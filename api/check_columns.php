<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

try {
    $db = getDB();
    $stmt = $db->query("SHOW COLUMNS FROM portal_users");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "Columns in portal_users:\n";
    foreach ($columns as $col) {
        echo "- $col\n";
    }

    if (in_array('membership_type', $columns)) {
        echo "\n✅ membership_type column EXISTS.";
    } else {
        echo "\n❌ membership_type column MISSING.";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
