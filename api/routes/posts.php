<?php
/**
 * Posts API Routes
 */

// Include upload helpers for file deletion
require_once __DIR__ . '/upload.php';

function getAll() {
    $db = getDB();

    $where = [];
    $params = [];

    if (!empty($_GET['sectionId'])) {
        $where[] = 'section_id = ?';
        $params[] = $_GET['sectionId'];
    }
    if (!empty($_GET['parentId'])) {
        $where[] = 'parent_id = ?';
        $params[] = $_GET['parentId'];
    }
    if (!empty($_GET['publishedOnly']) && $_GET['publishedOnly'] === 'true') {
        $where[] = 'is_published = 1';
    }

    $sql = "SELECT * FROM posts";
    if (!empty($where)) {
        $sql .= " WHERE " . implode(' AND ', $where);
    }
    $sql .= " ORDER BY display_order ASC";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $posts = $stmt->fetchAll();

    return array_map('mapPost', $posts);
}

function getOne($id) {
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM posts WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    if (!$row) {
        http_response_code(404);
        return ['error' => 'Post not found'];
    }

    return mapPost($row);
}

function create() {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['title'])) {
        http_response_code(400);
        return ['error' => 'title is required'];
    }

    $db = getDB();
    $id = $data['id'] ?? generateUUID();

    $stmt = $db->prepare("
        INSERT INTO posts (
            id, section_id, parent_id, is_subsection, title, subtitle, content,
            image, pdf_url, enable_audio, email, instagram, layout, display_order,
            is_published, tags, icon, gallery_images
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $id,
        $data['sectionId'] ?? null,
        $data['parentId'] ?? null,
        isset($data['isSubsection']) ? ($data['isSubsection'] ? 1 : 0) : 0,
        $data['title'],
        $data['subtitle'] ?? null,
        $data['content'] ?? null,
        $data['image'] ?? null,
        $data['pdfUrl'] ?? null,
        isset($data['enableAudio']) ? ($data['enableAudio'] ? 1 : 0) : 0,
        $data['email'] ?? null,
        $data['instagram'] ?? null,
        $data['layout'] ?? null,
        $data['order'] ?? 0,
        isset($data['isPublished']) ? ($data['isPublished'] ? 1 : 0) : 0,
        isset($data['tags']) ? json_encode($data['tags']) : null,
        $data['icon'] ?? null,
        isset($data['galleryImages']) ? json_encode($data['galleryImages']) : null
    ]);

    http_response_code(201);
    return getOne($id);
}

function update($id) {
    $data = json_decode(file_get_contents('php://input'), true);

    $db = getDB();

    // Check if exists
    $stmt = $db->prepare("SELECT id FROM posts WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        return ['error' => 'Post not found'];
    }

    $updates = [];
    $params = [];

    $fieldMap = [
        'sectionId' => 'section_id',
        'parentId' => 'parent_id',
        'isSubsection' => 'is_subsection',
        'title' => 'title',
        'subtitle' => 'subtitle',
        'content' => 'content',
        'image' => 'image',
        'pdfUrl' => 'pdf_url',
        'enableAudio' => 'enable_audio',
        'email' => 'email',
        'instagram' => 'instagram',
        'layout' => 'layout',
        'order' => 'display_order',
        'isPublished' => 'is_published',
        'icon' => 'icon'
    ];

    foreach ($fieldMap as $jsKey => $dbKey) {
        if (array_key_exists($jsKey, $data)) {
            $updates[] = "$dbKey = ?";
            $value = $data[$jsKey];

            // Handle booleans
            if (in_array($jsKey, ['isSubsection', 'enableAudio', 'isPublished'])) {
                $value = $value ? 1 : 0;
            }

            $params[] = $value;
        }
    }

    // Handle JSON fields
    if (array_key_exists('tags', $data)) {
        $updates[] = 'tags = ?';
        $params[] = $data['tags'] ? json_encode($data['tags']) : null;
    }
    if (array_key_exists('galleryImages', $data)) {
        $updates[] = 'gallery_images = ?';
        $params[] = $data['galleryImages'] ? json_encode($data['galleryImages']) : null;
    }

    if (empty($updates)) {
        return getOne($id);
    }

    $params[] = $id;
    $sql = "UPDATE posts SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    return getOne($id);
}

function delete($id) {
    $db = getDB();

    // Get post data before deleting (need file URLs)
    $stmt = $db->prepare("SELECT * FROM posts WHERE id = ?");
    $stmt->execute([$id]);
    $post = $stmt->fetch();

    if (!$post) {
        http_response_code(404);
        return ['error' => 'Post not found'];
    }

    // Delete associated files
    if (!empty($post['image'])) {
        deleteFileByUrl($post['image']);
    }
    if (!empty($post['pdf_url'])) {
        deleteFileByUrl($post['pdf_url']);
    }
    if (!empty($post['gallery_images'])) {
        $galleryImages = json_decode($post['gallery_images'], true);
        if (is_array($galleryImages)) {
            foreach ($galleryImages as $imageUrl) {
                deleteFileByUrl($imageUrl);
            }
        }
    }

    // Delete from database
    $stmt = $db->prepare("DELETE FROM posts WHERE id = ?");
    $stmt->execute([$id]);

    return ['message' => 'Post deleted successfully'];
}

// Helper function to map database row to API response
function mapPost($row) {
    return [
        'id' => $row['id'],
        'sectionId' => $row['section_id'],
        'parentId' => $row['parent_id'],
        'isSubsection' => (bool)$row['is_subsection'],
        'title' => $row['title'],
        'subtitle' => $row['subtitle'],
        'content' => $row['content'],
        'image' => $row['image'],
        'pdfUrl' => $row['pdf_url'],
        'enableAudio' => (bool)$row['enable_audio'],
        'email' => $row['email'],
        'instagram' => $row['instagram'],
        'layout' => $row['layout'],
        'order' => $row['display_order'] !== null ? (int)$row['display_order'] : null,
        'isPublished' => (bool)$row['is_published'],
        'tags' => $row['tags'] ? json_decode($row['tags'], true) : [],
        'icon' => $row['icon'],
        'galleryImages' => $row['gallery_images'] ? json_decode($row['gallery_images'], true) : [],
        'createdAt' => $row['created_at'] ? strtotime($row['created_at']) * 1000 : null,
        'updatedAt' => $row['updated_at'] ? strtotime($row['updated_at']) * 1000 : null
    ];
}

// Generate UUID v4
function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
