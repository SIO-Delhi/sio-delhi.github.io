<?php
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p>✅ Created 'popups' table</p>";

    // Insert default sections
    $defaultSections = [
        ['about', 'About SIO Delhi', 'ABOUT US', 'custom', 1],
        ['initiatives', 'Our Initiatives', 'INITIATIVES', 'custom', 2],
        ['media', 'Press & Media', 'MEDIA', 'custom', 3],
        ['leadership', 'Our Leadership', 'LEADERSHIP', 'custom', 4],
        ['more', 'More Resources', 'resources', 'custom', 5]
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
