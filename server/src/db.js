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

  -- Melodia-alvo de cada naipe em cada hino (linha de voz real)
  CREATE TABLE IF NOT EXISTS voice_lines (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    hymn_id     INTEGER NOT NULL REFERENCES hymns(id) ON DELETE CASCADE,
    voice_type  TEXT    NOT NULL,      -- 'soprano' | 'contralto' | 'tenor' | 'baixo'
    notes_text  TEXT    NOT NULL,      -- ex.: 'C4 D4 E4:2 F4' (Nota:tempos, tempo padrão 1)
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (hymn_id, voice_type)
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
  const h1 = insHymn.run('Hino da Cantata — Glória nas Alturas', 'C', 84).lastInsertRowid;
  insHymn.run('Aleluia ao Cordeiro', 'G', 72);

  // Linhas de voz de exemplo para o 1º hino (melodia simples por naipe)
  const insLine = db.prepare(
    'INSERT INTO voice_lines (hymn_id, voice_type, notes_text) VALUES (?, ?, ?)'
  );
  insLine.run(h1, 'soprano',   'C5 D5 E5 F5 G5:2 F5 E5 D5 C5:2');
  insLine.run(h1, 'contralto', 'G4 A4 G4 A4 C5:2 A4 G4 A4 G4:2');
  insLine.run(h1, 'tenor',     'E4 F4 G4 A4 C5:2 A4 G4 F4 E4:2');
  insLine.run(h1, 'baixo',     'C3 C3 G3 G3 C4:2 G3 E3 G3 C3:2');

  seedDemo();
  console.log('[db] Seed criado. Maestro: maestro@admoema.com.br / senha: admoema123');
}

// ---- Dados de demonstração (para o painel não nascer vazio) -----------------
function seedDemo() {
  const pass = bcrypt.hashSync('coral123', 10);
  const rand = (a, b) => a + Math.random() * (b - a);
  // centro de timbre por naipe (Hz) para gráficos coerentes
  const CENTER = { soprano: 523, contralto: 349, tenor: 262, baixo: 165 };

  // nome, email, naipe, nº ensaios, afinação média, desvio médio, nº acessos
  const demo = [
    ['Ana Beatriz Lima', 'ana.lima@admoema.org', 'soprano', 24, 94, 6, 18],
    ['Mariana Souza', 'mariana.souza@admoema.org', 'soprano', 17, 88, 11, 12],
    ['Priscila Andrade', 'priscila.a@admoema.org', 'contralto', 21, 91, 8, 15],
    ['Débora Nogueira', 'debora.n@admoema.org', 'contralto', 9, 79, 19, 7],
    ['Lucas Ferreira', 'lucas.f@admoema.org', 'tenor', 19, 85, 13, 14],
    ['Tiago Mendes', 'tiago.m@admoema.org', 'tenor', 6, 72, 24, 5],
    ['Rafael Carvalho', 'rafael.c@admoema.org', 'baixo', 20, 90, 9, 16],
    ['Josué Ribeiro', 'josue.r@admoema.org', 'baixo', 11, 83, 15, 9],
  ];

  const insUser = db.prepare(
    `INSERT INTO users (name, email, password_hash, role, voice_type) VALUES (?, ?, ?, 'coralista', ?)`
  );
  const insSess = db.prepare(
    `INSERT INTO practice_sessions
       (user_id, hymn_id, voice_type, duration_sec, accuracy_pct, avg_cents_off, median_freq, low_freq, high_freq, created_at)
     VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))`
  );
  const insLog = db.prepare(
    `INSERT INTO access_logs (user_id, action, created_at) VALUES (?, ?, datetime('now', ?, ?))`
  );

  for (const [name, email, voice, sessoes, acc, cents, acessos] of demo) {
    const uid = insUser.run(name, email, pass, voice).lastInsertRowid;
    const center = CENTER[voice];
    for (let i = 0; i < sessoes; i++) {
      const a = Math.max(40, Math.min(100, Math.round(acc + rand(-8, 8))));
      const c = Math.max(2, Math.round(cents + rand(-5, 6)));
      const dayOff = `-${Math.round(rand(0, 25))} days`;
      insSess.run(uid, voice, Math.round(rand(35, 90)), a, c,
        Math.round(center + rand(-12, 12)), Math.round(center * 0.8), Math.round(center * 1.3), dayOff);
    }
    for (let i = 0; i < acessos; i++) {
      insLog.run(uid, i % 4 === 0 ? 'practice' : 'login', `-${i % 7} days`, `-${Math.round(rand(0, 16))} hours`);
    }
  }
}
seed();

module.exports = { db, UPLOAD_DIR, DATA_DIR };
