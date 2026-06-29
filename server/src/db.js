'use strict';

const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'cantata.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'coralista', -- 'coralista' | 'maestro'
    voice_type    TEXT,                                 -- 'soprano' | 'contralto' | 'tenor' | 'baixo'
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS access_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action     TEXT    NOT NULL DEFAULT 'login',
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS hymns (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT    NOT NULL,
    music_key    TEXT,                 -- tonalidade, ex.: 'C', 'G'
    bpm          INTEGER,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS materials (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    hymn_id     INTEGER REFERENCES hymns(id) ON DELETE SET NULL,
    title       TEXT    NOT NULL,
    type        TEXT    NOT NULL,      -- 'cifra' | 'letra' | 'audio' | 'partitura'
    voice_type  TEXT,                  -- naipe alvo do material (para áudios separados)
    content     TEXT,                  -- texto (letra/cifra)
    file_name   TEXT,                  -- arquivo armazenado (áudio/partitura)
    created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Resultado agregado de cada sessão de ensaio (treino de voz)
  CREATE TABLE IF NOT EXISTS practice_sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hymn_id         INTEGER REFERENCES hymns(id) ON DELETE SET NULL,
    voice_type      TEXT,
    duration_sec    INTEGER NOT NULL DEFAULT 0,
    accuracy_pct    REAL    NOT NULL DEFAULT 0,   -- % do tempo dentro do tom
    avg_cents_off   REAL    NOT NULL DEFAULT 0,   -- desvio médio absoluto em cents
    median_freq     REAL,                          -- timbre/centro de frequência (Hz)
    low_freq        REAL,                          -- nota mais grave detectada (Hz)
    high_freq       REAL,                          -- nota mais aguda detectada (Hz)
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// ---- Seed: conta inicial do maestro -----------------------------------------
function seed() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (count > 0) return;

  const maestroHash = bcrypt.hashSync('admoema123', 10);
  db.prepare(
    `INSERT INTO users (name, email, password_hash, role, voice_type)
     VALUES (?, ?, ?, 'maestro', NULL)`
  ).run('Maestro ADMoema', 'maestro@admoema.com.br', maestroHash);

  // Hinos de exemplo
  const insHymn = db.prepare('INSERT INTO hymns (title, music_key, bpm) VALUES (?, ?, ?)');
  insHymn.run('Hino da Cantata — Glória nas Alturas', 'C', 84);
  insHymn.run('Aleluia ao Cordeiro', 'G', 72);

  console.log('[db] Seed criado. Maestro: maestro@admoema.com.br / senha: admoema123');
}
seed();

module.exports = { db, UPLOAD_DIR, DATA_DIR };
