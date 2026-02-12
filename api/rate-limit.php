<?php
/**
 * Simple file-based rate limiter.
 * Tracks request counts per IP in a temp directory.
 * No external dependencies (Redis, Memcached, etc.).
 */

/**
 * Check if a request should be rate-limited.
 *
 * @param string $key    Identifier (e.g., 'login', 'api')
 * @param int    $maxReq Max requests allowed in the window
 * @param int    $window Time window in seconds
 * @return bool  True if request is allowed, false if rate-limited
 */
function rateLimit(string $key, int $maxReq = 10, int $window = 60)
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $dir = __DIR__ . '/tmp/rate-limit';

    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }

    // Clean key for filesystem safety
    $safeKey = preg_replace('/[^a-zA-Z0-9_-]/', '', $key);
    $safeIp = preg_replace('/[^a-fA-F0-9.:_-]/', '', $ip);
    $file = "$dir/{$safeKey}_{$safeIp}.json";

    $now = time();
    $data = ['requests' => [], 'blocked_until' => 0];

    if (file_exists($file)) {
        $raw = @file_get_contents($file);
        if ($raw) {
            $data = json_decode($raw, true) ?: $data;
        }
    }

    // Check if currently blocked
    if ($data['blocked_until'] > $now) {
        return false;
    }

    // Remove expired entries
    $data['requests'] = array_filter($data['requests'], function ($ts) use ($now, $window) {
        return ($now - $ts) < $window;
    });

    // Check limit
    if (count($data['requests']) >= $maxReq) {
        // Block for the remainder of the window
        $data['blocked_until'] = $now + $window;
        @file_put_contents($file, json_encode($data), LOCK_EX);
        return false;
    }

    // Record this request
    $data['requests'][] = $now;
    @file_put_contents($file, json_encode($data), LOCK_EX);

    return true;
}

/**
 * Enforce rate limit — sends 429 and exits if exceeded.
 */
function enforceRateLimit(string $key, int $maxReq = 10, int $window = 60)
{
    if (!rateLimit($key, $maxReq, $window)) {
        http_response_code(429);
        header('Retry-After: ' . $window);
        echo json_encode(['error' => 'Too many requests. Please try again later.']);
        exit();
    }
}
