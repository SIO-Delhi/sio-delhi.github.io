<?php
/**
 * Input validation and sanitization helpers.
 * Use these on all user input before processing.
 */

/**
 * Sanitize a string: trim, remove null bytes, limit length.
 *
 * @param mixed  $input     Raw input value
 * @param int    $maxLength Maximum allowed length (default 500)
 * @return string|null       Sanitized string or null if input was empty/null
 */
function sanitizeString($input, int $maxLength = 500)
{
    if ($input === null || $input === '')
        return null;
    if (!is_string($input))
        return null;

    $str = trim($input);
    $str = str_replace("\0", '', $str);  // Remove null bytes
    if (mb_strlen($str) > $maxLength) {
        $str = mb_substr($str, 0, $maxLength);
    }

    return $str === '' ? null : $str;
}

/**
 * Sanitize text content (allows longer strings for messages, descriptions).
 */
function sanitizeText($input, int $maxLength = 5000)
{
    return sanitizeString($input, $maxLength);
}

/**
 * Validate and sanitize a phone number.
 * Strips country code prefix, allows only digits.
 */
function sanitizePhone($input)
{
    if ($input === null || $input === '')
        return null;
    if (!is_string($input))
        return null;

    $phone = trim($input);
    $phone = preg_replace('/^\+91/', '', $phone);
    $phone = preg_replace('/^\+/', '', $phone);
    $phone = preg_replace('/[^0-9]/', '', $phone);

    if (strlen($phone) < 7 || strlen($phone) > 15)
        return null;

    return $phone;
}

/**
 * Validate a UUID format.
 */
function isValidUuid(string $uuid): bool
{
    return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $uuid) === 1;
}

/**
 * Validate and sanitize email.
 */
function sanitizeEmail($input)
{
    if ($input === null || $input === '')
        return null;
    if (!is_string($input))
        return null;

    $email = trim($input);
    if (strlen($email) > 254)
        return null;

    return filter_var($email, FILTER_VALIDATE_EMAIL) ? strtolower($email) : null;
}

/**
 * Enforce a maximum request body size.
 * Call at the start of endpoints that accept POST/PUT body.
 *
 * @param int $maxBytes Maximum body size in bytes (default 1MB)
 */
function enforceBodyLimit(int $maxBytes = 1048576)
{
    $contentLength = $_SERVER['CONTENT_LENGTH'] ?? 0;
    if ((int) $contentLength > $maxBytes) {
        http_response_code(413);
        echo json_encode(['error' => 'Request body too large.']);
        exit();
    }
}

/**
 * Validate that a value is in an allowed whitelist.
 * Use for ORDER BY columns, status values, role names, etc.
 */
function validateWhitelist($value, array $allowed, $default = null)
{
    return in_array($value, $allowed, true) ? $value : $default;
}

/**
 * Sanitize a filename — remove path traversal, non-ASCII, and dangerous extensions.
 */
function sanitizeFilename(string $filename): string
{
    // Remove path components
    $filename = basename($filename);
    // Remove path traversal
    $filename = str_replace(['../', '..\\', '..'], '', $filename);
    // Keep only safe characters
    $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename);

    return $filename;
}
