<?php
/**
 * Popups API Routes
 */

// Include upload helpers for file deletion
require_once __DIR__ . '/upload.php';

function getAll() {
    $db = getDB();

    $sql = "SELECT * FROM popups ORDER BY created_at DESC";

    if (!empty($_GET['activeOnly']) && $_GET['activeOnly'] === 'true') {
        $sql = "SELECT * FROM popups WHERE is_active = 1 ORDER BY created_at DESC";
    }

    $stmt = $db->query($sql);
    $popups = $stmt->fetchAll();

    return array_map('mapPopup', $popups);
}

function getActive() {
    $db = getDB();
    $stmt = $db->query("SELECT * FROM popups WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1");
    $row = $stmt->fetch();

    if (!$row) {
        return null;
    }

    return mapPopup($row);
}

function getOne($id) {
    $popup = getPopupById($id);
    if (!$popup) {
        http_response_code(404);
        return ['error' => 'Popup not found'];
    }

    return $popup;
}

function create() {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['image'])) {
        http_response_code(400);
        return ['error' => 'image is required'];
    }

    $db = getDB();
    $id = $data['id'] ?? generatePopupUUID();
    $isActive = isset($data['isActive']) ? ($data['isActive'] ? 1 : 0) : 1;

    // Deactivate other popups if this one is active
    if ($isActive) {
        $db->exec("UPDATE popups SET is_active = 0");
    }

    $stmt = $db->prepare("
        INSERT INTO popups (id, image, is_active, button_text, button_link)
        VALUES (?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $id,
        $data['image'],
        $isActive,
        $data['buttonText'] ?? null,
        $data['buttonLink'] ?? null
    ]);

    http_response_code(201);
    return getPopupById($id);
}

function update($id) {
    $data = json_decode(file_get_contents('php://input'), true);

    $db = getDB();

    // Check if exists
    $stmt = $db->prepare("SELECT * FROM popups WHERE id = ?");
    $stmt->execute([$id]);
    $existing = $stmt->fetch();

    if (!$existing) {
        http_response_code(404);
        return ['error' => 'Popup not found'];
    }

    // If activating this popup, deactivate others
    if (isset($data['isActive']) && $data['isActive'] && !$existing['is_active']) {
        $db->prepare("UPDATE popups SET is_active = 0 WHERE id != ?")->execute([$id]);
    }

    $updates = [];
    $params = [];

    if (isset($data['image'])) {
        $updates[] = 'image = ?';
        $params[] = $data['image'];
    }
    if (isset($data['isActive'])) {
        $updates[] = 'is_active = ?';
        $params[] = $data['isActive'] ? 1 : 0;
    }
    if (array_key_exists('buttonText', $data)) {
        $updates[] = 'button_text = ?';
        $params[] = $data['buttonText'];
    }
    if (array_key_exists('buttonLink', $data)) {
        $updates[] = 'button_link = ?';
        $params[] = $data['buttonLink'];
    }

    if (empty($updates)) {
        return getPopupById($id);
    }

    $params[] = $id;
    $sql = "UPDATE popups SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    return getPopupById($id);
}

function delete($id) {
    $db = getDB();

    // Get popup data before deleting (need image URL)
    $stmt = $db->prepare("SELECT * FROM popups WHERE id = ?");
    $stmt->execute([$id]);
    $popup = $stmt->fetch();

    if (!$popup) {
        http_response_code(404);
        return ['error' => 'Popup not found'];
    }

    // Delete associated image
    if (!empty($popup['image'])) {
        deleteFileByUrl($popup['image']);
    }

    // Delete from database
    $stmt = $db->prepare("DELETE FROM popups WHERE id = ?");
    $stmt->execute([$id]);

    return ['message' => 'Popup deleted successfully'];
}

function clearAll() {
    $db = getDB();

    // Get all popup images before deleting
    $stmt = $db->query("SELECT image FROM popups WHERE image IS NOT NULL");
    $popups = $stmt->fetchAll();

    // Delete all popup images
    foreach ($popups as $popup) {
        if (!empty($popup['image'])) {
            deleteFileByUrl($popup['image']);
        }
    }

    // Delete all from database
    $db->exec("DELETE FROM popups");
    return ['message' => 'All popups deleted successfully'];
}

// Helper functions
function getPopupById($id) {
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM popups WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    if (!$row) {
        return null;
    }

    return mapPopup($row);
}

function mapPopup($row) {
    return [
        'id' => $row['id'],
        'image' => $row['image'],
        'isActive' => (bool)$row['is_active'],
        'buttonText' => $row['button_text'] ?? null,
        'buttonLink' => $row['button_link'] ?? null,
        'createdAt' => $row['created_at'] ? strtotime($row['created_at']) * 1000 : null,
        'updatedAt' => $row['updated_at'] ? strtotime($row['updated_at']) * 1000 : null
    ];
}

function generatePopupUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
