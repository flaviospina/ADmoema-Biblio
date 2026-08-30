<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Controller;
use App\Models\AccessLog;
use App\Models\User;

class AuthController extends Controller
{
    public function register(array $p): void
    {
        $in = $this->input();
        $name = trim($in['name'] ?? '');
        $email = trim($in['email'] ?? '');
        $password = (string) ($in['password'] ?? '');
        $voice = $in['voice_type'] ?? null;

        if ($name === '' || $email === '' || $password === '') {
            $this->json(['error' => 'Nome, e-mail e senha são obrigatórios.'], 400); return;
        }
        if ($voice !== null && $voice !== '' && !in_array($voice, self::VOICES, true)) {
            $this->json(['error' => 'Naipe inválido.'], 400); return;
        }
        if (User::findByEmail($email)) {
            $this->json(['error' => 'E-mail já cadastrado.'], 409); return;
        }

        $id = User::create($name, $email, password_hash($password, PASSWORD_BCRYPT), 'coralista', $voice ?: null);
        $user = User::find($id);
        Auth::login($user);
        AccessLog::log($id, 'register');
        $this->json(['user' => $this->publicUser($user)], 201);
    }

    public function login(array $p): void
    {
        $in = $this->input();
        $email = trim($in['email'] ?? '');
        $password = (string) ($in['password'] ?? '');
        if ($email === '' || $password === '') {
            $this->json(['error' => 'Informe e-mail e senha.'], 400); return;
        }
        $user = User::findByEmail($email);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            $this->json(['error' => 'Credenciais inválidas.'], 401); return;
        }
        Auth::login($user);
        AccessLog::log((int) $user['id'], 'login');
        $this->json(['user' => $this->publicUser($user)]);
    }

    public function logout(array $p): void
    {
        Auth::logout();
        $this->json(['ok' => true]);
    }

    public function me(array $p): void
    {
        $u = Auth::requireAuth();
        $this->json(['user' => $this->publicUser($u)]);
    }
}
