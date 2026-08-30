<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;

class AccessLog
{
    public static function log(int $userId, string $action = 'login'): void
    {
        $st = Database::pdo()->prepare('INSERT INTO access_logs (user_id, action) VALUES (?, ?)');
        $st->execute([$userId, $action]);
    }

    /** Acessos agrupados por dia/semana/mês (últimos 30 grupos). */
    public static function buckets(string $period): array
    {
        $bucket = Database::bucket($period);
        $rows = Database::pdo()->query(
            "SELECT {$bucket} AS bucket, COUNT(*) AS acessos, COUNT(DISTINCT user_id) AS usuarios
             FROM access_logs WHERE action IN ('login','practice')
             GROUP BY bucket ORDER BY bucket DESC LIMIT 30"
        )->fetchAll();
        return array_reverse($rows);
    }

    /** Ranking de dedicação dos coralistas. */
    public static function ranking(): array
    {
        return Database::pdo()->query(
            "SELECT u.id, u.name, u.voice_type,
                    COUNT(*) AS acessos, MAX(a.created_at) AS ultimo_acesso
             FROM access_logs a JOIN users u ON u.id = a.user_id
             WHERE u.role = 'coralista'
             GROUP BY u.id, u.name, u.voice_type
             ORDER BY acessos DESC"
        )->fetchAll();
    }
}
