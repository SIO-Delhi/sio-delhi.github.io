<?php
/**
 * Analytics - Page Visit Tracking with Geolocation
 */

require_once __DIR__ . '/../db.php';

/**
 * Auto-create/migrate the page_visits table
 */
function ensureAnalyticsTable() {
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
        // Columns may already exist, ignore
    }
}

/**
 * Lookup geolocation for an IP address using ip-api.com (free, no key needed)
 */
function geolocateIp($ip) {
    // Skip private/local IPs
    if ($ip === 'unknown' || $ip === '127.0.0.1' || $ip === '::1' || strpos($ip, '192.168.') === 0 || strpos($ip, '10.') === 0) {
        return null;
    }

    $ctx = stream_context_create(['http' => ['timeout' => 2]]);
    $url = "http://ip-api.com/json/" . urlencode($ip) . "?fields=status,city,regionName,countryCode,lat,lon";

    try {
        $response = @file_get_contents($url, false, $ctx);
        if ($response === false) return null;

        $data = json_decode($response, true);
        if (!$data || $data['status'] !== 'success') return null;

        return [
            'city' => $data['city'] ?? null,
            'region' => $data['regionName'] ?? null,
            'country' => $data['countryCode'] ?? null,
            'lat' => $data['lat'] ?? null,
            'lon' => $data['lon'] ?? null,
        ];
    } catch (Exception $e) {
        return null;
    }
}

/**
 * POST /analytics/track
 * Track a page visit with geolocation. Deduplicates by IP hash + page + day.
 */
function trackVisit() {
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

    $db = getDB();
    $stmt = $db->prepare("
        INSERT IGNORE INTO page_visits (page, ip_hash, visit_date, visited_at, city, region, country, lat, lon)
        VALUES (:page, :ip_hash, :visit_date, NOW(), :city, :region, :country, :lat, :lon)
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
    ]);

    return ['success' => true];
}

/**
 * GET /analytics/stats
 * Returns page visit statistics for the admin dashboard.
 */
function getVisitStats() {
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

    return [
        'totals' => $totals,
        'pages' => $pages,
        'trend' => $trend
    ];
}

/**
 * GET /analytics/locations
 * Returns aggregated visitor locations for map visualization.
 */
function getVisitorLocations() {
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
