<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Controller;
use App\Models\AccessLog;
use App\Models\PracticeSession;
use App\Models\User;

class AdminController extends Controller
{
    public function dashboard(array $p): void
    {
        Auth::requireMaestro();
        $this->json([
            'kpis'      => PracticeSession::kpis(),
            'por_naipe' => PracticeSession::byVoice(),
        ]);
    }

    public function accessReport(array $p): void
    {
        Auth::requireMaestro();
        $period = in_array($_GET['period'] ?? 'day', ['day', 'week', 'month'], true)
            ? $_GET['period'] : 'day';
        $this->json([
            'period'  => $period,
            'buckets' => AccessLog::buckets($period),
            'ranking' => AccessLog::ranking(),
        ]);
    }

    public function voiceReport(array $p): void
    {
        Auth::requireMaestro();
        $this->json([
            'por_naipe'  => PracticeSession::byVoice(),
            'coralistas' => PracticeSession::byCoralista(),
        ]);
    }

    public function coralistas(array $p): void
    {
        Auth::requireMaestro();
        $this->json(['coralistas' => User::coralistas()]);
    }

    public function storeCoralista(array $p): void
    {
        Auth::requireMaestro();
        $in = $this->input();
        $name = trim($in['name'] ?? '');
        $email = trim($in['email'] ?? '');
        $password = (string) ($in['password'] ?? '');
        $voice = $in['voice_type'] ?? null;

        if ($name === '' || $email === '' || $password === '') {
            $this->json(['error' => 'Dados incompletos.'], 400); return;
        }
        if ($voice !== null && $voice !== '' && !in_array($voice, self::VOICES, true)) {
            $this->json(['error' => 'Naipe inválido.'], 400); return;
        }
        if (User::findByEmail($email)) {
            $this->json(['error' => 'E-mail já cadastrado.'], 409); return;
        }
        $id = User::create($name, $email, password_hash($password, PASSWORD_BCRYPT), 'coralista', $voice ?: null);
        $this->json(['id' => $id], 201);
    }
}
