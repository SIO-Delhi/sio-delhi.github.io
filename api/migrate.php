<?php
/**
 * Database Migration Runner
 * Applies numbered SQL migration files from api/migrations/ in order.
 * Tracks applied migrations in a _migrations table.
 *
 * Usage: php api/migrate.php
 * Or call via API: POST /portal/migrate (admin only)
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

function runMigrations(): array
{
    $db = getDB();
    $migrationsDir = __DIR__ . '/migrations';
    $results = [];

    // Create migrations tracking table
    $db->exec("
        CREATE TABLE IF NOT EXISTS _migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Get already-applied migrations
    $applied = [];
    $stmt = $db->query("SELECT filename FROM _migrations ORDER BY id");
    foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $f) {
        $applied[$f] = true;
    }

    // Find migration files
    $files = glob("$migrationsDir/*.sql");
    if (!$files) {
        return ['success' => true, 'message' => 'No migration files found.', 'applied' => []];
    }
    sort($files); // Ensures numeric order (001, 002, ...)

    $newlyApplied = [];

    foreach ($files as $file) {
        $filename = basename($file);

        // Skip already applied
        if (isset($applied[$filename])) {
            continue;
        }

        $sql = file_get_contents($file);
        if (!$sql || trim($sql) === '') {
            $results[] = "SKIP $filename (empty)";
            continue;
        }

        try {
            // Execute migration (may contain multiple statements)
            $db->exec($sql);

            // Record as applied
            $stmt = $db->prepare("INSERT INTO _migrations (filename) VALUES (?)");
            $stmt->execute([$filename]);

            $newlyApplied[] = $filename;
            $results[] = "OK $filename";
        } catch (PDOException $e) {
            $results[] = "FAIL $filename: " . $e->getMessage();
            // Stop on failure — don't skip broken migrations
            break;
        }
    }

    return [
        'success' => true,
        'message' => count($newlyApplied) === 0
            ? 'Database is up to date.'
            : count($newlyApplied) . ' migration(s) applied.',
        'applied' => $newlyApplied,
        'details' => $results,
    ];
}

// If run from CLI
if (php_sapi_name() === 'cli') {
    echo "Running migrations...\n";
    $result = runMigrations();
    echo $result['message'] . "\n";
    foreach ($result['details'] as $detail) {
        echo "  $detail\n";
    }
    exit($result['success'] ? 0 : 1);
}
