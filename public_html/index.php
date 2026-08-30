<?php
declare(strict_types=1);

/**
 * Coral ADMoema — front controller.
 * Todas as requisições passam por aqui (ver .htaccess).
 */

define('BASE_DIR', __DIR__);
define('UPLOAD_DIR', __DIR__ . '/uploads');

// Servidor embutido do PHP (dev): entrega arquivos estáticos existentes.
if (PHP_SAPI === 'cli-server') {
    $f = __DIR__ . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if ($f !== __DIR__ . '/' && is_file($f)) {
        return false;
    }
}

$configFile = file_exists(__DIR__ . '/config.php') ? __DIR__ . '/config.php' : __DIR__ . '/config.example.php';
$config = require $configFile;

// Autoloader PSR-4 simplificado: App\ -> app/
spl_autoload_register(function (string $class): void {
    if (!str_starts_with($class, 'App\\')) return;
    $file = BASE_DIR . '/app/' . str_replace('\\', '/', substr($class, 4)) . '.php';
    if (file_exists($file)) require $file;
});

use App\Core\Database;
use App\Core\Router;
use App\Controllers\AuthController;
use App\Controllers\HymnController;
use App\Controllers\MaterialController;
use App\Controllers\SessionController;
use App\Controllers\AdminController;
use App\Controllers\PageController;

Database::init($config['db']);

$r = new Router();

// ---------- API ----------
$r->add('POST', '/api/auth/register', [AuthController::class, 'register']);
$r->add('POST', '/api/auth/login',    [AuthController::class, 'login']);
$r->add('POST', '/api/auth/logout',   [AuthController::class, 'logout']);
$r->add('GET',  '/api/me',            [AuthController::class, 'me']);

$r->add('GET',  '/api/hymns',                    [HymnController::class, 'index']);
$r->add('POST', '/api/hymns',                    [HymnController::class, 'store']);
$r->add('GET',  '/api/hymns/{id}/voice-lines',   [HymnController::class, 'voiceLines']);
$r->add('PUT',  '/api/hymns/{id}/voice-lines',   [HymnController::class, 'saveVoiceLine']);

$r->add('GET',  '/api/materials',            [MaterialController::class, 'index']);
$r->add('POST', '/api/materials',            [MaterialController::class, 'store']);
$r->add('GET',  '/api/materials/{id}/file',  [MaterialController::class, 'file']);

$r->add('POST', '/api/sessions',      [SessionController::class, 'store']);
$r->add('GET',  '/api/sessions/mine', [SessionController::class, 'mine']);

$r->add('GET',  '/api/admin/dashboard',      [AdminController::class, 'dashboard']);
$r->add('GET',  '/api/admin/access-report',  [AdminController::class, 'accessReport']);
$r->add('GET',  '/api/admin/voice-report',   [AdminController::class, 'voiceReport']);
$r->add('GET',  '/api/admin/coralistas',     [AdminController::class, 'coralistas']);
$r->add('POST', '/api/admin/coralistas',     [AdminController::class, 'storeCoralista']);

// ---------- Páginas (URLs amigáveis — o shell do app é servido e o JS renderiza) ----------
foreach ([
    '/', '/entrar', '/inicio', '/ensaiar', '/evolucao', '/materiais',
    '/painel', '/painel/acessos', '/painel/naipes', '/painel/hinos',
    '/painel/coralistas', '/painel/materiais',
] as $page) {
    $r->add('GET', $page, [PageController::class, 'shell']);
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
$path = rtrim($path, '/') ?: '/';
$r->dispatch($_SERVER['REQUEST_METHOD'], $path);
