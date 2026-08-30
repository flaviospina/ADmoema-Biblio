<?php
declare(strict_types=1);

namespace App\Core;

use App\Models\User;

/**
 * Autenticação por sessão PHP (cookie HttpOnly + SameSite=Lax).
 * Senhas sempre com password_hash()/password_verify() (bcrypt).
 */
class Auth
{
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) return;
        session_name('CANTATA_SESS');
        session_set_cookie_params([
            'httponly' => true,
            'samesite' => 'Lax',
            'path'     => '/',
            'secure'   => !empty($_SERVER['HTTPS']),
        ]);
        session_start();
    }

    public static function login(array $user): void
    {
        self::start();
        session_regenerate_id(true);
        $_SESSION['uid'] = (int) $user['id'];
    }

    public static function logout(): void
    {
        self::start();
        $_SESSION = [];
        session_destroy();
    }

    public static function user(): ?array
    {
        self::start();
        if (empty($_SESSION['uid'])) return null;
        return User::find((int) $_SESSION['uid']);
    }

    public static function requireAuth(): array
    {
        $u = self::user();
        if (!$u) {
            http_response_code(401);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'Sessão expirada ou inválida.']);
            exit;
        }
        return $u;
    }

    public static function requireMaestro(): array
    {
        $u = self::requireAuth();
        if ($u['role'] !== 'maestro') {
            http_response_code(403);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'Acesso restrito ao maestro.']);
            exit;
        }
        return $u;
    }
}
