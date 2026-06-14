<?php
/**
 * Portal API Routes
 * Member management, messaging, migrations, performance tracking.
 */

require_once __DIR__ . '/../db.php';

function uuid()
{
    return sprintf(
        '%04x%04x-%05x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0xffff)
    );
}

function jsonBody()
{
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

/**
 * Create a Clerk account for a portal user.
 * Returns ['success' => true, 'clerk_id' => '...'] or ['error' => '...']
 */
function createClerkAccount($username, $password, $firstName, $lastName)
{
    $clerkSecret = getenv('CLERK_SECRET_KEY') ?: ($_ENV['CLERK_SECRET_KEY'] ?? null);
    if (!$clerkSecret) {
        return ['error' => 'Clerk secret key not configured.'];
    }

    $ch = curl_init('https://api.clerk.com/v1/users');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    $payload = [
        'username' => $username,
        'password' => $password,
        'first_name' => $firstName,
        'skip_password_checks' => true,
        'skip_password_requirement' => true,
    ];
    if ($lastName !== null && $lastName !== '') {
        $payload['last_name'] = $lastName;
    }
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $clerkSecret,
        'Content-Type: application/json',
    ]);
    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($status === 200 || $status === 201) {
        $data = json_decode($response, true);
        return ['success' => true, 'clerk_id' => $data['id'] ?? null];
    }

    $errorData = json_decode($response, true);
    $errorMsg = $errorData['errors'][0]['long_message'] ?? $errorData['errors'][0]['message'] ?? "Clerk error (HTTP $status)";
    return ['error' => $errorMsg];
}

/**
 * Default password: first 4 letters of first name (lowercase) + last 4 digits of phone number.
 * e.g. first_name "Test", phone "1234567890" → "test7890"
 */
function generateDefaultPassword($firstName, $lastName, $dateOfBirth, $phone = null)
{
    $namePart = strtolower(preg_replace('/[^a-zA-Z]/', '', trim($firstName)));
    if (strlen($namePart) > 4)
        $namePart = substr($namePart, 0, 4);
    $phonePart = is_string($phone) && strlen($phone) >= 4 ? substr($phone, -4) : '0000';
    return $namePart . $phonePart;
}

/**
 * Username: first name lowercased (alphanumeric only) + 4-digit birth year, e.g. adnan1998.
 * Duplicates get _2, _3, etc.
 */
function generateUsername($firstName, $dateOfBirth, $db)
{
    $first = strtolower(preg_replace('/[^a-z0-9]/i', '', trim($firstName)));
    if ($first === '')
        $first = 'user';
    $year = (is_string($dateOfBirth) && strlen($dateOfBirth) >= 8) ? substr($dateOfBirth, 4, 4) : '1990';
    $base = $first . $year;
    $username = $base;
    $n = 2;
    while (true) {
        $stmt = $db->prepare("SELECT 1 FROM portal_users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetchColumn() === false)
            break;
        $username = $base . '_' . $n;
        $n++;
    }
    return $username;
}

/** Build full name from first, middle, last (for display). */
function buildFullName($firstName, $middleName, $lastName)
{
    $parts = array_filter([trim($firstName ?? ''), trim($middleName ?? ''), trim($lastName ?? '')]);
    return implode(' ', $parts);
}

/**
 * Check if region_id columns exist in portal_units and portal_users.
 * Returns an array with 'units' and 'users' booleans.
 */
function hasRegionColumns($db = null)
{
    static $cache = null;
    if ($cache !== null)
        return $cache;

    if (!$db)
        $db = getDB();
    $cache = ['units' => false, 'users' => false, 'circles' => false];

    try {
        $unitsCheck = $db->query("SHOW COLUMNS FROM portal_units LIKE 'region_id'")->fetch();
        $cache['units'] = (bool) $unitsCheck;
    } catch (Exception $e) {
    }

    try {
        $usersCheck = $db->query("SHOW COLUMNS FROM portal_users LIKE 'region_id'")->fetch();
        $cache['users'] = (bool) $usersCheck;
    } catch (Exception $e) {
    }

    try {
        $circlesCheck = $db->query("SHOW COLUMNS FROM portal_circles LIKE 'region_id'")->fetch();
        $cache['circles'] = (bool) $circlesCheck;
    } catch (Exception $e) {
    }

    return $cache;
}

/**
 * Check if a specific table exists in the database.
 */
function tableExists($db, $table)
{
    static $cache = [];
    if (isset($cache[$table]))
        return $cache[$table];
    try {
        $db->query("SELECT 1 FROM $table LIMIT 1");
        $cache[$table] = true;
    } catch (Exception $e) {
        $cache[$table] = false;
    }
    return $cache[$table];
}

function ensurePerfFormViewsTable($db)
{
    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_perf_form_views (
                form_id VARCHAR(36) NOT NULL,
                member_id VARCHAR(36) NOT NULL,
                seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (form_id, member_id),
                FOREIGN KEY (form_id) REFERENCES portal_perf_forms(id) ON DELETE CASCADE,
                FOREIGN KEY (member_id) REFERENCES portal_users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
}

function ensurePerfResponseNotificationViewsTable($db)
{
    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_perf_response_notification_views (
                response_id VARCHAR(36) NOT NULL,
                user_id VARCHAR(36) NOT NULL,
                seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (response_id, user_id),
                FOREIGN KEY (response_id) REFERENCES portal_perf_responses(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES portal_users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
}

function ensurePerfPublicResponsesTable($db)
{
    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_perf_public_responses (
                id VARCHAR(36) PRIMARY KEY,
                form_id VARCHAR(36) NOT NULL,
                respondent_name VARCHAR(255) NULL,
                respondent_email VARCHAR(255) NULL,
                respondent_phone VARCHAR(32) NULL,
                response_data JSON NOT NULL,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (form_id) REFERENCES portal_perf_forms(id) ON DELETE CASCADE,
                INDEX idx_pppr_form (form_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
}

function ensurePerfFormsSchema($db)
{
    if (!tableExists($db, 'portal_perf_forms'))
        return;
    foreach ([
        "ALTER TABLE portal_perf_forms ADD COLUMN scope_type VARCHAR(20) DEFAULT 'zone' AFTER created_by",
        "ALTER TABLE portal_perf_forms ADD COLUMN scope_region_id VARCHAR(36) NULL AFTER scope_type",
        "ALTER TABLE portal_perf_forms ADD COLUMN scope_circle_id VARCHAR(36) NULL AFTER scope_unit_id",
        "ALTER TABLE portal_perf_forms ADD COLUMN scope_campus_id VARCHAR(36) NULL AFTER scope_circle_id",
        "ALTER TABLE portal_perf_forms ADD COLUMN is_template TINYINT(1) DEFAULT 0 AFTER is_active",
        "ALTER TABLE portal_perf_forms ADD COLUMN template_key VARCHAR(100) NULL AFTER is_template",
        "ALTER TABLE portal_perf_forms ADD COLUMN is_public TINYINT(1) DEFAULT 0 AFTER template_key",
        "ALTER TABLE portal_perf_forms ADD COLUMN banner_image VARCHAR(500) NULL AFTER is_public",
        "ALTER TABLE portal_perf_forms ADD COLUMN theme_primary_color VARCHAR(20) DEFAULT '#ff3b3b' AFTER banner_image",
        "ALTER TABLE portal_perf_forms ADD COLUMN footer_bg_color VARCHAR(20) NULL AFTER theme_primary_color",
        "ALTER TABLE portal_perf_forms ADD COLUMN footer_text_color VARCHAR(20) NULL AFTER footer_bg_color",
        "ALTER TABLE portal_perf_forms ADD COLUMN footer_pattern_color VARCHAR(20) NULL AFTER footer_text_color",
        "ALTER TABLE portal_perf_fields MODIFY COLUMN type VARCHAR(32) NOT NULL",
    ] as $sql) {
        try {
            $db->exec($sql);
        } catch (Exception $e) { /* already migrated */
        }
    }
    try {
        $db->exec("UPDATE portal_perf_forms SET scope_type = CASE WHEN scope_unit_id IS NULL THEN 'zone' ELSE 'unit' END WHERE scope_type IS NULL OR scope_type = ''");
    } catch (Exception $e) { /* ignore */
    }
}

/**
 * Get the list of column names for a table (cached).
 */
function getTableColumns($db, $table)
{
    static $cache = [];
    if (isset($cache[$table]))
        return $cache[$table];
    try {
        $rows = $db->query("SHOW COLUMNS FROM $table")->fetchAll(PDO::FETCH_ASSOC);
        $cache[$table] = array_column($rows, 'Field');
    } catch (Exception $e) {
        $cache[$table] = [];
    }
    return $cache[$table];
}

/* ═══════════════════════════════════════════
Setup (creates portal tables)
═══════════════════════════════════════════ */

function portalSetup()
{
    $db = getDB();

    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_units (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_regions (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_circles (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_campuses (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_users (
                id VARCHAR(36) PRIMARY KEY,
                first_name VARCHAR(128) NOT NULL,
                middle_name VARCHAR(128),
                last_name VARCHAR(128),
                username VARCHAR(64) UNIQUE,
                phone VARCHAR(20) NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                date_of_birth VARCHAR(8),
                role ENUM('admin','zonal_secretary','regional_president','unit_president','member') NOT NULL,
                unit_id VARCHAR(36),
                circle_id VARCHAR(36),
                campus_id VARCHAR(36),
                permission_overrides JSON,
                avatar_url TEXT,
                title VARCHAR(255),
                title_assigned_by VARCHAR(36),
                title_assigned_at TIMESTAMP NULL,
                status ENUM('active','inactive','migrated','revoked') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (unit_id) REFERENCES portal_units(id) ON DELETE SET NULL,
                FOREIGN KEY (circle_id) REFERENCES portal_circles(id) ON DELETE SET NULL,
                FOREIGN KEY (campus_id) REFERENCES portal_campuses(id) ON DELETE SET NULL,
                INDEX idx_pu_role (role), INDEX idx_pu_unit (unit_id), INDEX idx_pu_circle (circle_id), INDEX idx_pu_campus (campus_id), INDEX idx_pu_phone (phone), INDEX idx_pu_username (username)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

    // Migrate from full_name to first/middle/last if old column exists
    $cols = $db->query("SHOW COLUMNS FROM portal_users LIKE 'full_name'")->fetchAll();
    if (count($cols) > 0) {
        try {
            $db->exec("ALTER TABLE portal_users ADD COLUMN first_name VARCHAR(128) AFTER id");
            $db->exec("ALTER TABLE portal_users ADD COLUMN middle_name VARCHAR(128) AFTER first_name");
            $db->exec("ALTER TABLE portal_users ADD COLUMN last_name VARCHAR(128) AFTER middle_name");
        } catch (Exception $e) { /* already added */
        }
        // Allow last_name to be NULL (single-name people)
        try {
            $db->exec("ALTER TABLE portal_users MODIFY COLUMN last_name VARCHAR(128) NULL");
        } catch (Exception $e) { /* ignore */
        }
        $rows = $db->query("SELECT id, full_name FROM portal_users WHERE first_name IS NULL OR first_name = ''")->fetchAll();
        foreach ($rows as $r) {
            $parts = preg_split('/\s+/', trim($r['full_name']), -1, PREG_SPLIT_NO_EMPTY);
            $first = $parts[0] ?? 'Unknown';
            $last = count($parts) > 1 ? end($parts) : $first;
            $middle = count($parts) > 2 ? implode(' ', array_slice($parts, 1, -1)) : null;
            $stmt = $db->prepare("UPDATE portal_users SET first_name = ?, middle_name = ?, last_name = ? WHERE id = ?");
            $stmt->execute([$first, $middle, $last, $r['id']]);
        }
        try {
            $db->exec("ALTER TABLE portal_users DROP COLUMN full_name");
        } catch (Exception $e) { /* ignore */
        }
    }

    // Add date_of_birth if table already existed without it
    try {
        $db->exec("ALTER TABLE portal_users ADD COLUMN date_of_birth VARCHAR(8) AFTER password");
    } catch (Exception $e) {
        // Column already exists
    }
    // Add username if missing
    try {
        $db->exec("ALTER TABLE portal_users ADD COLUMN username VARCHAR(64) UNIQUE AFTER last_name");
    } catch (Exception $e) {
        // Column already exists
    }
    // Create portal_circles if missing (for existing DBs)
    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_circles (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    // Add circle_id and permission_overrides if missing
    try {
        $db->exec("ALTER TABLE portal_users ADD COLUMN circle_id VARCHAR(36) AFTER unit_id");
        $db->exec("ALTER TABLE portal_users ADD COLUMN permission_overrides JSON AFTER circle_id");
    } catch (Exception $e) {
        // Columns already exist
    }
    // Create portal_campuses if missing
    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_campuses (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    try {
        $db->exec("ALTER TABLE portal_users ADD COLUMN campus_id VARCHAR(36) AFTER circle_id");
    } catch (Exception $e) {
        // Column already exists
    }

    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_region_units (
                id VARCHAR(36) PRIMARY KEY,
                regional_president_id VARCHAR(36) NOT NULL,
                unit_id VARCHAR(36) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (regional_president_id) REFERENCES portal_users(id) ON DELETE CASCADE,
                FOREIGN KEY (unit_id) REFERENCES portal_units(id) ON DELETE CASCADE,
                UNIQUE KEY uq_rg (regional_president_id, unit_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

    // Region: unit belongs to a region; regional president is assigned to a region (like unit has unit president)
    try {
        $db->exec("ALTER TABLE portal_units ADD COLUMN region_id VARCHAR(36) NULL AFTER name");
    } catch (Exception $e) {
        // Column already exists
    }
    try {
        $db->exec("ALTER TABLE portal_units ADD CONSTRAINT fk_portal_units_region FOREIGN KEY (region_id) REFERENCES portal_regions(id) ON DELETE SET NULL");
    } catch (Exception $e) {
        // Constraint already exists
    }
    try {
        $db->exec("ALTER TABLE portal_users ADD COLUMN region_id VARCHAR(36) NULL AFTER unit_id");
    } catch (Exception $e) {
        // Column already exists
    }
    try {
        $db->exec("ALTER TABLE portal_users ADD CONSTRAINT fk_portal_users_region FOREIGN KEY (region_id) REFERENCES portal_regions(id) ON DELETE SET NULL");
    } catch (Exception $e) {
        // Constraint already exists
    }
    try {
        $db->exec("ALTER TABLE portal_users ADD COLUMN title_color VARCHAR(32) NULL AFTER title_assigned_at");
    } catch (Exception $e) {
        // Column already exists
    }
    // Add alt_phone column
    try {
        $db->exec("ALTER TABLE portal_users ADD COLUMN alt_phone VARCHAR(20) NULL AFTER phone");
    } catch (Exception $e) {
        // Column already exists
    }
    // Add inactive tracking columns
    try {
        $db->exec("ALTER TABLE portal_users ADD COLUMN inactivated_by VARCHAR(36) NULL AFTER status");
    } catch (Exception $e) { /* Column already exists */
    }
    try {
        $db->exec("ALTER TABLE portal_users ADD COLUMN inactive_reason JSON NULL AFTER inactivated_by");
    } catch (Exception $e) { /* Column already exists */
    }
    try {
        $db->exec("ALTER TABLE portal_users ADD COLUMN inactivated_at TIMESTAMP NULL AFTER inactive_reason");
    } catch (Exception $e) { /* Column already exists */
    }
    // Add revoke tracking columns
    try {
        $db->exec("ALTER TABLE portal_users ADD COLUMN revoked_by VARCHAR(36) NULL AFTER inactivated_at");
    } catch (Exception $e) { /* Column already exists */
    }
    try {
        $db->exec("ALTER TABLE portal_users ADD COLUMN revoke_reason TEXT NULL AFTER revoked_by");
    } catch (Exception $e) { /* Column already exists */
    }
    try {
        $db->exec("ALTER TABLE portal_users ADD COLUMN revoked_at TIMESTAMP NULL AFTER revoke_reason");
    } catch (Exception $e) { /* Column already exists */
    }
    // Add 'revoked' to status ENUM if not present
    try {
        $db->exec("ALTER TABLE portal_users MODIFY COLUMN status ENUM('active','inactive','migrated','revoked') DEFAULT 'active'");
    } catch (Exception $e) { /* Already updated */
    }
    // Backfill from portal_region_units: one region per RP, set users.region_id and units.region_id
    $regionCount = (int) $db->query("SELECT COUNT(*) FROM portal_regions")->fetchColumn();
    if ($regionCount === 0) {
        $rps = $db->query("SELECT DISTINCT regional_president_id FROM portal_region_units")->fetchAll();
        foreach ($rps as $row) {
            $rpId = $row['regional_president_id'];
            $rp = $db->prepare("SELECT id, first_name, middle_name, last_name FROM portal_users WHERE id = ? AND role = 'regional_president'");
            $rp->execute([$rpId]);
            $rp = $rp->fetch();
            if (!$rp)
                continue;
            $regionName = 'Region - ' . trim($rp['first_name'] . ' ' . ($rp['middle_name'] ?? '') . ' ' . $rp['last_name']);
            $regionId = uuid();
            $db->prepare("INSERT INTO portal_regions (id, name) VALUES (?, ?)")->execute([$regionId, $regionName]);
            $db->prepare("UPDATE portal_users SET region_id = ? WHERE id = ?")->execute([$regionId, $rpId]);
            $unitIds = $db->prepare("SELECT unit_id FROM portal_region_units WHERE regional_president_id = ?");
            $unitIds->execute([$rpId]);
            foreach ($unitIds->fetchAll(PDO::FETCH_COLUMN) as $uid) {
                $db->prepare("UPDATE portal_units SET region_id = ? WHERE id = ?")->execute([$regionId, $uid]);
            }
        }
    }

    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_migration_requests (
                id VARCHAR(36) PRIMARY KEY,
                member_id VARCHAR(36) NOT NULL,
                from_unit_id VARCHAR(36) NOT NULL,
                to_unit_id VARCHAR(36) NOT NULL,
                status ENUM('pending','approved','rejected') DEFAULT 'pending',
                requested_by VARCHAR(36) NOT NULL,
                resolved_by VARCHAR(36),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP NULL,
                FOREIGN KEY (member_id) REFERENCES portal_users(id) ON DELETE CASCADE,
                FOREIGN KEY (from_unit_id) REFERENCES portal_units(id),
                FOREIGN KEY (to_unit_id) REFERENCES portal_units(id),
                FOREIGN KEY (requested_by) REFERENCES portal_users(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    // Make to_unit_id nullable for zone/location migrations
    try {
        $db->exec("ALTER TABLE portal_migration_requests MODIFY to_unit_id VARCHAR(36) NULL");
    } catch (Exception $e) {
    }
    try {
        $db->exec("ALTER TABLE portal_migration_requests ADD COLUMN to_location VARCHAR(255) NULL AFTER to_unit_id");
    } catch (Exception $e) {
    }
    try {
        $db->exec("ALTER TABLE portal_migration_requests ADD COLUMN reason TEXT NULL AFTER to_location");
    } catch (Exception $e) {
    }
    try {
        $db->exec("ALTER TABLE portal_migration_requests ADD COLUMN seen_at TIMESTAMP NULL AFTER resolved_at");
    } catch (Exception $e) {
    }

    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_messages (
                id VARCHAR(36) PRIMARY KEY,
                sender_id VARCHAR(36) NOT NULL,
                recipient_id VARCHAR(36),
                recipient_role ENUM('admin','zonal_secretary','regional_president','unit_president','member'),
                subject VARCHAR(500) NOT NULL,
                body TEXT NOT NULL,
                is_broadcast TINYINT(1) DEFAULT 0,
                is_read TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES portal_users(id) ON DELETE CASCADE,
                FOREIGN KEY (recipient_id) REFERENCES portal_users(id) ON DELETE CASCADE,
                INDEX idx_pm_sender (sender_id), INDEX idx_pm_recipient (recipient_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_perf_forms (
                id VARCHAR(36) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                created_by VARCHAR(36) NOT NULL,
                scope_type VARCHAR(20) DEFAULT 'zone',
                scope_region_id VARCHAR(36) NULL,
                scope_unit_id VARCHAR(36),
                scope_circle_id VARCHAR(36) NULL,
                scope_campus_id VARCHAR(36) NULL,
                period VARCHAR(50),
                is_active TINYINT(1) DEFAULT 1,
                is_template TINYINT(1) DEFAULT 0,
                template_key VARCHAR(100) NULL,
                is_public TINYINT(1) DEFAULT 0,
                banner_image VARCHAR(500) NULL,
                theme_primary_color VARCHAR(20) DEFAULT '#ff3b3b',
                footer_bg_color VARCHAR(20) NULL,
                footer_text_color VARCHAR(20) NULL,
                footer_pattern_color VARCHAR(20) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES portal_users(id) ON DELETE CASCADE,
                FOREIGN KEY (scope_unit_id) REFERENCES portal_units(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_perf_fields (
                id VARCHAR(36) PRIMARY KEY,
                form_id VARCHAR(36) NOT NULL,
                type VARCHAR(32) NOT NULL,
                label VARCHAR(500) NOT NULL,
                description TEXT,
                options JSON,
                is_required TINYINT(1) DEFAULT 1,
                display_order INT DEFAULT 0,
                max_value INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (form_id) REFERENCES portal_perf_forms(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

    foreach ([
        "ALTER TABLE portal_perf_forms ADD COLUMN scope_type VARCHAR(20) DEFAULT 'zone' AFTER created_by",
        "ALTER TABLE portal_perf_forms ADD COLUMN scope_region_id VARCHAR(36) NULL AFTER scope_type",
        "ALTER TABLE portal_perf_forms ADD COLUMN scope_circle_id VARCHAR(36) NULL AFTER scope_unit_id",
        "ALTER TABLE portal_perf_forms ADD COLUMN scope_campus_id VARCHAR(36) NULL AFTER scope_circle_id",
        "ALTER TABLE portal_perf_forms ADD COLUMN is_template TINYINT(1) DEFAULT 0 AFTER is_active",
        "ALTER TABLE portal_perf_forms ADD COLUMN template_key VARCHAR(100) NULL AFTER is_template",
        "ALTER TABLE portal_perf_forms ADD COLUMN is_public TINYINT(1) DEFAULT 0 AFTER template_key",
        "ALTER TABLE portal_perf_forms ADD COLUMN banner_image VARCHAR(500) NULL AFTER is_public",
        "ALTER TABLE portal_perf_forms ADD COLUMN theme_primary_color VARCHAR(20) DEFAULT '#ff3b3b' AFTER banner_image",
        "ALTER TABLE portal_perf_forms ADD COLUMN footer_bg_color VARCHAR(20) NULL AFTER theme_primary_color",
        "ALTER TABLE portal_perf_forms ADD COLUMN footer_text_color VARCHAR(20) NULL AFTER footer_bg_color",
        "ALTER TABLE portal_perf_forms ADD COLUMN footer_pattern_color VARCHAR(20) NULL AFTER footer_text_color",
        "ALTER TABLE portal_perf_fields MODIFY COLUMN type VARCHAR(32) NOT NULL",
    ] as $sql) {
        try {
            $db->exec($sql);
        } catch (Exception $e) { /* Column/type already migrated */
        }
    }

    try {
        $db->exec("UPDATE portal_perf_forms SET scope_type = CASE WHEN scope_unit_id IS NULL THEN 'zone' ELSE 'unit' END WHERE scope_type IS NULL OR scope_type = ''");
    } catch (Exception $e) { /* ignore */
    }

    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_perf_responses (
                id VARCHAR(36) PRIMARY KEY,
                form_id VARCHAR(36) NOT NULL,
                member_id VARCHAR(36) NOT NULL,
                response_data JSON NOT NULL,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (form_id) REFERENCES portal_perf_forms(id) ON DELETE CASCADE,
                FOREIGN KEY (member_id) REFERENCES portal_users(id) ON DELETE CASCADE,
                UNIQUE KEY uq_pr (form_id, member_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_perf_public_responses (
                id VARCHAR(36) PRIMARY KEY,
                form_id VARCHAR(36) NOT NULL,
                respondent_name VARCHAR(255) NULL,
                respondent_email VARCHAR(255) NULL,
                respondent_phone VARCHAR(32) NULL,
                response_data JSON NOT NULL,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (form_id) REFERENCES portal_perf_forms(id) ON DELETE CASCADE,
                INDEX idx_pppr_form (form_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_perf_form_views (
                form_id VARCHAR(36) NOT NULL,
                member_id VARCHAR(36) NOT NULL,
                seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (form_id, member_id),
                FOREIGN KEY (form_id) REFERENCES portal_perf_forms(id) ON DELETE CASCADE,
                FOREIGN KEY (member_id) REFERENCES portal_users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_perf_reviews (
                id VARCHAR(36) PRIMARY KEY,
                response_id VARCHAR(36) NOT NULL,
                reviewer_id VARCHAR(36) NOT NULL,
                comment TEXT,
                rating INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (response_id) REFERENCES portal_perf_responses(id) ON DELETE CASCADE,
                FOREIGN KEY (reviewer_id) REFERENCES portal_users(id) ON DELETE CASCADE,
                UNIQUE KEY uq_perf_review (response_id, reviewer_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_perf_response_notification_views (
                response_id VARCHAR(36) NOT NULL,
                user_id VARCHAR(36) NOT NULL,
                seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (response_id, user_id),
                FOREIGN KEY (response_id) REFERENCES portal_perf_responses(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES portal_users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

    // === UNIFIED MEMBERSHIP MODEL MIGRATION ===
    // Add region_id to portal_circles
    try {
        $db->exec("ALTER TABLE portal_circles ADD COLUMN region_id VARCHAR(36) NULL AFTER name");
    } catch (Exception $e) { /* Column already exists */
    }
    try {
        $db->exec("ALTER TABLE portal_circles ADD CONSTRAINT fk_portal_circles_region FOREIGN KEY (region_id) REFERENCES portal_regions(id) ON DELETE SET NULL");
    } catch (Exception $e) { /* Constraint already exists */
    }

    // Add membership_type and membership_id to portal_users
    try {
        $db->exec("ALTER TABLE portal_users ADD COLUMN membership_type ENUM('unit','circle','campus') NULL AFTER region_id");
    } catch (Exception $e) { /* Column already exists */
    }
    try {
        $db->exec("ALTER TABLE portal_users ADD COLUMN membership_id VARCHAR(36) NULL AFTER membership_type");
    } catch (Exception $e) { /* Column already exists */
    }

    // Migrate existing data: unit_id -> membership_type='unit', etc.
    // Only run if membership_type is mostly NULL (migration not done yet)
    $migratedCount = (int) $db->query("SELECT COUNT(*) FROM portal_users WHERE membership_type IS NOT NULL")->fetchColumn();
    $totalUsers = (int) $db->query("SELECT COUNT(*) FROM portal_users")->fetchColumn();
    if ($totalUsers > 0 && $migratedCount < $totalUsers * 0.5) {
        // Migrate users with unit_id
        $db->exec("UPDATE portal_users SET membership_type = 'unit', membership_id = unit_id WHERE unit_id IS NOT NULL AND (membership_type IS NULL OR membership_id IS NULL)");
        // Migrate users with only circle_id
        $db->exec("UPDATE portal_users SET membership_type = 'circle', membership_id = circle_id WHERE unit_id IS NULL AND circle_id IS NOT NULL AND (membership_type IS NULL OR membership_id IS NULL)");
        // Migrate users with only campus_id
        $db->exec("UPDATE portal_users SET membership_type = 'campus', membership_id = campus_id WHERE unit_id IS NULL AND circle_id IS NULL AND campus_id IS NOT NULL AND (membership_type IS NULL OR membership_id IS NULL)");
    }

    // Profile edit verification requests table
    $db->exec("
            CREATE TABLE IF NOT EXISTS portal_edit_requests (
                id VARCHAR(36) PRIMARY KEY,
                member_id VARCHAR(36) NOT NULL,
                changes JSON NOT NULL,
                status ENUM('pending','approved','rejected') DEFAULT 'pending',
                reviewed_by VARCHAR(36),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_at TIMESTAMP NULL,
                FOREIGN KEY (member_id) REFERENCES portal_users(id) ON DELETE CASCADE,
                INDEX idx_per_member (member_id),
                INDEX idx_per_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

    return ['success' => true, 'messssage' => 'Portal tables created.'];
}

/* ═══════════════════════════════════════════
Seed (inserts sample data)
═══════════════════════════════════════════ */

function portalSeed()
{
    $db = getDB();

    // Units (include HQ so admin/zonal/regional have a unit)
    $units = ['SIO Delhi HQ', 'Jamia Unit', 'Okhla Unit', 'Laxmi Nagar Unit', 'Chandni Chowk Unit', 'Rohini Unit'];
    $unitIds = [];
    $stmt = $db->prepare("INSERT IGNORE INTO portal_units (id, name) VALUES (?, ?)");
    foreach ($units as $name) {
        $id = uuid();
        $stmt->execute([$id, $name]);
        $row = $db->query("SELECT id FROM portal_units WHERE name = " . $db->quote($name))->fetch();
        $unitIds[$name] = $row['id'];
    }

    // Circles (same level as units)
    $circles = ['Study Circle A', 'Outreach Circle', 'Media Circle'];
    $circleIds = [];
    $stmtC = $db->prepare("INSERT IGNORE INTO portal_circles (id, name) VALUES (?, ?)");
    foreach ($circles as $name) {
        $id = uuid();
        $stmtC->execute([$id, $name]);
        $row = $db->query("SELECT id FROM portal_circles WHERE name = " . $db->quote($name))->fetch();
        $circleIds[$name] = $row['id'];
    }

    // Users: first_name, middle_name, last_name, phone, password, role, unit_name, date_of_birth (DDMMYYYY), circle_name
    $usersData = [
        ['SIO', null, 'DELHI', '8447097627', 'Siod1990', 'admin', 'SIO Delhi HQ', '01011990', null],
        ['Ankit', null, 'Singh', '9397395704', '8tE3mrK#l7Y', 'admin', 'SIO Delhi HQ', '15051988', null],
        ['Preeti', null, 'Verma', '8204572942', 'OT8j9#i9aZU', 'admin', 'SIO Delhi HQ', '22081991', null],
        ['Ramesh', null, 'Gautam', '9847263851', '37LmZ#FdzLE', 'zonal_secretary', 'SIO Delhi HQ', '10031989', null],
        ['Sunita', null, 'Sharma', '9429593922', 'VeL46Rbt0Q#', 'zonal_secretary', 'SIO Delhi HQ', '05071992', null],
        ['Vikram', null, 'Tandon', '9312456780', 'rP4#mKz8vXw', 'regional_president', 'SIO Delhi HQ', '12061990', null],
        ['Neha', null, 'Kapoor', '9456123780', 'nK7#qLs3bYt', 'regional_president', 'SIO Delhi HQ', '28021993', null],
        ['Priya', null, 'Jain', '9652748391', 'ghMlCiih9#Y', 'unit_president', 'Jamia Unit', '14041991', 'Study Circle A'],
        ['Aadhya', null, 'Yadav', '9894716385', 'e5ymEKMOcU#', 'unit_president', 'Okhla Unit', '09111989', 'Outreach Circle'],
        ['Aanya', null, 'Choudhary', '7014829637', '#eUIO2cn7wr', 'unit_president', 'Laxmi Nagar Unit', '03121992', null],
        ['Nandini', null, 'Bhatt', '8546392500', '2#Lhg7J24wr', 'member', 'Jamia Unit', '25031999', 'Study Circle A'],
        ['Myra', null, 'Choudhary', '7113719303', '3CKCg3Vde#2', 'member', 'Jamia Unit', '15062001', 'Study Circle A'],
        ['Kabir', null, 'Malik', '9234567890', 'kM9#xPq2rTw', 'member', 'Okhla Unit', '08051998', 'Outreach Circle'],
        ['Ishaan', null, 'Verma', '8765432109', 'iV7#bNz4mYs', 'member', 'Laxmi Nagar Unit', '12041997', null],
        ['Arjun', null, 'Mehta', '9876543210', 'Arju1996', 'member', 'Jamia Unit', '18081996', 'Media Circle'],
        ['Sana', null, 'Khan', '9123456789', 'Sana2000', 'member', 'Okhla Unit', '22052000', null],
    ];

    $stmt = $db->prepare("INSERT IGNORE INTO portal_users (id, first_name, middle_name, last_name, username, phone, password, date_of_birth, role, unit_id, circle_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
    foreach ($usersData as $u) {
        $uid = uuid();
        $unitId = $u[6] ? ($unitIds[$u[6]] ?? null) : null;
        $circleId = $u[8] ? ($circleIds[$u[8]] ?? null) : null;
        $username = generateUsername($u[0], $u[7], $db);
        $stmt->execute([$uid, $u[0], $u[1], $u[2], $username, $u[3], $u[4], $u[7], $u[5], $unitId, $circleId]);
    }

    // Helper to get user id by phone
    $getUserId = function ($phone) use ($db) {
        return $db->query("SELECT id FROM portal_users WHERE phone = " . $db->quote($phone))->fetchColumn();
    };

    // Region mappings: Region is a separate entity; each has a regional president and units.
    $vikramId = $getUserId('9312456780');
    $nehaId = $getUserId('9456123780');
    if ($vikramId) {
        $regionId1 = uuid();
        $db->prepare("INSERT IGNORE INTO portal_regions (id, name) VALUES (?, ?)")->execute([$regionId1, 'Region - Vikram Tandon']);
        $db->prepare("UPDATE portal_users SET region_id = ? WHERE id = ?")->execute([$regionId1, $vikramId]);
        foreach (['Jamia Unit', 'Okhla Unit'] as $uname) {
            if (isset($unitIds[$uname])) {
                $db->prepare("UPDATE portal_units SET region_id = ? WHERE id = ?")->execute([$regionId1, $unitIds[$uname]]);
            }
        }
        $stmtR = $db->prepare("INSERT IGNORE INTO portal_region_units (id, regional_president_id, unit_id) VALUES (?,?,?)");
        if (isset($unitIds['Jamia Unit']))
            $stmtR->execute([uuid(), $vikramId, $unitIds['Jamia Unit']]);
        if (isset($unitIds['Okhla Unit']))
            $stmtR->execute([uuid(), $vikramId, $unitIds['Okhla Unit']]);
    }
    if ($nehaId) {
        $regionId2 = uuid();
        $db->prepare("INSERT IGNORE INTO portal_regions (id, name) VALUES (?, ?)")->execute([$regionId2, 'Region - Neha Kapoor']);
        $db->prepare("UPDATE portal_users SET region_id = ? WHERE id = ?")->execute([$regionId2, $nehaId]);
        foreach (['Laxmi Nagar Unit', 'Chandni Chowk Unit', 'Rohini Unit'] as $uname) {
            if (isset($unitIds[$uname])) {
                $db->prepare("UPDATE portal_units SET region_id = ? WHERE id = ?")->execute([$regionId2, $unitIds[$uname]]);
            }
        }
        $stmtR = $db->prepare("INSERT IGNORE INTO portal_region_units (id, regional_president_id, unit_id) VALUES (?,?,?)");
        if (isset($unitIds['Laxmi Nagar Unit']))
            $stmtR->execute([uuid(), $nehaId, $unitIds['Laxmi Nagar Unit']]);
        if (isset($unitIds['Chandni Chowk Unit']))
            $stmtR->execute([uuid(), $nehaId, $unitIds['Chandni Chowk Unit']]);
        if (isset($unitIds['Rohini Unit']))
            $stmtR->execute([uuid(), $nehaId, $unitIds['Rohini Unit']]);
    }

    // Title assignments
    $ankitId = $getUserId('9397395704');
    $priyaId = $getUserId('9652748391');
    $aadhyaId = $getUserId('9894716385');

    if ($ankitId)
        $db->exec("UPDATE portal_users SET title='Zonal President', title_assigned_by='$ankitId', title_assigned_at=NOW() WHERE phone='9429593922'");
    if ($priyaId)
        $db->exec("UPDATE portal_users SET title='Joint Secretary', title_assigned_by='$priyaId', title_assigned_at=NOW() WHERE phone='8546392500'");
    if ($aadhyaId)
        $db->exec("UPDATE portal_users SET title='JAC Secretary', title_assigned_by='$aadhyaId', title_assigned_at=NOW() WHERE phone='9234567890'");

    // Dummy performance form (zone-wide, created by zonal)
    $formId = uuid();
    $rameshId = $getUserId('9847263851');
    if ($rameshId) {
        $db->prepare("INSERT IGNORE INTO portal_perf_forms (id, title, description, created_by, scope_unit_id, period, is_active) VALUES (?,?,?,?,?,?,?)")
            ->execute([$formId, 'January 2026 Evaluation', 'Monthly activity and engagement self-assessment.', $rameshId, null, '2026-01', 1]);

        $f1 = uuid();
        $f2 = uuid();
        $f3 = uuid();
        $db->prepare("INSERT IGNORE INTO portal_perf_fields (id, form_id, type, label, description, options, is_required, display_order, max_value) VALUES (?,?,?,?,?,?,?,?,?)")
            ->execute([$f1, $formId, 'subjective', 'What activities did you participate in this month?', 'List events or programs.', null, 1, 0, null]);
        $db->prepare("INSERT IGNORE INTO portal_perf_fields (id, form_id, type, label, description, options, is_required, display_order, max_value) VALUES (?,?,?,?,?,?,?,?,?)")
            ->execute([$f2, $formId, 'rating', 'Rate your overall engagement (1-5)', null, null, 1, 1, 5]);
        $db->prepare("INSERT IGNORE INTO portal_perf_fields (id, form_id, type, label, description, options, is_required, display_order, max_value) VALUES (?,?,?,?,?,?,?,?,?)")
            ->execute([$f3, $formId, 'mcq', 'Would you like to take up a role next month?', null, json_encode(['Yes', 'No', 'Maybe']), 1, 2, null]);

        $nandiniId = $getUserId('8546392500');
        $kabirId = $getUserId('9234567890');
        $ishaanId = $getUserId('8765432109');
        $arjunId = $getUserId('9876543210');

        if ($nandiniId) {
            $r1 = uuid();
            $db->prepare("INSERT IGNORE INTO portal_perf_responses (id, form_id, member_id, response_data) VALUES (?,?,?,?)")
                ->execute([$r1, $formId, $nandiniId, json_encode([$f1 => 'Attended unit meeting and study circle.', $f2 => 4, $f3 => 'Yes'])]);
            if ($priyaId) {
                $db->prepare("INSERT IGNORE INTO portal_perf_reviews (id, response_id, reviewer_id, comment, rating) VALUES (?,?,?,?,?)")
                    ->execute([uuid(), $r1, $priyaId, 'Good participation. Keep it up.', 4]);
            }
        }
        if ($kabirId) {
            $r2 = uuid();
            $db->prepare("INSERT IGNORE INTO portal_perf_responses (id, form_id, member_id, response_data) VALUES (?,?,?,?)")
                ->execute([$r2, $formId, $kabirId, json_encode([$f1 => 'JAC meeting and campus drive.', $f2 => 5, $f3 => 'Yes'])]);
            if ($aadhyaId) {
                $db->prepare("INSERT IGNORE INTO portal_perf_reviews (id, response_id, reviewer_id, comment, rating) VALUES (?,?,?,?,?)")
                    ->execute([uuid(), $r2, $aadhyaId, 'Excellent. Consider for JAC Secretary role.', 5]);
            }
        }
        if ($ishaanId) {
            $r3 = uuid();
            $db->prepare("INSERT IGNORE INTO portal_perf_responses (id, form_id, member_id, response_data) VALUES (?,?,?,?)")
                ->execute([$r3, $formId, $ishaanId, json_encode([$f1 => 'Could not attend due to exams.', $f2 => 2, $f3 => 'Maybe'])]);
        }
        if ($arjunId) {
            $r4 = uuid();
            $db->prepare("INSERT IGNORE INTO portal_perf_responses (id, form_id, member_id, response_data) VALUES (?,?,?,?)")
                ->execute([$r4, $formId, $arjunId, json_encode([$f1 => 'Study circle and volunteer event.', $f2 => 4, $f3 => 'Yes'])]);
        }
    }

    // Dummy migration request (pending)
    $nandiniId = $getUserId('8546392500');
    $jamiaUnitId = $unitIds['Jamia Unit'] ?? null;
    $okhlaUnitId = $unitIds['Okhla Unit'] ?? null;
    if ($nandiniId && $jamiaUnitId && $okhlaUnitId) {
        $db->prepare("INSERT IGNORE INTO portal_migration_requests (id, member_id, from_unit_id, to_unit_id, status, requested_by) VALUES (?,?,?,?,?,?)")
            ->execute([uuid(), $nandiniId, $jamiaUnitId, $okhlaUnitId, 'pending', $nandiniId]);
    }

    // Dummy messages
    $rameshId = $getUserId('9847263851');
    $priyaId = $getUserId('9652748391');
    $nandiniId = $getUserId('8546392500');
    if ($rameshId && $priyaId) {
        $db->prepare("INSERT IGNORE INTO portal_messages (id, sender_id, recipient_id, subject, body, is_read) VALUES (?,?,?,?,?,?)")
            ->execute([uuid(), $rameshId, $priyaId, 'January unit report', 'Please share the Jamia unit activity summary by weekend.', 0]);
    }
    if ($nandiniId && $priyaId) {
        $db->prepare("INSERT IGNORE INTO portal_messages (id, sender_id, recipient_id, subject, body, is_read) VALUES (?,?,?,?,?,?)")
            ->execute([uuid(), $nandiniId, $priyaId, 'Query about next meeting', 'When is the next unit meeting scheduled?', 1]);
    }
    if ($priyaId && $nandiniId) {
        $db->prepare("INSERT IGNORE INTO portal_messages (id, sender_id, recipient_id, subject, body, is_read) VALUES (?,?,?,?,?,?)")
            ->execute([uuid(), $priyaId, $nandiniId, 'Re: Next meeting', 'Next meeting is on Saturday 2 PM at the usual venue.', 0]);
    }

    return ['success' => true, 'message' => 'Portal seed data inserted.'];
}

/* ═══════════════════════════════════════════
Auth: Look up portal user by Clerk phone
═══════════════════════════════════════════ */

function portalAuthMe()
{
    $body = jsonBody();
    $phone = $body['phone'] ?? null;
    $username = $body['username'] ?? null;
    $email = $body['email'] ?? null;

    if (!$phone && !$username && !$email) {
        http_response_code(400);
        return ['error' => 'Phone, username, or email required.'];
    }

    $db = getDB();

    // Build query dynamically — add circle/campus JOINs and region info when columns exist
    $regionCols = hasRegionColumns($db);
    $unitRegionSelect = $regionCols['units'] ? ', pu.region_id AS unit_region_id' : '';
    $circleJoin = '';
    $campusJoin = '';
    $circleSelect = '';
    $campusSelect = '';
    try {
        $db->query("SELECT 1 FROM portal_circles LIMIT 0");
        $circleJoin = 'LEFT JOIN portal_circles pc ON u.circle_id = pc.id';
        $circleSelect = ', pc.name AS circle_name';
    } catch (Exception $e) {
    }
    try {
        $db->query("SELECT 1 FROM portal_campuses LIMIT 0");
        $campusJoin = 'LEFT JOIN portal_campuses pca ON u.campus_id = pca.id';
        $campusSelect = ', pca.name AS campus_name';
    } catch (Exception $e) {
    }

    try {
        if ($username !== null && $username !== '') {
            $username = trim($username);
            $stmt = $db->prepare("
                    SELECT u.*, pu.name AS unit_name{$unitRegionSelect}{$circleSelect}{$campusSelect}
                    FROM portal_users u
                    LEFT JOIN portal_units pu ON u.unit_id = pu.id
                    {$circleJoin} {$campusJoin}
                    WHERE LOWER(u.username) = LOWER(?)
                ");
            $stmt->execute([$username]);
            $user = $stmt->fetch();
            if ($user)
                return formatUser($user);
        }

        if ($phone) {
            $phone = preg_replace('/^\+91/', '', $phone);
            $phone = preg_replace('/^\+/', '', $phone);

            $stmt = $db->prepare("
                    SELECT u.*, pu.name AS unit_name{$unitRegionSelect}{$circleSelect}{$campusSelect}
                    FROM portal_users u
                    LEFT JOIN portal_units pu ON u.unit_id = pu.id
                    {$circleJoin} {$campusJoin}
                    WHERE u.phone = ?
                ");
            $stmt->execute([$phone]);
            $user = $stmt->fetch();
            if ($user)
                return formatUser($user);
        }
    } catch (Exception $e) {
        http_response_code(500);
        return ['error' => 'Auth lookup failed: ' . $e->getMessage()];
    }

    http_response_code(404);
    return ['error' => 'Portal user not found.'];
}

/* ═══════════════════════════════════════════
Units
═══════════════════════════════════════════ */

function portalGetUnits()
{
    $db = getDB();
    $excludeCampusUnits = ($_GET['excludeCampusUnits'] ?? null) === 'true';

    $regionCols = hasRegionColumns($db);
    $hasRegionsTable = tableExists($db, 'portal_regions');

    $presidentSub = "(SELECT TRIM(CONCAT_WS(' ', first_name, middle_name, last_name)) FROM portal_users WHERE unit_id = u.id AND role = 'unit_president' LIMIT 1)";
    if ($regionCols['units'] && $hasRegionsTable) {
        $sql = "
            SELECT u.id, u.name, u.created_at, u.region_id,
                r.name AS region_name,
                $presidentSub AS unit_president_name
            FROM portal_units u
            LEFT JOIN portal_regions r ON r.id = u.region_id
        ";
        if ($excludeCampusUnits) {
            $sql .= " WHERE u.region_id IS NOT NULL";
        }
    } elseif ($regionCols['units']) {
        $sql = "
            SELECT u.id, u.name, u.created_at, u.region_id,
                NULL AS region_name,
                $presidentSub AS unit_president_name
            FROM portal_units u
        ";
        if ($excludeCampusUnits) {
            $sql .= " WHERE u.region_id IS NOT NULL";
        }
    } else {
        $sql = "
            SELECT u.id, u.name, u.created_at, NULL AS region_id,
                NULL AS region_name,
                $presidentSub AS unit_president_name
            FROM portal_units u
        ";
    }

    $sql .= " ORDER BY u.name";

    $rows = $db->query($sql)->fetchAll();

    // Add is_campus flag for frontend reference
    foreach ($rows as &$row) {
        $row['is_campus'] = $row['region_id'] === null;
    }

    return $rows;
}

function portalCreateUnits()
{
    try {
        $body = jsonBody();
        $units = $body['units'] ?? [];
        if (empty($units)) {
            http_response_code(400);
            return ['error' => 'No units provided'];
        }
        $db = getDB();
        $regionCols = hasRegionColumns($db);
        if ($regionCols['units']) {
            $stmt = $db->prepare("INSERT IGNORE INTO portal_units (id, name, region_id) VALUES (?, ?, ?)");
            foreach ($units as $u) {
                $regionId = !empty($u['region_id']) ? $u['region_id'] : null;
                $stmt->execute([uuid(), $u['name'], $regionId]);
            }
        } else {
            $stmt = $db->prepare("INSERT IGNORE INTO portal_units (id, name) VALUES (?, ?)");
            foreach ($units as $u) {
                $stmt->execute([uuid(), $u['name']]);
            }
        }
        return ['success' => true, 'count' => count($units)];
    } catch (\Throwable $e) {
        http_response_code(500);
        return ['error' => 'Create units failed: ' . $e->getMessage()];
    }
}

function portalUpdateUnit($id)
{
    $body = jsonBody();
    $db = getDB();
    if (array_key_exists('name', $body)) {
        $db->prepare("UPDATE portal_units SET name = ? WHERE id = ?")->execute([$body['name'], $id]);
    }
    $regionCols = hasRegionColumns($db);
    if (array_key_exists('region_id', $body) && $regionCols['units']) {
        $regionId = $body['region_id'] ?: null;
        $db->prepare("UPDATE portal_units SET region_id = ? WHERE id = ?")->execute([$regionId, $id]);
    }
    return ['success' => true];
}

function portalDeleteUnit($id)
{
    $db = getDB();
    $db->prepare("DELETE FROM portal_units WHERE id = ?")->execute([$id]);
    return ['success' => true];
}

function portalGetUnit($id)
{
    $db = getDB();
    try {
        $stmt = $db->prepare("
                SELECT u.id, u.name, u.created_at, u.region_id,
                    r.name AS region_name
                FROM portal_units u
                LEFT JOIN portal_regions r ON r.id = u.region_id
                WHERE u.id = ?
            ");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
    } catch (Exception $e) {
        $stmt = $db->prepare("SELECT id, name, created_at FROM portal_units WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if ($row) {
            $row['region_id'] = null;
            $row['region_name'] = null;
        }
    }
    if (!$row) {
        http_response_code(404);
        return ['error' => 'Unit not found.'];
    }
    return $row;
}

function portalGetUnitMembers($id)
{
    $db = getDB();
    $regionCols = hasRegionColumns($db);
    $unitRegionSelect = $regionCols['units'] ? ', pu.region_id AS unit_region_id' : '';

    $stmt = $db->prepare("
            SELECT u.*, pu.name AS unit_name{$unitRegionSelect}, pc.name AS circle_name, pca.name AS campus_name
            FROM portal_users u
            LEFT JOIN portal_units pu ON u.unit_id = pu.id
            LEFT JOIN portal_circles pc ON u.circle_id = pc.id
            LEFT JOIN portal_campuses pca ON u.campus_id = pca.id
            WHERE u.unit_id = ?
            ORDER BY u.first_name, u.last_name
        ");
    $stmt->execute([$id]);
    return array_map('formatUser', $stmt->fetchAll());
}

/* ═══════════════════════════════════════════
Circles (same level as units; have members via circle_id on users)
═══════════════════════════════════════════ */

function portalGetCircles()
{
    $db = getDB();
    $regionCols = hasRegionColumns($db);

    if ($regionCols['circles']) {
        return $db->query("
            SELECT c.*, r.name AS region_name 
            FROM portal_circles c
            LEFT JOIN portal_regions r ON c.region_id = r.id
            ORDER BY c.name
        ")->fetchAll();
    } else {
        return $db->query("
            SELECT c.*, NULL AS region_name 
            FROM portal_circles c
            ORDER BY c.name
        ")->fetchAll();
    }
}

function portalGetCircle($id)
{
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM portal_circles WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) {
        http_response_code(404);
        return ['error' => 'Circle not found.'];
    }
    return $row;
}

function portalGetCircleMembers($id)
{
    $db = getDB();
    $regionCols = hasRegionColumns($db);
    $unitRegionSelect = $regionCols['units'] ? ', pu.region_id AS unit_region_id' : '';

    $stmt = $db->prepare("
            SELECT u.*, pu.name AS unit_name{$unitRegionSelect}, pc.name AS circle_name, pca.name AS campus_name
            FROM portal_users u
            LEFT JOIN portal_units pu ON u.unit_id = pu.id
            LEFT JOIN portal_circles pc ON u.circle_id = pc.id
            LEFT JOIN portal_campuses pca ON u.campus_id = pca.id
            WHERE u.circle_id = ?
            ORDER BY u.first_name, u.last_name
        ");
    $stmt->execute([$id]);
    return array_map('formatUser', $stmt->fetchAll());
}

function portalCreateCircles()
{
    $body = jsonBody();
    $circles = $body['circles'] ?? [];
    $db = getDB();
    $stmt = $db->prepare("INSERT IGNORE INTO portal_circles (id, name) VALUES (?, ?)");
    foreach ($circles as $c) {
        $stmt->execute([uuid(), $c['name']]);
    }
    return ['success' => true, 'count' => count($circles)];
}

function portalUpdateCircle($id)
{
    $body = jsonBody();
    $db = getDB();
    $stmt = $db->prepare("UPDATE portal_circles SET name = ? WHERE id = ?");
    $stmt->execute([$body['name'], $id]);
    return ['success' => true];
}

function portalDeleteCircle($id)
{
    $db = getDB();
    $db->prepare("UPDATE portal_users SET circle_id = NULL WHERE circle_id = ?")->execute([$id]);
    $db->prepare("DELETE FROM portal_circles WHERE id = ?")->execute([$id]);
    return ['success' => true];
}

/* ═══════════════════════════════════════════
Campuses (same level as units and circles)
═══════════════════════════════════════════ */

function portalGetCampuses()
{
    $db = getDB();
    return $db->query("
        SELECT c.*,
            (SELECT TRIM(CONCAT_WS(' ', first_name, middle_name, last_name)) FROM portal_users WHERE campus_id = c.id AND role = 'campus_president' LIMIT 1) AS campus_president_name
        FROM portal_campuses c
        ORDER BY c.name
    ")->fetchAll();
}

function portalGetCampus($id)
{
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM portal_campuses WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) {
        http_response_code(404);
        return ['error' => 'Campus not found.'];
    }
    return $row;
}

function portalGetCampusMembers($id)
{
    $db = getDB();
    $regionCols = hasRegionColumns($db);
    $unitRegionSelect = $regionCols['units'] ? ', pu.region_id AS unit_region_id' : '';

    $stmt = $db->prepare("
            SELECT u.*, pu.name AS unit_name{$unitRegionSelect}, pc.name AS circle_name, pca.name AS campus_name
            FROM portal_users u
            LEFT JOIN portal_units pu ON u.unit_id = pu.id
            LEFT JOIN portal_circles pc ON u.circle_id = pc.id
            LEFT JOIN portal_campuses pca ON u.campus_id = pca.id
            WHERE u.campus_id = ?
            ORDER BY u.first_name, u.last_name
        ");
    $stmt->execute([$id]);
    return array_map('formatUser', $stmt->fetchAll());
}

function portalCreateCampuses()
{
    $body = jsonBody();
    $campuses = $body['campuses'] ?? [];
    $db = getDB();
    $stmt = $db->prepare("INSERT IGNORE INTO portal_campuses (id, name) VALUES (?, ?)");
    foreach ($campuses as $c) {
        $stmt->execute([uuid(), $c['name']]);
    }
    return ['success' => true, 'count' => count($campuses)];
}

function portalUpdateCampus($id)
{
    $body = jsonBody();
    $db = getDB();
    $stmt = $db->prepare("UPDATE portal_campuses SET name = ? WHERE id = ?");
    $stmt->execute([$body['name'], $id]);
    return ['success' => true];
}

function portalDeleteCampus($id)
{
    $db = getDB();
    $db->prepare("UPDATE portal_users SET campus_id = NULL WHERE campus_id = ?")->execute([$id]);
    $db->prepare("DELETE FROM portal_campuses WHERE id = ?")->execute([$id]);
    return ['success' => true];
}

/* ═══════════════════════════════════════════
Users
═══════════════════════════════════════════ */

function portalGetUsers()
{
    $db = getDB();
    $role = $_GET['role'] ?? null;
    $unitId = $_GET['unitId'] ?? null;
    $circleId = $_GET['circleId'] ?? null;
    $titleOnly = $_GET['titleOnly'] ?? null;

    // Check if region columns exist (may not be migrated yet)
    $regionCols = hasRegionColumns($db);
    $hasUnitRegion = $regionCols['units'];
    $hasUserRegion = $regionCols['users'];

    // Build select clause dynamically based on available columns
    $unitRegionSelect = $hasUnitRegion ? ', pu.region_id AS unit_region_id' : '';
    $regionJoin = '';
    $regionSelect = '';
    if ($hasUserRegion && tableExists($db, 'portal_regions')) {
        $regionSelect = ', pr.name AS region_name';
        $regionJoin = 'LEFT JOIN portal_regions pr ON u.region_id = pr.id';
    }
    // Add dynamic membership_name based on membership_type (only if column exists)
    $membershipNameSelect = '';
    try {
        $cols = $db->query("SHOW COLUMNS FROM portal_users LIKE 'membership_type'")->fetchAll();
        if (count($cols) > 0) {
            $membershipNameSelect = ",
                    CASE u.membership_type
                        WHEN 'unit' THEN pu.name
                        WHEN 'circle' THEN pc.name
                        WHEN 'campus' THEN pca.name
                        ELSE NULL
                    END AS membership_name";
        }
    } catch (Exception $e) { /* Column doesn't exist, skip */
    }

    $sql = "SELECT u.*, pu.name AS unit_name{$unitRegionSelect}{$regionSelect}, pc.name AS circle_name, pca.name AS campus_name{$membershipNameSelect} FROM portal_users u
                LEFT JOIN portal_units pu ON u.unit_id = pu.id
                LEFT JOIN portal_circles pc ON u.circle_id = pc.id
                LEFT JOIN portal_campuses pca ON u.campus_id = pca.id
                {$regionJoin}
                WHERE 1=1";
    $params = [];

    // Hide revoked members from non-admin/non-zonal roles
    $requestingRole = $_GET['requestingRole'] ?? null;
    if ($requestingRole && $requestingRole !== 'admin' && $requestingRole !== 'zonal_secretary') {
        $sql .= " AND u.status != 'revoked'";
    }

    if ($role) {
        $sql .= " AND u.role = ?";
        $params[] = $role;
    }
    if ($unitId) {
        $sql .= " AND u.unit_id = ?";
        $params[] = $unitId;
    }
    if ($circleId) {
        $sql .= " AND u.circle_id = ?";
        $params[] = $circleId;
    }
    $campusId = $_GET['campusId'] ?? null;
    if ($campusId) {
        $sql .= " AND u.campus_id = ?";
        $params[] = $campusId;
    }
    if ($titleOnly) {
        $sql .= " AND u.title IS NOT NULL";
    }
    // Unit Presidents list: show only region/area unit presidents; campus unit presidents appear under Campus Presidents
    $excludeCampusUnits = isset($_GET['excludeCampusUnits']) && $_GET['excludeCampusUnits'] !== '0' && $_GET['excludeCampusUnits'] !== '';
    $campusUnitsOnly = isset($_GET['campusUnitsOnly']) && $_GET['campusUnitsOnly'] !== '0' && $_GET['campusUnitsOnly'] !== '';
    if ($role === 'unit_president' && $excludeCampusUnits && $hasUnitRegion) {
        $sql .= " AND pu.region_id IS NOT NULL";
    }
    if ($role === 'unit_president' && $campusUnitsOnly && $hasUnitRegion) {
        // All 5 campuses: Academy (IIISR), Jamia Millia Islamia, D.U, JNU, Jamia Hamdard. Include any unit_president whose unit is one of these (by name or region_id NULL or user has campus_id).
        $sql .= " AND (
                u.unit_id IN (SELECT id FROM portal_units WHERE region_id IS NULL OR LOWER(TRIM(name)) IN ('iiisr', 'jamia millia islamia', 'd.u', 'jnu', 'jamia hamdard'))
                OR u.campus_id IS NOT NULL
            )";
    }

    $regionId = $_GET['regionId'] ?? null;
    if ($regionId) {
        $conditions = [];
        if ($regionCols['units']) {
            $conditions[] = "pu.region_id = ?";
            $params[] = $regionId;
        }
        if ($regionCols['circles']) {
            $conditions[] = "pc.region_id = ?";
            $params[] = $regionId;
        }
        if (!empty($conditions)) {
            $sql .= " AND (" . implode(' OR ', $conditions) . ")";
        }
    }

    $sql .= " ORDER BY u.first_name, u.last_name";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    return array_map('formatUser', $stmt->fetchAll());
}

function portalGetUser($id)
{
    $db = getDB();
    $regionCols = hasRegionColumns($db);
    $unitRegionSelect = $regionCols['units'] ? ', pu.region_id AS unit_region_id' : '';
    $stmt = $db->prepare("SELECT u.*, pu.name AS unit_name{$unitRegionSelect}, pc.name AS circle_name, pca.name AS campus_name FROM portal_users u
                LEFT JOIN portal_units pu ON u.unit_id = pu.id
                LEFT JOIN portal_circles pc ON u.circle_id = pc.id
                LEFT JOIN portal_campuses pca ON u.campus_id = pca.id
                WHERE u.id = ?");
    $stmt->execute([$id]);
    $user = $stmt->fetch();
    if (!$user) {
        http_response_code(404);
        return ['error' => 'User not found.'];
    }
    return formatUser($user);
}

function portalCreateUsers()
{
    $body = jsonBody();
    $users = $body['users'] ?? [];
    $db = getDB();
    $clerkErrors = [];
    $cols = getTableColumns($db, 'portal_users');
    $hasAltPhone = in_array('alt_phone', $cols);
    $hasMembershipType = in_array('membership_type', $cols);
    $hasMembershipId = in_array('membership_id', $cols);
    $hasRegion = in_array('region_id', $cols);

    // Build dynamic INSERT columns
    $insertCols = ['id', 'first_name', 'middle_name', 'last_name', 'username', 'phone'];
    if ($hasAltPhone)
        $insertCols[] = 'alt_phone';
    $insertCols = array_merge($insertCols, ['password', 'date_of_birth', 'role', 'unit_id']);
    if ($hasMembershipType)
        $insertCols[] = 'membership_type';
    if ($hasMembershipId)
        $insertCols[] = 'membership_id';
    if ($hasRegion)
        $insertCols[] = 'region_id';

    $placeholders = implode(',', array_fill(0, count($insertCols), '?'));
    $colList = implode(', ', $insertCols);
    $stmt = $db->prepare("INSERT INTO portal_users ($colList) VALUES ($placeholders)");

    foreach ($users as $u) {
        $first = trim($u['first_name'] ?? '');
        $middle = isset($u['middle_name']) ? trim($u['middle_name']) : null;
        $last = trim($u['last_name'] ?? '');
        if ($last === '')
            $last = null;
        if ($first === '') {
            continue; // first name is required
        }
        $dob = $u['date_of_birth'] ?? null;
        $phone = $u['phone'] ?? null;
        $password = $u['password'] ?? null;
        if ($password === null || $password === '') {
            $password = generateDefaultPassword($first, $last, $dob, $phone);
        }
        $username = $u['username'] ?? null;
        if ($username === null || $username === '') {
            $username = generateUsername($first, $dob ?: '01011990', $db);
        }

        $params = [uuid(), $first, $middle, $last, $username, $u['phone']];
        if ($hasAltPhone)
            $params[] = $u['alt_phone'] ?? null;
        $params = array_merge($params, [$password, $dob, $u['role'], $u['unit_id'] ?? null]);
        if ($hasMembershipType)
            $params[] = $u['membership_type'] ?? ($u['unit_id'] ? 'unit' : null);
        if ($hasMembershipId)
            $params[] = $u['membership_id'] ?? $u['unit_id'] ?? null;
        if ($hasRegion)
            $params[] = $u['region_id'] ?? null;

        $stmt->execute($params);

        // Create Clerk account for this user
        $clerkResult = createClerkAccount($username, $password, $first, $last);
        if (isset($clerkResult['error'])) {
            $clerkErrors[] = "$first $last: " . $clerkResult['error'];
        }
    }
    $result = ['success' => true, 'count' => count($users)];
    if (!empty($clerkErrors)) {
        $result['clerk_warnings'] = $clerkErrors;
        $result['message'] = count($clerkErrors) . ' user(s) were added to the portal but their Clerk account could not be created: ' . implode('; ', $clerkErrors);
    }
    return $result;
}

function portalUpdateUser($id)
{
    $body = jsonBody();
    $db = getDB();

    // Dynamically check which columns actually exist in the table
    $existingCols = [];
    $colRows = $db->query("SHOW COLUMNS FROM portal_users")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($colRows as $row) {
        $existingCols[] = $row['Field'];
    }

    $allowed = ['first_name', 'middle_name', 'last_name', 'username', 'phone', 'alt_phone', 'password', 'date_of_birth', 'role', 'unit_id', 'circle_id', 'campus_id', 'region_id', 'membership_type', 'membership_id', 'avatar_url', 'status', 'permission_overrides'];
    $sets = [];
    $params = [];
    foreach ($allowed as $key) {
        if (array_key_exists($key, $body) && in_array($key, $existingCols)) {
            $sets[] = "$key = ?";
            $val = $body[$key];
            // Convert empty strings to NULL for nullable foreign keys
            if (in_array($key, ['unit_id', 'region_id', 'circle_id', 'campus_id', 'membership_id']) && $val === '') {
                $val = null;
            }
            if ($key === 'permission_overrides') {
                $params[] = is_string($val) ? $val : json_encode($val ?? []);
            } else {
                $params[] = $val;
            }
        }
    }
    if (empty($sets))
        return ['error' => 'No valid fields to update.'];
    $params[] = $id;
    try {
        $db->prepare("UPDATE portal_users SET " . implode(', ', $sets) . " WHERE id = ?")->execute($params);
    } catch (Exception $e) {
        http_response_code(500);
        return ['error' => 'Database update failed: ' . $e->getMessage()];
    }
    return ['success' => true];
}

function portalDeleteUser($id)
{
    $db = getDB();

    // Get username before deleting, so we can remove from Clerk too
    $stmt = $db->prepare("SELECT username FROM portal_users WHERE id = ?");
    $stmt->execute([$id]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        return ['error' => 'User not found.'];
    }

    $username = $user['username'] ?? null;

    // Delete from portal database
    $db->prepare("DELETE FROM portal_users WHERE id = ?")->execute([$id]);

    // Also delete from Clerk (best-effort — don't fail if Clerk is unavailable)
    $clerkError = null;
    if ($username) {
        $clerkSecret = getenv('CLERK_SECRET_KEY') ?: ($_ENV['CLERK_SECRET_KEY'] ?? null);
        if ($clerkSecret) {
            try {
                // Find user in Clerk by username
                $searchUrl = 'https://api.clerk.com/v1/users?username=' . urlencode($username);
                $ch = curl_init($searchUrl);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Authorization: Bearer ' . $clerkSecret,
                    'Content-Type: application/json',
                ]);
                $searchResponse = curl_exec($ch);
                $searchStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                if ($searchStatus === 200) {
                    $clerkUsers = json_decode($searchResponse, true);
                    $clerkUserId = (!empty($clerkUsers) && is_array($clerkUsers)) ? ($clerkUsers[0]['id'] ?? null) : null;

                    if ($clerkUserId) {
                        // Delete from Clerk
                        $deleteUrl = 'https://api.clerk.com/v1/users/' . $clerkUserId;
                        $ch = curl_init($deleteUrl);
                        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
                        curl_setopt($ch, CURLOPT_HTTPHEADER, [
                            'Authorization: Bearer ' . $clerkSecret,
                            'Content-Type: application/json',
                        ]);
                        $deleteResponse = curl_exec($ch);
                        $deleteStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                        curl_close($ch);

                        if ($deleteStatus !== 200) {
                            $clerkError = 'Portal user deleted, but failed to remove Clerk account.';
                        }
                    }
                }
            } catch (\Throwable $e) {
                $clerkError = 'Portal user deleted, but Clerk cleanup failed: ' . $e->getMessage();
            }
        }
    }

    $result = ['success' => true];
    if ($clerkError)
        $result['warning'] = $clerkError;
    return $result;
}

function portalLockUser($id)
{
    $body = jsonBody();
    $db = getDB();
    $locked = $body['locked'] ?? false;
    $newStatus = $locked ? 'inactive' : 'active';
    $actorUserId = $body['actorUserId'] ?? null;
    $reasons = $body['reasons'] ?? null;

    if ($locked) {
        // Setting inactive: store who did it, why, and when
        $reasonJson = $reasons ? json_encode($reasons) : null;
        $db->prepare("UPDATE portal_users SET status = ?, inactivated_by = ?, inactive_reason = ?, inactivated_at = NOW() WHERE id = ?")
            ->execute([$newStatus, $actorUserId, $reasonJson, $id]);
    } else {
        // Reactivating: clear inactive metadata
        $db->prepare("UPDATE portal_users SET status = ?, inactivated_by = NULL, inactive_reason = NULL, inactivated_at = NULL WHERE id = ?")
            ->execute([$newStatus, $id]);
    }

    return ['success' => true, 'status' => $newStatus];
}

function portalRevokeUser($id)
{
    $body = jsonBody();
    $db = getDB();
    $revoke = $body['revoke'] ?? true;
    $reason = $body['reason'] ?? null;
    $actorUserId = $body['actorUserId'] ?? null;

    if ($revoke) {
        if (!$reason || trim($reason) === '') {
            http_response_code(400);
            return ['error' => 'Revoke reason is required.'];
        }
        $db->prepare("UPDATE portal_users SET status = 'revoked', revoked_by = ?, revoke_reason = ?, revoked_at = NOW() WHERE id = ?")
            ->execute([$actorUserId, trim($reason), $id]);
        return ['success' => true, 'status' => 'revoked'];
    } else {
        // Restore: set back to active, clear revoke metadata
        $db->prepare("UPDATE portal_users SET status = 'active', revoked_by = NULL, revoke_reason = NULL, revoked_at = NULL WHERE id = ?")
            ->execute([$id]);
        return ['success' => true, 'status' => 'active'];
    }
}

/**
 * Reset a user's Clerk password back to their stored default password.
 * Requires CLERK_SECRET_KEY to be set in environment (.env file).
 */
function portalResetUserPassword($id)
{
    $db = getDB();

    // Get user's stored password and username
    $stmt = $db->prepare("SELECT username, password, phone FROM portal_users WHERE id = ?");
    $stmt->execute([$id]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        return ['error' => 'User not found.'];
    }

    $storedPassword = $user['password'];
    $username = $user['username'];

    if (!$storedPassword) {
        http_response_code(400);
        return ['error' => 'No stored password found for this user.'];
    }

    // Get Clerk secret key from environment
    $clerkSecret = getenv('CLERK_SECRET_KEY') ?: ($_ENV['CLERK_SECRET_KEY'] ?? null);
    if (!$clerkSecret) {
        http_response_code(500);
        return ['error' => 'Clerk secret key not configured.'];
    }

    // Find user in Clerk by username
    $searchUrl = 'https://api.clerk.com/v1/users?username=' . urlencode($username);
    $ch = curl_init($searchUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $clerkSecret,
        'Content-Type: application/json',
    ]);
    $searchResponse = curl_exec($ch);
    $searchStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($searchStatus !== 200) {
        http_response_code(500);
        return ['error' => 'Failed to search Clerk users.'];
    }

    $clerkUsers = json_decode($searchResponse, true);
    if (empty($clerkUsers) || !is_array($clerkUsers)) {
        http_response_code(404);
        return ['error' => 'User not found in Clerk. They may need to be pushed to Clerk first.'];
    }

    $clerkUserId = $clerkUsers[0]['id'] ?? null;
    if (!$clerkUserId) {
        http_response_code(404);
        return ['error' => 'Clerk user ID not found.'];
    }

    // Update password in Clerk
    $updateUrl = 'https://api.clerk.com/v1/users/' . $clerkUserId;
    $ch = curl_init($updateUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'password' => $storedPassword,
        'skip_password_checks' => true,
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $clerkSecret,
        'Content-Type: application/json',
    ]);
    $updateResponse = curl_exec($ch);
    $updateStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($updateStatus !== 200) {
        $errorData = json_decode($updateResponse, true);
        $errorMsg = $errorData['errors'][0]['message'] ?? 'Failed to update password in Clerk.';
        http_response_code(500);
        return ['error' => $errorMsg];
    }

    return ['success' => true, 'message' => 'Password reset to default successfully.'];
}

/* ═══════════════════════════════════════════
Titles
═══════════════════════════════════════════ */

function portalAssignTitle($id)
{
    $body = jsonBody();
    if (!isset($body['title']) || !isset($body['assigned_by'])) {
        http_response_code(400);
        return ['error' => 'Missing title or assigned_by.'];
    }
    $db = getDB();
    $hasTitleColorCol = $db->query("SHOW COLUMNS FROM portal_users LIKE 'title_color'")->fetch();
    $updateColor = $hasTitleColorCol && array_key_exists('title_color', $body);
    $titleColor = $updateColor ? (isset($body['title_color']) && $body['title_color'] !== '' && $body['title_color'] !== null ? $body['title_color'] : null) : null;
    if ($hasTitleColorCol && $updateColor) {
        $stmt = $db->prepare("UPDATE portal_users SET title = ?, title_assigned_by = ?, title_assigned_at = NOW(), title_color = ? WHERE id = ?");
        $stmt->execute([$body['title'], $body['assigned_by'], $titleColor, $id]);
    } elseif ($hasTitleColorCol) {
        $stmt = $db->prepare("UPDATE portal_users SET title = ?, title_assigned_by = ?, title_assigned_at = NOW() WHERE id = ?");
        $stmt->execute([$body['title'], $body['assigned_by'], $id]);
    } else {
        $stmt = $db->prepare("UPDATE portal_users SET title = ?, title_assigned_by = ?, title_assigned_at = NOW() WHERE id = ?");
        $stmt->execute([$body['title'], $body['assigned_by'], $id]);
    }
    return ['success' => true];
}

function portalRevokeTitle($id)
{
    $db = getDB();
    $hasTitleColorCol = $db->query("SHOW COLUMNS FROM portal_users LIKE 'title_color'")->fetch();
    if ($hasTitleColorCol) {
        $stmt = $db->prepare("UPDATE portal_users SET title = NULL, title_assigned_by = NULL, title_assigned_at = NULL, title_color = NULL WHERE id = ?");
    } else {
        $stmt = $db->prepare("UPDATE portal_users SET title = NULL, title_assigned_by = NULL, title_assigned_at = NULL WHERE id = ?");
    }
    $stmt->execute([$id]);
    return ['success' => true];
}

/* ═══════════════════════════════════════════
Regions (region entity; has name and a regional president assigned; units belong to region)
═══════════════════════════════════════════ */

function portalGetRegions()
{
    $db = getDB();
    if (!tableExists($db, 'portal_regions'))
        return [];
    $regionCols = hasRegionColumns($db);
    $regions = $db->query("SELECT id, name, created_at FROM portal_regions ORDER BY name")->fetchAll();
    $out = [];
    foreach ($regions as $r) {
        $rpRow = null;
        if ($regionCols['users']) {
            $rp = $db->prepare("
                    SELECT id AS regional_president_id,
                        TRIM(CONCAT_WS(' ', first_name, middle_name, last_name)) AS regional_president_name,
                        phone
                    FROM portal_users
                    WHERE role = 'regional_president' AND region_id = ?
                ");
            $rp->execute([$r['id']]);
            $rpRow = $rp->fetch();
        }
        $unitRows = [];
        if ($regionCols['units']) {
            $units = $db->prepare("SELECT id, name FROM portal_units WHERE region_id = ? ORDER BY name");
            $units->execute([$r['id']]);
            $unitRows = $units->fetchAll();
        }
        $out[] = [
            'region_id' => $r['id'],
            'region_name' => $r['name'],
            'regional_president_id' => $rpRow['regional_president_id'] ?? null,
            'regional_president_name' => $rpRow['regional_president_name'] ?? null,
            'phone' => $rpRow['phone'] ?? null,
            'units' => $unitRows,
        ];
    }
    return $out;
}

function portalCreateRegions()
{
    try {
        $body = jsonBody();
        $regions = $body['regions'] ?? [];
        if (empty($regions)) {
            http_response_code(400);
            return ['error' => 'No regions provided'];
        }
        $db = getDB();
        if (!tableExists($db, 'portal_regions')) {
            $db->exec("CREATE TABLE IF NOT EXISTS portal_regions (id CHAR(36) PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
        }
        $stmt = $db->prepare("INSERT INTO portal_regions (id, name) VALUES (?, ?)");
        foreach ($regions as $r) {
            $name = is_array($r) ? ($r['name'] ?? '') : $r;
            if (!$name)
                continue;
            $stmt->execute([uuid(), trim($name)]);
        }
        return ['success' => true, 'count' => count($regions)];
    } catch (\Throwable $e) {
        http_response_code(500);
        return ['error' => 'Create regions failed: ' . $e->getMessage()];
    }
}

function portalDeleteRegion($id)
{
    try {
        $db = getDB();
        if (!tableExists($db, 'portal_regions')) {
            http_response_code(404);
            return ['error' => 'Regions table not found'];
        }
        $db->prepare("DELETE FROM portal_regions WHERE id = ?")->execute([$id]);
        return ['success' => true];
    } catch (\Throwable $e) {
        http_response_code(500);
        return ['error' => 'Delete region failed: ' . $e->getMessage()];
    }
}

function portalUpdateRegion($id)
{
    try {
        $body = jsonBody();
        $db = getDB();
        if (!tableExists($db, 'portal_regions')) {
            http_response_code(404);
            return ['error' => 'Regions table not found'];
        }
        if (isset($body['name'])) {
            $db->prepare("UPDATE portal_regions SET name = ? WHERE id = ?")->execute([trim($body['name']), $id]);
        }
        return ['success' => true];
    } catch (\Throwable $e) {
        http_response_code(500);
        return ['error' => 'Update region failed: ' . $e->getMessage()];
    }
}

/* ═══════════════════════════════════════════
Dashboard Stats
═══════════════════════════════════════════ */

function portalDashboardStats()
{
    $db = getDB();
    $role = $_GET['role'] ?? 'admin';
    $userId = $_GET['userId'] ?? null;
    $unitId = $_GET['unitId'] ?? null;
    $regionId = $_GET['regionId'] ?? null;

    $regionCols = hasRegionColumns($db);
    $hasRegion = $regionCols['units'];

    $stats = [];

    // Base counts
    $hasCircleRegion = $regionCols['circles'];
    $unitSql = "SELECT COUNT(*) FROM portal_units WHERE 1=1";
    $circleSql = "SELECT COUNT(*) FROM portal_circles WHERE 1=1";
    $campusSql = "SELECT COUNT(*) FROM portal_campuses WHERE 1=1";
    if ($role === 'regional_president' && $regionId && $hasRegion) {
        $unitSql .= " AND region_id = ?";
        $stmt = $db->prepare($unitSql);
        $stmt->execute([$regionId]);
    } else {
        $stmt = $db->prepare($unitSql);
        $stmt->execute([]);
    }
    $stats['totalUnits'] = (int) $stmt->fetchColumn();

    if ($role === 'regional_president' && $regionId && $hasCircleRegion) {
        $circleSql .= " AND region_id = ?";
        $stmt = $db->prepare($circleSql);
        $stmt->execute([$regionId]);
    } else {
        $stmt = $db->prepare($circleSql);
        $stmt->execute([]);
    }
    $stats['totalCircles'] = (int) $stmt->fetchColumn();

    $stats['totalCampuses'] = (int) $db->query("SELECT COUNT(*) FROM portal_campuses")->fetchColumn();
    $stats['totalRegions'] = tableExists($db, 'portal_regions') ? (int) $db->query("SELECT COUNT(*) FROM portal_regions")->fetchColumn() : 0;

    if ($role === 'regional_president' && $hasRegion) {
        $stmt = $db->prepare("SELECT COUNT(*) FROM portal_units WHERE region_id = ?");
        $stmt->execute([$regionId]);
        $stats['totalRegionUnits'] = (int) $stmt->fetchColumn();
    } elseif ($hasRegion) {
        $stats['totalRegionUnits'] = (int) $db->query("SELECT COUNT(*) FROM portal_units WHERE region_id IS NOT NULL")->fetchColumn();
    } else {
        $stats['totalRegionUnits'] = $stats['totalUnits'];
    }

    // Total people in the organisation: count ALL users (not just role='member'). Previously only role='member' was counted, so unit presidents etc. were excluded and the number looked lower.
    $memberSql = "SELECT status, COUNT(*) as cnt FROM portal_users WHERE 1=1";
    $params = [];
    if ($role === 'unit_president' && $unitId) {
        $memberSql .= " AND unit_id = ?";
        $params[] = $unitId;
    } elseif ($role === 'regional_president' && $regionId && $hasRegion) {
        if ($hasCircleRegion) {
            $memberSql .= " AND (unit_id IN (SELECT id FROM portal_units WHERE region_id = ?) OR circle_id IN (SELECT id FROM portal_circles WHERE region_id = ?))";
            $params[] = $regionId;
            $params[] = $regionId;
        } else {
            $memberSql .= " AND unit_id IN (SELECT id FROM portal_units WHERE region_id = ?)";
            $params[] = $regionId;
        }
    }
    $memberSql .= " GROUP BY status";
    $stmt = $db->prepare($memberSql);
    $stmt->execute($params);
    $statusCounts = $stmt->fetchAll();

    $total = 0;
    $active = 0;
    $inactive = 0;
    $migrated = 0;
    foreach ($statusCounts as $row) {
        $cnt = (int) $row['cnt'];
        $total += $cnt;
        if ($row['status'] === 'active')
            $active = $cnt;
        elseif ($row['status'] === 'inactive')
            $inactive = $cnt;
        elseif ($row['status'] === 'migrated')
            $migrated = $cnt;
    }
    $stats['totalMembers'] = $total;
    $stats['activeMembers'] = $active;
    $stats['inactiveMembers'] = $inactive;
    $stats['migratedMembers'] = $migrated;

    // Unit presidents: count only those assigned to region units (not campus units)
    if ($hasRegion) {
        $stats['totalUnitPresidents'] = (int) $db->query("
                SELECT COUNT(*) FROM portal_users u
                JOIN portal_units pu ON u.unit_id = pu.id
                WHERE u.role = 'unit_president' AND pu.region_id IS NOT NULL
            ")->fetchColumn();
        $stats['unitsWithoutPresident'] = (int) $db->query("
                SELECT COUNT(*) FROM portal_units u
                LEFT JOIN portal_users up ON up.unit_id = u.id AND up.role = 'unit_president'
                WHERE up.id IS NULL AND u.region_id IS NOT NULL
            ")->fetchColumn();
        $stats['regionUnitsWithoutPresident'] = $db->query("
                SELECT u.id, u.name FROM portal_units u
                LEFT JOIN portal_users up ON up.unit_id = u.id AND up.role = 'unit_president'
                WHERE up.id IS NULL AND u.region_id IS NOT NULL
                ORDER BY u.name
            ")->fetchAll(PDO::FETCH_ASSOC);
    } else {
        $stats['totalUnitPresidents'] = (int) $db->query("SELECT COUNT(*) FROM portal_users WHERE role = 'unit_president'")->fetchColumn();
        $stats['unitsWithoutPresident'] = (int) $db->query("
                SELECT COUNT(*) FROM portal_units u
                LEFT JOIN portal_users up ON up.unit_id = u.id AND up.role = 'unit_president'
                WHERE up.id IS NULL
            ")->fetchColumn();
        $stats['regionUnitsWithoutPresident'] = $db->query("
                SELECT u.id, u.name FROM portal_units u
                LEFT JOIN portal_users up ON up.unit_id = u.id AND up.role = 'unit_president'
                WHERE up.id IS NULL ORDER BY u.name
            ")->fetchAll(PDO::FETCH_ASSOC);
    }
    $stats['totalZonalSecretaries'] = (int) $db->query("SELECT COUNT(*) FROM portal_users WHERE role='zonal_secretary'")->fetchColumn();
    $stats['pendingMigrations'] = tableExists($db, 'portal_migration_requests') ? (int) $db->query("SELECT COUNT(*) FROM portal_migration_requests WHERE status='pending'")->fetchColumn() : 0;

    // Unread messages
    if ($userId && tableExists($db, 'portal_messages')) {
        $stmt = $db->prepare("SELECT COUNT(*) FROM portal_messages WHERE recipient_id = ? AND is_read = 0");
        $stmt->execute([$userId]);
        $stats['unreadMessages'] = (int) $stmt->fetchColumn();
    } else {
        $stats['unreadMessages'] = 0;
    }

    // Retiring members: only those who have turned 30 by 31 Dec of current year (DOB format DDMMYYYY)
    $year = (int) date('Y');
    $stmt = $db->prepare("SELECT COUNT(*) FROM portal_users WHERE date_of_birth IS NOT NULL AND LENGTH(date_of_birth) >= 4 AND (? - CAST(RIGHT(date_of_birth, 4) AS UNSIGNED)) >= 30");
    $stmt->execute([$year]);
    $stats['retiringMembers'] = (int) $stmt->fetchColumn();

    // Members with incomplete details: missing phone or DOB (same scope as member count)
    $incompleteCond = "(COALESCE(TRIM(phone), '') = '' OR COALESCE(TRIM(date_of_birth), '') = '')";
    $incompleteSql = "SELECT COUNT(*) FROM portal_users WHERE 1=1";
    $incompleteParams = [];
    if ($role === 'unit_president' && $unitId) {
        $incompleteSql .= " AND unit_id = ?";
        $incompleteParams[] = $unitId;
    } elseif ($role === 'regional_president' && $regionId && $hasRegion) {
        if ($hasCircleRegion) {
            $incompleteSql .= " AND (unit_id IN (SELECT id FROM portal_units WHERE region_id = ?) OR circle_id IN (SELECT id FROM portal_circles WHERE region_id = ?))";
            $incompleteParams[] = $regionId;
            $incompleteParams[] = $regionId;
        } else {
            $incompleteSql .= " AND unit_id IN (SELECT id FROM portal_units WHERE region_id = ?)";
            $incompleteParams[] = $regionId;
        }
    }
    $incompleteSql .= " AND " . $incompleteCond;
    $stmt = $db->prepare($incompleteSql);
    $stmt->execute($incompleteParams);
    $stats['membersWithIncompleteDetails'] = (int) $stmt->fetchColumn();

    return $stats;
}

function portalGetRegionUnitsWithoutPresident()
{
    $db = getDB();
    $regionCols = hasRegionColumns($db);
    if (!$regionCols['units']) {
        // Without region_id, return all units without a president
        return $db->query("
                SELECT u.id, u.name FROM portal_units u
                LEFT JOIN portal_users up ON up.unit_id = u.id AND up.role = 'unit_president'
                WHERE up.id IS NULL
                ORDER BY u.name
            ")->fetchAll(PDO::FETCH_ASSOC);
    }
    return $db->query("
            SELECT u.id, u.name FROM portal_units u
            LEFT JOIN portal_users up ON up.unit_id = u.id AND up.role = 'unit_president'
            WHERE up.id IS NULL AND u.region_id IS NOT NULL
            ORDER BY u.name
        ")->fetchAll(PDO::FETCH_ASSOC);
}

function portalGetRetiringMembers()
{
    $db = getDB();
    $year = (int) date('Y');
    // Age = current year - birth year (DOB format DDMMYYYY); only those who have turned 30 by 31 Dec of current year
    $sql = "SELECT u.*, pu.name AS unit_name,
                (? - CAST(RIGHT(u.date_of_birth, 4) AS UNSIGNED)) AS age_this_year
                FROM portal_users u
                LEFT JOIN portal_units pu ON u.unit_id = pu.id
                WHERE u.date_of_birth IS NOT NULL AND LENGTH(u.date_of_birth) >= 4
                AND (? - CAST(RIGHT(u.date_of_birth, 4) AS UNSIGNED)) >= 30
                ORDER BY age_this_year DESC, u.last_name, u.first_name";
    $stmt = $db->prepare($sql);
    $stmt->execute([$year, $year]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $out = [];
    foreach ($rows as $row) {
        $u = formatUser($row);
        $u['age_this_year'] = (int) ($row['age_this_year'] ?? 0);
        $out[] = $u;
    }
    return $out;
}

/**
 * Members with incomplete details (missing phone or DOB). Scoped by role (admin/zonal = all; regional = region; unit = unit).
 * GET params: role, regionId (optional), unitId (optional). Returns list with id, full_name, phone, date_of_birth, unit_name, circle_name, campus_name, membership_name (unit or circle or campus for display), missing (array of 'phone' | 'date_of_birth').
 */
function portalGetMembersWithIncompleteDetails()
{
    $db = getDB();
    $role = $_GET['role'] ?? 'admin';
    $regionId = $_GET['regionId'] ?? null;
    $unitId = $_GET['unitId'] ?? null;
    $regionCols = hasRegionColumns($db);
    $hasRegion = $regionCols['units'] ?? false;
    $hasCircleRegion = $regionCols['circles'] ?? false;

    $where = " (COALESCE(TRIM(u.phone), '') = '' OR COALESCE(TRIM(u.date_of_birth), '') = '')";
    $params = [];
    if ($role === 'unit_president' && $unitId) {
        $where = " u.unit_id = ? AND" . $where;
        $params[] = $unitId;
    } elseif ($role === 'regional_president' && $regionId && $hasRegion) {
        if ($hasCircleRegion) {
            $where = " (u.unit_id IN (SELECT id FROM portal_units WHERE region_id = ?) OR u.circle_id IN (SELECT id FROM portal_circles WHERE region_id = ?)) AND" . $where;
            $params[] = $regionId;
            $params[] = $regionId;
        } else {
            $where = " u.unit_id IN (SELECT id FROM portal_units WHERE region_id = ?) AND" . $where;
            $params[] = $regionId;
        }
    }

    $sql = "SELECT u.id, u.first_name, u.middle_name, u.last_name, u.phone, u.date_of_birth, u.unit_id,
                pu.name AS unit_name, pc.name AS circle_name, pca.name AS campus_name
            FROM portal_users u
            LEFT JOIN portal_units pu ON u.unit_id = pu.id
            LEFT JOIN portal_circles pc ON u.circle_id = pc.id
            LEFT JOIN portal_campuses pca ON u.campus_id = pca.id
            WHERE" . $where . "
            ORDER BY u.first_name, u.last_name";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $out = [];
    foreach ($rows as $row) {
        $missing = [];
        if (trim($row['phone'] ?? '') === '')
            $missing[] = 'phone';
        if (trim($row['date_of_birth'] ?? '') === '')
            $missing[] = 'date_of_birth';
        $fullName = trim(implode(' ', array_filter([$row['first_name'] ?? '', $row['middle_name'] ?? '', $row['last_name'] ?? '']))) ?: '—';
        $unitName = isset($row['unit_name']) && trim($row['unit_name']) !== '' ? $row['unit_name'] : null;
        $circleName = isset($row['circle_name']) && trim($row['circle_name']) !== '' ? $row['circle_name'] : null;
        $campusName = isset($row['campus_name']) && trim($row['campus_name']) !== '' ? $row['campus_name'] : null;
        $membershipName = $unitName ?? $circleName ?? $campusName;
        $out[] = [
            'id' => $row['id'],
            'full_name' => $fullName,
            'phone' => $row['phone'] ?? '',
            'date_of_birth' => $row['date_of_birth'] ?? '',
            'unit_name' => $unitName,
            'circle_name' => $circleName,
            'campus_name' => $campusName,
            'membership_name' => $membershipName,
            'missing' => $missing,
        ];
    }
    return $out;
}

/**
 * Global search for admin/zonal: members (name, phone), units, regions, circles, campuses.
 * GET /portal/search?q=...
 */
function portalSearch()
{
    $db = getDB();
    $q = trim($_GET['q'] ?? '');
    if ($q === '') {
        return ['members' => [], 'units' => [], 'regions' => [], 'circles' => [], 'campuses' => []];
    }
    $term = '%' . $q . '%';

    // Members: first_name, middle_name, last_name, username, phone
    $stmt = $db->prepare("SELECT u.id, u.first_name, u.middle_name, u.last_name, u.phone, pu.name AS unit_name FROM portal_users u
            LEFT JOIN portal_units pu ON u.unit_id = pu.id
            WHERE (u.first_name LIKE ? OR u.middle_name LIKE ? OR u.last_name LIKE ? OR u.username LIKE ? OR u.phone LIKE ?
            OR CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.middle_name,''), ' ', COALESCE(u.last_name,'')) LIKE ?)
            ORDER BY u.first_name, u.last_name LIMIT 20");
    $stmt->execute([$term, $term, $term, $term, $term, $term]);
    $members = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $members[] = [
            'id' => $row['id'],
            'full_name' => buildFullName($row['first_name'], $row['middle_name'], $row['last_name']),
            'phone' => $row['phone'],
            'unit_name' => $row['unit_name'],
        ];
    }

    // Units
    $stmt = $db->prepare("SELECT id, name FROM portal_units WHERE name LIKE ? ORDER BY name LIMIT 15");
    $stmt->execute([$term]);
    $units = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Regions
    $stmt = $db->prepare("SELECT id, name FROM portal_regions WHERE name LIKE ? ORDER BY name LIMIT 15");
    $stmt->execute([$term]);
    $regions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Circles
    $stmt = $db->prepare("SELECT id, name FROM portal_circles WHERE name LIKE ? ORDER BY name LIMIT 15");
    $stmt->execute([$term]);
    $circles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Campuses
    $stmt = $db->prepare("SELECT id, name FROM portal_campuses WHERE name LIKE ? ORDER BY name LIMIT 15");
    $stmt->execute([$term]);
    $campuses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    return ['members' => $members, 'units' => $units, 'regions' => $regions, 'circles' => $circles, 'campuses' => $campuses];
}

function portalNotificationCounts()
{
    $db = getDB();
    $userId = $_GET['userId'] ?? null;
    $role = $_GET['role'] ?? 'member';
    $unitId = $_GET['unitId'] ?? null;

    $out = ['unreadMessages' => 0, 'pendingMigrations' => 0, 'pendingForms' => 0];

    // Check if region columns exist (may not be migrated yet)
    $regionCols = hasRegionColumns($db);
    $hasUserRegion = $regionCols['users'];
    $hasUnitRegion = $regionCols['units'];

    if ($userId && tableExists($db, 'portal_messages')) {
        $stmt = $db->prepare("SELECT COUNT(*) FROM portal_messages WHERE recipient_id = ? AND is_read = 0");
        $stmt->execute([$userId]);
        $out['unreadMessages'] = (int) $stmt->fetchColumn();
    }

    if (!tableExists($db, 'portal_migration_requests'))
        return $out;

    $migSql = "SELECT COUNT(*) FROM portal_migration_requests WHERE status = 'pending'";
    $migParams = [];
    if ($role === 'regional_president' && $userId && $hasUserRegion && $hasUnitRegion) {
        $migSql = "SELECT COUNT(*) FROM portal_migration_requests WHERE status = 'pending' AND from_unit_id IN (SELECT id FROM portal_units WHERE region_id = (SELECT region_id FROM portal_users WHERE id = ? AND role = 'regional_president'))";
        $migParams = [$userId];
    } elseif ($role === 'regional_president' && $userId && (!$hasUserRegion || !$hasUnitRegion)) {
        // Fallback: if region columns don't exist, show 0 for now
        $out['pendingMigrations'] = 0;
        $migParams = null; // skip query
    } elseif ($role === 'unit_president' && $unitId) {
        $migSql = "SELECT COUNT(*) FROM portal_migration_requests WHERE status = 'pending' AND from_unit_id = ?";
        $migParams = [$unitId];
    } elseif ($role === 'member' && $userId) {
        $migSql = "SELECT COUNT(*) FROM portal_migration_requests WHERE status = 'pending' AND requested_by = ?";
        $migParams = [$userId];
    }
    if ($migParams !== null) {
        if ($migParams) {
            $stmt = $db->prepare($migSql);
            $stmt->execute($migParams);
            $out['pendingMigrations'] = (int) $stmt->fetchColumn();
        } else {
            $out['pendingMigrations'] = (int) $db->query($migSql)->fetchColumn();
        }
    }

    if (!tableExists($db, 'portal_perf_forms'))
        return $out;

    ensurePerfFormsSchema($db);
    ensurePerfFormViewsTable($db);

    if ($role === 'member' && $userId && $unitId) {
        $member = ['circle_id' => null, 'campus_id' => null, 'region_id' => null];
        $userStmt = $db->prepare("SELECT circle_id, campus_id, region_id FROM portal_users WHERE id = ?");
        $userStmt->execute([$userId]);
        $member = $userStmt->fetch() ?: $member;
        $stmt = $db->prepare("
                SELECT COUNT(*) FROM portal_perf_forms f
                WHERE f.is_active = 1 AND (
                    COALESCE(f.scope_type, CASE WHEN f.scope_unit_id IS NULL THEN 'zone' ELSE 'unit' END) = 'zone'
                    OR f.scope_unit_id = ?
                    OR (f.scope_circle_id IS NOT NULL AND f.scope_circle_id = ?)
                    OR (f.scope_campus_id IS NOT NULL AND f.scope_campus_id = ?)
                    OR (f.scope_region_id IS NOT NULL AND f.scope_region_id = ?)
                )
                AND NOT EXISTS (SELECT 1 FROM portal_perf_responses r WHERE r.form_id = f.id AND r.member_id = ?)
                AND NOT EXISTS (SELECT 1 FROM portal_perf_form_views v WHERE v.form_id = f.id AND v.member_id = ?)
            ");
        $stmt->execute([$unitId, $member['circle_id'] ?? null, $member['campus_id'] ?? null, $member['region_id'] ?? null, $userId, $userId]);
        $out['pendingForms'] = (int) $stmt->fetchColumn();
    } elseif (in_array($role, ['admin', 'zonal_secretary', 'regional_president', 'unit_president'], true) && $userId) {
        ensurePerfResponseNotificationViewsTable($db);
        $base = "SELECT COUNT(*) FROM portal_perf_responses r WHERE NOT EXISTS (SELECT 1 FROM portal_perf_reviews rev WHERE rev.response_id = r.id) AND NOT EXISTS (SELECT 1 FROM portal_perf_response_notification_views v WHERE v.response_id = r.id AND v.user_id = ?)";
        $params = [$userId];
        if ($role === 'unit_president' && $unitId) {
            $base .= " AND r.member_id IN (SELECT id FROM portal_users WHERE unit_id = ?)";
            $params[] = $unitId;
        } elseif ($role === 'regional_president' && $hasUserRegion && $hasUnitRegion) {
            $base .= " AND r.member_id IN (SELECT id FROM portal_users WHERE unit_id IN (SELECT id FROM portal_units WHERE region_id = (SELECT region_id FROM portal_users WHERE id = ? AND role = 'regional_president')))";
            $params[] = $userId;
        } elseif ($role === 'regional_president') {
            // Fallback: no region columns, skip filtering (show 0)
            $out['pendingForms'] = 0;
            $params = null;
        }
        if ($params !== null) {
            if ($params) {
                $stmt = $db->prepare($base);
                $stmt->execute($params);
                $out['pendingForms'] = (int) $stmt->fetchColumn();
            } else {
                $out['pendingForms'] = (int) $db->query($base)->fetchColumn();
            }
        }
    }

    return $out;
}

/* ═══════════════════════════════════════════
Migrations
═══════════════════════════════════════════ */

function portalGetMigrations()
{
    $db = getDB();
    $status = $_GET['status'] ?? 'all';
    $role = $_GET['role'] ?? null;
    $userId = $_GET['userId'] ?? null;
    $unitId = $_GET['unitId'] ?? null;

    $sql = "
            SELECT m.*,
                TRIM(CONCAT_WS(' ', mem.first_name, mem.middle_name, mem.last_name)) AS member_name,
                mem.role AS member_role,
                fu.name AS from_unit_name,
                tu.name AS to_unit_name,
                TRIM(CONCAT_WS(' ', req.first_name, req.middle_name, req.last_name)) AS requested_by_name
            FROM portal_migration_requests m
            LEFT JOIN portal_users mem ON m.member_id = mem.id
            LEFT JOIN portal_units fu ON m.from_unit_id = fu.id
            LEFT JOIN portal_units tu ON m.to_unit_id = tu.id
            LEFT JOIN portal_users req ON m.requested_by = req.id
            WHERE 1=1
        ";
    $params = [];

    if ($status !== 'all') {
        $sql .= " AND m.status = ?";
        $params[] = $status;
    }

    // Role-based access filtering
    if ($role === 'member' && $userId) {
        // Members only see their own migrations
        $sql .= " AND (m.member_id = ? OR m.requested_by = ?)";
        $params[] = $userId;
        $params[] = $userId;
    } elseif ($role === 'unit_president' && $unitId && $userId) {
        // Unit presidents see migrations from their unit (members only) + their own
        $sql .= " AND ((m.from_unit_id = ? AND mem.role = 'member') OR m.member_id = ?)";
        $params[] = $unitId;
        $params[] = $userId;
    } elseif ($role === 'regional_president' && $userId) {
        // Regional presidents see migrations from units in their region (members + unit presidents) + their own
        $regionCols = hasRegionColumns($db);
        if ($regionCols['units'] && $regionCols['users']) {
            $sql .= " AND (
                    (m.from_unit_id IN (SELECT id FROM portal_units WHERE region_id = (SELECT region_id FROM portal_users WHERE id = ? AND role = 'regional_president'))
                    AND mem.role IN ('member', 'unit_president'))
                    OR m.member_id = ?
                )";
            $params[] = $userId;
            $params[] = $userId;
        } else {
            // Fallback: regional president can only see their own
            $sql .= " AND m.member_id = ?";
            $params[] = $userId;
        }
    }
    // admin / zonal_secretary: no filter — see all

    $sql .= " ORDER BY m.created_at DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function portalCreateMigration()
{
    $body = jsonBody();
    $db = getDB();

    $memberId = $body['member_id'] ?? null;
    $fromUnitId = $body['from_unit_id'] ?? null;
    $toUnitId = !empty($body['to_unit_id']) ? $body['to_unit_id'] : null;
    $toLocation = !empty($body['to_location']) ? trim($body['to_location']) : null;
    $reason = !empty($body['reason']) ? trim($body['reason']) : null;
    $requestedBy = $body['requested_by'] ?? null;

    if (!$memberId || !$fromUnitId || !$requestedBy) {
        http_response_code(400);
        return ['error' => 'member_id, from_unit_id, and requested_by are required.'];
    }
    if (!$toUnitId && !$toLocation) {
        http_response_code(400);
        return ['error' => 'Either to_unit_id or to_location is required.'];
    }

    // Validate requester permissions
    $regionCols = hasRegionColumns($db);
    $reqSelect = $regionCols['users'] ? "SELECT role, unit_id, region_id FROM portal_users WHERE id = ?" : "SELECT role, unit_id, NULL AS region_id FROM portal_users WHERE id = ?";
    $requester = $db->prepare($reqSelect);
    $requester->execute([$requestedBy]);
    $req = $requester->fetch();
    if (!$req) {
        http_response_code(403);
        return ['error' => 'Requester not found.'];
    }

    $reqRole = $req['role'];
    if ($reqRole === 'member') {
        if ($memberId !== $requestedBy) {
            http_response_code(403);
            return ['error' => 'Members can only initiate their own migration.'];
        }
    } elseif ($reqRole === 'unit_president') {
        if ($memberId !== $requestedBy) {
            $mem = $db->prepare("SELECT unit_id FROM portal_users WHERE id = ?");
            $mem->execute([$memberId]);
            $memRow = $mem->fetch();
            if (!$memRow || $memRow['unit_id'] !== $req['unit_id']) {
                http_response_code(403);
                return ['error' => 'Unit presidents can only initiate migrations for their unit members.'];
            }
        }
    } elseif ($reqRole === 'regional_president') {
        if ($memberId !== $requestedBy) {
            if ($regionCols['units']) {
                $mem = $db->prepare("SELECT u.unit_id, pu.region_id FROM portal_users u LEFT JOIN portal_units pu ON u.unit_id = pu.id WHERE u.id = ?");
                $mem->execute([$memberId]);
                $memRow = $mem->fetch();
                $rpRegion = $req['region_id'];
                if (!$memRow || $memRow['region_id'] !== $rpRegion) {
                    http_response_code(403);
                    return ['error' => 'Regional presidents can only initiate migrations for members in their region.'];
                }
            }
        }
    }
    // admin / zonal_secretary: no restriction

    $id = uuid();
    $stmt = $db->prepare("INSERT INTO portal_migration_requests (id, member_id, from_unit_id, to_unit_id, to_location, reason, requested_by) VALUES (?,?,?,?,?,?,?)");
    $stmt->execute([$id, $memberId, $fromUnitId, $toUnitId, $toLocation, $reason, $requestedBy]);
    return ['success' => true, 'id' => $id];
}

function portalResolveMigration($id)
{
    $body = jsonBody();
    $db = getDB();

    $resolvedBy = $body['resolved_by'] ?? null;
    $newStatus = $body['status'] ?? null;
    if (!$resolvedBy || !$newStatus) {
        http_response_code(400);
        return ['error' => 'status and resolved_by are required.'];
    }

    // Only admin or zonal_secretary can approve/reject
    $resolver = $db->prepare("SELECT role FROM portal_users WHERE id = ?");
    $resolver->execute([$resolvedBy]);
    $resolverRow = $resolver->fetch();
    if (!$resolverRow || !in_array($resolverRow['role'], ['admin', 'zonal_secretary'])) {
        http_response_code(403);
        return ['error' => 'Only admin or zonal secretary can approve/reject migrations.'];
    }

    $stmt = $db->prepare("UPDATE portal_migration_requests SET status = ?, resolved_by = ?, resolved_at = NOW() WHERE id = ?");
    $stmt->execute([$newStatus, $resolvedBy, $id]);

    // If approved, handle member transfer
    if ($newStatus === 'approved') {
        $mig = $db->prepare("SELECT member_id, to_unit_id, to_location FROM portal_migration_requests WHERE id = ?");
        $mig->execute([$id]);
        $row = $mig->fetch();
        if ($row) {
            if ($row['to_unit_id']) {
                // Within-zone (unit→unit): reassign unit, do NOT mark as migrated
                $db->prepare("UPDATE portal_users SET unit_id = ? WHERE id = ?")
                    ->execute([$row['to_unit_id'], $row['member_id']]);
            } else {
                // Cross-zone (to another zone/location): mark as migrated
                $db->prepare("UPDATE portal_users SET status = 'migrated' WHERE id = ?")
                    ->execute([$row['member_id']]);
            }
        }
    }
    return ['success' => true];
}

function portalMarkMigrationsSeen()
{
    $body = jsonBody();
    $memberId = $body['member_id'] ?? null;
    if (!$memberId) {
        http_response_code(400);
        return ['error' => 'member_id required.'];
    }
    $db = getDB();
    $stmt = $db->prepare("UPDATE portal_migration_requests SET seen_at = NOW() WHERE member_id = ? AND status != 'pending' AND seen_at IS NULL");
    $stmt->execute([$memberId]);
    return ['success' => true];
}

/* ═══════════════════════════════════════════
Messages
═══════════════════════════════════════════ */

function portalGetMessages()
{
    $db = getDB();
    $userId = $_GET['userId'] ?? null;
    $type = $_GET['type'] ?? 'inbox';

    if (!$userId) {
        http_response_code(400);
        return ['error' => 'userId required.'];
    }

    $sql = "
            SELECT m.*,
                TRIM(CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name)) AS sender_name, s.role AS sender_role,
                TRIM(CONCAT_WS(' ', r.first_name, r.middle_name, r.last_name)) AS recipient_name
            FROM portal_messages m
            LEFT JOIN portal_users s ON m.sender_id = s.id
            LEFT JOIN portal_users r ON m.recipient_id = r.id
        ";

    if ($type === 'inbox') {
        $sql .= " WHERE (m.recipient_id = ? OR (m.is_broadcast = 1 AND m.sender_id != ?))";
        $params = [$userId, $userId];
    } else {
        $sql .= " WHERE m.sender_id = ?";
        $params = [$userId];
    }
    $sql .= " ORDER BY m.created_at DESC";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function portalSendMessage()
{
    $body = jsonBody();
    $db = getDB();
    $senderId = $body['sender_id'];

    $sender = $db->prepare("SELECT role, unit_id FROM portal_users WHERE id = ?");
    $sender->execute([$senderId]);
    $senderRow = $sender->fetch();
    if ($senderRow && $senderRow['role'] === 'member') {
        if (!empty($body['is_broadcast']) || !empty($body['recipient_role'])) {
            http_response_code(403);
            return ['error' => 'Members can only message their unit president, regional president, zonal secretary, or admin.'];
        }
        $recipientId = $body['recipient_id'] ?? null;
        if (!$recipientId) {
            http_response_code(400);
            return ['error' => 'Please select a recipient.'];
        }
        $rec = $db->prepare("SELECT role, unit_id FROM portal_users WHERE id = ?");
        $rec->execute([$recipientId]);
        $recRow = $rec->fetch();
        $allowedRoles = ['zonal_secretary', 'regional_president', 'admin'];
        $isOwnUnitPres = $recRow && $recRow['role'] === 'unit_president' && $recRow['unit_id'] === $senderRow['unit_id'];
        if (!$recRow || (!in_array($recRow['role'], $allowedRoles) && !$isOwnUnitPres)) {
            http_response_code(403);
            return ['error' => 'Members can only message their unit president, regional president, zonal secretary, or admin.'];
        }
    }

    if (!empty($body['is_broadcast']) || !empty($body['recipient_role'])) {
        // Multi-recipient
        $sql = "SELECT id FROM portal_users WHERE id != ?";
        $params = [$senderId];
        if (!empty($body['recipient_role'])) {
            $sql .= " AND role = ?";
            $params[] = $body['recipient_role'];
        }
        $recipients = $db->prepare($sql);
        $recipients->execute($params);

        $stmt = $db->prepare("INSERT INTO portal_messages (id, sender_id, recipient_id, recipient_role, subject, body, is_broadcast) VALUES (?,?,?,?,?,?,?)");
        $count = 0;
        foreach ($recipients->fetchAll() as $r) {
            $stmt->execute([uuid(), $senderId, $r['id'], $body['recipient_role'] ?? null, $body['subject'], $body['body'], $body['is_broadcast'] ? 1 : 0]);
            $count++;
        }
        return ['success' => true, 'sent' => $count];
    } else {
        // Single recipient
        $id = uuid();
        $stmt = $db->prepare("INSERT INTO portal_messages (id, sender_id, recipient_id, subject, body) VALUES (?,?,?,?,?)");
        $stmt->execute([$id, $senderId, $body['recipient_id'], $body['subject'], $body['body']]);
        return ['success' => true, 'id' => $id];
    }
}

function portalMarkMessageRead($id)
{
    $db = getDB();
    $db->prepare("UPDATE portal_messages SET is_read = 1 WHERE id = ?")->execute([$id]);
    return ['success' => true];
}

/* ═══════════════════════════════════════════
Performance Forms
═══════════════════════════════════════════ */

function portalGetPerfForms()
{
    $db = getDB();
    ensurePerfFormsSchema($db);
    ensurePerfPublicResponsesTable($db);
    $unitId = $_GET['unitId'] ?? null;
    $role = $_GET['role'] ?? null;
    $userId = $_GET['userId'] ?? null;

    $baseSql = "
            SELECT f.*, TRIM(CONCAT_WS(' ', u.first_name, u.middle_name, u.last_name)) AS creator_name,
                pu.name AS scope_unit_name, pr.name AS scope_region_name, pc.name AS scope_circle_name, pca.name AS scope_campus_name,
                (SELECT COUNT(*) FROM portal_perf_fields WHERE form_id = f.id) AS field_count,
                (
                    (SELECT COUNT(*) FROM portal_perf_responses WHERE form_id = f.id)
                    + (SELECT COUNT(*) FROM portal_perf_public_responses WHERE form_id = f.id)
                ) AS response_count
            FROM portal_perf_forms f
            LEFT JOIN portal_users u ON f.created_by = u.id
            LEFT JOIN portal_units pu ON f.scope_unit_id = pu.id
            LEFT JOIN portal_regions pr ON f.scope_region_id = pr.id
            LEFT JOIN portal_circles pc ON f.scope_circle_id = pc.id
            LEFT JOIN portal_campuses pca ON f.scope_campus_id = pca.id
        ";
    $params = [];

    if ($role === 'regional_president' && $userId) {
        // Regional president sees only:
        // 1. Forms they created themselves
        // 2. Forms created by unit presidents within their region's units
        $regionCols = hasRegionColumns($db);
        if ($regionCols['units'] && $regionCols['users']) {
            $baseSql .= "
                    WHERE (
                        f.created_by = ?
                        OR f.created_by IN (
                            SELECT pu2.id FROM portal_users pu2
                            WHERE pu2.role = 'unit_president'
                            AND pu2.unit_id IN (SELECT id FROM portal_units WHERE region_id = (SELECT region_id FROM portal_users WHERE id = ? AND role = 'regional_president'))
                        )
                        OR f.scope_unit_id IN (SELECT id FROM portal_units WHERE region_id = (SELECT region_id FROM portal_users WHERE id = ? AND role = 'regional_president'))
                    )
                ";
            $params = [$userId, $userId, $userId];
        } else {
            $baseSql .= " WHERE f.created_by = ?";
            $params = [$userId];
        }
    } elseif ($role === 'unit_president' && $unitId) {
        // Unit president sees forms scoped to their unit + zone-wide forms
        $baseSql .= " WHERE (COALESCE(f.scope_type, CASE WHEN f.scope_unit_id IS NULL THEN 'zone' ELSE 'unit' END) = 'zone' OR f.scope_unit_id = ?)";
        $params[] = $unitId;
    } elseif ($role === 'member' && $unitId) {
        // Members see active forms scoped to their hierarchy + zone-wide forms.
        $member = null;
        if ($userId) {
            $userStmt = $db->prepare("SELECT unit_id, circle_id, campus_id, region_id FROM portal_users WHERE id = ?");
            $userStmt->execute([$userId]);
            $member = $userStmt->fetch();
        }
        $baseSql .= " WHERE f.is_active = 1 AND (
                COALESCE(f.scope_type, CASE WHEN f.scope_unit_id IS NULL THEN 'zone' ELSE 'unit' END) = 'zone'
                OR f.scope_unit_id = ?
                OR (f.scope_circle_id IS NOT NULL AND f.scope_circle_id = ?)
                OR (f.scope_campus_id IS NOT NULL AND f.scope_campus_id = ?)
                OR (f.scope_region_id IS NOT NULL AND f.scope_region_id = ?)
            )";
        $params[] = $unitId;
        $params[] = $member['circle_id'] ?? null;
        $params[] = $member['campus_id'] ?? null;
        $params[] = $member['region_id'] ?? null;
    }
    // Admin and zonal_secretary see ALL forms (no filter)

    $baseSql .= " ORDER BY f.created_at DESC";

    $stmt = $db->prepare($baseSql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function portalGetPerfForm($id)
{
    $db = getDB();
    ensurePerfFormsSchema($db);

    // Form
    $stmt = $db->prepare("
            SELECT f.*, TRIM(CONCAT_WS(' ', u.first_name, u.middle_name, u.last_name)) AS creator_name,
                pu.name AS scope_unit_name, pr.name AS scope_region_name, pc.name AS scope_circle_name, pca.name AS scope_campus_name
            FROM portal_perf_forms f
            LEFT JOIN portal_users u ON f.created_by = u.id
            LEFT JOIN portal_units pu ON f.scope_unit_id = pu.id
            LEFT JOIN portal_regions pr ON f.scope_region_id = pr.id
            LEFT JOIN portal_circles pc ON f.scope_circle_id = pc.id
            LEFT JOIN portal_campuses pca ON f.scope_campus_id = pca.id
            WHERE f.id = ?
        ");
    $stmt->execute([$id]);
    $form = $stmt->fetch();
    if (!$form) {
        http_response_code(404);
        return ['error' => 'Form not found.'];
    }

    // Fields
    $fields = $db->prepare("SELECT * FROM portal_perf_fields WHERE form_id = ? ORDER BY display_order");
    $fields->execute([$id]);
    $form['fields'] = $fields->fetchAll();

    // Decode JSON options
    foreach ($form['fields'] as &$f) {
        if ($f['options'] && is_string($f['options']))
            $f['options'] = json_decode($f['options'], true);
    }

    return $form;
}

function portalGetPublicPerfForm($id)
{
    $db = getDB();
    ensurePerfFormsSchema($db);

    $stmt = $db->prepare("
            SELECT f.*, TRIM(CONCAT_WS(' ', u.first_name, u.middle_name, u.last_name)) AS creator_name,
                pu.name AS scope_unit_name, pr.name AS scope_region_name, pc.name AS scope_circle_name, pca.name AS scope_campus_name
            FROM portal_perf_forms f
            LEFT JOIN portal_users u ON f.created_by = u.id
            LEFT JOIN portal_units pu ON f.scope_unit_id = pu.id
            LEFT JOIN portal_regions pr ON f.scope_region_id = pr.id
            LEFT JOIN portal_circles pc ON f.scope_circle_id = pc.id
            LEFT JOIN portal_campuses pca ON f.scope_campus_id = pca.id
            WHERE f.id = ? AND f.is_public = 1 AND f.is_active = 1
        ");
    $stmt->execute([$id]);
    $form = $stmt->fetch();
    if (!$form) {
        http_response_code(404);
        return ['error' => 'Public form not found.'];
    }

    $fields = $db->prepare("SELECT * FROM portal_perf_fields WHERE form_id = ? ORDER BY display_order");
    $fields->execute([$id]);
    $form['fields'] = $fields->fetchAll();
    foreach ($form['fields'] as &$f) {
        if ($f['options'] && is_string($f['options']))
            $f['options'] = json_decode($f['options'], true);
    }

    return $form;
}

function portalCreatePerfForm()
{
    $body = jsonBody();
    $db = getDB();
    ensurePerfFormsSchema($db);
    $formId = uuid();

    $scopeType = $body['scope_type'] ?? (!empty($body['scope_unit_id']) ? 'unit' : 'zone');
    $stmt = $db->prepare("INSERT INTO portal_perf_forms (id, title, description, created_by, scope_type, scope_region_id, scope_unit_id, scope_circle_id, scope_campus_id, period, is_template, template_key, is_public, banner_image, theme_primary_color, footer_bg_color, footer_text_color, footer_pattern_color) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute([
        $formId,
        $body['title'],
        $body['description'] ?? null,
        $body['created_by'],
        $scopeType,
        $body['scope_region_id'] ?? null,
        $body['scope_unit_id'] ?? null,
        $body['scope_circle_id'] ?? null,
        $body['scope_campus_id'] ?? null,
        $body['period'] ?? null,
        !empty($body['is_template']) ? 1 : 0,
        $body['template_key'] ?? null,
        !empty($body['is_public']) ? 1 : 0,
        $body['banner_image'] ?? null,
        $body['theme_primary_color'] ?? '#ff3b3b',
        $body['footer_bg_color'] ?? null,
        $body['footer_text_color'] ?? null,
        $body['footer_pattern_color'] ?? null,
    ]);

    // Insert fields
    if (!empty($body['fields'])) {
        $fstmt = $db->prepare("INSERT INTO portal_perf_fields (id, form_id, type, label, description, options, is_required, display_order, max_value) VALUES (?,?,?,?,?,?,?,?,?)");
        foreach ($body['fields'] as $i => $f) {
            $fstmt->execute([uuid(), $formId, $f['type'], $f['label'], $f['description'] ?? null, isset($f['options']) ? json_encode($f['options']) : null, $f['is_required'] ?? 1, $i, $f['max_value'] ?? null]);
        }
    }

    return ['success' => true, 'id' => $formId];
}

function portalUpdatePerfForm($id)
{
    $body = jsonBody();
    $db = getDB();
    ensurePerfFormsSchema($db);

    // Update form metadata
    $allowed = ['title', 'description', 'scope_type', 'scope_region_id', 'scope_unit_id', 'scope_circle_id', 'scope_campus_id', 'period', 'is_active', 'is_template', 'template_key', 'is_public', 'banner_image', 'theme_primary_color', 'footer_bg_color', 'footer_text_color', 'footer_pattern_color'];
    $sets = [];
    $params = [];
    foreach ($allowed as $key) {
        if (array_key_exists($key, $body)) {
            $sets[] = "$key = ?";
            $params[] = $body[$key];
        }
    }
    if (!empty($sets)) {
        $params[] = $id;
        $db->prepare("UPDATE portal_perf_forms SET " . implode(', ', $sets) . " WHERE id = ?")->execute($params);
    }

    // Replace fields if provided
    if (isset($body['fields'])) {
        $db->prepare("DELETE FROM portal_perf_fields WHERE form_id = ?")->execute([$id]);
        $fstmt = $db->prepare("INSERT INTO portal_perf_fields (id, form_id, type, label, description, options, is_required, display_order, max_value) VALUES (?,?,?,?,?,?,?,?,?)");
        foreach ($body['fields'] as $i => $f) {
            $fstmt->execute([uuid(), $id, $f['type'], $f['label'], $f['description'] ?? null, isset($f['options']) ? json_encode($f['options']) : null, $f['is_required'] ?? 1, $i, $f['max_value'] ?? null]);
        }
    }

    return ['success' => true];
}

function portalDeletePerfForm($id)
{
    $db = getDB();
    $db->prepare("DELETE FROM portal_perf_forms WHERE id = ?")->execute([$id]);
    return ['success' => true];
}

/* ═══════════════════════════════════════════
Performance Responses
═══════════════════════════════════════════ */

function portalGetPerfResponses($formId)
{
    $db = getDB();
    ensurePerfPublicResponsesTable($db);
    $stmt = $db->prepare("
            SELECT r.*, 'member' AS response_source,
                TRIM(CONCAT_WS(' ', u.first_name, u.middle_name, u.last_name)) AS member_name,
                u.phone AS member_phone,
                pu.name AS unit_name
            FROM portal_perf_responses r
            LEFT JOIN portal_users u ON r.member_id = u.id
            LEFT JOIN portal_units pu ON u.unit_id = pu.id
            WHERE r.form_id = ?
            ORDER BY r.submitted_at DESC
        ");
    $stmt->execute([$formId]);
    $rows = $stmt->fetchAll();
    $publicStmt = $db->prepare("
            SELECT id, form_id, NULL AS member_id, 'public' AS response_source,
                COALESCE(NULLIF(TRIM(respondent_name), ''), 'Public respondent') AS member_name,
                respondent_phone AS member_phone,
                'Public' AS unit_name,
                response_data,
                submitted_at,
                updated_at
            FROM portal_perf_public_responses
            WHERE form_id = ?
            ORDER BY submitted_at DESC
        ");
    $publicStmt->execute([$formId]);
    $rows = array_merge($rows, $publicStmt->fetchAll());
    usort($rows, function ($a, $b) {
        return strcmp($b['submitted_at'] ?? '', $a['submitted_at'] ?? '');
    });
    foreach ($rows as &$r) {
        if ($r['response_data'] && is_string($r['response_data']))
            $r['response_data'] = json_decode($r['response_data'], true);
    }
    return $rows;
}

function portalSubmitPerfResponse($formId)
{
    $body = jsonBody();
    $db = getDB();

    // Check existing
    $existing = $db->prepare("SELECT id FROM portal_perf_responses WHERE form_id = ? AND member_id = ?");
    $existing->execute([$formId, $body['member_id']]);

    if ($existing->fetch()) {
        // Update
        $db->prepare("UPDATE portal_perf_responses SET response_data = ? WHERE form_id = ? AND member_id = ?")
            ->execute([json_encode($body['response_data']), $formId, $body['member_id']]);
        ensurePerfFormViewsTable($db);
        $db->prepare("INSERT INTO portal_perf_form_views (form_id, member_id, seen_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE seen_at = NOW()")
            ->execute([$formId, $body['member_id']]);
        return ['success' => true, 'updated' => true];
    } else {
        // Insert
        $db->prepare("INSERT INTO portal_perf_responses (id, form_id, member_id, response_data) VALUES (?,?,?,?)")
            ->execute([uuid(), $formId, $body['member_id'], json_encode($body['response_data'])]);
        ensurePerfFormViewsTable($db);
        $db->prepare("INSERT INTO portal_perf_form_views (form_id, member_id, seen_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE seen_at = NOW()")
            ->execute([$formId, $body['member_id']]);
        return ['success' => true, 'created' => true];
    }
}

function portalSubmitPublicPerfResponse($formId)
{
    $body = jsonBody();
    $db = getDB();
    ensurePerfFormsSchema($db);
    ensurePerfPublicResponsesTable($db);

    $stmt = $db->prepare("SELECT id FROM portal_perf_forms WHERE id = ? AND is_public = 1 AND is_active = 1");
    $stmt->execute([$formId]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        return ['error' => 'Public form not found.'];
    }

    $responseData = $body['response_data'] ?? null;
    if (!$responseData || !is_array($responseData)) {
        http_response_code(400);
        return ['error' => 'response_data is required.'];
    }

    $id = uuid();
    $db->prepare("
            INSERT INTO portal_perf_public_responses
                (id, form_id, respondent_name, respondent_email, respondent_phone, response_data)
            VALUES (?,?,?,?,?,?)
        ")->execute([
            $id,
            $formId,
            isset($body['respondent_name']) ? trim((string) $body['respondent_name']) : null,
            isset($body['respondent_email']) ? trim((string) $body['respondent_email']) : null,
            isset($body['respondent_phone']) ? trim((string) $body['respondent_phone']) : null,
            json_encode($responseData),
        ]);

    return ['success' => true, 'id' => $id];
}

function portalMarkPerfFormSeen($formId)
{
    $body = jsonBody();
    $memberId = $body['member_id'] ?? null;
    if (!$memberId) {
        http_response_code(400);
        return ['error' => 'member_id required.'];
    }
    $db = getDB();
    ensurePerfFormViewsTable($db);
    $stmt = $db->prepare("INSERT INTO portal_perf_form_views (form_id, member_id, seen_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE seen_at = NOW()");
    $stmt->execute([$formId, $memberId]);
    return ['success' => true];
}

function portalMarkPerfResponseNotificationsSeen()
{
    $body = jsonBody();
    $userId = $body['user_id'] ?? null;
    if (!$userId) {
        http_response_code(400);
        return ['error' => 'user_id required.'];
    }

    $db = getDB();
    ensurePerfFormsSchema($db);
    ensurePerfResponseNotificationViewsTable($db);

    $stmt = $db->prepare("SELECT id, role, unit_id FROM portal_users WHERE id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        http_response_code(400);
        return ['error' => 'Invalid user ID.'];
    }

    $role = $user['role'] ?? 'member';
    if (!in_array($role, ['admin', 'zonal_secretary', 'regional_president', 'unit_president'], true)) {
        return ['success' => true, 'seen' => 0];
    }

    $regionCols = hasRegionColumns($db);
    $hasUserRegion = $regionCols['users'];
    $hasUnitRegion = $regionCols['units'];
    $sql = "
        INSERT IGNORE INTO portal_perf_response_notification_views (response_id, user_id, seen_at)
        SELECT r.id, ?, NOW()
        FROM portal_perf_responses r
        WHERE NOT EXISTS (SELECT 1 FROM portal_perf_reviews rev WHERE rev.response_id = r.id)
    ";
    $params = [$userId];

    if ($role === 'unit_president') {
        $sql .= " AND r.member_id IN (SELECT id FROM portal_users WHERE unit_id = ?)";
        $params[] = $user['unit_id'] ?? null;
    } elseif ($role === 'regional_president') {
        if (!$hasUserRegion || !$hasUnitRegion) {
            return ['success' => true, 'seen' => 0];
        }
        $sql .= " AND r.member_id IN (SELECT id FROM portal_users WHERE unit_id IN (SELECT id FROM portal_units WHERE region_id = (SELECT region_id FROM portal_users WHERE id = ? AND role = 'regional_president')))";
        $params[] = $userId;
    }

    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    return ['success' => true, 'seen' => $stmt->rowCount()];
}

/* ═══════════════════════════════════════════
Profile Edit Verification Requests
═══════════════════════════════════════════ */

function portalCreateEditRequest()
{
    $db = getDB();
    $body = jsonBody();
    $memberId = $body['member_id'] ?? null;
    $changes = $body['changes'] ?? null;

    if (!$memberId || !$changes) {
        http_response_code(400);
        return ['error' => 'member_id and changes are required.'];
    }

    // Auto-create table if it doesn't exist yet
    if (!tableExists($db, 'portal_edit_requests')) {
        $db->exec("
            CREATE TABLE IF NOT EXISTS portal_edit_requests (
                id VARCHAR(36) PRIMARY KEY,
                member_id VARCHAR(36) NOT NULL,
                changes JSON NOT NULL,
                status ENUM('pending','approved','rejected') DEFAULT 'pending',
                reviewed_by VARCHAR(36),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_at TIMESTAMP NULL,
                FOREIGN KEY (member_id) REFERENCES portal_users(id) ON DELETE CASCADE,
                INDEX idx_per_member (member_id),
                INDEX idx_per_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    // Cancel any existing pending request for this member
    $db->prepare("UPDATE portal_edit_requests SET status = 'rejected' WHERE member_id = ? AND status = 'pending'")->execute([$memberId]);

    $id = uuid();
    $stmt = $db->prepare("INSERT INTO portal_edit_requests (id, member_id, changes) VALUES (?, ?, ?)");
    $stmt->execute([$id, $memberId, json_encode($changes)]);

    return ['success' => true, 'id' => $id];
}

function portalGetEditRequests()
{
    $db = getDB();
    $unitId = $_GET['unitId'] ?? null;
    $status = $_GET['status'] ?? 'pending';

    if (!tableExists($db, 'portal_edit_requests')) {
        return [];
    }

    $sql = "SELECT er.*, TRIM(CONCAT_WS(' ', u.first_name, u.middle_name, u.last_name)) AS member_name, u.phone AS member_phone, u.unit_id
            FROM portal_edit_requests er
            JOIN portal_users u ON er.member_id = u.id";
    $params = [];

    $conditions = [];
    if ($status && $status !== 'all') {
        $conditions[] = "er.status = ?";
        $params[] = $status;
    }
    if ($unitId) {
        $conditions[] = "u.unit_id = ?";
        $params[] = $unitId;
    }

    if ($conditions) {
        $sql .= ' WHERE ' . implode(' AND ', $conditions);
    }

    $sql .= ' ORDER BY er.created_at DESC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Decode JSON changes
    foreach ($rows as &$row) {
        $row['changes'] = json_decode($row['changes'], true);
    }
    return $rows;
}

function portalResolveEditRequest($id)
{
    $db = getDB();
    $body = jsonBody();
    $status = $body['status'] ?? null;
    $reviewedBy = $body['reviewed_by'] ?? null;

    if (!$status || !in_array($status, ['approved', 'rejected'])) {
        http_response_code(400);
        return ['error' => 'status must be approved or rejected.'];
    }

    // Get the request
    $stmt = $db->prepare("SELECT * FROM portal_edit_requests WHERE id = ?");
    $stmt->execute([$id]);
    $req = $stmt->fetch();
    if (!$req) {
        http_response_code(404);
        return ['error' => 'Edit request not found.'];
    }

    if ($req['status'] !== 'pending') {
        http_response_code(400);
        return ['error' => 'Request already resolved.'];
    }

    // Update the request status
    $db->prepare("UPDATE portal_edit_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?")
        ->execute([$status, $reviewedBy, $id]);

    // If approved, apply the changes to the user record
    if ($status === 'approved') {
        $changes = json_decode($req['changes'], true);
        if ($changes && is_array($changes)) {
            $allowed = ['first_name', 'middle_name', 'last_name', 'phone', 'alt_phone', 'date_of_birth'];
            $sets = [];
            $vals = [];
            foreach ($changes as $field => $value) {
                if (in_array($field, $allowed)) {
                    $sets[] = "$field = ?";
                    $vals[] = $value;
                }
            }
            if ($sets) {
                $vals[] = $req['member_id'];
                $db->prepare("UPDATE portal_users SET " . implode(', ', $sets) . " WHERE id = ?")->execute($vals);
            }
        }
    }

    return ['success' => true];
}

function portalGetMemberEditRequests($memberId)
{
    $db = getDB();
    if (!tableExists($db, 'portal_edit_requests')) {
        return [];
    }
    $stmt = $db->prepare("SELECT * FROM portal_edit_requests WHERE member_id = ? ORDER BY created_at DESC LIMIT 10");
    $stmt->execute([$memberId]);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$row) {
        $row['changes'] = json_decode($row['changes'], true);
    }
    return $rows;
}

/* ═══════════════════════════════════════════
Avatar Upload
═══════════════════════════════════════════ */

function portalUploadAvatar($id)
{
    if (!isset($_FILES['file'])) {
        http_response_code(400);
        return ['error' => 'No file uploaded.'];
    }

    $file = $_FILES['file'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
        http_response_code(400);
        return ['error' => 'Invalid file type.'];
    }
    if ($file['size'] > 5 * 1024 * 1024) {
        http_response_code(400);
        return ['error' => 'File too large (max 5MB).'];
    }

    $dir = __DIR__ . '/../uploads/avatars/';
    if (!is_dir($dir))
        mkdir($dir, 0755, true);

    // Remove old avatar files for this user
    foreach (glob($dir . $id . '.*') as $old)
        unlink($old);

    $filename = $id . '.' . $ext;
    move_uploaded_file($file['tmp_name'], $dir . $filename);

    $url = BASE_URL . '/uploads/avatars/' . $filename . '?t=' . time();

    // Update user record
    $db = getDB();
    $db->prepare("UPDATE portal_users SET avatar_url = ? WHERE id = ?")->execute([$url, $id]);

    return ['success' => true, 'url' => $url];
}

function portalDeleteAvatar($id)
{
    $dir = __DIR__ . '/../uploads/avatars/';
    foreach (glob($dir . $id . '.*') as $old)
        @unlink($old);

    $db = getDB();
    $db->prepare("UPDATE portal_users SET avatar_url = NULL WHERE id = ?")->execute([$id]);

    return ['success' => true];
}

/* ═══════════════════════════════════════════
Region Units
═══════════════════════════════════════════ */

function portalGetRegionUnits($rpId)
{
    $db = getDB();
    $stmt = $db->prepare("SELECT unit_id FROM portal_region_units WHERE regional_president_id = ?");
    $stmt->execute([$rpId]);
    return array_column($stmt->fetchAll(), 'unit_id');
}

/* ═══════════════════════════════════════════
Performance response reviews
═══════════════════════════════════════════ */

function canReviewResponse($db, $reviewerId, $responseId)
{
    $stmt = $db->prepare("
            SELECT r.member_id, u.unit_id AS member_unit_id, f.scope_unit_id AS form_scope_unit_id
            FROM portal_perf_responses r
            JOIN portal_users u ON r.member_id = u.id
            JOIN portal_perf_forms f ON r.form_id = f.id
            WHERE r.id = ?
        ");
    $stmt->execute([$responseId]);
    $row = $stmt->fetch();
    if (!$row)
        return false;

    $stmt = $db->prepare("SELECT role, unit_id FROM portal_users WHERE id = ?");
    $stmt->execute([$reviewerId]);
    $reviewer = $stmt->fetch();
    if (!$reviewer)
        return false;

    $role = $reviewer['role'];
    if ($role === 'admin' || $role === 'zonal_secretary')
        return true;
    if ($role === 'unit_president' && $reviewer['unit_id'] === $row['member_unit_id'])
        return true;
    if ($role === 'regional_president') {
        $regionCols = hasRegionColumns($db);
        if ($regionCols['units'] && $regionCols['users']) {
            $check = $db->prepare("SELECT 1 FROM portal_users rp JOIN portal_units u ON u.region_id = rp.region_id WHERE rp.id = ? AND rp.role = 'regional_president' AND u.id = ?");
            $check->execute([$reviewerId, $row['member_unit_id']]);
            return $check->fetch() ? true : false;
        }
        return false;
    }
    return false;
}

function portalGetPerfResponseReviews($formId, $responseId)
{
    $db = getDB();
    $stmt = $db->prepare("
            SELECT rev.*, TRIM(CONCAT_WS(' ', u.first_name, u.middle_name, u.last_name)) AS reviewer_name
            FROM portal_perf_reviews rev
            LEFT JOIN portal_users u ON rev.reviewer_id = u.id
            WHERE rev.response_id = ?
            ORDER BY rev.created_at DESC
        ");
    $stmt->execute([$responseId]);
    return $stmt->fetchAll();
}

function portalUpsertPerfResponseReview($formId, $responseId)
{
    $body = jsonBody();
    $reviewerId = $body['reviewer_id'] ?? null;
    $comment = $body['comment'] ?? null;
    $rating = isset($body['rating']) ? (int) $body['rating'] : null;

    if (!$reviewerId) {
        http_response_code(400);
        return ['error' => 'reviewer_id required.'];
    }

    $db = getDB();
    if (!canReviewResponse($db, $reviewerId, $responseId)) {
        http_response_code(403);
        return ['error' => 'Not allowed to review this response.'];
    }

    $existing = $db->prepare("SELECT id FROM portal_perf_reviews WHERE response_id = ? AND reviewer_id = ?");
    $existing->execute([$responseId, $reviewerId]);
    $row = $existing->fetch();

    if ($row) {
        $db->prepare("UPDATE portal_perf_reviews SET comment = ?, rating = ? WHERE id = ?")
            ->execute([$comment, $rating, $row['id']]);
        return ['success' => true, 'id' => $row['id'], 'updated' => true];
    }

    $id = uuid();
    $db->prepare("INSERT INTO portal_perf_reviews (id, response_id, reviewer_id, comment, rating) VALUES (?,?,?,?,?)")
        ->execute([$id, $responseId, $reviewerId, $comment, $rating]);
    return ['success' => true, 'id' => $id];
}

function portalUpdatePerfReview($reviewId)
{
    $body = jsonBody();
    $reviewerId = $body['reviewer_id'] ?? $_GET['reviewer_id'] ?? null;
    if (!$reviewerId) {
        http_response_code(400);
        return ['error' => 'reviewer_id required.'];
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT reviewer_id FROM portal_perf_reviews WHERE id = ?");
    $stmt->execute([$reviewId]);
    $row = $stmt->fetch();
    if (!$row) {
        http_response_code(404);
        return ['error' => 'Review not found.'];
    }
    if ($row['reviewer_id'] !== $reviewerId) {
        http_response_code(403);
        return ['error' => 'Not allowed to update this review.'];
    }

    $comment = $body['comment'] ?? null;
    $rating = isset($body['rating']) ? (int) $body['rating'] : null;
    $db->prepare("UPDATE portal_perf_reviews SET comment = ?, rating = ? WHERE id = ?")
        ->execute([$comment, $rating, $reviewId]);
    return ['success' => true];
}

function portalDeletePerfReview($reviewId)
{
    $body = jsonBody();
    $reviewerId = $body['reviewer_id'] ?? $_GET['reviewer_id'] ?? null;
    if (!$reviewerId) {
        http_response_code(400);
        return ['error' => 'reviewer_id required.'];
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT reviewer_id FROM portal_perf_reviews WHERE id = ?");
    $stmt->execute([$reviewId]);
    $row = $stmt->fetch();
    if (!$row) {
        http_response_code(404);
        return ['error' => 'Review not found.'];
    }
    if ($row['reviewer_id'] !== $reviewerId) {
        http_response_code(403);
        return ['error' => 'Not allowed to delete this review.'];
    }

    $db->prepare("DELETE FROM portal_perf_reviews WHERE id = ?")->execute([$reviewId]);
    return ['success' => true];
}

/* ═══════════════════════════════════════════
Helpers
═══════════════════════════════════════════ */

function formatUser($row)
{
    $fullName = isset($row['first_name']) ? buildFullName($row['first_name'], $row['middle_name'] ?? null, $row['last_name']) : ($row['full_name'] ?? '');
    $overrides = $row['permission_overrides'] ?? null;
    if (is_string($overrides)) {
        $decoded = json_decode($overrides, true);
        $overrides = is_array($decoded) ? $decoded : null;
    }
    $title = $row['title'] ?? null;
    $unitRegionId = $row['unit_region_id'] ?? null;

    // Determine if this is a campus unit for display_title purposes
    $membershipType = $row['membership_type'] ?? null;
    $isCampusUnit = $membershipType === 'campus' || ($unitRegionId === null && isset($row['unit_id']) && $row['unit_id'] !== null);

    $displayTitle = $title;
    if ($title === 'Unit President' && $isCampusUnit) {
        $displayTitle = 'Campus President';
    } elseif ($title === 'Unit Secretary' && $isCampusUnit) {
        $displayTitle = 'Campus Secretary';
    }

    // Compute membership_name based on membership_type
    $membershipName = $row['membership_name'] ?? null;
    if (!$membershipName) {
        if ($membershipType === 'unit') {
            $membershipName = $row['unit_name'] ?? null;
        } elseif ($membershipType === 'circle') {
            $membershipName = $row['circle_name'] ?? null;
        } elseif ($membershipType === 'campus') {
            $membershipName = $row['campus_name'] ?? null;
        }
    }

    return [
        'id' => $row['id'],
        'first_name' => $row['first_name'] ?? null,
        'middle_name' => $row['middle_name'] ?? null,
        'last_name' => $row['last_name'] ?? null,
        'full_name' => $fullName,
        'username' => $row['username'] ?? null,
        'phone' => $row['phone'],
        'alt_phone' => $row['alt_phone'] ?? null,
        'role' => $row['role'],
        // New unified membership fields
        'membership_type' => $membershipType,
        'membership_id' => $row['membership_id'] ?? null,
        'membership_name' => $membershipName,
        // Legacy fields (for backward compatibility during transition)
        'unit_id' => $row['unit_id'] ?? null,
        'unit_name' => $row['unit_name'] ?? null,
        'region_id' => $row['region_id'] ?? null,
        'region_name' => $row['region_name'] ?? null,
        'circle_id' => $row['circle_id'] ?? null,
        'circle_name' => $row['circle_name'] ?? null,
        'campus_id' => $row['campus_id'] ?? null,
        'campus_name' => $row['campus_name'] ?? null,
        'permission_overrides' => $overrides,
        'date_of_birth' => $row['date_of_birth'] ?? null,
        'avatar_url' => $row['avatar_url'] ?? null,
        'title' => $title,
        'display_title' => $displayTitle,
        'title_color' => $row['title_color'] ?? null,
        'title_assigned_by' => $row['title_assigned_by'] ?? null,
        'title_assigned_at' => $row['title_assigned_at'] ?? null,
        'status' => $row['status'] ?? 'active',
        'inactivated_by' => $row['inactivated_by'] ?? null,
        'inactive_reason' => isset($row['inactive_reason']) && is_string($row['inactive_reason']) ? json_decode($row['inactive_reason'], true) : ($row['inactive_reason'] ?? null),
        'inactivated_at' => $row['inactivated_at'] ?? null,
        'revoked_by' => $row['revoked_by'] ?? null,
        'revoke_reason' => $row['revoke_reason'] ?? null,
        'revoked_at' => $row['revoked_at'] ?? null,
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}
