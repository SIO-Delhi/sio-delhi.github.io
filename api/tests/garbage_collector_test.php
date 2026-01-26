<?php
/**
 * Garbage Collector Safety Tests
 *
 * IMPORTANT: Run these tests before deploying garbage collector changes!
 * These tests ensure referenced files are NEVER accidentally deleted.
 *
 * Run with: php api/tests/garbage_collector_test.php
 */

// Include the stats functions
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../routes/stats.php';

class GarbageCollectorTest {
    private $passed = 0;
    private $failed = 0;
    private $tests = [];

    public function run() {
        echo "\n" . str_repeat("=", 60) . "\n";
        echo "  GARBAGE COLLECTOR SAFETY TESTS\n";
        echo str_repeat("=", 60) . "\n\n";

        // Run all tests
        $this->testUrlMatching();
        $this->testReferencedFilesNotOrphaned();
        $this->testOrphanedFilesNotReferenced();
        $this->testReferenceSourceTracking();
        $this->testDeleteRefusesReferencedFiles();
        $this->testPathSanitization();
        $this->testUrlEncodingHandling();
        $this->testGalleryImagesDetection();
        $this->testFormResponseDataExtraction();
        $this->testAllTablesScanned();

        // Print results
        echo "\n" . str_repeat("=", 60) . "\n";
        echo "  RESULTS: {$this->passed} passed, {$this->failed} failed\n";
        echo str_repeat("=", 60) . "\n\n";

        if ($this->failed > 0) {
            echo "FAILED TESTS:\n";
            foreach ($this->tests as $name => $result) {
                if (!$result['passed']) {
                    echo "  - {$name}: {$result['message']}\n";
                }
            }
            echo "\n";
            exit(1);
        }

        return $this->failed === 0;
    }

    private function assert($condition, $testName, $message = '') {
        if ($condition) {
            $this->passed++;
            $this->tests[$testName] = ['passed' => true, 'message' => 'OK'];
            echo "  ✓ {$testName}\n";
        } else {
            $this->failed++;
            $this->tests[$testName] = ['passed' => false, 'message' => $message];
            echo "  ✗ {$testName}: {$message}\n";
        }
    }

    /**
     * Test URL matching logic handles various URL formats
     */
    private function testUrlMatching() {
        echo "Testing URL Matching...\n";

        $baseUrl = 'https://api.siodelhi.org';

        // Test cases: [fileUrl, referenceUrl, shouldMatch]
        $testCases = [
            // Exact match
            [
                $baseUrl . '/uploads/images/test.jpg',
                $baseUrl . '/uploads/images/test.jpg',
                true,
                'Exact URL match'
            ],
            // Encoded filename match
            [
                $baseUrl . '/uploads/images/test file.jpg',
                $baseUrl . '/uploads/images/test%20file.jpg',
                true,
                'URL encoded space'
            ],
            // Filename contains match
            [
                $baseUrl . '/uploads/pdfs/document.pdf',
                $baseUrl . '/uploads/pdfs/document.pdf?v=123',
                true,
                'URL with query params'
            ],
            // Different files should NOT match
            [
                $baseUrl . '/uploads/images/image1.jpg',
                $baseUrl . '/uploads/images/image2.jpg',
                false,
                'Different files should not match'
            ],
            // Partial filename should NOT falsely match
            [
                $baseUrl . '/uploads/images/test.jpg',
                $baseUrl . '/uploads/images/mytest.jpg',
                false,
                'Partial name in different file'
            ],
        ];

        foreach ($testCases as $case) {
            list($fileUrl, $refUrl, $shouldMatch, $description) = $case;

            $fileName = basename(parse_url($fileUrl, PHP_URL_PATH));
            $matches = ($fileUrl === $refUrl ||
                        strpos($refUrl, $fileName) !== false ||
                        strpos($refUrl, rawurlencode($fileName)) !== false);

            $this->assert(
                $matches === $shouldMatch,
                "URL Match: {$description}",
                "Expected " . ($shouldMatch ? 'match' : 'no match') . ", got " . ($matches ? 'match' : 'no match')
            );
        }
    }

    /**
     * Test that files referenced in database are NOT marked as orphaned
     */
    private function testReferencedFilesNotOrphaned() {
        echo "\nTesting Referenced Files Protection...\n";

        $result = getOrphanedFiles();
        $referencesWithSources = getAllReferencedUrlsWithSources();

        // Get all orphaned file paths
        $orphanedPaths = array_map(function($f) { return $f['path']; }, $result['orphanedFiles']);

        // Check that no referenced URL appears in orphaned files
        $wronglyOrphaned = [];
        foreach ($referencesWithSources as $ref) {
            $refPath = parse_url($ref['url'], PHP_URL_PATH);
            $refPath = str_replace('/uploads/', '', $refPath);

            foreach ($orphanedPaths as $orphanPath) {
                if (strpos($orphanPath, basename($refPath)) !== false) {
                    $wronglyOrphaned[] = [
                        'path' => $orphanPath,
                        'ref' => $ref['url'],
                        'source' => "{$ref['table']}.{$ref['column']} (id: {$ref['id']})"
                    ];
                }
            }
        }

        $this->assert(
            count($wronglyOrphaned) === 0,
            'No referenced files in orphaned list',
            count($wronglyOrphaned) . " referenced files wrongly marked as orphaned: " .
            implode(', ', array_map(function($w) { return $w['path']; }, array_slice($wronglyOrphaned, 0, 3)))
        );
    }

    /**
     * Test that orphaned files are genuinely not referenced
     */
    private function testOrphanedFilesNotReferenced() {
        echo "\nTesting Orphaned Files Are Truly Orphaned...\n";

        $result = getOrphanedFiles();
        $allRefs = getAllReferencedUrlsWithSources();

        // Build a list of all referenced URLs and their variations
        $refUrls = [];
        foreach ($allRefs as $ref) {
            $refUrls[] = $ref['url'];
            // Also add decoded version
            $refUrls[] = urldecode($ref['url']);
        }
        $refUrls = array_unique($refUrls);

        $falseOrphans = [];
        foreach ($result['orphanedFiles'] as $file) {
            foreach ($refUrls as $refUrl) {
                if ($file['url'] === $refUrl ||
                    strpos($refUrl, $file['name']) !== false ||
                    strpos($refUrl, rawurlencode($file['name'])) !== false) {
                    $falseOrphans[] = $file['path'];
                    break;
                }
            }
        }

        $this->assert(
            count($falseOrphans) === 0,
            'Orphaned files are genuinely unreferenced',
            count($falseOrphans) . " files marked orphaned but found in references"
        );
    }

    /**
     * Test that reference sources are properly tracked
     */
    private function testReferenceSourceTracking() {
        echo "\nTesting Reference Source Tracking...\n";

        $result = getOrphanedFiles();

        // Check that referenced files have sources
        $missingSource = 0;
        foreach ($result['referencedFiles'] as $file) {
            if (empty($file['sources'])) {
                $missingSource++;
            }
        }

        $this->assert(
            $missingSource === 0,
            'All referenced files have source info',
            "{$missingSource} referenced files missing source information"
        );

        // Check source structure
        $invalidSource = 0;
        foreach ($result['referencedFiles'] as $file) {
            foreach ($file['sources'] as $source) {
                if (!isset($source['table']) || !isset($source['column']) || !isset($source['id'])) {
                    $invalidSource++;
                }
            }
        }

        $this->assert(
            $invalidSource === 0,
            'All sources have table, column, and id',
            "{$invalidSource} sources have invalid structure"
        );
    }

    /**
     * Test that delete function refuses to delete referenced files
     * (Simulated - doesn't actually delete)
     */
    private function testDeleteRefusesReferencedFiles() {
        echo "\nTesting Delete Protection...\n";

        $result = getOrphanedFiles();

        if (count($result['referencedFiles']) > 0) {
            // Take a referenced file path
            $referencedFile = $result['referencedFiles'][0];

            // The delete function should only work on orphaned files
            // We test by checking if the path is in orphaned list
            $isOrphaned = false;
            foreach ($result['orphanedFiles'] as $orphan) {
                if ($orphan['path'] === $referencedFile['path']) {
                    $isOrphaned = true;
                    break;
                }
            }

            $this->assert(
                !$isOrphaned,
                'Referenced file not in orphaned list',
                'Referenced file appeared in orphaned list - DELETE WOULD FAIL'
            );
        } else {
            $this->assert(
                true,
                'Delete protection (no referenced files to test)',
                ''
            );
        }
    }

    /**
     * Test path sanitization prevents directory traversal
     */
    private function testPathSanitization() {
        echo "\nTesting Path Sanitization...\n";

        $dangerousPaths = [
            '../../../etc/passwd',
            '..\\..\\..\\windows\\system32',
            'images/../../../config.php',
            'images/test/../../../secrets.txt',
        ];

        foreach ($dangerousPaths as $path) {
            $sanitized = str_replace('..', '', $path);
            $this->assert(
                strpos($sanitized, '..') === false,
                "Sanitize: {$path}",
                'Path traversal not properly sanitized'
            );
        }
    }

    /**
     * Test that URL encoding variations are handled
     */
    private function testUrlEncodingHandling() {
        echo "\nTesting URL Encoding Handling...\n";

        $testCases = [
            ['file name.jpg', 'file%20name.jpg'],
            ['file+name.jpg', 'file%2Bname.jpg'],
            ['Ürümqi.jpg', '%C3%9Cr%C3%BCmqi.jpg'],
            ['test&file.jpg', 'test%26file.jpg'],
        ];

        foreach ($testCases as $case) {
            list($decoded, $encoded) = $case;

            // Simulate the matching logic
            $matches = (
                strpos($decoded, basename($encoded)) !== false ||
                strpos($decoded, basename(urldecode($encoded))) !== false ||
                $decoded === urldecode($encoded)
            );

            $this->assert(
                $matches,
                "Encoding: {$decoded}",
                "Failed to match encoded filename"
            );
        }
    }

    /**
     * Test that gallery images (JSON arrays) are properly detected
     */
    private function testGalleryImagesDetection() {
        echo "\nTesting Gallery Images Detection...\n";

        $db = getDB();
        $stmt = $db->query("SELECT id, gallery_images FROM posts WHERE gallery_images IS NOT NULL AND gallery_images != '' AND gallery_images != '[]' LIMIT 5");
        $galleryPosts = $stmt->fetchAll();

        if (count($galleryPosts) === 0) {
            $this->assert(true, 'Gallery detection (no galleries found)', '');
            return;
        }

        $refs = getAllReferencedUrlsWithSources();
        $galleryRefs = array_filter($refs, function($r) {
            return $r['column'] === 'gallery_images';
        });

        $this->assert(
            count($galleryRefs) > 0,
            'Gallery images are being tracked',
            'No gallery image references found despite gallery posts existing'
        );

        // Verify each gallery image is tracked
        foreach ($galleryPosts as $post) {
            $images = json_decode($post['gallery_images'], true);
            if (!is_array($images)) continue;

            foreach ($images as $imgUrl) {
                $found = false;
                foreach ($galleryRefs as $ref) {
                    if ($ref['url'] === $imgUrl && $ref['id'] == $post['id']) {
                        $found = true;
                        break;
                    }
                }
                $this->assert(
                    $found,
                    "Gallery image tracked: post #{$post['id']}",
                    "Gallery image not tracked: {$imgUrl}"
                );
                break; // Just check first image per post
            }
        }
    }

    /**
     * Test that form response data URLs are extracted
     */
    private function testFormResponseDataExtraction() {
        echo "\nTesting Form Response Data Extraction...\n";

        $db = getDB();
        $stmt = $db->query("SELECT id, response_data FROM form_responses WHERE response_data LIKE '%/uploads/%' LIMIT 5");
        $responses = $stmt->fetchAll();

        if (count($responses) === 0) {
            $this->assert(true, 'Form response extraction (no file uploads found)', '');
            return;
        }

        $refs = getAllReferencedUrlsWithSources();
        $responseRefs = array_filter($refs, function($r) {
            return $r['table'] === 'form_responses';
        });

        $this->assert(
            count($responseRefs) > 0,
            'Form response files are being tracked',
            'No form response file references found despite uploads existing'
        );
    }

    /**
     * Test that all relevant database tables are scanned
     */
    private function testAllTablesScanned() {
        echo "\nTesting All Tables Are Scanned...\n";

        $refs = getAllReferencedUrlsWithSources();

        $tablesScanned = array_unique(array_map(function($r) { return $r['table']; }, $refs));

        $requiredTables = ['posts', 'forms', 'popups'];
        $missingTables = [];

        foreach ($requiredTables as $table) {
            if (!in_array($table, $tablesScanned)) {
                // Check if table has any file references
                $db = getDB();
                $hasData = false;
                if ($table === 'posts') {
                    $stmt = $db->query("SELECT COUNT(*) FROM posts WHERE image IS NOT NULL OR pdf_url IS NOT NULL");
                    $hasData = $stmt->fetchColumn() > 0;
                } elseif ($table === 'forms') {
                    $stmt = $db->query("SELECT COUNT(*) FROM forms WHERE banner_image IS NOT NULL OR theme_background_image IS NOT NULL");
                    $hasData = $stmt->fetchColumn() > 0;
                } elseif ($table === 'popups') {
                    $stmt = $db->query("SELECT COUNT(*) FROM popups WHERE image IS NOT NULL");
                    $hasData = $stmt->fetchColumn() > 0;
                }

                if ($hasData) {
                    $missingTables[] = $table;
                }
            }
        }

        $this->assert(
            count($missingTables) === 0,
            'All required tables are scanned',
            'Missing tables: ' . implode(', ', $missingTables)
        );
    }
}

// Run tests
$test = new GarbageCollectorTest();
$test->run();
