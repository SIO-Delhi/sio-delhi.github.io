<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/routes/stats.php';

// Mock values if needed or just call the functions
$uploadDir = UPLOAD_DIR;
$baseUrl = BASE_URL . '/uploads';

echo "1. Scanning files in: $uploadDir\n";
$allFiles = getAllUploadedFiles($uploadDir, $baseUrl);
echo "Total files scanned: " . count($allFiles) . "\n";
if (count($allFiles) > 0) {
    echo "First file sample:\n";
    print_r($allFiles[0]);
}

echo "\n2. Fetching DB references...\n";
$errors = [];
$refs = getAllReferencedUrlsWithSources($errors);
echo "Total references found: " . count($refs) . "\n";
if (count($refs) > 0) {
    echo "First reference sample:\n";
    print_r($refs[0]);
}

echo "\n3. Testing Match Logic on first 5 refs against first 5 files...\n";
$matchesFound = 0;
foreach (array_slice($allFiles, 0, 100) as $file) {
    $filePath = $file['path'];
    $fileName = $file['name'];
    $fileUrl = $file['url'];

    foreach ($refs as $ref) {
        $refUrl = $ref['url'];

        $isMatch = false;
        // Exact URL match
        if ($fileUrl === $refUrl)
            $isMatch = true;
        // Contains path
        elseif (strpos($refUrl, $filePath) !== false)
            $isMatch = true;
        // Contains filename
        elseif (strpos($refUrl, $fileName) !== false)
            $isMatch = true;

        if ($isMatch) {
            echo "MATCH FOUND!\n";
            echo "File: " . $fileUrl . "\n";
            echo "Ref: " . $refUrl . "\n";
            echo "----------------\n";
            $matchesFound++;
            break;
        }
    }
    if ($matchesFound >= 5)
        break;
}

if ($matchesFound === 0) {
    echo "NO MATCHES FOUND in sample test.\n";
    echo "Debug info:\n";
    if (count($allFiles) > 0 && count($refs) > 0) {
        echo "File URL: " . $allFiles[0]['url'] . "\n";
        echo "Ref URL: " . $refs[0]['url'] . "\n";
    }
}
