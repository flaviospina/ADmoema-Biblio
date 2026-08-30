<?php
// Cria o banco SQLite de desenvolvimento e o config.php local apontando para ele.
// Uso: php dev/make_dev_db.php  &&  php -S localhost:8080 -t public_html public_html/index.php
$dbPath = __DIR__ . '/dev.sqlite';
@unlink($dbPath);
$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec(file_get_contents(__DIR__ . '/sqlite_schema.sql'));

$config = "<?php\n// Config de DESENVOLVIMENTO (gerado por dev/make_dev_db.php) — não subir para a HostGator\nreturn ['db' => ['driver' => 'sqlite', 'path' => " . var_export($dbPath, true) . "]];\n";
file_put_contents(__DIR__ . '/../public_html/config.php', $config);
echo "✔ dev.sqlite criado e public_html/config.php apontando para ele\n";
