<?php
/**
 * Main API Router
 * Handles all incoming requests and routes them to appropriate handlers
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

// Routes that do NOT require authentication
$publicRoutes = [
    'GET /health',
    'GET /sections',
    'GET /sections/([^/]+)',
    'GET /posts',
    'GET /posts/([^/]+)',
    'GET /popups/active',
    'GET /forms/public/([^/]+)',
    'GET /download/([^/]+)/([^/]+)',
    'POST /analytics/track',
    'POST /analytics/duration',
    'POST /analytics/heartbeat',
    'POST /forms/([^/]+)/submit',
];

// Handle CORS - allow multiple origins (localhost for dev, production domains)
$allowedOrigins = [
    'https://siodelhi.org',
    'https://www.siodelhi.org',
    'https://sio-delhi.github.io',
    'https://local.siodelhi.org',  // local dev with hosts entry for Clerk production keys
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Check if origin matches allowed list OR is localhost/127.0.0.1
$isAllowed = in_array($origin, $allowedOrigins) || 
             preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin);

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

    // Frame Tool
    'POST /frame/apply-bulk' => 'routes/frame.php@applyFrameBulk',
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

    // Portal
    'POST /portal/setup' => 'routes/portal.php@portalSetup',
    'POST /portal/seed' => 'routes/portal.php@portalSeed',
    'POST /portal/auth/me' => 'routes/portal.php@portalAuthMe',
    'GET /portal/units' => 'routes/portal.php@portalGetUnits',
    'GET /portal/units/([^/]+)/members' => 'routes/portal.php@portalGetUnitMembers',
    'GET /portal/units/([^/]+)' => 'routes/portal.php@portalGetUnit',
    'POST /portal/units' => 'routes/portal.php@portalCreateUnits',
    'PUT /portal/units/([^/]+)' => 'routes/portal.php@portalUpdateUnit',
    'DELETE /portal/units/([^/]+)' => 'routes/portal.php@portalDeleteUnit',
    'GET /portal/circles' => 'routes/portal.php@portalGetCircles',
    'GET /portal/circles/([^/]+)/members' => 'routes/portal.php@portalGetCircleMembers',
    'GET /portal/circles/([^/]+)' => 'routes/portal.php@portalGetCircle',
    'POST /portal/circles' => 'routes/portal.php@portalCreateCircles',
    'PUT /portal/circles/([^/]+)' => 'routes/portal.php@portalUpdateCircle',
    'DELETE /portal/circles/([^/]+)' => 'routes/portal.php@portalDeleteCircle',
    'GET /portal/campuses' => 'routes/portal.php@portalGetCampuses',
    'GET /portal/campuses/([^/]+)/members' => 'routes/portal.php@portalGetCampusMembers',
    'GET /portal/campuses/([^/]+)' => 'routes/portal.php@portalGetCampus',
    'POST /portal/campuses' => 'routes/portal.php@portalCreateCampuses',
    'PUT /portal/campuses/([^/]+)' => 'routes/portal.php@portalUpdateCampus',
    'DELETE /portal/campuses/([^/]+)' => 'routes/portal.php@portalDeleteCampus',
    'GET /portal/regions' => 'routes/portal.php@portalGetRegions',
    'GET /portal/users' => 'routes/portal.php@portalGetUsers',
    'GET /portal/users/([^/]+)/messages' => 'routes/portal.php@portalGetUserMessages',
    'GET /portal/users/([^/]+)/migrations' => 'routes/portal.php@portalGetUserMigrations',
    'GET /portal/users/([^/]+)/performance' => 'routes/portal.php@portalGetUserPerformance',
    'GET /portal/users/([^/]+)' => 'routes/portal.php@portalGetUser',
    'POST /portal/users' => 'routes/portal.php@portalCreateUsers',
    'PUT /portal/users/([^/]+)' => 'routes/portal.php@portalUpdateUser',
    'DELETE /portal/users/([^/]+)' => 'routes/portal.php@portalDeleteUser',
    'PUT /portal/users/([^/]+)/title' => 'routes/portal.php@portalAssignTitle',
    'DELETE /portal/users/([^/]+)/title' => 'routes/portal.php@portalRevokeTitle',
    'POST /portal/users/([^/]+)/avatar' => 'routes/portal.php@portalUploadAvatar',
    'DELETE /portal/users/([^/]+)/avatar' => 'routes/portal.php@portalDeleteAvatar',
    'GET /portal/dashboard/stats' => 'routes/portal.php@portalDashboardStats',
    'GET /portal/retiring-members' => 'routes/portal.php@portalGetRetiringMembers',
    'PUT /portal/users/([^/]+)/lock' => 'routes/portal.php@portalLockUser',
    'GET /portal/notifications' => 'routes/portal.php@portalNotificationCounts',
    'GET /portal/migrations' => 'routes/portal.php@portalGetMigrations',
    'POST /portal/migrations' => 'routes/portal.php@portalCreateMigration',
    'POST /portal/migrations/mark-seen' => 'routes/portal.php@portalMarkMigrationsSeen',
    'PUT /portal/migrations/([^/]+)' => 'routes/portal.php@portalResolveMigration',
    'GET /portal/messages' => 'routes/portal.php@portalGetMessages',
    'POST /portal/messages' => 'routes/portal.php@portalSendMessage',
    'PUT /portal/messages/([^/]+)/read' => 'routes/portal.php@portalMarkMessageRead',
    'GET /portal/performance/forms' => 'routes/portal.php@portalGetPerfForms',
    'GET /portal/performance/forms/([^/]+)' => 'routes/portal.php@portalGetPerfForm',
    'POST /portal/performance/forms' => 'routes/portal.php@portalCreatePerfForm',
    'PUT /portal/performance/forms/([^/]+)' => 'routes/portal.php@portalUpdatePerfForm',
    'DELETE /portal/performance/forms/([^/]+)' => 'routes/portal.php@portalDeletePerfForm',
    'GET /portal/performance/forms/([^/]+)/responses/([^/]+)/reviews' => 'routes/portal.php@portalGetPerfResponseReviews',
    'POST /portal/performance/forms/([^/]+)/responses/([^/]+)/reviews' => 'routes/portal.php@portalUpsertPerfResponseReview',
    'GET /portal/performance/forms/([^/]+)/responses' => 'routes/portal.php@portalGetPerfResponses',
    'POST /portal/performance/forms/([^/]+)/seen' => 'routes/portal.php@portalMarkPerfFormSeen',
    'POST /portal/performance/forms/([^/]+)/respond' => 'routes/portal.php@portalSubmitPerfResponse',
    'PUT /portal/performance/reviews/([^/]+)' => 'routes/portal.php@portalUpdatePerfReview',
    'DELETE /portal/performance/reviews/([^/]+)' => 'routes/portal.php@portalDeletePerfReview',
    'GET /portal/regions/([^/]+)/units' => 'routes/portal.php@portalGetRegionUnits',

    // Analytics
    'POST /analytics/track' => 'routes/analytics.php@trackVisit',
    'POST /analytics/duration' => 'routes/analytics.php@trackDuration',
    'POST /analytics/heartbeat' => 'routes/analytics.php@heartbeat',
    'GET /analytics/live' => 'routes/analytics.php@getLiveVisitors',
    'GET /analytics/stats' => 'routes/analytics.php@getVisitStats',
    'GET /analytics/locations' => 'routes/analytics.php@getVisitorLocations',
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

        // Auth check: require authentication for non-public routes
        $isPublic = in_array($pattern, $publicRoutes);

        // Allow unauthenticated uploads when formId is present (public form submissions)
        if (!$isPublic && strpos($pattern, 'POST /upload/') === 0 && !empty($_POST['formId'])) {
            $isPublic = true;
        }

        if (!$isPublic) {
            requireAuth(); // Halts with 401 if invalid
        }

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
