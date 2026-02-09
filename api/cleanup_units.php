<?php
require_once __DIR__ . '/db.php';

// List of names that are actually Campuses or Circles and should NOT be in portal_units
$toRemove = [
    // Campuses
    'D.U',
    'IIISR',
    'IIISR Academy',
    'Jamia Hamdard',
    'Jamia Millia Islamia',
    'JNU',

    // Circles (from user screenshot and common knowledge of the data)
    '3rd Pushta',
    'Ballimaran',
    'Bara Hindu Rao',
    'Chhajarsi',
    'Inderlok',
    'Indrapuri',
    'Karol Bagh',
    'Laxmi Nagar',
    'Mahipalpur',
    'Nihal Vihar',
    'Paschim Vihar',
    'Pasonda',
    'Saket',
    'Shahdara',
    'Usmanpur',
    'Vijay Nagar',
    'Vijaynagar'
];

try {
    $pdo = getDB();

    echo "Cleaning up portal_units table...\n";
    echo "The following names will be removed from 'portal_units' as they are Campuses or Circles:\n";

    // Prepare placeholders
    $placeholders = implode(',', array_fill(0, count($toRemove), '?'));

    // Check what will be deleted
    $stmtCheck = $pdo->prepare("SELECT name, id FROM portal_units WHERE name IN ($placeholders)");
    $stmtCheck->execute($toRemove);
    $found = $stmtCheck->fetchAll();

    if (count($found) === 0) {
        echo "No erroneous entries found in portal_units table. It's already clean! ✅\n";
    } else {
        echo "Found " . count($found) . " entries to delete:\n";
        foreach ($found as $row) {
            echo "- " . $row['name'] . " (ID: " . $row['id'] . ")\n";
        }

        // Delete
        $stmtDelete = $pdo->prepare("DELETE FROM portal_units WHERE name IN ($placeholders)");
        $stmtDelete->execute($toRemove);

        echo "\nSuccessfully deleted " . $stmtDelete->rowCount() . " entries from portal_units. ✅\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
