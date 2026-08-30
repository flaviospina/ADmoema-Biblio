<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;

class PageController extends Controller
{
    /** Serve o shell HTML do aplicativo (o JS renderiza a tela pela URL). */
    public function shell(array $p): void
    {
        header('Content-Type: text/html; charset=utf-8');
        require BASE_DIR . '/app/Views/shell.php';
    }
}
