<?php
// URLs absolutas para as meta tags de compartilhamento (WhatsApp/Facebook exigem URL completa)
$scheme  = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host    = $_SERVER['HTTP_HOST'] ?? 'admoema.com.br';
$origin  = $scheme . '://' . $host;
$siteUrl = $origin . BASE_URL . '/';
$ogImage = $origin . BASE_URL . '/assets/img/og-cover.png';

$title = 'Coral ADMoema — Cantata · Ensaio Inteligente';
$desc  = 'Plataforma do Coral da Assembleia de Deus — Ministério Belém, Setor 124 Moema (ADMoema): '
       . 'ensaie sua voz em casa com afinação em tempo real por naipe '
       . '(soprano, contralto, tenor e baixo), acompanhe sua evolução e acesse os hinos da cantata.';
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><?= $title ?></title>

  <!-- SEO -->
  <meta name="description" content="<?= $desc ?>" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="<?= $siteUrl ?>" />
  <meta name="theme-color" content="#4f7a52" />

  <!-- Open Graph (WhatsApp, Facebook, Instagram, LinkedIn, Telegram) -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Coral ADMoema" />
  <meta property="og:title" content="<?= $title ?>" />
  <meta property="og:description" content="<?= $desc ?>" />
  <meta property="og:url" content="<?= $siteUrl ?>" />
  <meta property="og:image" content="<?= $ogImage ?>" />
  <meta property="og:image:secure_url" content="<?= $ogImage ?>" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Coral ADMoema — ensaio de voz com afinação em tempo real" />
  <meta property="og:locale" content="pt_BR" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="<?= $title ?>" />
  <meta name="twitter:description" content="<?= $desc ?>" />
  <meta name="twitter:image" content="<?= $ogImage ?>" />

  <!-- Ícones -->
  <link rel="icon" type="image/png" sizes="32x32" href="<?= BASE_URL ?>/assets/img/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="192x192" href="<?= BASE_URL ?>/assets/img/icon-192.png" />
  <link rel="apple-touch-icon" href="<?= BASE_URL ?>/assets/img/apple-touch-icon.png" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="<?= BASE_URL ?>/assets/css/styles.css" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <script>window.APP_BASE = '<?= BASE_URL ?>';</script>
</head>
<body>
  <div id="app"></div>

  <script src="<?= BASE_URL ?>/assets/js/api.js"></script>
  <script src="<?= BASE_URL ?>/assets/js/pitch.js"></script>
  <script src="<?= BASE_URL ?>/assets/js/melody.js"></script>
  <script src="<?= BASE_URL ?>/assets/js/trainer.js"></script>
  <script src="<?= BASE_URL ?>/assets/js/app.js"></script>
</body>
</html>
