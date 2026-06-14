<?php
/**
 * Main API Router
 * Handles all incoming requests and routes them to appropriate handlers
 */

// Handle CORS immediately
// Allow multiple origins (localhost for dev, production domains)
$allowedOrigins = [
    'https://siodelhi.org',
    'https://www.siodelhi.org',
    'https://sio-delhi.github.io',
    'https://local.siodelhi.org',
];

// Disable error display in production to prevent JSON corruption
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Check if origin matches allowed list OR is localhost/127.0.0.1
$isAllowed = in_array($origin, $allowedOrigins) ||
    preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin);

if ($isAllowed) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
} else {
    // If not in allowed list, use the primary allowed origin (siodelhi.org)
    // or fallback to the config value if available later. 
    // Since we haven't loaded config yet, we'll hardcode the main one or just not send it if strict.
    // For now, let's try to be permissive for the main domain if allowedOrigins check failed for some reason (e.g. strict type).
    if (!empty($origin) && strpos($origin, 'siodelhi.org') !== false) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    } else {
        // Fallback to a default safe origin if possible, or just don't set it (which causes the error).
        // Let's set it to the main site to be safe.
        header('Access-Control-Allow-Origin: https://siodelhi.org');
    }
}

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
// Cache for 60 seconds to balance freshness and performance
header("Cache-Control: public, max-age=60, must-revalidate");


// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/rate-limit.php';
require_once __DIR__ . '/validate.php';
require_once __DIR__ . '/logger.php';

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
    'POST /analytics/event',
    'POST /forms/([^/]+)/submit',
    'GET /portal/performance/public/forms/([^/]+)',
    'POST /portal/performance/public/forms/([^/]+)/respond',
    'POST /posters/save',
    'POST /short-links',
    'GET /short-links/resolve/([a-zA-Z0-9]+)',
    'GET /short-links/post/([^/]+)',
    'GET /short-links/form/([^/]+)',
    'POST /dev-reports',
    'POST /portal/migrate',
];

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
    'GET /health' => function () {
        $result = ['status' => 'ok', 'message' => 'API is running'];
        try {
            $pdo = getDB();
            $pdo->query('SELECT 1');
            $result['db'] = 'connected';
        } catch (Throwable $e) {
            $result['db'] = 'error';
        }
        return $result;
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
    'POST /portal/migrate' => 'routes/portal.php@portalMigrate',
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
    'POST /portal/regions' => 'routes/portal.php@portalCreateRegions',
    'PUT /portal/regions/([^/]+)' => 'routes/portal.php@portalUpdateRegion',
    'DELETE /portal/regions/([^/]+)' => 'routes/portal.php@portalDeleteRegion',
    'GET /portal/users' => 'routes/portal.php@portalGetUsers',
    'GET /portal/users/([^/]+)/messages' => 'routes/portal.php@portalGetUserMessages',
    'GET /portal/users/([^/]+)/migrations' => 'routes/portal.php@portalGetUserMigrations',
    'GET /portal/users/([^/]+)/performance' => 'routes/portal.php@portalGetUserPerformance',
    'GET /portal/users/([^/]+)/edit-requests' => 'routes/portal.php@portalGetMemberEditRequests',
    'GET /portal/users/([^/]+)' => 'routes/portal.php@portalGetUser',
    'POST /portal/users' => 'routes/portal.php@portalCreateUsers',
    'PUT /portal/users/([^/]+)' => 'routes/portal.php@portalUpdateUser',
    'DELETE /portal/users/([^/]+)' => 'routes/portal.php@portalDeleteUser',
    'PUT /portal/users/([^/]+)/title' => 'routes/portal.php@portalAssignTitle',
    'DELETE /portal/users/([^/]+)/title' => 'routes/portal.php@portalRevokeTitle',
    'POST /portal/users/([^/]+)/avatar' => 'routes/portal.php@portalUploadAvatar',
    'DELETE /portal/users/([^/]+)/avatar' => 'routes/portal.php@portalDeleteAvatar',
    'GET /portal/dashboard/stats' => 'routes/portal.php@portalDashboardStats',
    'GET /portal/region-units-without-president' => 'routes/portal.php@portalGetRegionUnitsWithoutPresident',
    'GET /portal/retiring-members' => 'routes/portal.php@portalGetRetiringMembers',
    'GET /portal/members-incomplete-details' => 'routes/portal.php@portalGetMembersWithIncompleteDetails',
    'GET /portal/search' => 'routes/portal.php@portalSearch',
    'PUT /portal/users/([^/]+)/lock' => 'routes/portal.php@portalLockUser',
    'PUT /portal/users/([^/]+)/revoke' => 'routes/portal.php@portalRevokeUser',
    'POST /portal/users/([^/]+)/reset-password' => 'routes/portal.php@portalResetUserPassword',
    'GET /portal/notifications' => 'routes/portal.php@portalNotificationCounts',
    'POST /portal/edit-requests' => 'routes/portal.php@portalCreateEditRequest',
    'GET /portal/edit-requests' => 'routes/portal.php@portalGetEditRequests',
    'PUT /portal/edit-requests/([^/]+)' => 'routes/portal.php@portalResolveEditRequest',
    'GET /portal/migrations' => 'routes/portal.php@portalGetMigrations',
    'POST /portal/migrations' => 'routes/portal.php@portalCreateMigration',
    'POST /portal/migrations/mark-seen' => 'routes/portal.php@portalMarkMigrationsSeen',
    'PUT /portal/migrations/([^/]+)' => 'routes/portal.php@portalResolveMigration',
    'GET /portal/messages' => 'routes/portal.php@portalGetMessages',
    'POST /portal/messages' => 'routes/portal.php@portalSendMessage',
    'PUT /portal/messages/([^/]+)/read' => 'routes/portal.php@portalMarkMessageRead',
    'GET /portal/performance/forms' => 'routes/portal.php@portalGetPerfForms',
    'GET /portal/performance/public/forms/([^/]+)' => 'routes/portal.php@portalGetPublicPerfForm',
    'POST /portal/performance/public/forms/([^/]+)/respond' => 'routes/portal.php@portalSubmitPublicPerfResponse',
    'GET /portal/performance/forms/([^/]+)' => 'routes/portal.php@portalGetPerfForm',
    'POST /portal/performance/forms' => 'routes/portal.php@portalCreatePerfForm',
    'PUT /portal/performance/forms/([^/]+)' => 'routes/portal.php@portalUpdatePerfForm',
    'DELETE /portal/performance/forms/([^/]+)' => 'routes/portal.php@portalDeletePerfForm',
    'POST /portal/performance/responses/notifications/seen' => 'routes/portal.php@portalMarkPerfResponseNotificationsSeen',
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
    'POST /analytics/event' => 'routes/analytics.php@trackEvent',
    'GET /analytics/events' => 'routes/analytics.php@getEventStats',
    'GET /analytics/heatmap' => 'routes/analytics.php@getHourlyHeatmap',

    // Posters
    'POST /posters/save' => 'routes/posters.php@savePoster',
    'GET /posters' => 'routes/posters.php@getPosters',
    'DELETE /posters/([^/]+)' => 'routes/posters.php@deletePoster',

    // Short Links
    'POST /short-links' => 'routes/short-links.php@createShortLink',
    'GET /short-links/resolve/([a-zA-Z0-9]+)' => 'routes/short-links.php@resolveShortLink',
    'GET /short-links/post/([^/]+)' => 'routes/short-links.php@getShortLinkByPost',
    'GET /short-links/form/([^/]+)' => 'routes/short-links.php@getShortLinkByForm',

    // Dev Reports
    'POST /dev-reports' => 'routes/dev-reports.php@submitDevReport',
    'GET /dev-reports' => 'routes/dev-reports.php@getDevReports',
    'DELETE /dev-reports/([^/]+)' => 'routes/dev-reports.php@deleteDevReport',
];

// Find matching route
$matched = false;
foreach ($routes as $pattern => $handler) {
    list($routeMethod, $routePath) = explode(' ', $pattern, 2);

    if ($method !== $routeMethod)
        continue;

    $regex = '#^' . $routePath . '$#';
    if (preg_match($regex, $uri, $matches)) {
        $matched = true;
        array_shift($matches); // Remove full match

        // Rate limiting on login endpoint
        if ($pattern === 'POST /portal/auth/me') {
            enforceRateLimit('login', 10, 60); // 10 attempts per minute
        }

        // Rate limiting on short link creation
        if ($pattern === 'POST /short-links') {
            enforceRateLimit('short_link_create', 30, 60); // 30 per minute
        }

        // General API rate limit (60 req/min per IP for write operations)
        if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
            // Higher limit for uploads and posters to allow bulk operations (e.g. gallery images)
            if (strpos($pattern, '/upload/') !== false || strpos($pattern, '/posters/') !== false) {
                enforceRateLimit('api_upload', 600, 60); // 600 req/min (approx 10/sec)
            } else {
                enforceRateLimit('api_write', 60, 60);
            }
        }

        // Auth check: require authentication for non-public routes
        $isPublic = in_array($pattern, $publicRoutes);

        // Allow unauthenticated uploads when formId is present (public form submissions)
        if (!$isPublic && strpos($pattern, 'POST /upload/') === 0 && !empty($_POST['formId'])) {
            $isPublic = true;
        }

        // Enforce body size limit on POST/PUT (1MB, except uploads/posters which have their own limits)
        if (in_array($method, ['POST', 'PUT']) && strpos($pattern, 'upload') === false && strpos($pattern, 'avatar') === false && strpos($pattern, 'posters/save') === false) {
            enforceBodyLimit(1048576); // 1MB
        }

        if (!$isPublic) {
            $payload = requireAuth(); // Halts with 401 if invalid
            $GLOBALS['AUTH_PAYLOAD'] = $payload;

            // Secure Admin Routes: If not a portal route, enforce "siodelhi" user
            // We check if the route pattern contains "/portal/"
            if (strpos($pattern, '/portal/') === false) {
                $username = $payload['username'] ?? ($payload['preferred_username'] ?? '');
                $email = $payload['email'] ?? ($payload['email_address'] ?? '');
                $userId = $payload['sub'] ?? '';

                // Check if username is "siodelhi", email contains "siodelhi", OR it's the specific admin user ID
                // Check against allowed admin usernames
                $adminUsernames = explode(',', env('ADMIN_USERNAMES', ''));
                $usernameMatches = false;
                foreach ($adminUsernames as $adminName) {
                    $adminName = trim($adminName);
                    if (empty($adminName))
                        continue;

                    if (
                        (strtolower((string) $username) === strtolower($adminName)) ||
                        (strpos(strtolower((string) $email), strtolower($adminName)) !== false)
                    ) {
                        $usernameMatches = true;
                        break;
                    }
                }

                // Check against allowed admin user IDs
                $adminUserIds = explode(',', env('ADMIN_USER_IDS', ''));
                $userIdMatches = false;
                foreach ($adminUserIds as $adminId) {
                    if (trim($adminId) === $userId) {
                        $userIdMatches = true;
                        break;
                    }
                }

                $isAdmin = $usernameMatches || $userIdMatches;

                if (!$isAdmin) {
                    error_log('Admin access denied for user: ' . json_encode($payload));
                    http_response_code(403);
                    echo json_encode(['error' => 'Admin access denied']);
                    exit();
                }
            }
        }

        try {
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
        } catch (Throwable $e) {
            // Ensure CORS headers are present even on error
            if (!headers_sent()) {
                if (isset($isAllowed) && $isAllowed) {
                    header('Access-Control-Allow-Origin: ' . ($origin ?? 'https://siodelhi.org'));
                } else {
                    header('Access-Control-Allow-Origin: https://siodelhi.org');
                }
                header('Access-Control-Allow-Credentials: true');
            }

            http_response_code(500);

            // Try to log
            if (function_exists('logError')) {
                logError($e->getMessage(), [
                    'file' => basename($e->getFile()),
                    'line' => $e->getLine(),
                    'route' => $pattern,
                ]);
            }

            echo json_encode([
                'error' => 'Internal server error.',
                'debug_message' => $e->getMessage(), // Temporary for debugging
                'file' => basename($e->getFile()),
                'line' => $e->getLine()
            ]);
        }
        break;
    }
}

if (!$matched) {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
}
