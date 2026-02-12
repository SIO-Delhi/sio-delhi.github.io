<?php
/**
 * Structured PHP error logging.
 * Writes JSON log entries to daily-rotated files in api/logs/.
 */

/**
 * Log a structured message.
 *
 * @param string $level   Log level: error, warn, info, debug
 * @param string $message Human-readable message
 * @param array  $context Additional data (user_id, endpoint, etc.)
 */
function portalLog(string $level, string $message, array $context = [])
{
    $dir = __DIR__ . '/logs';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
        // Add .htaccess to block web access to logs
        @file_put_contents("$dir/.htaccess", "Order Allow,Deny\nDeny from all\n");
    }

    $date = date('Y-m-d');
    $file = "$dir/$level-$date.log";

    $entry = [
        'timestamp' => date('c'),
        'level' => $level,
        'message' => $message,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'cli',
        'method' => $_SERVER['REQUEST_METHOD'] ?? 'cli',
        'uri' => $_SERVER['REQUEST_URI'] ?? '',
    ];

    if (!empty($context)) {
        $entry['context'] = $context;
    }

    @file_put_contents($file, json_encode($entry) . "\n", FILE_APPEND | LOCK_EX);
}

/**
 * Log an error.
 */
function logError(string $message, array $context = [])
{
    portalLog('error', $message, $context);
}

/**
 * Log a warning.
 */
function logWarn(string $message, array $context = [])
{
    portalLog('warn', $message, $context);
}

/**
 * Log an informational message.
 */
function logInfo(string $message, array $context = [])
{
    portalLog('info', $message, $context);
}
