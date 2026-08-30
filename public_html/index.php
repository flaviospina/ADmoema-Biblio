<?php
declare(strict_types=1);

/**
 * Coral ADMoema — front controller.
 * Todas as requisições passam por aqui (ver .htaccess).
 *
 * IMPORTANTE: este arquivo evita sintaxe do PHP 8 de propósito, para conseguir
 * exibir a mensagem abaixo caso a hospedagem ainda esteja no PHP 7.
 */

if (PHP_VERSION_ID < 80000) {
    http_response_code(500);
    header('Content-Type: text/html; charset=utf-8');
    echo '<div style="font-family:sans-serif;max-width:640px;margin:60px auto;padding:24px;'
        . 'border:1px solid #e0d9c8;border-radius:12px;background:#fffefb;color:#2e3327">'
        . '<h2>⚠️ Versão do PHP incompatível</h2>'
        . '<p>Este sistema precisa de <b>PHP 8.0 ou superior</b> — o servidor está usando <b>PHP '
        . htmlspecialchars(PHP_VERSION) . '</b>.</p>'
        . '<p><b>Como resolver na HostGator:</b> cPanel → <b>MultiPHP Manager</b> → '
        . 'selecione o domínio/pasta e escolha <b>PHP 8.1</b> (ou superior) → Apply.</p></div>';
    exit;
}

define('BASE_DIR', __DIR__);
define('UPLOAD_DIR', __DIR__ . '/uploads');

// Detecta automaticamente a subpasta onde o sistema está instalado.
// Raiz do domínio -> ''  ·  admoema.com.br/coral -> '/coral'
$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/'));
define('BASE_URL', rtrim($scriptDir, '/'));

// Servidor embutido do PHP (dev): entrega arquivos estáticos existentes.
if (PHP_SAPI === 'cli-server') {
    $f = __DIR__ . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if ($f !== __DIR__ . '/' && is_file($f)) {
        return false;
    }
}

$configFile = file_exists(__DIR__ . '/config.php') ? __DIR__ . '/config.php' : __DIR__ . '/config.example.php';
$config = require $configFile;

// Autoloader PSR-4 simplificado: App\ -> app/  (sintaxe compatível com PHP 7 de propósito)
spl_autoload_register(function ($class) {
    if (strncmp($class, 'App\\', 4) !== 0) return;
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
$r->add('POST', '/api/auth/change-password', [AuthController::class, 'changePassword']);
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
// Remove o prefixo da subpasta (ex.: '/coral') antes de casar as rotas
if (BASE_URL !== '' && strncmp($path, BASE_URL, strlen(BASE_URL)) === 0) {
    $path = substr($path, strlen(BASE_URL));
}
// Acesso direto a index.php também cai na raiz do app
if ($path === '/index.php' || $path === 'index.php') $path = '/';
$path = rtrim($path, '/') ?: '/';
$r->dispatch($_SERVER['REQUEST_METHOD'], $path);
