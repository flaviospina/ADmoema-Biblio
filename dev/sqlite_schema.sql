-- Esquema SQLite equivalente ao database/schema.sql — SOMENTE para testes locais
-- (na HostGator use o MySQL). Rode: php dev/make_dev_db.php

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'coralista',
  voice_type TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL DEFAULT 'login',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE hymns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  music_key TEXT,
  bpm INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE voice_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hymn_id INTEGER NOT NULL REFERENCES hymns(id) ON DELETE CASCADE,
  voice_type TEXT NOT NULL,
  notes_text TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (hymn_id, voice_type)
);
CREATE TABLE materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hymn_id INTEGER REFERENCES hymns(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  voice_type TEXT,
  content TEXT,
  file_name TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE practice_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hymn_id INTEGER REFERENCES hymns(id) ON DELETE SET NULL,
  voice_type TEXT,
  duration_sec INTEGER NOT NULL DEFAULT 0,
  accuracy_pct REAL NOT NULL DEFAULT 0,
  avg_cents_off REAL NOT NULL DEFAULT 0,
  median_freq REAL,
  low_freq REAL,
  high_freq REAL,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
