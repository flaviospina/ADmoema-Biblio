<?php
declare(strict_types=1);

namespace App\Core;

use PDO;

/**
 * Conexão PDO única (MySQL na HostGator; SQLite disponível para desenvolvimento).
 * Os helpers bucket()/daysAgo() isolam as pequenas diferenças de dialeto SQL.
 */
class Database
{
    private static ?PDO $pdo = null;
    private static array $cfg = [];

    public static function init(array $cfg): void
    {
        self::$cfg = $cfg;
    }

    public static function pdo(): PDO
    {
        if (self::$pdo === null) {
            $c = self::$cfg;
            if (($c['driver'] ?? 'mysql') === 'sqlite') {
                $dsn = 'sqlite:' . $c['path'];
                self::$pdo = new PDO($dsn, null, null, self::options());
                self::$pdo->exec('PRAGMA foreign_keys = ON');
            } else {
                $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s',
                    $c['host'], $c['name'], $c['charset'] ?? 'utf8mb4');
                self::$pdo = new PDO($dsn, $c['user'], $c['pass'], self::options());
            }
        }
        return self::$pdo;
    }

    private static function options(): array
    {
        return [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
    }

    public static function isSqlite(): bool
    {
        return (self::$cfg['driver'] ?? 'mysql') === 'sqlite';
    }

    /** Expressão SQL que agrupa created_at por dia/semana/mês. */
    public static function bucket(string $period): string
    {
        if (self::isSqlite()) {
            return match ($period) {
                'week'  => "strftime('%Y-W%W', created_at)",
                'month' => "strftime('%Y-%m', created_at)",
                default => "strftime('%Y-%m-%d', created_at)",
            };
        }
        return match ($period) {
            'week'  => "DATE_FORMAT(created_at, '%x-W%v')",
            'month' => "DATE_FORMAT(created_at, '%Y-%m')",
            default => "DATE_FORMAT(created_at, '%Y-%m-%d')",
        };
    }

    /** Expressão SQL para "agora menos N dias". */
    public static function daysAgo(int $n): string
    {
        return self::isSqlite()
            ? "datetime('now', '-{$n} days')"
            : "(NOW() - INTERVAL {$n} DAY)";
    }
}
