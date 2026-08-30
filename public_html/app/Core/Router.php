<?php
declare(strict_types=1);

namespace App\Core;

class Router
{
    /** @var array<int, array{0:string,1:string,2:array}> */
    private array $routes = [];

    public function add(string $method, string $pattern, array $handler): void
    {
        $regex = '#^' . preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', $pattern) . '$#';
        $this->routes[] = [$method, $regex, $handler];
    }

    public function dispatch(string $method, string $path): void
    {
        foreach ($this->routes as [$m, $regex, $handler]) {
            if ($m !== $method) continue;
            if (preg_match($regex, $path, $match)) {
                $params = array_filter($match, 'is_string', ARRAY_FILTER_USE_KEY);
                [$class, $fn] = $handler;
                (new $class())->$fn($params);
                return;
            }
        }

        if (str_starts_with($path, '/api/')) {
            http_response_code(404);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'Rota não encontrada.']);
            return;
        }
        // Qualquer outra página cai no shell do app (o JS decide o que mostrar)
        (new \App\Controllers\PageController())->shell([]);
    }
}
