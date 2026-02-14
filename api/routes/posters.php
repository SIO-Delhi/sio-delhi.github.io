<?php
/**
 * Poster Download Storage API Routes
 * Saves downloaded poster images for admin review
 */

require_once __DIR__ . '/../db.php';

/**
 * Auto-create the poster_downloads table if it doesn't exist
 */
function ensurePosterTable()
{
    $pdo = getDB();
    $pdo->exec("CREATE TABLE IF NOT EXISTS poster_downloads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        poster_type VARCHAR(50) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        metadata TEXT,
        ip_hash VARCHAR(64),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
}

/**
 * POST /posters/save
 * Save a downloaded poster image to the server.
 * Accepts multipart/form-data with:
 *   - poster: JPEG file
 *   - poster_type: 'weekly_poster' | 'event_poster'
 *   - metadata: JSON string with poster details
 */
function savePoster()
{
    try {
        ensurePosterTable();

        if (!isset($_FILES['poster'])) {
            http_response_code(400);
            return ['error' => 'No poster file provided'];
        }

        $file = $_FILES['poster'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            return ['error' => 'Upload error'];
        }

        // Limit to 2MB
        if ($file['size'] > 2 * 1024 * 1024) {
            http_response_code(400);
            return ['error' => 'File too large (max 2MB)'];
        }

        // Only allow JPEG
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ['jpg', 'jpeg'])) {
            http_response_code(400);
            return ['error' => 'Only JPEG files are allowed'];
        }

        $posterType = $_POST['poster_type'] ?? 'unknown';
        $metadata = $_POST['metadata'] ?? '{}';

        // Validate poster_type
        if (!in_array($posterType, ['weekly_poster', 'event_poster'])) {
            $posterType = 'unknown';
        }

        // Generate unique filename
        $filename = $posterType . '-' . time() . '-' . substr(uniqid(), -6) . '.jpg';

        // Create posters directory if it doesn't exist
        $uploadPath = UPLOAD_DIR . 'posters/';
        if (!is_dir($uploadPath)) {
            mkdir($uploadPath, 0755, true);
        }

        $filepath = $uploadPath . $filename;
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            http_response_code(500);
            return ['error' => 'Failed to save poster'];
        }

        $fileUrl = BASE_URL . '/uploads/posters/' . $filename;

        // Hash the IP for privacy
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $ipHash = hash('sha256', $ip . date('Y-m'));

        $pdo = getDB();
        $stmt = $pdo->prepare("INSERT INTO poster_downloads (poster_type, file_url, filename, metadata, ip_hash) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$posterType, $fileUrl, $filename, $metadata, $ipHash]);

        // Auto-cleanup: delete posters older than 90 days
        cleanupOldPosters();

        http_response_code(201);
        return ['success' => true];
    } catch (\Throwable $e) {
        http_response_code(500);
        return ['error' => 'Server error: ' . $e->getMessage()];
    }
}

/**
 * GET /posters
 * Returns paginated list of saved posters (admin only).
 * Query params: page (default 1), limit (default 20), type (filter)
 */
function getPosters()
{
    ensurePosterTable();

    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(50, max(1, intval($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;
    $type = $_GET['type'] ?? null;

    $pdo = getDB();

    // Count total
    if ($type && in_array($type, ['weekly_poster', 'event_poster'])) {
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM poster_downloads WHERE poster_type = ?");
        $countStmt->execute([$type]);
    } else {
        $countStmt = $pdo->query("SELECT COUNT(*) FROM poster_downloads");
        $type = null;
    }
    $total = $countStmt->fetchColumn();

    // Fetch posters
    if ($type) {
        $stmt = $pdo->prepare("SELECT id, poster_type, file_url, metadata, created_at FROM poster_downloads WHERE poster_type = ? ORDER BY created_at DESC LIMIT ? OFFSET ?");
        $stmt->execute([$type, $limit, $offset]);
    } else {
        $stmt = $pdo->prepare("SELECT id, poster_type, file_url, metadata, created_at FROM poster_downloads ORDER BY created_at DESC LIMIT ? OFFSET ?");
        $stmt->execute([$limit, $offset]);
    }

    $posters = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Parse metadata JSON for each poster
    foreach ($posters as &$poster) {
        $poster['metadata'] = json_decode($poster['metadata'], true) ?? [];
    }

    return [
        'posters' => $posters,
        'total' => (int) $total,
        'page' => $page,
        'limit' => $limit,
        'total_pages' => ceil($total / $limit)
    ];
}

/**
 * DELETE /posters/{id}
 * Delete a saved poster (admin only).
 */
function deletePoster($id)
{
    ensurePosterTable();

    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT filename FROM poster_downloads WHERE id = ?");
    $stmt->execute([$id]);
    $poster = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$poster) {
        http_response_code(404);
        return ['error' => 'Poster not found'];
    }

    // Delete file from disk
    $filepath = UPLOAD_DIR . 'posters/' . $poster['filename'];
    if (file_exists($filepath)) {
        unlink($filepath);
    }

    // Delete from DB
    $deleteStmt = $pdo->prepare("DELETE FROM poster_downloads WHERE id = ?");
    $deleteStmt->execute([$id]);

    return ['success' => true];
}

/**
 * Auto-cleanup: remove posters older than 90 days
 */
function cleanupOldPosters()
{
    $pdo = getDB();

    // Find posters older than 90 days
    $stmt = $pdo->query("SELECT id, filename FROM poster_downloads WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)");
    $old = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($old as $poster) {
        $filepath = UPLOAD_DIR . 'posters/' . $poster['filename'];
        if (file_exists($filepath)) {
            unlink($filepath);
        }
    }

    // Delete from DB
    $pdo->exec("DELETE FROM poster_downloads WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)");
}
