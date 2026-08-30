<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Controller;
use App\Models\Material;

class MaterialController extends Controller
{
    public function index(array $p): void
    {
        Auth::requireAuth();
        $voice = $_GET['voice_type'] ?? null;
        $hymn = isset($_GET['hymn_id']) ? (int) $_GET['hymn_id'] : null;
        $this->json(['materials' => Material::query($voice ?: null, $hymn ?: null)]);
    }

    /** Upload multipart: campos em $_POST e arquivo opcional em $_FILES['file']. */
    public function store(array $p): void
    {
        $u = Auth::requireMaestro();
        $title = trim($_POST['title'] ?? '');
        $type = $_POST['type'] ?? '';
        $voice = $_POST['voice_type'] ?? '';
        if ($title === '' || $type === '') {
            $this->json(['error' => 'Título e tipo são obrigatórios.'], 400); return;
        }
        if ($voice !== '' && !in_array($voice, self::VOICES, true)) {
            $this->json(['error' => 'Naipe inválido.'], 400); return;
        }

        $fileName = null;
        if (!empty($_FILES['file']['tmp_name']) && is_uploaded_file($_FILES['file']['tmp_name'])) {
            if ($_FILES['file']['size'] > 25 * 1024 * 1024) {
                $this->json(['error' => 'Arquivo acima de 25 MB.'], 400); return;
            }
            $safe = preg_replace('/[^a-zA-Z0-9._-]/', '_', $_FILES['file']['name']);
            $fileName = time() . '_' . $safe;
            if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
            if (!move_uploaded_file($_FILES['file']['tmp_name'], UPLOAD_DIR . '/' . $fileName)) {
                $this->json(['error' => 'Falha ao salvar o arquivo.'], 500); return;
            }
        }

        $id = Material::create([
            'hymn_id'    => !empty($_POST['hymn_id']) ? (int) $_POST['hymn_id'] : null,
            'title'      => $title,
            'type'       => $type,
            'voice_type' => $voice ?: null,
            'content'    => $_POST['content'] ?? null,
            'file_name'  => $fileName,
            'created_by' => (int) $u['id'],
        ]);
        $this->json(['material' => Material::find($id)], 201);
    }

    /** Entrega o arquivo de um material (a pasta uploads é bloqueada no .htaccess). */
    public function file(array $p): void
    {
        Auth::requireAuth();
        $m = Material::find((int) $p['id']);
        if (!$m || empty($m['file_name'])) {
            $this->json(['error' => 'Arquivo não encontrado.'], 404); return;
        }
        $path = UPLOAD_DIR . '/' . basename($m['file_name']); // basename evita path traversal
        if (!is_file($path)) { $this->json(['error' => 'Arquivo não encontrado.'], 404); return; }

        $mime = function_exists('mime_content_type') ? (mime_content_type($path) ?: 'application/octet-stream') : 'application/octet-stream';
        header('Content-Type: ' . $mime);
        header('Content-Length: ' . (string) filesize($path));
        header('Content-Disposition: inline; filename="' . basename($m['file_name']) . '"');
        readfile($path);
    }
}
