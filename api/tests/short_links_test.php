<?php
/**
 * Short Links Safety Tests
 *
 * Run with: php api/tests/short_links_test.php
 */

require_once __DIR__ . '/../routes/short-links.php';

class DeniedMetadataPDO extends PDO
{
    public function __construct()
    {
    }

    public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): PDOStatement|false
    {
        throw new PDOException('metadata denied');
    }

    public function exec(string $statement): int|false
    {
        throw new PDOException('DDL denied');
    }
}

class ShortLinksTest
{
    private int $passed = 0;
    private int $failed = 0;

    public function run(): void
    {
        echo "\nShort Links Tests\n";
        echo str_repeat('=', 40) . "\n";

        $this->testSchemaCheckDoesNotRequireDdlPermissions();

        echo "\n{$this->passed} passed, {$this->failed} failed\n";
        if ($this->failed > 0) {
            exit(1);
        }
    }

    private function assert(bool $condition, string $name, string $message = ''): void
    {
        if ($condition) {
            $this->passed++;
            echo "  OK {$name}\n";
            return;
        }

        $this->failed++;
        echo "  FAIL {$name}: {$message}\n";
    }

    private function testSchemaCheckDoesNotRequireDdlPermissions(): void
    {
        $pdo = new DeniedMetadataPDO();
        $thrown = null;

        try {
            ensureShortLinksSchema($pdo);
        } catch (Throwable $e) {
            $thrown = $e;
        }

        $this->assert(
            $thrown === null,
            'short link schema check does not require DDL permissions',
            $thrown ? $thrown->getMessage() : ''
        );
    }
}

(new ShortLinksTest())->run();
