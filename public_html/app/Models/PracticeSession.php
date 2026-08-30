<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;

class PracticeSession
{
    public static function create(array $d): int
    {
        $st = Database::pdo()->prepare(
            'INSERT INTO practice_sessions
               (user_id, hymn_id, voice_type, duration_sec, accuracy_pct, avg_cents_off,
                median_freq, low_freq, high_freq, details)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $st->execute([
            $d['user_id'], $d['hymn_id'], $d['voice_type'], $d['duration_sec'],
            $d['accuracy_pct'], $d['avg_cents_off'], $d['median_freq'],
            $d['low_freq'], $d['high_freq'], $d['details'],
        ]);
        return (int) Database::pdo()->lastInsertId();
    }

    public static function mine(int $userId): array
    {
        $st = Database::pdo()->prepare(
            'SELECT s.*, h.title AS hymn_title FROM practice_sessions s
             LEFT JOIN hymns h ON h.id = s.hymn_id
             WHERE s.user_id = ? ORDER BY s.created_at ASC'
        );
        $st->execute([$userId]);
        return $st->fetchAll();
    }

    // ---------- Relatórios do maestro ----------

    public static function kpis(): array
    {
        $pdo = Database::pdo();
        $ago7 = Database::daysAgo(7);
        return [
            'total_coralistas' => (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role='coralista'")->fetchColumn(),
            'total_sessoes'    => (int) $pdo->query('SELECT COUNT(*) FROM practice_sessions')->fetchColumn(),
            'ativos_7d'        => (int) $pdo->query("SELECT COUNT(DISTINCT user_id) FROM access_logs WHERE created_at >= {$ago7}")->fetchColumn(),
            'accuracy_media'   => round((float) $pdo->query('SELECT COALESCE(AVG(accuracy_pct),0) FROM practice_sessions')->fetchColumn(), 1),
            'minutos_totais'   => (int) round(((float) $pdo->query('SELECT COALESCE(SUM(duration_sec),0) FROM practice_sessions')->fetchColumn()) / 60),
        ];
    }

    public static function byVoice(): array
    {
        return Database::pdo()->query(
            'SELECT voice_type, COUNT(*) AS sessoes, COUNT(DISTINCT user_id) AS coralistas,
                    ROUND(AVG(accuracy_pct),1) AS accuracy, ROUND(AVG(avg_cents_off),1) AS cents
             FROM practice_sessions WHERE voice_type IS NOT NULL
             GROUP BY voice_type ORDER BY voice_type'
        )->fetchAll();
    }

    public static function byCoralista(): array
    {
        return Database::pdo()->query(
            "SELECT u.id, u.name, u.voice_type,
                    COUNT(s.id) AS sessoes,
                    ROUND(AVG(s.accuracy_pct),1) AS accuracy,
                    ROUND(AVG(s.avg_cents_off),1) AS cents,
                    MAX(s.created_at) AS ultimo_ensaio
             FROM users u LEFT JOIN practice_sessions s ON s.user_id = u.id
             WHERE u.role = 'coralista'
             GROUP BY u.id, u.name, u.voice_type
             ORDER BY u.voice_type, accuracy DESC"
        )->fetchAll();
    }
}
