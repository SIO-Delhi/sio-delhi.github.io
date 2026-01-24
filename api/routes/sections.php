<?php
/**
 * Sections API Routes
 */

function getAll() {
    $db = getDB();
    $stmt = $db->query("SELECT * FROM sections ORDER BY display_order ASC");
    $sections = $stmt->fetchAll();

    return array_map(function($row) {
        return [
            'id' => $row['id'],
            'title' => $row['title'],
            'label' => $row['label'],
            'type' => $row['type'],
            'template' => $row['template'] ?? 'standard',
            'displayOrder' => (int)$row['display_order'],
            'isPublished' => (bool)$row['is_published'],
            'description' => $row['description'],
            'createdAt' => $row['created_at'] ? strtotime($row['created_at']) * 1000 : null,
            'updatedAt' => $row['updated_at'] ? strtotime($row['updated_at']) * 1000 : null
        ];
    }, $sections);
}

function getOne($id) {
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM sections WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    if (!$row) {
        http_response_code(404);
        return ['error' => 'Section not found'];
    }

    return [
        'id' => $row['id'],
        'title' => $row['title'],
        'label' => $row['label'],
        'type' => $row['type'],
        'template' => $row['template'] ?? 'standard',
        'displayOrder' => (int)$row['display_order'],
        'isPublished' => (bool)$row['is_published'],
        'description' => $row['description'],
        'createdAt' => $row['created_at'] ? strtotime($row['created_at']) * 1000 : null,
        'updatedAt' => $row['updated_at'] ? strtotime($row['updated_at']) * 1000 : null
    ];
}

function create() {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['id']) || empty($data['title']) || empty($data['label'])) {
        http_response_code(400);
        return ['error' => 'id, title, and label are required'];
    }

    $db = getDB();

    // Check if exists
    $stmt = $db->prepare("SELECT id FROM sections WHERE id = ?");
    $stmt->execute([$data['id']]);
    if ($stmt->fetch()) {
        http_response_code(409);
        return ['error' => 'Section with this ID already exists'];
    }

    $stmt = $db->prepare("
        INSERT INTO sections (id, title, label, type, template, display_order, is_published, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $data['id'],
        $data['title'],
        $data['label'],
        $data['type'] ?? 'generic',
        $data['template'] ?? 'standard',
        $data['displayOrder'] ?? 0,
        isset($data['isPublished']) ? ($data['isPublished'] ? 1 : 0) : 1,
        $data['description'] ?? null
    ]);

    http_response_code(201);
    return getOne($data['id']);
}

function update($id) {
    $data = json_decode(file_get_contents('php://input'), true);

    $db = getDB();

    // Check if exists
    $stmt = $db->prepare("SELECT id FROM sections WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        return ['error' => 'Section not found'];
    }

    $updates = [];
    $params = [];

    if (isset($data['title'])) {
        $updates[] = 'title = ?';
        $params[] = $data['title'];
    }
    if (isset($data['label'])) {
        $updates[] = 'label = ?';
        $params[] = $data['label'];
    }
    if (isset($data['type'])) {
        $updates[] = 'type = ?';
        $params[] = $data['type'];
    }
    if (isset($data['template'])) {
        $updates[] = 'template = ?';
        $params[] = $data['template'];
    }
    if (isset($data['displayOrder'])) {
        $updates[] = 'display_order = ?';
        $params[] = $data['displayOrder'];
    }
    if (isset($data['isPublished'])) {
        $updates[] = 'is_published = ?';
        $params[] = $data['isPublished'] ? 1 : 0;
    }
    if (isset($data['description'])) {
        $updates[] = 'description = ?';
        $params[] = $data['description'];
    }

    if (empty($updates)) {
        return getOne($id);
    }

    $params[] = $id;
    $sql = "UPDATE sections SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    return getOne($id);
}

function delete($id) {
    $db = getDB();

    $stmt = $db->prepare("SELECT id FROM sections WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        return ['error' => 'Section not found'];
    }

    $stmt = $db->prepare("DELETE FROM sections WHERE id = ?");
    $stmt->execute([$id]);

    return ['message' => 'Section deleted successfully'];
}
