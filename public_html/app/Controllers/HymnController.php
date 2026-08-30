<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Controller;
use App\Models\Hymn;
use App\Models\VoiceLine;

class HymnController extends Controller
{
    public function index(array $p): void
    {
        Auth::requireAuth();
        $this->json(['hymns' => Hymn::all()]);
    }

    public function store(array $p): void
    {
        Auth::requireMaestro();
        $in = $this->input();
        $title = trim($in['title'] ?? '');
        if ($title === '') { $this->json(['error' => 'Título obrigatório.'], 400); return; }
        $bpm = isset($in['bpm']) && $in['bpm'] !== '' ? (int) $in['bpm'] : null;
        $id = Hymn::create($title, $in['music_key'] ?? null, $bpm);
        $this->json(['hymn' => Hymn::find($id)], 201);
    }

    public function voiceLines(array $p): void
    {
        Auth::requireAuth();
        $this->json(['voice_lines' => VoiceLine::forHymn((int) $p['id'])]);
    }

    public function saveVoiceLine(array $p): void
    {
        Auth::requireMaestro();
        $in = $this->input();
        $voice = $in['voice_type'] ?? '';
        $notes = trim($in['notes_text'] ?? '');
        if (!in_array($voice, self::VOICES, true)) { $this->json(['error' => 'Naipe inválido.'], 400); return; }
        if ($notes === '') { $this->json(['error' => 'Informe as notas.'], 400); return; }
        if (!Hymn::find((int) $p['id'])) { $this->json(['error' => 'Hino não encontrado.'], 404); return; }
        VoiceLine::upsert((int) $p['id'], $voice, $notes);
        $this->json(['ok' => true]);
    }
}
