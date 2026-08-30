<?php
declare(strict_types=1);

namespace App\Core;

abstract class Controller
{
    protected const VOICES = ['soprano', 'contralto', 'tenor', 'baixo'];

    protected function json(mixed $data, int $code = 200): void
    {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
    }

    /** Corpo JSON da requisição (POST/PUT). */
    protected function input(): array
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '', true);
        return is_array($data) ? $data : [];
    }

    protected function publicUser(array $u): array
    {
        return [
            'id'         => (int) $u['id'],
            'name'       => $u['name'],
            'email'      => $u['email'],
            'role'       => $u['role'],
            'voice_type' => $u['voice_type'],
        ];
    }
}
