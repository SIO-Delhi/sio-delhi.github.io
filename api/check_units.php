<?php
require_once __DIR__ . '/db.php';

// List of units/campuses from the CSV
$csvUnits = [
    'Abul Fazl Enclave North',
    'Abul Fazl Enclave South',
    'Ballimaran',
    'Bara Hindu Rao',
    'Batla House',
    'Chhajarsi',
    'D.U',
    'Ghonda',
    'Greater Noida',
    'IIISR',
    'Inderlok',
    'Indrapuri',
    'Jahangir Puri',
    'Jaitpur',
    'Jamia Hamdard',
    'Jamia Millia Islamia',
    'Jasola',
    'JNU',
    'Kanchankunj',
    'Kardampuri',
    'Karol Bagh',
    'Loni',
    'Mahipalpur',
    'Nabi Karim',
    'New Mustafabad',
    'Nihal Vihar',
    'Okhla Village',
    'Old Mustafabad',
    'Pasonda',
    'Raghubir Nagar',
    'Saket',
    'Seemapuri',
    'Shahdara',
    'Shaheen Bagh',
    'shakurpur', // Note lowercase in CSV
    'Usmanpur',
    'Vijay Nagar',
    'Vikas Nagar'
];

try {
    $pdo = getDB();

    // Fetch all existing units
    $stmtUnits = $pdo->query("SELECT name FROM portal_units");
    $dbUnits = $stmtUnits->fetchAll(PDO::FETCH_COLUMN);

    // Fetch all existing campuses
    $stmtCampuses = $pdo->query("SELECT name FROM portal_campuses");
    $dbCampuses = $stmtCampuses->fetchAll(PDO::FETCH_COLUMN);

    // Fetch all existing circles (just in case)
    $stmtCircles = $pdo->query("SELECT name FROM portal_circles");
    $dbCircles = $stmtCircles->fetchAll(PDO::FETCH_COLUMN);

    echo "Checking " . count($csvUnits) . " entities from CSV against DB...\n\n";

    $missing = [];
    $foundInUnits = 0;
    $foundInCampuses = 0;
    $foundInCircles = 0;

    foreach ($csvUnits as $csvName) {
        $found = false;

        // Check exact match first
        if (in_array($csvName, $dbUnits)) {
            $found = true;
            $foundInUnits++;
        } elseif (in_array($csvName, $dbCampuses)) {
            $found = true;
            $foundInCampuses++;
        } elseif (in_array($csvName, $dbCircles)) {
            $found = true;
            $foundInCircles++;
        }

        // Case-insensitive check if not found exactly
        if (!$found) {
            foreach ($dbUnits as $dbName) {
                if (strcasecmp($csvName, $dbName) === 0) {
                    $found = true;
                    $foundInUnits++;
                    echo "Notice: '$csvName' matches unit '$dbName' (case difference)\n";
                    break;
                }
            }
        }
        if (!$found) {
            foreach ($dbCampuses as $dbName) {
                if (strcasecmp($csvName, $dbName) === 0) {
                    $found = true;
                    $foundInCampuses++;
                    echo "Notice: '$csvName' matches campus '$dbName' (case difference)\n";
                    break;
                }
            }
        }

        if (!$found) {
            $missing[] = $csvName;
        }
    }

    echo "\nResults:\n";
    echo "- Found in Units: $foundInUnits\n";
    echo "- Found in Campuses: $foundInCampuses\n";
    echo "- Found in Circles: $foundInCircles\n";
    echo "- Missing: " . count($missing) . "\n";

    if (count($missing) > 0) {
        echo "\nMissing Entities (Not found in Units, Campuses, or Circles):\n";
        foreach ($missing as $m) {
            echo " - $m\n";
        }
        echo "\nACTION REQUIRED: You need to add these to the 'portal_units' or 'portal_campuses' table.\n";
    } else {
        echo "\nAll entities from CSV are present in the database! ✅\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
