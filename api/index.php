<?php
/**
 * Main API Router
 * Handles all incoming requests and routes them to appropriate handlers
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

// Handle CORS - allow multiple origins (localhost for dev, production domains)
$allowedOrigins = [
    'https://siodelhi.org',
    'https://www.siodelhi.org',
    'https://sio-delhi.github.io'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Check if origin matches allowed list OR is localhost/127.0.0.1
$isAllowed = in_array($origin, $allowedOrigins) || 
             preg_match('/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin);

if ($isAllowed) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
} else {
    header('Access-Control-Allow-Origin: ' . CORS_ORIGIN);
}

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get request method and URI
$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

// Remove query string and base path
$uri = parse_url($uri, PHP_URL_PATH);
$uri = preg_replace('#^/api#', '', $uri); // Remove /api prefix if present
$uri = rtrim($uri, '/');

// Simple router
$routes = [
    // Health check
    'GET /health' => function() {
        return ['status' => 'ok', 'message' => 'API is running'];
    },

    // Sections
    'GET /sections' => 'routes/sections.php@getAll',
    'GET /sections/([^/]+)' => 'routes/sections.php@getOne',
    'POST /sections' => 'routes/sections.php@create',
    'PUT /sections/([^/]+)' => 'routes/sections.php@update',
    'DELETE /sections/([^/]+)' => 'routes/sections.php@delete',

    // Posts
    'GET /posts' => 'routes/posts.php@getAll',
    'GET /posts/([^/]+)' => 'routes/posts.php@getOne',
    'POST /posts' => 'routes/posts.php@create',
    'PUT /posts/([^/]+)' => 'routes/posts.php@update',
    'DELETE /posts/([^/]+)' => 'routes/posts.php@delete',

    // Popups
    'GET /popups' => 'routes/popups.php@getAll',
    'GET /popups/active' => 'routes/popups.php@getActive',
    'GET /popups/([^/]+)' => 'routes/popups.php@getOne',
    'POST /popups' => 'routes/popups.php@create',
    'PUT /popups/([^/]+)' => 'routes/popups.php@update',
    'DELETE /popups/([^/]+)' => 'routes/popups.php@delete',
    'DELETE /popups/clear' => 'routes/popups.php@clearAll',

    // Upload
    'POST /upload/image' => 'routes/upload.php@uploadImage',
    'POST /upload/pdf' => 'routes/upload.php@uploadPdf',
    'POST /upload/audio' => 'routes/upload.php@uploadAudio',
    'DELETE /upload/([^/]+)/([^/]+)' => 'routes/upload.php@deleteFile',
    'GET /download/([^/]+)/([^/]+)' => 'routes/upload.php@downloadFile',

    // Stats
    'GET /stats' => 'routes/stats.php@getAllStats',
    'GET /stats/storage' => 'routes/stats.php@getStorageStats',
    'GET /stats/database' => 'routes/stats.php@getDatabaseStats',

    // Garbage Collector
    'GET /garbage' => 'routes/stats.php@getOrphanedFiles',
    'POST /garbage/cleanup' => 'routes/stats.php@deleteOrphanedFiles',

    // Forms
    'GET /forms' => 'routes/forms.php@getAllForms',
    'GET /forms/public/([^/]+)' => 'routes/forms.php@getPublicForm',
    'GET /forms/([^/]+)/responses/([^/]+)' => 'routes/forms.php@getFormResponse',
    'GET /forms/([^/]+)/responses' => 'routes/forms.php@getFormResponses',
    'GET /forms/([^/]+)/export' => 'routes/forms.php@exportFormResponses',
    'GET /forms/([^/]+)' => 'routes/forms.php@getFormById',
    'POST /forms' => 'routes/forms.php@createForm',
    'POST /forms/([^/]+)/submit' => 'routes/forms.php@submitFormResponse',
    'PUT /forms/([^/]+)/fields' => 'routes/forms.php@updateFormFields',
    'PUT /forms/([^/]+)/responses/([^/]+)' => 'routes/forms.php@updateFormResponse',
    'PUT /forms/([^/]+)' => 'routes/forms.php@updateForm',
    'DELETE /forms/([^/]+)/responses/([^/]+)' => 'routes/forms.php@deleteFormResponse',
    'DELETE /forms/([^/]+)' => 'routes/forms.php@deleteForm',
];

// Find matching route
$matched = false;
foreach ($routes as $pattern => $handler) {
    list($routeMethod, $routePath) = explode(' ', $pattern, 2);

    if ($method !== $routeMethod) continue;

    $regex = '#^' . $routePath . '$#';
    if (preg_match($regex, $uri, $matches)) {
        $matched = true;
        array_shift($matches); // Remove full match

        if (is_callable($handler)) {
            // Direct function
            $result = $handler(...$matches);
        } else {
            // File@function format
            list($file, $func) = explode('@', $handler);
            require_once __DIR__ . '/' . $file;
            $result = $func(...$matches);
        }

        echo json_encode($result);
        break;
    }
}

if (!$matched) {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
}
