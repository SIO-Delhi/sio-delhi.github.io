<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/routes/stats.php';

echo "Testing getOrphanedFiles()...\n";
$result = getOrphanedFiles();
echo "Total References Found: " . $result['totalReferencesFound'] . "\n";
echo "References Count detailed: " . count($result['referencedFiles']) . "\n";

// Also test getAllReferencedUrlsWithSources directly
echo "Testing getAllReferencedUrlsWithSources()...\n";
$refs = getAllReferencedUrlsWithSources();
echo "Count from helper: " . count($refs) . "\n";
if (count($refs) > 0) {
    echo "First reference: " . print_r($refs[0], true) . "\n";
} else {
    echo "No references found!\n";
}
