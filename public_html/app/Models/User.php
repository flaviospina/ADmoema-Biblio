<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;

class User
{
    public static function find(int $id): ?array
    {
        $st = Database::pdo()->prepare('SELECT * FROM users WHERE id = ?');
        $st->execute([$id]);
        return $st->fetch() ?: null;
    }

    public static function findByEmail(string $email): ?array
    {
        $st = Database::pdo()->prepare('SELECT * FROM users WHERE email = ?');
        $st->execute([mb_strtolower(trim($email))]);
        return $st->fetch() ?: null;
    }

    public static function create(string $name, string $email, string $hash, string $role, ?string $voice): int
    {
        $st = Database::pdo()->prepare(
            'INSERT INTO users (name, email, password_hash, role, voice_type) VALUES (?, ?, ?, ?, ?)'
        );
        $st->execute([trim($name), mb_strtolower(trim($email)), $hash, $role, $voice]);
        return (int) Database::pdo()->lastInsertId();
    }

    public static function coralistas(): array
    {
        return Database::pdo()
            ->query("SELECT id, name, email, voice_type, created_at FROM users WHERE role = 'coralista' ORDER BY name")
            ->fetchAll();
    }
}
