<?php
/**
 * Configuração do Coral ADMoema.
 *
 * NA HOSTGATOR: copie este arquivo para "config.php" e preencha com os dados
 * do banco criado no cPanel (MySQL Databases). O usuário e o banco ganham o
 * prefixo da sua conta, ex.: "usuario_cantata".
 */
return [
    'db' => [
        'driver'  => 'mysql',          // não altere na HostGator
        'host'    => 'localhost',      // na HostGator normalmente é localhost
        'name'    => 'SEUUSUARIO_cantata',
        'user'    => 'SEUUSUARIO_cantata',
        'pass'    => 'SENHA_DO_BANCO',
        'charset' => 'utf8mb4',
    ],
];
