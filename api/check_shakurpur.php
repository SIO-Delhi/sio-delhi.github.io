<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

try {
    $db = getDB();

    // Check Unit
    $stmt = $db->prepare("SELECT * FROM portal_units WHERE name LIKE ?");
    $stmt->execute(['%Shakurpur%']);
    $unit = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($unit) {
        echo "✅ Unit 'Shakurpur' found: " . json_encode($unit) . "\n";
    } else {
        echo "❌ Unit 'Shakurpur' NOT found.\n";
    }

    // Check Members
    $stmt = $db->prepare("SELECT id, first_name, phone, unit_id, membership_type, membership_id FROM portal_users WHERE phone IN ('9151241734', '6387913305')");
    $stmt->execute();
    $members = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($members) > 0) {
        echo "ℹ️ Members found:\n";
        foreach ($members as $m) {
            echo " - " . $m['first_name'] . " (" . $m['phone'] . ") -> Unit ID: " . ($m['unit_id'] ?? 'NULL') . "\n";
        }
    } else {
        echo "❌ Members (Ateeq, Danish) NOT found in DB.\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
