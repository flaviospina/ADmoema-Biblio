<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;

class Hymn
{
    public static function all(): array
    {
        return Database::pdo()->query('SELECT * FROM hymns ORDER BY title')->fetchAll();
    }

    public static function find(int $id): ?array
    {
        $st = Database::pdo()->prepare('SELECT * FROM hymns WHERE id = ?');
        $st->execute([$id]);
        return $st->fetch() ?: null;
    }

    public static function create(string $title, ?string $key, ?int $bpm): int
    {
        $st = Database::pdo()->prepare('INSERT INTO hymns (title, music_key, bpm) VALUES (?, ?, ?)');
        $st->execute([trim($title), $key ?: null, $bpm]);
        return (int) Database::pdo()->lastInsertId();
    }
}
