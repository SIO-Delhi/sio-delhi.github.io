<?php
/**
 * JWT Authentication using Clerk
 * Pure PHP - no composer dependencies
 * Verifies RS256-signed JWTs against Clerk's JWKS
 */

require_once __DIR__ . '/config.php';

/**
 * Base64URL decode (JWT uses base64url, not standard base64)
 */
function base64url_decode($data) {
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/'));
}

/**
 * Fetch and cache the Clerk JWKS public key as PEM
 * Caches to a local file for performance (refreshed every 1 hour)
 * If CLERK_PUBLIC_KEY_PEM is set in env, use that (avoids fetching when clerk.siodelhi.org DNS is not set).
 */
function getClerkPublicKey($kid = null) {
    $staticPem = env('CLERK_PUBLIC_KEY_PEM', '');
    if ($staticPem !== '') {
        $staticPem = trim(str_replace(["\r\n", "\r", "\\n"], "\n", $staticPem));
        if (strpos($staticPem, '-----BEGIN PUBLIC KEY-----') !== false) {
            return $staticPem;
        }
    }

    $cacheFile = __DIR__ . '/.clerk_jwks_cache.json';
    $cacheTTL = 3600; // 1 hour

    // Try cache first
    if (file_exists($cacheFile)) {
        $cached = json_decode(file_get_contents($cacheFile), true);
        if ($cached && isset($cached['fetched_at']) && (time() - $cached['fetched_at']) < $cacheTTL) {
            foreach ($cached['keys'] as $key) {
                if ($kid === null || $key['kid'] === $kid) {
                    return $key['pem'];
                }
            }
        }
    }

    // Fetch fresh JWKS from Clerk
    $jwksUrl = env('CLERK_JWKS_URL', 'https://clerk.siodelhi.org/.well-known/jwks.json');

    $context = stream_context_create([
        'http' => ['timeout' => 10],
        'ssl' => ['verify_peer' => true, 'verify_peer_name' => true]
    ]);

    $jwksJson = @file_get_contents($jwksUrl, false, $context);
    if (!$jwksJson) {
        error_log('Failed to fetch Clerk JWKS from ' . $jwksUrl);
        return null;
    }

    $jwks = json_decode($jwksJson, true);
    if (!$jwks || !isset($jwks['keys'])) {
        error_log('Invalid JWKS response from Clerk');
        return null;
    }

    // Convert each JWK to PEM and cache
    $cacheData = ['fetched_at' => time(), 'keys' => []];

    foreach ($jwks['keys'] as $jwk) {
        if (($jwk['kty'] ?? '') !== 'RSA') continue;
        if (($jwk['use'] ?? 'sig') !== 'sig') continue;

        $pem = jwkToPem($jwk);
        if ($pem) {
            $cacheData['keys'][] = [
                'kid' => $jwk['kid'],
                'pem' => $pem
            ];
        }
    }

    @file_put_contents($cacheFile, json_encode($cacheData));

    foreach ($cacheData['keys'] as $key) {
        if ($kid === null || $key['kid'] === $kid) {
            return $key['pem'];
        }
    }

    return null;
}

/**
 * Convert a JWK RSA key to PEM format
 */
function jwkToPem($jwk) {
    if (!isset($jwk['n']) || !isset($jwk['e'])) {
        return null;
    }

    $modulus = base64url_decode($jwk['n']);
    $exponent = base64url_decode($jwk['e']);

    // Ensure modulus is positive (prepend 0x00 if high bit set)
    if (ord($modulus[0]) > 0x7f) {
        $modulus = "\x00" . $modulus;
    }

    // Ensure exponent is positive
    if (ord($exponent[0]) > 0x7f) {
        $exponent = "\x00" . $exponent;
    }

    // ASN.1 DER encoding
    $modulusEncoded = asn1Integer($modulus);
    $exponentEncoded = asn1Integer($exponent);

    $rsaPublicKey = asn1Sequence($modulusEncoded . $exponentEncoded);

    // Wrap in SubjectPublicKeyInfo
    $algorithmIdentifier = asn1Sequence(
        asn1ObjectIdentifier("\x2a\x86\x48\x86\xf7\x0d\x01\x01\x01") . // rsaEncryption OID
        "\x05\x00" // NULL parameters
    );

    $bitString = "\x00" . $rsaPublicKey;
    $bitStringEncoded = "\x03" . asn1Length(strlen($bitString)) . $bitString;

    $publicKeyInfo = asn1Sequence($algorithmIdentifier . $bitStringEncoded);

    $pem = "-----BEGIN PUBLIC KEY-----\n";
    $pem .= chunk_split(base64_encode($publicKeyInfo), 64, "\n");
    $pem .= "-----END PUBLIC KEY-----";

    return $pem;
}

// ASN.1 DER encoding helpers
function asn1Length($length) {
    if ($length < 0x80) {
        return chr($length);
    } elseif ($length < 0x100) {
        return "\x81" . chr($length);
    } else {
        return "\x82" . chr($length >> 8) . chr($length & 0xFF);
    }
}

function asn1Sequence($data) {
    return "\x30" . asn1Length(strlen($data)) . $data;
}

function asn1Integer($data) {
    return "\x02" . asn1Length(strlen($data)) . $data;
}

function asn1ObjectIdentifier($oid) {
    return "\x06" . asn1Length(strlen($oid)) . $oid;
}

/**
 * Verify a Clerk JWT and return the decoded payload.
 * Returns the payload array on success, or null on failure.
 */
function verifyClerkJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }

    list($headerB64, $payloadB64, $signatureB64) = $parts;

    // Decode header
    $header = json_decode(base64url_decode($headerB64), true);
    if (!$header || ($header['alg'] ?? '') !== 'RS256') {
        return null;
    }

    // Decode payload
    $payload = json_decode(base64url_decode($payloadB64), true);
    if (!$payload) {
        return null;
    }

    // Check expiration with 30s leeway for clock skew
    $now = time();
    $leeway = 30;

    if (isset($payload['exp']) && ($now - $leeway) > $payload['exp']) {
        return null;
    }
    if (isset($payload['nbf']) && ($now + $leeway) < $payload['nbf']) {
        return null;
    }

    // Get the public key using kid from header
    $kid = $header['kid'] ?? null;
    $publicKeyPem = getClerkPublicKey($kid);
    if (!$publicKeyPem) {
        error_log('Could not obtain Clerk public key for kid: ' . ($kid ?? 'null'));
        return null;
    }

    // Verify RS256 signature
    $dataToVerify = $headerB64 . '.' . $payloadB64;
    $signature = base64url_decode($signatureB64);

    $publicKey = openssl_pkey_get_public($publicKeyPem);
    if (!$publicKey) {
        error_log('Failed to parse PEM public key');
        return null;
    }

    $verified = openssl_verify($dataToVerify, $signature, $publicKey, OPENSSL_ALGO_SHA256);

    if ($verified === 1) {
        return $payload;
    }

    return null;
}

/**
 * Require authentication. Call before protected route handlers.
 * Halts execution with 401 if authentication fails.
 * Returns the decoded JWT payload on success.
 */
function requireAuth() {
    // Check multiple sources - Apache CGI/FastCGI may place it in different variables
    $authHeader = $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? '';

    if (empty($authHeader) || !preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit();
    }

    $token = $matches[1];
    $payload = verifyClerkJWT($token);

    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token']);
        exit();
    }

    return $payload;
}
