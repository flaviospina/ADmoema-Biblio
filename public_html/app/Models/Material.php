<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;

class Material
{
    public static function query(?string $voice, ?int $hymnId): array
    {
        $sql = 'SELECT m.*, h.title AS hymn_title FROM materials m
                LEFT JOIN hymns h ON h.id = m.hymn_id WHERE 1=1';
        $args = [];
        if ($voice) { $sql .= ' AND (m.voice_type = ? OR m.voice_type IS NULL)'; $args[] = $voice; }
        if ($hymnId) { $sql .= ' AND m.hymn_id = ?'; $args[] = $hymnId; }
        $sql .= ' ORDER BY m.created_at DESC';
        $st = Database::pdo()->prepare($sql);
        $st->execute($args);
        return $st->fetchAll();
    }

    public static function find(int $id): ?array
    {
        $st = Database::pdo()->prepare('SELECT * FROM materials WHERE id = ?');
        $st->execute([$id]);
        return $st->fetch() ?: null;
    }

    public static function create(array $d): int
    {
        $st = Database::pdo()->prepare(
            'INSERT INTO materials (hymn_id, title, type, voice_type, content, file_name, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $st->execute([
            $d['hymn_id'], $d['title'], $d['type'], $d['voice_type'],
            $d['content'], $d['file_name'], $d['created_by'],
        ]);
        return (int) Database::pdo()->lastInsertId();
    }
}
