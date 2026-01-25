<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

/**
 * Database Setup Script
 * Run this once to create the required tables
 *
 * Access via: https://yourdomain.com/api/setup.php
 * DELETE THIS FILE after running it!
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h1>Database Setup</h1>";

try {
    $db = getDB();

    // Create sections table
    $db->exec("
        CREATE TABLE IF NOT EXISTS sections (
            id VARCHAR(50) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            label VARCHAR(255) NOT NULL,
            type VARCHAR(50) DEFAULT 'generic',
            display_order INT DEFAULT 0,
            is_published TINYINT(1) DEFAULT 1,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p>✅ Created 'sections' table</p>";

    // Create posts table
    $db->exec("
        CREATE TABLE IF NOT EXISTS posts (
            id VARCHAR(36) PRIMARY KEY,
            section_id VARCHAR(50),
            parent_id VARCHAR(36),
            is_subsection TINYINT(1) DEFAULT 0,
            title VARCHAR(500) NOT NULL,
            subtitle VARCHAR(500),
            content LONGTEXT,
            image TEXT,
            pdf_url VARCHAR(500),
            enable_audio TINYINT(1) DEFAULT 0,
            email VARCHAR(255),
            instagram VARCHAR(255),
            layout VARCHAR(50),
            display_order INT DEFAULT 0,
            is_published TINYINT(1) DEFAULT 0,
            tags JSON,
            icon VARCHAR(100),
            gallery_images JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p>✅ Created 'posts' table</p>";

    // Create popups table
    $db->exec("
        CREATE TABLE IF NOT EXISTS popups (
            id VARCHAR(36) PRIMARY KEY,
            image VARCHAR(500) NOT NULL,
            is_active TINYINT(1) DEFAULT 1,
            button_text VARCHAR(100),
            button_link VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p>✅ Created 'popups' table</p>";

    // Add missing columns to popups table (for existing installations)
    $popupColumnsToAdd = [
        ['button_text', "ALTER TABLE popups ADD COLUMN button_text VARCHAR(100)"],
        ['button_link', "ALTER TABLE popups ADD COLUMN button_link VARCHAR(500)"]
    ];

    foreach ($popupColumnsToAdd as $column) {
        $colName = $column[0];
        $sql = $column[1];
        try {
            $checkStmt = $db->query("SHOW COLUMNS FROM popups LIKE '$colName'");
            if ($checkStmt->rowCount() == 0) {
                $db->exec($sql);
                echo "<p>✅ Added '$colName' column to popups table</p>";
            } else {
                echo "<p>ℹ️ '$colName' column already exists in popups</p>";
            }
        } catch (PDOException $e) {
            echo "<p>⚠️ Error with '$colName': " . htmlspecialchars($e->getMessage()) . "</p>";
        }
    }

    // Create forms table
    $db->exec("
        CREATE TABLE IF NOT EXISTS forms (
            id VARCHAR(36) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            slug VARCHAR(100) UNIQUE,
            banner_image VARCHAR(500),
            theme_primary_color VARCHAR(20) DEFAULT '#ff3b3b',
            theme_background VARCHAR(100) DEFAULT '#fafafa',
            theme_background_image VARCHAR(500),
            is_published TINYINT(1) DEFAULT 0,
            accept_responses TINYINT(1) DEFAULT 1,
            success_message TEXT,
            response_limit INT DEFAULT NULL,
            expires_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p>✅ Created 'forms' table</p>";

    // Add missing columns to forms table (for existing installations)
    $columnsToAdd = [
        ['banner_image', "ALTER TABLE forms ADD COLUMN banner_image VARCHAR(500)"],
        ['theme_primary_color', "ALTER TABLE forms ADD COLUMN theme_primary_color VARCHAR(20) DEFAULT '#ff3b3b'"],
        ['theme_background', "ALTER TABLE forms ADD COLUMN theme_background VARCHAR(200) DEFAULT '#fafafa'"],
        ['theme_background_image', "ALTER TABLE forms ADD COLUMN theme_background_image VARCHAR(500)"]
    ];

    foreach ($columnsToAdd as $column) {
        $colName = $column[0];
        $sql = $column[1];
        try {
            // Check if column exists first
            $checkStmt = $db->query("SHOW COLUMNS FROM forms LIKE '$colName'");
            if ($checkStmt->rowCount() == 0) {
                $db->exec($sql);
                echo "<p>✅ Added '$colName' column to forms table</p>";
            } else {
                echo "<p>ℹ️ '$colName' column already exists</p>";
            }
        } catch (PDOException $e) {
            echo "<p>⚠️ Error with '$colName': " . htmlspecialchars($e->getMessage()) . "</p>";
        }
    }

    // Create form_fields table
    $db->exec("
        CREATE TABLE IF NOT EXISTS form_fields (
            id VARCHAR(36) PRIMARY KEY,
            form_id VARCHAR(36) NOT NULL,
            type VARCHAR(50) NOT NULL,
            label VARCHAR(255) NOT NULL,
            placeholder VARCHAR(255),
            help_text VARCHAR(500),
            is_required TINYINT(1) DEFAULT 0,
            options JSON,
            validation_rules JSON,
            display_order INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p>✅ Created 'form_fields' table</p>";

    // Create form_responses table
    $db->exec("
        CREATE TABLE IF NOT EXISTS form_responses (
            id VARCHAR(36) PRIMARY KEY,
            form_id VARCHAR(36) NOT NULL,
            response_data JSON NOT NULL,
            submitter_ip VARCHAR(45),
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
            INDEX idx_form_responses_form_id (form_id),
            INDEX idx_form_responses_submitted_at (submitted_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p>✅ Created 'form_responses' table</p>";

    // Insert default sections
    $defaultSections = [
        ['about', 'About SIO Delhi', 'ABOUT US', 'custom', 1],
        ['initiatives', 'Our Initiatives', 'INITIATIVES', 'custom', 2],
        ['media', 'Press & Media', 'MEDIA', 'custom', 3],
        ['leadership', 'Our Leadership', 'LEADERSHIP', 'custom', 4],
    ];

    $stmt = $db->prepare("
        INSERT IGNORE INTO sections (id, title, label, type, display_order, is_published)
        VALUES (?, ?, ?, ?, ?, 1)
    ");

    foreach ($defaultSections as $section) {
        $stmt->execute($section);
    }
    echo "<p>✅ Inserted default sections</p>";

    // Create upload directories
    $uploadDirs = ['images', 'pdfs', 'audio'];
    foreach ($uploadDirs as $dir) {
        $path = UPLOAD_DIR . $dir;
        if (!is_dir($path)) {
            if (mkdir($path, 0755, true)) {
                echo "<p>✅ Created upload directory: $dir</p>";
            } else {
                echo "<p>⚠️ Could not create upload directory: $dir (create it manually)</p>";
            }
        } else {
            echo "<p>ℹ️ Upload directory already exists: $dir</p>";
        }
    }

    echo "<hr>";
    echo "<h2>Setup Complete!</h2>";
    echo "<p><strong>⚠️ IMPORTANT: Delete this file (setup.php) now for security!</strong></p>";
    echo "<p>Your API is ready at: <code>" . BASE_URL . "/api/</code></p>";
    echo "<p>Test endpoint: <a href='health'>" . BASE_URL . "/api/health</a></p>";

} catch (Exception $e) {
    echo "<p>❌ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
