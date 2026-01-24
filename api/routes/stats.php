<?php
/**
 * Storage Stats API Routes
 */

function getStorageStats() {
    // Error reporting for debugging
    error_reporting(E_ALL);
    ini_set('display_errors', 0);
    
    try {
        $uploadDir = defined('UPLOAD_DIR') ? UPLOAD_DIR : __DIR__ . '/../uploads/';
        
        $stats = [
            'images' => getDirectoryStats($uploadDir . 'images/'),
            'pdfs' => getDirectoryStats($uploadDir . 'pdfs/'),
            'audio' => getDirectoryStats($uploadDir . 'audio/'),
        ];
        
        $totalSize = $stats['images']['totalSize'] + $stats['pdfs']['totalSize'] + $stats['audio']['totalSize'];
        $totalFiles = $stats['images']['fileCount'] + $stats['pdfs']['fileCount'] + $stats['audio']['fileCount'];
        
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

function getDirectoryStats($path) {
    $fileCount = 0;
    $totalSize = 0;
    $files = [];
    
    // Extract folder name from path (images, pdfs, audio)
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
        $dirFiles = scandir($path);
        foreach ($dirFiles as $file) {
            if ($file === '.' || $file === '..') continue;
            $filePath = $path . $file;
            if (is_file($filePath)) {
                $fileCount++;
                $size = filesize($filePath);
                $totalSize += $size;
                $files[] = [
                    'name' => $file,
                    'size' => $size,
                    'modified' => filemtime($filePath),
                    'url' => $baseUrl . '/uploads/' . $folderName . '/' . rawurlencode($file)
                ];
            }
        }
        
        // Sort files by size descending (largest first)
        usort($files, function($a, $b) {
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

function getDatabaseStats() {
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
            'posts' => (int)$postsCount,
            'sections' => (int)$sectionsCount,
            'popups' => (int)$popupsCount
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

function getAllStats() {
    return [
        'storage' => getStorageStats(),
        'database' => getDatabaseStats()
    ];
}
