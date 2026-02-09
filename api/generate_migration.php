<?php
// Script to generate SQL for adding Units and linking Members based on CSV

$csvFile = __DIR__ . '/../src/siodelhi_data.csv';
$csvData = array_map('str_getcsv', file($csvFile));
$header = array_shift($csvData); // Remove header

// Known Campuses (to distinguish from Units)
$knownCampuses = [
    'Jamia Millia Islamia',
    'Jamia Hamdard',
    'D.U',
    'JNU',
    'IIISR',
    'IIISR Academy'
];

$units = [];
$memberUpdates = [];

foreach ($csvData as $row) {
    // CSV Structure: Sl. No.,Name,Unit,Date of Birth ,Mobile Number
    // Index: 0=Sl, 1=Name, 2=Unit, 3=DOB, 4=Mobile

    $name = trim($row[1]);
    $entityName = trim($row[2]);
    $mobile = trim($row[4]);

    if (empty($name) || empty($entityName))
        continue;

    // Link user to this Unit
    // Use CONCAT_WS to match first/middle/last name, or phone
    $sqlNameMatch = "CONCAT_WS(' ', first_name, middle_name, last_name) = '" . addslashes($name) . "'";
    $sqlPhoneMatch = "(phone = '$mobile' AND phone IS NOT NULL AND phone != '')";

    // Check if it's a Campus
    if (in_array($entityName, $knownCampuses)) {
        // It's a campus, user needs to be linked to portal_campuses
        $memberUpdates[] = "UPDATE portal_users SET membership_type = 'campus', membership_id = (SELECT id FROM portal_campuses WHERE name = '" . addslashes($entityName) . "' LIMIT 1) WHERE ($sqlNameMatch OR $sqlPhoneMatch);";
    } else {
        // It's a UNIT (even Jasola, Loni, etc. per user request)
        $units[$entityName] = true;

        // Link user to this Unit
        $memberUpdates[] = "UPDATE portal_users SET membership_type = 'unit', membership_id = (SELECT id FROM portal_units WHERE name = '" . addslashes($entityName) . "' LIMIT 1) WHERE ($sqlNameMatch OR $sqlPhoneMatch);";
    }
}

// Generate SQL
echo "-- =====================================================\n";
echo "-- STEP 10 (Revised): Ensure ALL Units exist\n";
echo "-- =====================================================\n";
echo "INSERT IGNORE INTO portal_units (id, name, created_at, updated_at) VALUES \n";
$unitValues = [];
foreach (array_keys($units) as $u) {
    if ($u === 'Unit' || empty($u))
        continue;
    $unitValues[] = "(UUID(), '" . addslashes($u) . "', NOW(), NOW())";
}
echo implode(",\n", $unitValues) . ";\n\n";


echo "-- =====================================================\n";
echo "-- STEP 11: Link Members to Units/Campuses\n";
echo "-- =====================================================\n";
foreach ($memberUpdates as $sql) {
    echo $sql . "\n";
}
