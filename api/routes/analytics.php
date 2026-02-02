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

    if (!$page || !is_string($page)) {
        http_response_code(400);
        return ['error' => 'Missing page parameter'];
    }

    // Sanitize page path
    $page = substr(trim($page), 0, 255);

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
        INSERT IGNORE INTO page_visits
        (page, ip_hash, visit_date, visited_at, city, region, country, lat, lon, browser, os, device_type, referrer, isp, organization)
        VALUES
        (:page, :ip_hash, :visit_date, NOW(), :city, :region, :country, :lat, :lon, :browser, :os, :device_type, :referrer, :isp, :organization)
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
    ]);

    return ['success' => true];
}

/**
 * GET /analytics/stats
 * Returns page visit statistics for the admin dashboard.
 */
function getVisitStats()
{
    ensureAnalyticsTable();

    $db = getDB();
    $today = date('Y-m-d');

    // Per-page stats
    $stmt = $db->prepare("
        SELECT
            page,
            COUNT(*) as total_visits,
            COUNT(DISTINCT ip_hash) as unique_visitors,
            SUM(CASE WHEN visit_date = :today THEN 1 ELSE 0 END) as today_visits,
            SUM(CASE WHEN visit_date = :today2 THEN 1 ELSE 0 END) as today_unique,
            MIN(visit_date) as first_visit,
            MAX(visit_date) as last_visit
        FROM page_visits
        GROUP BY page
        ORDER BY total_visits DESC
    ");
    $stmt->execute([':today' => $today, ':today2' => $today]);
    $pages = $stmt->fetchAll();

    // Overall totals
    $stmt = $db->prepare("
        SELECT
            COUNT(*) as total_visits,
            COUNT(DISTINCT ip_hash) as unique_visitors,
            SUM(CASE WHEN visit_date = :today THEN 1 ELSE 0 END) as today_visits
        FROM page_visits
    ");
    $stmt->execute([':today' => $today]);
    $totals = $stmt->fetch();

    // Last 7 days trend
    $stmt = $db->prepare("
        SELECT visit_date, COUNT(*) as visits, COUNT(DISTINCT ip_hash) as unique_visitors
        FROM page_visits
        WHERE visit_date >= DATE_SUB(:today, INTERVAL 7 DAY)
        GROUP BY visit_date
        ORDER BY visit_date ASC
    ");
    $stmt->execute([':today' => $today]);
    $trend = $stmt->fetchAll();

    // Browser stats
    $browsers = $db->query("SELECT browser, COUNT(*) as count FROM page_visits WHERE browser IS NOT NULL GROUP BY browser ORDER BY count DESC LIMIT 10")->fetchAll();

    // OS stats
    $oss = $db->query("SELECT os, COUNT(*) as count FROM page_visits WHERE os IS NOT NULL GROUP BY os ORDER BY count DESC LIMIT 10")->fetchAll();

    // Referrer stats
    $referrers = $db->query("SELECT referrer, COUNT(*) as count FROM page_visits WHERE referrer IS NOT NULL GROUP BY referrer ORDER BY count DESC LIMIT 10")->fetchAll();

    // ISP stats
    $isps = $db->query("SELECT isp, COUNT(*) as count FROM page_visits WHERE isp IS NOT NULL GROUP BY isp ORDER BY count DESC LIMIT 10")->fetchAll();

    // Organization stats
    $orgs = $db->query("SELECT organization, COUNT(*) as count FROM page_visits WHERE organization IS NOT NULL GROUP BY organization ORDER BY count DESC LIMIT 10")->fetchAll();

    return [
        'totals' => $totals,
        'pages' => $pages,
        'trend' => $trend,
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
 */
function getVisitorLocations()
{
    ensureAnalyticsTable();

    $db = getDB();

    // Aggregated locations (cluster by city+country)
    $stmt = $db->query("
        SELECT
            city,
            region,
            country,
            ROUND(lat, 2) as lat,
            ROUND(lon, 2) as lon,
            COUNT(*) as visit_count,
            COUNT(DISTINCT ip_hash) as unique_visitors
        FROM page_visits
        WHERE lat IS NOT NULL AND lon IS NOT NULL
        GROUP BY city, country, ROUND(lat, 2), ROUND(lon, 2)
        ORDER BY visit_count DESC
    ");
    $locations = $stmt->fetchAll();

    // Country breakdown
    $stmt = $db->query("
        SELECT
            country,
            COUNT(*) as visit_count,
            COUNT(DISTINCT ip_hash) as unique_visitors
        FROM page_visits
        WHERE country IS NOT NULL
        GROUP BY country
        ORDER BY visit_count DESC
    ");
    $countries = $stmt->fetchAll();

    return [
        'locations' => $locations,
        'countries' => $countries
    ];
}
