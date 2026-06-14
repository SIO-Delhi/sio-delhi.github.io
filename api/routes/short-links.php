<?php
/**
 * Short Links API Routes
 * Provides URL shortening for post sharing
 */

function ensureShortLinksSchema(PDO $db)
{
    $db->exec("CREATE TABLE IF NOT EXISTS short_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        short_code VARCHAR(8) NOT NULL UNIQUE,
        full_url VARCHAR(2048) NOT NULL,
        post_id VARCHAR(255) NULL,
        resource_type VARCHAR(50) NULL,
        resource_id VARCHAR(255) NULL,
        click_count INT UNSIGNED DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_short_code (short_code),
        INDEX idx_post_id (post_id),
        INDEX idx_resource (resource_type, resource_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

function generateShortCode(): string
{
    $chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $db = getDB();
    ensureShortLinksSchema($db);

    for ($i = 0; $i < 10; $i++) {
        $code = '';
        for ($j = 0; $j < 6; $j++) {
            $code .= $chars[random_int(0, 61)];
        }
        $stmt = $db->prepare("SELECT id FROM short_links WHERE short_code = ?");
        $stmt->execute([$code]);
        if (!$stmt->fetch()) {
            return $code;
        }
    }

    throw new Exception('Failed to generate unique short code after 10 attempts');
}

function resolvePortalPerfFormId(PDO $db, string $resourceId)
{
    $stmt = $db->prepare("SELECT id FROM portal_perf_forms WHERE id = ? LIMIT 1");
    $stmt->execute([$resourceId]);
    $id = $stmt->fetchColumn();
    if ($id) {
        return $id;
    }

    $trimmed = substr($resourceId, 0, 36);
    if ($trimmed !== $resourceId) {
        $stmt = $db->prepare("SELECT id FROM portal_perf_forms WHERE id = ? OR ? LIKE CONCAT(id, '%') LIMIT 1");
        $stmt->execute([$trimmed, $resourceId]);
        $id = $stmt->fetchColumn();
        if ($id) {
            return $id;
        }
    }

    return null;
}

/**
 * POST /short-links
 * Create a short link. If post_id/resource is provided and a link already exists, returns the existing one.
 * Body: { fullUrl: string, postId?: string, resourceType?: string, resourceId?: string }
 */
function createShortLink(): array
{
    try {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $fullUrl = trim($data['fullUrl'] ?? '');
        $postId = $data['postId'] ?? null;
        $resourceType = $data['resourceType'] ?? null;
        $resourceId = $data['resourceId'] ?? null;

        if (empty($fullUrl)) {
            http_response_code(400);
            return ['error' => 'fullUrl is required'];
        }

        // Validate URL format and length
        if (strlen($fullUrl) > 2048) {
            http_response_code(400);
            return ['error' => 'URL too long (max 2048 characters)'];
        }
        if (!filter_var($fullUrl, FILTER_VALIDATE_URL)) {
            http_response_code(400);
            return ['error' => 'Invalid URL format'];
        }

        // Only allow siodelhi.org URLs to prevent abuse
        $parsed = parse_url($fullUrl);
        $host = $parsed['host'] ?? '';
        if (!preg_match('/(?:^|\.)siodelhi\.org$/i', $host)) {
            http_response_code(400);
            return ['error' => 'Only siodelhi.org URLs can be shortened'];
        }

        $db = getDB();
        ensureShortLinksSchema($db);

        // Validate postId exists in the database if provided
        if ($postId) {
            $stmt = $db->prepare("SELECT id FROM posts WHERE id = ?");
            $stmt->execute([$postId]);
            if (!$stmt->fetch()) {
                http_response_code(400);
                return ['error' => 'Invalid post ID'];
            }

            // Check if short link already exists for this post
            $stmt = $db->prepare("SELECT * FROM short_links WHERE post_id = ? LIMIT 1");
            $stmt->execute([$postId]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($existing) {
                return [
                    'shortCode' => $existing['short_code'],
                    'shortUrl' => 'https://siodelhi.org/s/' . $existing['short_code'],
                    'fullUrl' => $existing['full_url'],
                    'clickCount' => (int) $existing['click_count'],
                ];
            }
        }

        if ($resourceType || $resourceId) {
            if (!$resourceType || !$resourceId) {
                http_response_code(400);
                return ['error' => 'resourceType and resourceId must be provided together'];
            }
            if (!in_array($resourceType, ['portal_perf_form', 'portal_perf_form_public', 'portal_perf_form_internal'], true)) {
                http_response_code(400);
                return ['error' => 'Unsupported resource type'];
            }

            if (strpos($resourceType, 'portal_perf_form') === 0) {
                $resourceId = resolvePortalPerfFormId($db, (string) $resourceId) ?? (string) $resourceId;
            }

            $stmt = $db->prepare("SELECT * FROM short_links WHERE resource_type = ? AND resource_id = ? LIMIT 1");
            $stmt->execute([$resourceType, $resourceId]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($existing) {
                return [
                    'shortCode' => $existing['short_code'],
                    'shortUrl' => 'https://siodelhi.org/s/' . $existing['short_code'],
                    'fullUrl' => $existing['full_url'],
                    'clickCount' => (int) $existing['click_count'],
                ];
            }
        }

        $shortCode = generateShortCode();

        $stmt = $db->prepare(
            "INSERT INTO short_links (short_code, full_url, post_id, resource_type, resource_id) VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->execute([$shortCode, $fullUrl, $postId, $resourceType, $resourceId]);

        return [
            'shortCode' => $shortCode,
            'shortUrl' => 'https://siodelhi.org/s/' . $shortCode,
            'fullUrl' => $fullUrl,
            'clickCount' => 0,
        ];
    } catch (Throwable $e) {
        error_log('Short link creation failed: ' . $e->getMessage());
        http_response_code(500);
        return [
            'error' => 'Short link creation failed: ' . $e->getMessage(),
            'file' => basename($e->getFile()),
            'line' => $e->getLine(),
        ];
    }
}

/**
 * GET /short-links/resolve/{code}
 * Resolve a short code to its full URL. Increments click count.
 */
function resolveShortLink(string $code): array
{
    // Sanitize code
    if (!preg_match('/^[a-zA-Z0-9]{4,8}$/', $code)) {
        http_response_code(400);
        return ['error' => 'Invalid short code'];
    }

    $db = getDB();
    ensureShortLinksSchema($db);
    $stmt = $db->prepare("SELECT * FROM short_links WHERE short_code = ?");
    $stmt->execute([$code]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        return ['error' => 'Short link not found'];
    }

    // Increment click count
    $db->prepare("UPDATE short_links SET click_count = click_count + 1 WHERE id = ?")
        ->execute([$row['id']]);

    return [
        'fullUrl' => $row['full_url'],
        'shortCode' => $row['short_code'],
        'clickCount' => (int) $row['click_count'] + 1,
    ];
}

/**
 * GET /short-links/post/{postId}
 * Get an existing short link for a specific post.
 */
function getShortLinkByPost(string $postId): array
{
    $db = getDB();
    ensureShortLinksSchema($db);
    $stmt = $db->prepare("SELECT * FROM short_links WHERE post_id = ? LIMIT 1");
    $stmt->execute([$postId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        return ['error' => 'No short link for this post'];
    }

    return [
        'shortCode' => $row['short_code'],
        'shortUrl' => 'https://siodelhi.org/s/' . $row['short_code'],
        'fullUrl' => $row['full_url'],
        'clickCount' => (int) $row['click_count'],
    ];
}

/**
 * GET /short-links/form/{formId}
 * Get an existing short link for a portal performance form.
 */
function getShortLinkByForm(string $formId): array
{
    $db = getDB();
    ensureShortLinksSchema($db);
    $type = $_GET['type'] ?? 'portal_perf_form';
    if (!in_array($type, ['portal_perf_form', 'portal_perf_form_public', 'portal_perf_form_internal'], true)) {
        http_response_code(400);
        return ['error' => 'Unsupported resource type'];
    }

    $resolvedFormId = resolvePortalPerfFormId($db, $formId);
    if ($resolvedFormId) {
        $formId = $resolvedFormId;
    }

    $stmt = $db->prepare("SELECT * FROM short_links WHERE resource_type = ? AND resource_id = ? LIMIT 1");
    $stmt->execute([$type, $formId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        return ['error' => 'No short link for this form'];
    }

    return [
        'shortCode' => $row['short_code'],
        'shortUrl' => 'https://siodelhi.org/s/' . $row['short_code'],
        'fullUrl' => $row['full_url'],
        'clickCount' => (int) $row['click_count'],
    ];
}
