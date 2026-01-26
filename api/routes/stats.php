<?php
/**
 * Storage Stats API Routes
 */

// Include upload helpers for file deletion
require_once __DIR__ . '/upload.php';

function getStorageStats()
{
    // Error reporting for debugging
    error_reporting(E_ALL);
    ini_set('display_errors', 0);

    try {
        $uploadDir = defined('UPLOAD_DIR') ? UPLOAD_DIR : __DIR__ . '/../uploads/';

        $stats = [
            'images' => getDirectoryStats($uploadDir . 'images/'),
            'pdfs' => getDirectoryStats($uploadDir . 'pdfs/'),
            'audio' => getDirectoryStats($uploadDir . 'audio/'),
            'forms' => getDirectoryStats($uploadDir . 'forms/'),
        ];

        $totalSize = $stats['images']['totalSize'] + $stats['pdfs']['totalSize'] + $stats['audio']['totalSize'] + $stats['forms']['totalSize'];
        $totalFiles = $stats['images']['fileCount'] + $stats['pdfs']['fileCount'] + $stats['audio']['fileCount'] + $stats['forms']['fileCount'];

        return [
            'buckets' => $stats,
            'totalSize' => $totalSize,
            'totalFiles' => $totalFiles,
            'maxStorage' => 5024 * 1024 * 1024, // 5024 MB (~5GB) cPanel quota
            'uploadDir' => $uploadDir
        ];
    } catch (Exception $e) {
        return [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ];
    }
}

function getDirectoryStats($path)
{
    $fileCount = 0;
    $totalSize = 0;
    $files = [];

    // Extract folder name from path (images, pdfs, audio, forms)
    $folderName = basename(rtrim($path, '/'));
    $baseUrl = defined('BASE_URL') ? BASE_URL : 'https://api.siodelhi.org';

    if (!is_dir($path)) {
        return [
            'fileCount' => 0,
            'totalSize' => 0,
            'path' => $path,
            'exists' => false,
            'files' => []
        ];
    }

    try {
        // Recursive directory iterator
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $item) {
            if ($item->isFile()) {
                $fileCount++;
                $size = $item->getSize();
                $totalSize += $size;

                // Calculate relative path for URL
                // $path is absolute path to category root (e.g. .../uploads/forms/)
                // $item->getPathname() is absolute path to file
                // We want relative path from uploads root

                // Get path relative to the category root
                $relativePath = substr($item->getPathname(), strlen($path));

                // Construct URL: base/uploads/category/relative/path
                // We need to rawurlencode each segment of the relative path
                $urlSegments = explode('/', $relativePath);
                $encodedSegments = array_map('rawurlencode', $urlSegments);
                $encodedPath = implode('/', $encodedSegments);

                $files[] = [
                    'name' => $item->getFilename(), // Just the filename for display
                    'relativePath' => $folderName . '/' . $relativePath, // For reference
                    'size' => $size,
                    'modified' => $item->getMTime(),
                    'url' => $baseUrl . '/uploads/' . $folderName . '/' . $encodedPath
                ];
            }
        }

        // Sort files by size descending (largest first)
        usort($files, function ($a, $b) {
            return $b['size'] - $a['size'];
        });

    } catch (Exception $e) {
        return [
            'fileCount' => 0,
            'totalSize' => 0,
            'error' => $e->getMessage(),
            'files' => []
        ];
    }

    return [
        'fileCount' => $fileCount,
        'totalSize' => $totalSize,
        'path' => $path,
        'exists' => true,
        'files' => $files
    ];
}

function getDatabaseStats()
{
    global $pdo;

    try {
        // Count posts
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM posts");
        $postsCount = $stmt->fetch()['count'];

        // Count sections
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM sections");
        $sectionsCount = $stmt->fetch()['count'];

        // Count popups
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM popups");
        $popupsCount = $stmt->fetch()['count'];

        return [
            'posts' => (int) $postsCount,
            'sections' => (int) $sectionsCount,
            'popups' => (int) $popupsCount
        ];
    } catch (PDOException $e) {
        return [
            'posts' => 0,
            'sections' => 0,
            'popups' => 0,
            'error' => 'Failed to fetch database stats'
        ];
    }
}

function getAllStats()
{
    return [
        'storage' => getStorageStats(),
        'database' => getDatabaseStats()
    ];
}

/**
 * Garbage Collector - Find orphaned files
 * Scans all uploaded files and compares against database references
 * Now includes detailed reference source tracking
 */
function getOrphanedFiles()
{
    $uploadDir = defined('UPLOAD_DIR') ? UPLOAD_DIR : __DIR__ . '/../uploads/';
    $baseUrl = defined('BASE_URL') ? BASE_URL : 'https://api.siodelhi.org';

    // 1. Get all files on disk
    $allFiles = getAllUploadedFiles($uploadDir, $baseUrl);

    // 2. Get all file URLs referenced in database WITH their sources
    $dbErrors = [];
    $referencesWithSources = getAllReferencedUrlsWithSources($dbErrors);

    // 3. Categorize files as orphaned or referenced
    $orphanedFiles = [];
    $referencedFiles = [];
    $totalOrphanedSize = 0;

    foreach ($allFiles as $file) {
        $fileSources = [];

        // Normalize the file path for comparison
        // Normalize the file path for comparison
        $filePath = $file['path'];
        $fileName = $file['name'];

        // Check all references for matches
        foreach ($referencesWithSources as $ref) {
            $refUrl = $ref['url'];

            // Extract filename from reference URL
            $cleanRefUrl = strtok($refUrl, '?');
            $refBasename = basename($cleanRefUrl);

            $isMatch = false;

            // 1. Exact Filename Match (Strongest check)
            if ($refBasename === $fileName) {
                $isMatch = true;
            }
            // 2. Decoded Filename Match
            elseif (urldecode($refBasename) === $fileName) {
                $isMatch = true;
            }
            // 3. Fallback: Path contained in URL
            elseif (strpos($refUrl, $filePath) !== false) {
                $isMatch = true;
            }

            if ($isMatch) {
                $fileSources[] = [
                    'table' => $ref['table'],
                    'column' => $ref['column'],
                    'id' => $ref['id']
                ];
            }
        }

        if (empty($fileSources)) {
            $orphanedFiles[] = $file;
            $totalOrphanedSize += $file['size'];
        } else {
            $file['sources'] = $fileSources;
            $referencedFiles[] = $file;
        }
    }

    // Sort orphaned by size (largest first)
    usort($orphanedFiles, function ($a, $b) {
        return $b['size'] - $a['size'];
    });

    // Sort referenced by size (largest first)
    usort($referencedFiles, function ($a, $b) {
        return $b['size'] - $a['size'];
    });


    return [
        'orphanedFiles' => $orphanedFiles,
        'referencedFiles' => $referencedFiles,
        'totalOrphanedCount' => count($orphanedFiles),
        'totalOrphanedSize' => $totalOrphanedSize,
        'totalFilesScanned' => count($allFiles),
        'totalReferencesFound' => count($referencesWithSources),
        'totalReferencedFilesCount' => count($referencedFiles),
        'debug_db_errors' => $dbErrors,
    ];
}

/**
 * Recursively get all uploaded files
 */
function getAllUploadedFiles($baseDir, $baseUrl, $relativePath = '')
{
    $files = [];
    $currentPath = $baseDir . $relativePath;

    if (!is_dir($currentPath)) {
        return $files;
    }

    $items = scandir($currentPath);
    foreach ($items as $item) {
        if ($item === '.' || $item === '..')
            continue;

        $fullPath = $currentPath . '/' . $item;
        $relPath = $relativePath ? $relativePath . '/' . $item : $item;

        if (is_dir($fullPath)) {
            // Recursively scan subdirectories
            $files = array_merge($files, getAllUploadedFiles($baseDir, $baseUrl, $relPath));
        } else {
            $files[] = [
                'name' => $item,
                'path' => $relPath,
                'fullPath' => $fullPath,
                'size' => filesize($fullPath),
                'modified' => filemtime($fullPath),
                'url' => $baseUrl . '/uploads/' . $relPath
            ];
        }
    }

    return $files;
}

/**
 * Get all file URLs referenced in the database
 */
function getAllReferencedUrls()
{
    $db = getDB();
    $urls = [];

    // Posts: image, pdf_url, gallery_images
    $stmt = $db->query("SELECT image, pdf_url, gallery_images FROM posts");
    while ($row = $stmt->fetch()) {
        if (!empty($row['image']))
            $urls[] = $row['image'];
        if (!empty($row['pdf_url']))
            $urls[] = $row['pdf_url'];
        if (!empty($row['gallery_images'])) {
            $gallery = json_decode($row['gallery_images'], true);
            if (is_array($gallery)) {
                $urls = array_merge($urls, $gallery);
            }
        }
    }

    // Forms: banner_image, theme_background_image
    $stmt = $db->query("SELECT banner_image, theme_background_image FROM forms");
    while ($row = $stmt->fetch()) {
        if (!empty($row['banner_image']))
            $urls[] = $row['banner_image'];
        if (!empty($row['theme_background_image']))
            $urls[] = $row['theme_background_image'];
    }

    // Form responses: response_data (JSON containing file URLs)
    $stmt = $db->query("SELECT response_data FROM form_responses");
    while ($row = $stmt->fetch()) {
        if (!empty($row['response_data'])) {
            $data = json_decode($row['response_data'], true);
            if (is_array($data)) {
                $urls = array_merge($urls, extractUrlsFromResponseData($data));
            }
        }
    }

    // Popups: image
    $stmt = $db->query("SELECT image FROM popups");
    while ($row = $stmt->fetch()) {
        if (!empty($row['image']))
            $urls[] = $row['image'];
    }

    return array_unique($urls);
}

/**
 * Get all file URLs referenced in the database WITH source information
 * Returns array of: { url, table, column, id }
 */
function getAllReferencedUrlsWithSources(&$errors = [])
{
    $references = [];
    $errors = [];

    try {
        $db = getDB();

        // 1. Posts: image, pdf_url, gallery_images
        try {
            $stmt = $db->query("SELECT id, image, pdf_url, gallery_images FROM posts");
            while ($row = $stmt->fetch()) {
                if (!empty($row['image'])) {
                    $references[] = ['url' => $row['image'], 'table' => 'posts', 'column' => 'image', 'id' => $row['id']];
                }
                if (!empty($row['pdf_url'])) {
                    $references[] = ['url' => $row['pdf_url'], 'table' => 'posts', 'column' => 'pdf_url', 'id' => $row['id']];
                }
                if (!empty($row['gallery_images'])) {
                    $gallery = json_decode($row['gallery_images'], true);
                    if (is_array($gallery)) {
                        foreach ($gallery as $imgUrl) {
                            $references[] = ['url' => $imgUrl, 'table' => 'posts', 'column' => 'gallery_images', 'id' => $row['id']];
                        }
                    }
                }
            }
        } catch (Exception $e) {
            $errors['posts'] = $e->getMessage();
            error_log('Error querying posts stats: ' . $e->getMessage());
        }

        // 2. Forms: banner_image, theme_background_image
        try {
            $stmt = $db->query("SELECT id, banner_image, theme_background_image FROM forms");
            while ($row = $stmt->fetch()) {
                if (!empty($row['banner_image'])) {
                    $references[] = ['url' => $row['banner_image'], 'table' => 'forms', 'column' => 'banner_image', 'id' => $row['id']];
                }
                if (!empty($row['theme_background_image'])) {
                    $references[] = ['url' => $row['theme_background_image'], 'table' => 'forms', 'column' => 'theme_background_image', 'id' => $row['id']];
                }
            }
        } catch (Exception $e) {
            $errors['forms'] = $e->getMessage();
            error_log('Error querying forms stats: ' . $e->getMessage());
        }

        // 3. Form responses: response_data
        try {
            $stmt = $db->query("SELECT id, form_id, response_data FROM form_responses");
            while ($row = $stmt->fetch()) {
                if (!empty($row['response_data'])) {
                    $data = json_decode($row['response_data'], true);
                    if (is_array($data)) {
                        $urls = extractUrlsFromResponseData($data);
                        foreach ($urls as $url) {
                            $references[] = [
                                'url' => $url,
                                'table' => 'form_responses',
                                'column' => 'response_data',
                                'id' => $row['id'],
                                'pid' => $row['form_id'] // Parent ID (Form ID)
                            ];
                        }
                    }
                }
            }
        } catch (Exception $e) {
            $errors['form_responses'] = $e->getMessage();
            error_log('Error querying form_responses stats: ' . $e->getMessage());
        }

        // 4. Popups: image
        try {
            $stmt = $db->query("SELECT id, image FROM popups");
            while ($row = $stmt->fetch()) {
                if (!empty($row['image'])) {
                    $references[] = ['url' => $row['image'], 'table' => 'popups', 'column' => 'image', 'id' => $row['id']];
                }
            }
        } catch (Exception $e) {
            $errors['popups'] = $e->getMessage();
            error_log('Error querying popups stats: ' . $e->getMessage());
        }

    } catch (Exception $e) {
        $errors['general'] = $e->getMessage();
        error_log('getAllReferencedUrlsWithSources fatal error: ' . $e->getMessage());
    }

    return $references;
}

/**
 * Extract file URLs from form response data
 */
function extractUrlsFromResponseData($data)
{
    $urls = [];
    foreach ($data as $value) {
        if (is_string($value) && strpos($value, '/uploads/') !== false) {
            $urls[] = $value;
        } elseif (is_array($value)) {
            foreach ($value as $item) {
                if (is_string($item) && strpos($item, '/uploads/') !== false) {
                    $urls[] = $item;
                }
            }
        }
    }
    return $urls;
}

/**
 * Delete orphaned files
 * POST body: { "files": ["path1", "path2"] } or { "deleteAll": true }
 *
 * SAFETY: This function re-verifies files are orphaned before deletion
 */
function deleteOrphanedFiles()
{
    $data = json_decode(file_get_contents('php://input'), true);
    $uploadDir = defined('UPLOAD_DIR') ? UPLOAD_DIR : __DIR__ . '/../uploads/';

    $deleted = [];
    $failed = [];
    $protected = [];
    $totalFreed = 0;

    // SAFETY: Always get fresh list of orphaned files to verify before deletion
    $currentOrphans = getOrphanedFiles();
    $orphanedPaths = array_map(function ($f) {
        return $f['path'];
    }, $currentOrphans['orphanedFiles']);

    if (!empty($data['deleteAll'])) {
        // Delete all currently orphaned files (re-scanned)
        foreach ($currentOrphans['orphanedFiles'] as $file) {
            if (file_exists($file['fullPath']) && unlink($file['fullPath'])) {
                $deleted[] = $file['path'];
                $totalFreed += $file['size'];

                // Try to remove empty parent directories
                cleanupEmptyDirectories(dirname($file['fullPath']), $uploadDir);
            } else {
                $failed[] = $file['path'];
            }
        }
    } elseif (!empty($data['files']) && is_array($data['files'])) {
        // Delete specific files - but ONLY if they're still orphaned
        foreach ($data['files'] as $relativePath) {
            // Sanitize path to prevent directory traversal
            $relativePath = str_replace('..', '', $relativePath);
            $fullPath = $uploadDir . $relativePath;

            // SAFETY CHECK: Verify file is in orphaned list before deleting
            if (!in_array($relativePath, $orphanedPaths)) {
                // File is referenced in database - DO NOT DELETE
                $protected[] = $relativePath . ' (PROTECTED: referenced in database)';
                continue;
            }

            if (file_exists($fullPath) && is_file($fullPath)) {
                $size = filesize($fullPath);
                if (unlink($fullPath)) {
                    $deleted[] = $relativePath;
                    $totalFreed += $size;

                    // Try to remove empty parent directories
                    cleanupEmptyDirectories(dirname($fullPath), $uploadDir);
                } else {
                    $failed[] = $relativePath;
                }
            } else {
                $failed[] = $relativePath . ' (not found)';
            }
        }
    } else {
        http_response_code(400);
        return ['error' => 'Please provide "files" array or "deleteAll": true'];
    }

    return [
        'deleted' => $deleted,
        'deletedCount' => count($deleted),
        'failed' => $failed,
        'failedCount' => count($failed),
        'protected' => $protected,
        'protectedCount' => count($protected),
        'spaceFreed' => $totalFreed
    ];
}

/**
 * Remove empty directories up to the uploads root
 */
function cleanupEmptyDirectories($dir, $stopAt)
{
    $stopAt = rtrim($stopAt, '/');
    $dir = rtrim($dir, '/');

    // Don't delete the uploads root or go above it
    while ($dir !== $stopAt && strlen($dir) > strlen($stopAt)) {
        if (is_dir($dir)) {
            $files = array_diff(scandir($dir), ['.', '..']);
            if (empty($files)) {
                rmdir($dir);
                $dir = dirname($dir);
            } else {
                break;
            }
        } else {
            break;
        }
    }
}
