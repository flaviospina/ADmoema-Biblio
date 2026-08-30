<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;

class VoiceLine
{
    public static function forHymn(int $hymnId): array
    {
        $st = Database::pdo()->prepare(
            'SELECT id, voice_type, notes_text, updated_at FROM voice_lines WHERE hymn_id = ?'
        );
        $st->execute([$hymnId]);
        return $st->fetchAll();
    }

    /** Cria ou atualiza a linha de um naipe (portável entre MySQL e SQLite). */
    public static function upsert(int $hymnId, string $voice, string $notes): void
    {
        $pdo = Database::pdo();
        $st = $pdo->prepare(
            'UPDATE voice_lines SET notes_text = ?, updated_at = CURRENT_TIMESTAMP
             WHERE hymn_id = ? AND voice_type = ?'
        );
        $st->execute([trim($notes), $hymnId, $voice]);
        if ($st->rowCount() === 0) {
            // Pode ser "nenhuma alteração" ou "não existe": garante com INSERT tolerante
            $exists = $pdo->prepare('SELECT id FROM voice_lines WHERE hymn_id = ? AND voice_type = ?');
            $exists->execute([$hymnId, $voice]);
            if (!$exists->fetch()) {
                $ins = $pdo->prepare(
                    'INSERT INTO voice_lines (hymn_id, voice_type, notes_text) VALUES (?, ?, ?)'
                );
                $ins->execute([$hymnId, $voice, trim($notes)]);
            }
        }
    }
}
