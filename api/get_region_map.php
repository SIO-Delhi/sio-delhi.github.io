<?php
// Adjust path to db.php - we are in api/ directory, db.php is in api/
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

try {
    $pdo = getDB();
    $stmt = $pdo->query("SELECT id, name FROM portal_regions ORDER BY name");
    $regions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($regions, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
