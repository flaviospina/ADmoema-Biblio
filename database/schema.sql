-- ============================================================================
--  Coral ADMoema — banco MySQL (HostGator)
--  Importe este arquivo pelo phpMyAdmin no banco criado no cPanel.
-- ============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('coralista','maestro') NOT NULL DEFAULT 'coralista',
  voice_type    ENUM('soprano','contralto','tenor','baixo') DEFAULT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS access_logs (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  action     VARCHAR(20) NOT NULL DEFAULT 'login',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_logs_user (user_id),
  KEY idx_logs_created (created_at),
  CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hymns (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title      VARCHAR(180) NOT NULL,
  music_key  VARCHAR(6)  DEFAULT NULL,
  bpm        SMALLINT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Melodia-alvo de cada naipe em cada hino
CREATE TABLE IF NOT EXISTS voice_lines (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  hymn_id    INT UNSIGNED NOT NULL,
  voice_type ENUM('soprano','contralto','tenor','baixo') NOT NULL,
  notes_text TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_line (hymn_id, voice_type),
  CONSTRAINT fk_lines_hymn FOREIGN KEY (hymn_id) REFERENCES hymns(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS materials (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  hymn_id    INT UNSIGNED DEFAULT NULL,
  title      VARCHAR(180) NOT NULL,
  type       ENUM('cifra','letra','audio','partitura') NOT NULL,
  voice_type ENUM('soprano','contralto','tenor','baixo') DEFAULT NULL,
  content    MEDIUMTEXT DEFAULT NULL,
  file_name  VARCHAR(255) DEFAULT NULL,
  created_by INT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_mat_hymn (hymn_id),
  CONSTRAINT fk_mat_hymn FOREIGN KEY (hymn_id) REFERENCES hymns(id) ON DELETE SET NULL,
  CONSTRAINT fk_mat_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Resultado agregado de cada sessão de ensaio (details = JSON nota a nota)
CREATE TABLE IF NOT EXISTS practice_sessions (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  hymn_id       INT UNSIGNED DEFAULT NULL,
  voice_type    ENUM('soprano','contralto','tenor','baixo') DEFAULT NULL,
  duration_sec  INT UNSIGNED NOT NULL DEFAULT 0,
  accuracy_pct  DECIMAL(5,1) NOT NULL DEFAULT 0,
  avg_cents_off DECIMAL(6,1) NOT NULL DEFAULT 0,
  median_freq   DECIMAL(7,2) DEFAULT NULL,
  low_freq      DECIMAL(7,2) DEFAULT NULL,
  high_freq     DECIMAL(7,2) DEFAULT NULL,
  details       TEXT DEFAULT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sess_user (user_id),
  KEY idx_sess_created (created_at),
  CONSTRAINT fk_sess_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_sess_hymn FOREIGN KEY (hymn_id) REFERENCES hymns(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
--  Dados iniciais
-- ============================================================================

-- Maestro: maestro@admoema.com.br / senha admoema123 (bcrypt) — TROQUE após o 1º acesso
INSERT INTO users (name, email, password_hash, role) VALUES
('Maestro ADMoema', 'maestro@admoema.com.br',
 '$2y$12$RCGEpCJiZgtpS2Ap4Y9qfuiBxvKRthv2ydxDEDG6nEaoobj68WDWO', 'maestro');

INSERT INTO hymns (title, music_key, bpm) VALUES
('Hino da Cantata — Glória nas Alturas', 'C', 84),
('Aleluia ao Cordeiro', 'G', 72);

INSERT INTO voice_lines (hymn_id, voice_type, notes_text) VALUES
(1, 'soprano',   'C5 D5 E5 F5 G5:2 F5 E5 D5 C5:2'),
(1, 'contralto', 'G4 A4 G4 A4 C5:2 A4 G4 A4 G4:2'),
(1, 'tenor',     'E4 F4 G4 A4 C5:2 A4 G4 F4 E4:2'),
(1, 'baixo',     'C3 C3 G3 G3 C4:2 G3 E3 G3 C3:2');
