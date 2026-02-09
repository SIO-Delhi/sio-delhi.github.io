<?php
require_once __DIR__ . '/config.php';
header('Content-Type: application/json');

try {
    // Force TCP connection
    $dsn = "mysql:host=127.0.0.1;dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Check if table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'portal_regions'");
    if ($stmt->rowCount() === 0) {
        echo json_encode(['error' => 'Table portal_regions does not exist']);
        exit;
    }

    $stmt = $pdo->query("SELECT id, name FROM portal_regions ORDER BY name");
    $regions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($regions, JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}