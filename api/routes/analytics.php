<?php
/**
 * Analytics - Page Visit Tracking with Geolocation
 */

require_once __DIR__ . '/../db.php';

/**
 * Auto-create/migrate the page_visits table
 */
function ensureAnalyticsTable()
{
    $db = getDB();
    $db->exec("
        CREATE TABLE IF NOT EXISTS page_visits (
            id INT AUTO_INCREMENT PRIMARY KEY,
            page VARCHAR(255) NOT NULL,
            ip_hash VARCHAR(64) NOT NULL,
            visit_date DATE NOT NULL,
            visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            city VARCHAR(100) DEFAULT NULL,
            region VARCHAR(100) DEFAULT NULL,
            country VARCHAR(2) DEFAULT NULL,
            lat DECIMAL(8,4) DEFAULT NULL,
            lon DECIMAL(8,4) DEFAULT NULL,
            INDEX idx_page (page),
            INDEX idx_page_date (page, visit_date),
            UNIQUE KEY unique_visit (page, ip_hash, visit_date)
        )
    ");

    // Migrate existing tables: add geo columns if missing
    try {
        $cols = $db->query("SHOW COLUMNS FROM page_visits LIKE 'city'")->fetchAll();
        if (empty($cols)) {
            $db->exec("ALTER TABLE page_visits
                ADD COLUMN city VARCHAR(100) DEFAULT NULL,
                ADD COLUMN region VARCHAR(100) DEFAULT NULL,
                ADD COLUMN country VARCHAR(2) DEFAULT NULL,
                ADD COLUMN lat DECIMAL(8,4) DEFAULT NULL,
                ADD COLUMN lon DECIMAL(8,4) DEFAULT NULL
            ");
        }
    } catch (Exception $e) {
    }

    // Migrate: add browser/os/referrer columns
    try {
        $cols = $db->query("SHOW COLUMNS FROM page_visits LIKE 'browser'")->fetchAll();
        if (empty($cols)) {
            $db->exec("ALTER TABLE page_visits
                ADD COLUMN browser VARCHAR(50) DEFAULT NULL,
                ADD COLUMN os VARCHAR(50) DEFAULT NULL,
                ADD COLUMN device_type VARCHAR(20) DEFAULT NULL,
                ADD COLUMN referrer VARCHAR(255) DEFAULT NULL
            ");
        }
    } catch (Exception $e) {
    }

    // Migrate: add isp/organization columns
    try {
        $cols = $db->query("SHOW COLUMNS FROM page_visits LIKE 'isp'")->fetchAll();
        if (empty($cols)) {
            $db->exec("ALTER TABLE page_visits
                ADD COLUMN isp VARCHAR(100) DEFAULT NULL,
                ADD COLUMN organization VARCHAR(100) DEFAULT NULL
            ");
        }
    } catch (Exception $e) {
    }

    // Migrate: add visitor_id column for localStorage-based unique tracking
    try {
        $cols = $db->query("SHOW COLUMNS FROM page_visits LIKE 'visitor_id'")->fetchAll();
        if (empty($cols)) {
            $db->exec("ALTER TABLE page_visits
                ADD COLUMN visitor_id VARCHAR(36) DEFAULT NULL,
                ADD INDEX idx_visitor_id (visitor_id)
            ");
        }
    } catch (Exception $e) {
    }

    // Migrate: add duration_seconds column for time-on-page tracking
    try {
        $cols = $db->query("SHOW COLUMNS FROM page_visits LIKE 'duration_seconds'")->fetchAll();
        if (empty($cols)) {
            $db->exec("ALTER TABLE page_visits
                ADD COLUMN duration_seconds INT DEFAULT NULL
            ");
        }
    } catch (Exception $e) {
    }

    // Migrate: add last_seen column for live visitor heartbeat
    try {
        $cols = $db->query("SHOW COLUMNS FROM page_visits LIKE 'last_seen'")->fetchAll();
        if (empty($cols)) {
            $db->exec("ALTER TABLE page_visits
                ADD COLUMN last_seen DATETIME DEFAULT NULL,
                ADD INDEX idx_last_seen (last_seen)
            ");
            // Backfill existing rows
            $db->exec("UPDATE page_visits SET last_seen = visited_at WHERE last_seen IS NULL");
        }
    } catch (Exception $e) {
    }
}

/**
 * Simple User-Agent parser to avoid heavy dependencies
 */
function parseUserAgent($ua)
{
    $browser = 'Unknown';
    $os = 'Unknown';
    $device = 'Desktop';

    // Detect OS
    if (preg_match('/android/i', $ua)) {
        $os = 'Android';
        $device = 'Mobile';
    } elseif (preg_match('/iphone|ipad|ipod/i', $ua)) {
        $os = 'iOS';
        $device = 'Mobile';
    } elseif (preg_match('/windows nt/i', $ua)) {
        $os = 'Windows';
    } elseif (preg_match('/macintosh|mac os x/i', $ua)) {
        $os = 'Mac OS';
    } elseif (preg_match('/linux/i', $ua)) {
        $os = 'Linux';
    }

    // Detect Browser
    if (preg_match('/edg/i', $ua)) {
        $browser = 'Edge';
    } elseif (preg_match('/chrome/i', $ua)) {
        $browser = 'Chrome';
    } elseif (preg_match('/firefox/i', $ua)) {
        $browser = 'Firefox';
    } elseif (preg_match('/safari/i', $ua)) {
        $browser = 'Safari';
    } elseif (preg_match('/opera|opr/i', $ua)) {
        $browser = 'Opera';
    }

    return ['browser' => $browser, 'os' => $os, 'device' => $device];
}

/**
 * Lookup geolocation for an IP address using ip-api.com (free, no key needed)
 */
function geolocateIp($ip)
{
    // Skip private/local IPs
    if ($ip === 'unknown' || $ip === '127.0.0.1' || $ip === '::1' || strpos($ip, '192.168.') === 0 || strpos($ip, '10.') === 0) {
        return null;
    }

    $ctx = stream_context_create([
        'http' => ['timeout' => 5],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
        ]
    ]);
    $url = "https://ipwho.is/" . urlencode($ip);

    try {
        $response = @file_get_contents($url, false, $ctx);
        if ($response === false)
            return null;

        $data = json_decode($response, true);
        if (!$data || !($data['success'] ?? false))
            return null;

        return [
            'city' => $data['city'] ?? null,
            'region' => $data['region'] ?? null,
            'country' => $data['country_code'] ?? null,
            'lat' => $data['latitude'] ?? null,
            'lon' => $data['longitude'] ?? null,
            'isp' => $data['connection']['isp'] ?? null,
            'organization' => $data['connection']['org'] ?? null,
        ];
    } catch (Exception $e) {
        return null;
    }
}

/**
 * POST /analytics/track
 * Track a page visit with geolocation. Deduplicates by IP hash + page + day.
 */
function trackVisit()
{
    ensureAnalyticsTable();

    $input = json_decode(file_get_contents('php://input'), true);
    $page = $input['page'] ?? null;
    $visitorId = $input['visitor_id'] ?? null;

    if (!$page || !is_string($page)) {
        http_response_code(400);
        return ['error' => 'Missing page parameter'];
    }

    // Sanitize page path
    $page = substr(trim($page), 0, 255);

    // Sanitize visitor_id (UUID format)
    if ($visitorId && is_string($visitorId)) {
        $visitorId = substr(trim($visitorId), 0, 36);
    } else {
        $visitorId = null;
    }

    // Get visitor IP
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $ip = trim(explode(',', $ip)[0]);
    $ipHash = hash('sha256', $ip);

    $today = date('Y-m-d');

    // Geolocate the IP
    $geo = geolocateIp($ip);

    // Parse User Agent
    $uaStr = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $uaInfo = parseUserAgent($uaStr);

    // Get Referrer
    $referrer = $_SERVER['HTTP_REFERER'] ?? null;
    if ($referrer) {
        $parsed = parse_url($referrer);
        $referrer = $parsed['host'] ?? null; // Store domain only
    }

    $db = getDB();
    $stmt = $db->prepare("
        INSERT INTO page_visits
        (page, ip_hash, visit_date, visited_at, last_seen, city, region, country, lat, lon, browser, os, device_type, referrer, isp, organization, visitor_id)
        VALUES
        (:page, :ip_hash, :visit_date, NOW(), NOW(), :city, :region, :country, :lat, :lon, :browser, :os, :device_type, :referrer, :isp, :organization, :visitor_id)
        ON DUPLICATE KEY UPDATE last_seen = NOW()
    ");
    $stmt->execute([
        ':page' => $page,
        ':ip_hash' => $ipHash,
        ':visit_date' => $today,
        ':city' => $geo['city'] ?? null,
        ':region' => $geo['region'] ?? null,
        ':country' => $geo['country'] ?? null,
        ':lat' => $geo['lat'] ?? null,
        ':lon' => $geo['lon'] ?? null,
        ':browser' => $uaInfo['browser'],
        ':os' => $uaInfo['os'],
        ':device_type' => $uaInfo['device'],
        ':referrer' => $referrer,
        ':isp' => $geo['isp'] ?? null,
        ':organization' => $geo['organization'] ?? null,
        ':visitor_id' => $visitorId,
    ]);

    return ['success' => true];
}

/**
 * POST /analytics/duration
 * Update the duration_seconds for the most recent visit matching page + visitor_id + today.
 */
function trackDuration()
{
    // ensureAnalyticsTable(); // Optimization: assume table exists if tracking started

    $input = json_decode(file_get_contents('php://input'), true);
    $page = $input['page'] ?? null;
    $visitorId = $input['visitor_id'] ?? null;
    $duration = $input['duration'] ?? null;

    if (!$page || !$visitorId || !$duration) {
        http_response_code(400);
        return ['error' => 'Missing required parameters'];
    }

    $page = substr(trim($page), 0, 255);
    $visitorId = substr(trim($visitorId), 0, 36);
    $duration = min(max((int) $duration, 0), 3600); // cap at 1 hour

    $today = date('Y-m-d');
    $db = getDB();

    // Update the most recent matching row, keeping the higher duration
    $stmt = $db->prepare("
        UPDATE page_visits
        SET duration_seconds = GREATEST(COALESCE(duration_seconds, 0), :duration)
        WHERE page = :page AND visitor_id = :visitor_id AND visit_date = :visit_date
        ORDER BY visited_at DESC
        LIMIT 1
    ");
    $stmt->execute([
        ':page' => $page,
        ':visitor_id' => $visitorId,
        ':visit_date' => $today,
        ':duration' => $duration,
    ]);

    return ['success' => true];
}

/**
 * GET /analytics/stats
 * Returns page visit statistics for the admin dashboard.
 * Optional query params: from, to (YYYY-MM-DD), trend_days (7|30|90)
 */
function getVisitStats()
{
    ensureAnalyticsTable();

    $db = getDB();
    $today = date('Y-m-d');

    // Date range filtering
    $from = $_GET['from'] ?? null;
    $to = $_GET['to'] ?? null;
    $trendDays = (int) ($_GET['trend_days'] ?? 7);
    if (!in_array($trendDays, [7, 30, 90]))
        $trendDays = 7;

    $dateFilter = '';
    $dateParams = [];
    if ($from && $to) {
        $dateFilter = ' AND visit_date BETWEEN :from AND :to';
        $dateParams = [':from' => $from, ':to' => $to];
    }

    $uniqueExpr = "COALESCE(visitor_id, ip_hash)";

    // Per-page stats
    $stmt = $db->prepare("
        SELECT
            page,
            COUNT(*) as total_visits,
            COUNT(DISTINCT $uniqueExpr) as unique_visitors,
            SUM(CASE WHEN visit_date = :today THEN 1 ELSE 0 END) as today_visits,
            SUM(CASE WHEN visit_date = :today2 THEN 1 ELSE 0 END) as today_unique,
            MIN(visit_date) as first_visit,
            MAX(visit_date) as last_visit,
            ROUND(AVG(CASE WHEN duration_seconds > 0 THEN duration_seconds ELSE NULL END)) as avg_duration
        FROM page_visits
        WHERE 1=1 $dateFilter
        AND page NOT LIKE '/portal%'
        GROUP BY page
        ORDER BY total_visits DESC
    ");
    $stmt->execute(array_merge([':today' => $today, ':today2' => $today], $dateParams));
    $pages = $stmt->fetchAll();

    // Overall totals
    $stmt = $db->prepare("
        SELECT
            COUNT(*) as total_visits,
            COUNT(DISTINCT $uniqueExpr) as unique_visitors,
            SUM(CASE WHEN visit_date = :today THEN 1 ELSE 0 END) as today_visits,
            ROUND(AVG(CASE WHEN duration_seconds > 0 THEN duration_seconds ELSE NULL END)) as avg_duration
        FROM page_visits
        WHERE 1=1 $dateFilter
    ");
    $stmt->execute(array_merge([':today' => $today], $dateParams));
    $totals = $stmt->fetch();

    // Trend (parameterized days)
    $stmt = $db->prepare("
        SELECT visit_date, COUNT(*) as visits, COUNT(DISTINCT $uniqueExpr) as unique_visitors
        FROM page_visits
        WHERE visit_date >= DATE_SUB(:today, INTERVAL $trendDays DAY) $dateFilter
        GROUP BY visit_date
        ORDER BY visit_date ASC
    ");
    $stmt->execute(array_merge([':today' => $today], $dateParams));
    $trend = $stmt->fetchAll();

    // Previous period comparison (last 7 days vs 7 days before that)
    $stmt = $db->prepare("
        SELECT
            COUNT(*) as prev_visits,
            COUNT(DISTINCT $uniqueExpr) as prev_unique
        FROM page_visits
        WHERE visit_date BETWEEN DATE_SUB(:today, INTERVAL 14 DAY) AND DATE_SUB(:today2, INTERVAL 8 DAY)
    ");
    $stmt->execute([':today' => $today, ':today2' => $today]);
    $prevPeriod = $stmt->fetch();

    // Current 7-day period for comparison
    $stmt = $db->prepare("
        SELECT
            COUNT(*) as curr_visits,
            COUNT(DISTINCT $uniqueExpr) as curr_unique
        FROM page_visits
        WHERE visit_date >= DATE_SUB(:today, INTERVAL 7 DAY)
    ");
    $stmt->execute([':today' => $today]);
    $currPeriod = $stmt->fetch();

    // Bounce rate
    $bounceStmt = $db->prepare("
        SELECT
            COUNT(*) as total_sessions,
            SUM(CASE WHEN page_count = 1 THEN 1 ELSE 0 END) as bounced
        FROM (
            SELECT $uniqueExpr as vid, visit_date, COUNT(DISTINCT page) as page_count
            FROM page_visits
            WHERE 1=1 $dateFilter
            GROUP BY vid, visit_date
        ) sub
    ");
    $bounceStmt->execute($dateParams);
    $bounceData = $bounceStmt->fetch();
    $bounceRate = ($bounceData['total_sessions'] > 0)
        ? round(($bounceData['bounced'] / $bounceData['total_sessions']) * 100, 1)
        : 0;

    // New vs returning visitors (today)
    $stmt = $db->prepare("
        SELECT
            SUM(CASE WHEN first_seen = :today THEN 1 ELSE 0 END) as new_visitors,
            SUM(CASE WHEN first_seen < :today2 THEN 1 ELSE 0 END) as returning_visitors
        FROM (
            SELECT $uniqueExpr as vid, MIN(visit_date) as first_seen
            FROM page_visits
            GROUP BY vid
        ) sub
        WHERE vid IN (SELECT DISTINCT $uniqueExpr FROM page_visits WHERE visit_date = :today3)
    ");
    $stmt->execute([':today' => $today, ':today2' => $today, ':today3' => $today]);
    $newVsReturning = $stmt->fetch() ?: ['new_visitors' => 0, 'returning_visitors' => 0];

    // Hourly heatmap (convert to IST: UTC+5:30)
    $heatmapStmt = $db->prepare("
        SELECT DAYOFWEEK(CONVERT_TZ(visited_at, '+00:00', '+05:30')) as dow, HOUR(CONVERT_TZ(visited_at, '+00:00', '+05:30')) as hour, COUNT(*) as count
        FROM page_visits
        WHERE 1=1 $dateFilter
        GROUP BY dow, hour
    ");
    $heatmapStmt->execute($dateParams);
    $heatmap = $heatmapStmt->fetchAll();

    // Top landing pages (first page per visitor per day)
    $landingStmt = $db->prepare("
        SELECT page, COUNT(*) as count FROM (
            SELECT $uniqueExpr as vid, visit_date,
                (SELECT p2.page FROM page_visits p2
                 WHERE COALESCE(p2.visitor_id, p2.ip_hash) = COALESCE(page_visits.visitor_id, page_visits.ip_hash)
                 AND p2.visit_date = page_visits.visit_date
                 ORDER BY p2.visited_at ASC LIMIT 1) as page
            FROM page_visits
            WHERE 1=1 $dateFilter
            GROUP BY vid, visit_date
        ) sub
        WHERE page NOT LIKE '/portal%'
        GROUP BY page ORDER BY count DESC LIMIT 10
    ");
    $landingStmt->execute($dateParams);
    $landingPages = $landingStmt->fetchAll();

    // Page flow (consecutive transitions)
    try {
        $flowStmt = $db->prepare("
            SELECT from_page, to_page, COUNT(*) as count FROM (
                SELECT page as from_page,
                    LEAD(page) OVER (PARTITION BY $uniqueExpr, visit_date ORDER BY visited_at) as to_page
                FROM page_visits
                WHERE 1=1 $dateFilter
            ) sub
            WHERE to_page IS NOT NULL AND from_page != to_page
            GROUP BY from_page, to_page ORDER BY count DESC LIMIT 15
        ");
        $flowStmt->execute($dateParams);
        $pageFlows = $flowStmt->fetchAll();
    } catch (Exception $e) {
        // Fallback for MySQL < 8.0 (no window functions)
        $pageFlows = [];
    }

    // Device type breakdown
    $devicesStmt = $db->prepare("
        SELECT device_type, COUNT(DISTINCT $uniqueExpr) as count
        FROM page_visits
        WHERE device_type IS NOT NULL $dateFilter
        GROUP BY device_type ORDER BY count DESC
    ");
    $devicesStmt->execute($dateParams);
    $devices = $devicesStmt->fetchAll();

    // Browser stats
    $browsersStmt = $db->prepare("SELECT browser, COUNT(DISTINCT $uniqueExpr) as count FROM page_visits WHERE browser IS NOT NULL $dateFilter GROUP BY browser ORDER BY count DESC LIMIT 10");
    $browsersStmt->execute($dateParams);
    $browsers = $browsersStmt->fetchAll();

    // OS stats
    $ossStmt = $db->prepare("SELECT os, COUNT(DISTINCT $uniqueExpr) as count FROM page_visits WHERE os IS NOT NULL $dateFilter GROUP BY os ORDER BY count DESC LIMIT 10");
    $ossStmt->execute($dateParams);
    $oss = $ossStmt->fetchAll();

    // Referrer stats
    $refStmt = $db->prepare("SELECT referrer, COUNT(DISTINCT $uniqueExpr) as count FROM page_visits WHERE referrer IS NOT NULL $dateFilter GROUP BY referrer ORDER BY count DESC LIMIT 10");
    $refStmt->execute($dateParams);
    $referrers = $refStmt->fetchAll();

    // ISP stats
    $ispStmt = $db->prepare("SELECT isp, COUNT(DISTINCT $uniqueExpr) as count FROM page_visits WHERE isp IS NOT NULL $dateFilter GROUP BY isp ORDER BY count DESC LIMIT 10");
    $ispStmt->execute($dateParams);
    $isps = $ispStmt->fetchAll();

    // Organization stats
    $orgStmt = $db->prepare("SELECT organization, COUNT(DISTINCT $uniqueExpr) as count FROM page_visits WHERE organization IS NOT NULL $dateFilter GROUP BY organization ORDER BY count DESC LIMIT 10");
    $orgStmt->execute($dateParams);
    $orgs = $orgStmt->fetchAll();

    return [
        'totals' => $totals,
        'pages' => $pages,
        'trend' => $trend,
        'prev_period' => [
            'prev_visits' => (int) ($prevPeriod['prev_visits'] ?? 0),
            'prev_unique' => (int) ($prevPeriod['prev_unique'] ?? 0),
            'curr_visits' => (int) ($currPeriod['curr_visits'] ?? 0),
            'curr_unique' => (int) ($currPeriod['curr_unique'] ?? 0),
        ],
        'bounce_rate' => $bounceRate,
        'new_vs_returning' => [
            'new' => (int) ($newVsReturning['new_visitors'] ?? 0),
            'returning' => (int) ($newVsReturning['returning_visitors'] ?? 0),
        ],
        'heatmap' => $heatmap,
        'landing_pages' => $landingPages,
        'page_flows' => $pageFlows,
        'devices' => $devices,
        'browsers' => $browsers,
        'oss' => $oss,
        'referrers' => $referrers,
        'isps' => $isps,
        'organizations' => $orgs
    ];
}

/**
 * GET /analytics/locations
 * Returns aggregated visitor locations for map visualization.
 * Optional query params: from, to (YYYY-MM-DD)
 */
function getVisitorLocations()
{
    ensureAnalyticsTable();

    $db = getDB();

    $from = $_GET['from'] ?? null;
    $to = $_GET['to'] ?? null;
    $dateFilter = '';
    $dateParams = [];
    if ($from && $to) {
        $dateFilter = ' AND visit_date BETWEEN :from AND :to';
        $dateParams = [':from' => $from, ':to' => $to];
    }

    $uniqueExpr = "COALESCE(visitor_id, ip_hash)";

    // Aggregated locations (cluster by city+country)
    $stmt = $db->prepare("
        SELECT
            city,
            region,
            country,
            ROUND(lat, 2) as lat,
            ROUND(lon, 2) as lon,
            COUNT(*) as visit_count,
            COUNT(DISTINCT $uniqueExpr) as unique_visitors
        FROM page_visits
        WHERE lat IS NOT NULL AND lon IS NOT NULL $dateFilter
        GROUP BY city, country, ROUND(lat, 2), ROUND(lon, 2)
        ORDER BY visit_count DESC
    ");
    $stmt->execute($dateParams);
    $locations = $stmt->fetchAll();

    // Country breakdown
    $stmt = $db->prepare("
        SELECT
            country,
            COUNT(*) as visit_count,
            COUNT(DISTINCT $uniqueExpr) as unique_visitors
        FROM page_visits
        WHERE country IS NOT NULL $dateFilter
        GROUP BY country
        ORDER BY visit_count DESC
    ");
    $stmt->execute($dateParams);
    $countries = $stmt->fetchAll();

    return [
        'locations' => $locations,
        'countries' => $countries
    ];
}

/**
 * GET /analytics/live
 * Returns count of unique visitors in the last 5 minutes.
 */
function getLiveVisitors()
{
    ensureAnalyticsTable();

    $db = getDB();
    $uniqueExpr = "COALESCE(visitor_id, ip_hash)";

    $stmt = $db->query("
        SELECT COUNT(DISTINCT $uniqueExpr) as live_count
        FROM page_visits
        WHERE last_seen >= DATE_SUB(NOW(), INTERVAL 2 MINUTE)
    ");
    $row = $stmt->fetch();

    return ['live_count' => (int) ($row['live_count'] ?? 0)];
}

/**
 * POST /analytics/heartbeat
 * Updates last_seen for a visitor to keep them "live".
 */
function heartbeat()
{
    // ensureAnalyticsTable(); // Optimization: minimize overhead for heartbeat

    $input = json_decode(file_get_contents('php://input'), true);
    $visitorId = $input['visitor_id'] ?? null;

    if (!$visitorId || !is_string($visitorId)) {
        http_response_code(400);
        return ['error' => 'Missing visitor_id'];
    }

    $visitorId = substr(trim($visitorId), 0, 36);
    $today = date('Y-m-d');

    $db = getDB();
    $stmt = $db->prepare("
        UPDATE page_visits SET last_seen = NOW()
        WHERE visitor_id = :visitor_id AND visit_date = :today
        ORDER BY visited_at DESC LIMIT 1
    ");
    $stmt->execute([':visitor_id' => $visitorId, ':today' => $today]);

    return ['success' => true];
}

/**
 * Ensure analytics_events table exists
 */
function ensureEventsTable()
{
    $db = getDB();
    $db->exec("
        CREATE TABLE IF NOT EXISTS analytics_events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_name VARCHAR(100) NOT NULL,
            event_label VARCHAR(255) DEFAULT NULL,
            visitor_id VARCHAR(36) DEFAULT NULL,
            page VARCHAR(255) DEFAULT NULL,
            count INT DEFAULT 1,
            event_date DATE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_event (event_name),
            INDEX idx_visitor (visitor_id),
            UNIQUE KEY unique_event_day (event_name, event_label, visitor_id, event_date)
        )
    ");
}

/**
 * POST /analytics/event
 * Track a generic event (e.g. clicks)
 */
function trackEvent()
{
    ensureEventsTable();

    $input = json_decode(file_get_contents('php://input'), true);
    $eventName = $input['event_name'] ?? null;
    $eventLabel = $input['event_label'] ?? null;
    $visitorId = $input['visitor_id'] ?? null;
    $page = $input['page'] ?? null;

    if (!$eventName || !$visitorId) {
        http_response_code(400);
        return ['error' => 'Missing required fields'];
    }

    $eventName = substr(trim($eventName), 0, 100);
    $eventLabel = $eventLabel ? substr(trim($eventLabel), 0, 255) : null;
    $visitorId = substr(trim($visitorId), 0, 36);
    $page = $page ? substr(trim($page), 0, 255) : null;

    $db = getDB();
    // Increment count if same event happens multiple times per day for same user (optional logic)
    // Or just treat unique key as "one record per day per user" and effectively ignore dupes or increment count.
    // Let's increment count.
    $stmt = $db->prepare("
        INSERT INTO analytics_events (event_name, event_label, visitor_id, page, count, event_date, created_at)
        VALUES (:name, :label, :visitor_id, :page, 1, CURDATE(), NOW())
        ON DUPLICATE KEY UPDATE count = count + 1, updated_at = NOW()
    ");

    $stmt->execute([
        ':name' => $eventName,
        ':label' => $eventLabel,
        ':visitor_id' => $visitorId,
        ':page' => $page
    ]);

    return ['success' => true];
}

/**
 * GET /analytics/events
 * Get aggregated event stats
 */
function getEventStats()
{
    ensureEventsTable();
    $db = getDB();

    $stmt = $db->query("
        SELECT 
            event_name,
            event_label,
            SUM(count) as total_count,
            COUNT(DISTINCT visitor_id) as unique_users
        FROM analytics_events
        GROUP BY event_name, event_label
        ORDER BY total_count DESC
    ");

    return ['events' => $stmt->fetchAll()];
}

/**
 * GET /analytics/heatmap
 * Get hourly heatmap for a specific date range
 */
function getHourlyHeatmap()
{
    ensureAnalyticsTable();
    $db = getDB();

    $from = $_GET['from'] ?? null;
    $to = $_GET['to'] ?? null;

    $dateFilter = '';
    $dateParams = [];
    if ($from && $to) {
        $dateFilter = ' AND visit_date BETWEEN :from AND :to';
        $dateParams = [':from' => $from, ':to' => $to];
    }

    // Hourly heatmap (convert to IST: UTC+5:30)
    $heatmapStmt = $db->prepare("
        SELECT DAYOFWEEK(CONVERT_TZ(visited_at, '+00:00', '+05:30')) as dow, HOUR(CONVERT_TZ(visited_at, '+00:00', '+05:30')) as hour, COUNT(*) as count
        FROM page_visits
        WHERE 1=1 $dateFilter
        GROUP BY dow, hour
    ");
    $heatmapStmt->execute($dateParams);

    return ['heatmap' => $heatmapStmt->fetchAll()];
}
