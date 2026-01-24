<?php
/**
 * Configuration file for the API
 * Loads sensitive values from .env file
 */

// Load environment variables from .env file
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue; // Skip comments
        if (strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        // Remove quotes if present
        $value = trim($value, '"\'');
        putenv("$key=$value");
        $_ENV[$key] = $value;
    }
}

// Helper function to get env with fallback
function env($key, $default = null) {
    $value = getenv($key);
    return $value !== false ? $value : $default;
}

// Database Configuration
define('DB_HOST', env('DB_HOST', 'localhost'));
define('DB_NAME', env('DB_NAME', 'siodelhi_site'));
define('DB_USER', env('DB_USER', 'siodelhi_adnan'));
define('DB_PASS', env('DB_PASS', ''));

// Upload Configuration
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('BASE_URL', env('BASE_URL', 'https://api.siodelhi.org'));

// CORS - Your GitHub Pages URL
define('CORS_ORIGIN', env('CORS_ORIGIN', 'https://sio-delhi.github.io'));

// Max file sizes (in bytes)
define('MAX_IMAGE_SIZE', 5 * 1024 * 1024);  // 5MB
define('MAX_PDF_SIZE', 10 * 1024 * 1024);   // 10MB
define('MAX_AUDIO_SIZE', 10 * 1024 * 1024); // 10MB

// Allowed file extensions
define('ALLOWED_IMAGE_EXT', ['jpg', 'jpeg', 'png', 'gif', 'webp']);
define('ALLOWED_PDF_EXT', ['pdf']);
define('ALLOWED_AUDIO_EXT', ['mp3', 'wav', 'ogg', 'm4a']);
