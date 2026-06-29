'use strict';

const path = require('node:path');
const express = require('express');
const multer = require('multer');

const { db, UPLOAD_DIR } = require('./db');
const {
  hashPassword, verifyPassword, signToken, requireAuth, requireMaestro,
} = require('./auth');

const app = express();
app.use(express.json({ limit: '2mb' }));

const VOICE_TYPES = ['soprano', 'contralto', 'tenor', 'baixo'];

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}_${safe}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
});

function logAccess(userId, action = 'login') {
  db.prepare('INSERT INTO access_logs (user_id, action) VALUES (?, ?)').run(userId, action);
}

// ============================ AUTENTICAÇÃO ===================================

// Registro de coralista (auto-cadastro)
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, voice_type } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }
  if (voice_type && !VOICE_TYPES.includes(voice_type)) {
    return res.status(400).json({ error: 'Naipe inválido.' });
  }
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (exists) return res.status(409).json({ error: 'E-mail já cadastrado.' });

  const info = db.prepare(
    `INSERT INTO users (name, email, password_hash, role, voice_type)
     VALUES (?, ?, ?, 'coralista', ?)`
  ).run(name.trim(), email.toLowerCase().trim(), hashPassword(password), voice_type || null);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  logAccess(user.id, 'register');
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Informe e-mail e senha.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase().trim());
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }
  logAccess(user.id, 'login');
  res.json({ token: signToken(user), user: publicUser(user) });
});

app.get('/api/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.sub);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  res.json({ user: publicUser(user) });
});

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, voice_type: u.voice_type };
}

// ============================ HINOS =========================================

app.get('/api/hymns', requireAuth, (_req, res) => {
  res.json({ hymns: db.prepare('SELECT * FROM hymns ORDER BY title').all() });
});

app.post('/api/hymns', requireAuth, requireMaestro, (req, res) => {
  const { title, music_key, bpm } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Título obrigatório.' });
  const info = db.prepare('INSERT INTO hymns (title, music_key, bpm) VALUES (?, ?, ?)')
    .run(title.trim(), music_key || null, bpm ? Number(bpm) : null);
  res.status(201).json({ hymn: db.prepare('SELECT * FROM hymns WHERE id = ?').get(info.lastInsertRowid) });
});

// ============================ MATERIAIS =====================================

app.get('/api/materials', requireAuth, (req, res) => {
  const { voice_type, hymn_id } = req.query;
  let sql = `SELECT m.*, h.title AS hymn_title FROM materials m
             LEFT JOIN hymns h ON h.id = m.hymn_id WHERE 1=1`;
  const args = [];
  if (voice_type) { sql += ' AND (m.voice_type = ? OR m.voice_type IS NULL)'; args.push(voice_type); }
  if (hymn_id) { sql += ' AND m.hymn_id = ?'; args.push(Number(hymn_id)); }
  sql += ' ORDER BY m.created_at DESC';
  res.json({ materials: db.prepare(sql).all(...args) });
});

app.post('/api/materials', requireAuth, requireMaestro, upload.single('file'), (req, res) => {
  const { title, type, voice_type, hymn_id, content } = req.body || {};
  if (!title || !type) return res.status(400).json({ error: 'Título e tipo são obrigatórios.' });
  if (voice_type && !VOICE_TYPES.includes(voice_type)) {
    return res.status(400).json({ error: 'Naipe inválido.' });
  }
  const info = db.prepare(
    `INSERT INTO materials (hymn_id, title, type, voice_type, content, file_name, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    hymn_id ? Number(hymn_id) : null,
    title.trim(), type, voice_type || null,
    content || null,
    req.file ? req.file.filename : null,
    req.user.sub
  );
  res.status(201).json({ material: db.prepare('SELECT * FROM materials WHERE id = ?').get(info.lastInsertRowid) });
});

app.get('/api/materials/:id/file', requireAuth, (req, res) => {
  const m = db.prepare('SELECT file_name FROM materials WHERE id = ?').get(Number(req.params.id));
  if (!m || !m.file_name) return res.status(404).json({ error: 'Arquivo não encontrado.' });
  res.sendFile(path.join(UPLOAD_DIR, m.file_name));
});

// ============================ SESSÕES DE ENSAIO =============================

// Coralista salva o resultado de uma sessão de treino de voz
app.post('/api/sessions', requireAuth, (req, res) => {
  const {
    hymn_id, voice_type, duration_sec, accuracy_pct,
    avg_cents_off, median_freq, low_freq, high_freq,
  } = req.body || {};

  const info = db.prepare(
    `INSERT INTO practice_sessions
       (user_id, hymn_id, voice_type, duration_sec, accuracy_pct, avg_cents_off, median_freq, low_freq, high_freq)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    req.user.sub,
    hymn_id ? Number(hymn_id) : null,
    voice_type || req.user.voice_type || null,
    Math.round(duration_sec || 0),
    Number(accuracy_pct) || 0,
    Number(avg_cents_off) || 0,
    median_freq != null ? Number(median_freq) : null,
    low_freq != null ? Number(low_freq) : null,
    high_freq != null ? Number(high_freq) : null
  );
  logAccess(req.user.sub, 'practice');
  res.status(201).json({ session: db.prepare('SELECT * FROM practice_sessions WHERE id = ?').get(info.lastInsertRowid) });
});

// Histórico do próprio coralista (evolução)
app.get('/api/sessions/mine', requireAuth, (req, res) => {
  const rows = db.prepare(
    `SELECT s.*, h.title AS hymn_title FROM practice_sessions s
     LEFT JOIN hymns h ON h.id = s.hymn_id
     WHERE s.user_id = ? ORDER BY s.created_at ASC`
  ).all(req.user.sub);
  res.json({ sessions: rows });
});

// ============================ ADMIN / MAESTRO ===============================

app.get('/api/admin/dashboard', requireAuth, requireMaestro, (_req, res) => {
  const totalCoralistas = db.prepare("SELECT COUNT(*) n FROM users WHERE role='coralista'").get().n;
  const totalSessions = db.prepare('SELECT COUNT(*) n FROM practice_sessions').get().n;
  const ativos7d = db.prepare(
    `SELECT COUNT(DISTINCT user_id) n FROM access_logs
     WHERE created_at >= datetime('now','-7 days')`
  ).get().n;
  const accuracyMedia = db.prepare('SELECT ROUND(AVG(accuracy_pct),1) v FROM practice_sessions').get().v;
  const minutosTotais = db.prepare('SELECT ROUND(SUM(duration_sec)/60.0,0) v FROM practice_sessions').get().v;

  const porNaipe = db.prepare(
    `SELECT voice_type, COUNT(*) sessoes, ROUND(AVG(accuracy_pct),1) accuracy, ROUND(AVG(avg_cents_off),1) cents
     FROM practice_sessions WHERE voice_type IS NOT NULL GROUP BY voice_type`
  ).all();

  res.json({
    kpis: {
      total_coralistas: totalCoralistas,
      total_sessoes: totalSessions,
      ativos_7d: ativos7d,
      accuracy_media: accuracyMedia || 0,
      minutos_totais: minutosTotais || 0,
    },
    por_naipe: porNaipe,
  });
});

// Relatório de acessos por dia/semana/mês
app.get('/api/admin/access-report', requireAuth, requireMaestro, (req, res) => {
  const period = ['day', 'week', 'month'].includes(req.query.period) ? req.query.period : 'day';
  const fmt = period === 'day' ? '%Y-%m-%d' : period === 'week' ? '%Y-W%W' : '%Y-%m';
  const rows = db.prepare(
    `SELECT strftime('${fmt}', created_at) AS bucket, COUNT(*) AS acessos,
            COUNT(DISTINCT user_id) AS usuarios
     FROM access_logs WHERE action IN ('login','practice')
     GROUP BY bucket ORDER BY bucket DESC LIMIT 30`
  ).all();

  // Ranking de quem mais ensaia em casa
  const ranking = db.prepare(
    `SELECT u.id, u.name, u.voice_type,
            COUNT(*) AS acessos,
            MAX(a.created_at) AS ultimo_acesso
     FROM access_logs a JOIN users u ON u.id = a.user_id
     WHERE u.role = 'coralista'
     GROUP BY u.id ORDER BY acessos DESC`
  ).all();

  res.json({ period, buckets: rows.reverse(), ranking });
});

// Relatório por naipe: quem está no tom e quem precisa melhorar
app.get('/api/admin/voice-report', requireAuth, requireMaestro, (_req, res) => {
  const porNaipe = db.prepare(
    `SELECT voice_type,
            COUNT(DISTINCT user_id) coralistas,
            ROUND(AVG(accuracy_pct),1) accuracy,
            ROUND(AVG(avg_cents_off),1) cents
     FROM practice_sessions WHERE voice_type IS NOT NULL
     GROUP BY voice_type`
  ).all();

  const coralistas = db.prepare(
    `SELECT u.id, u.name, u.voice_type,
            COUNT(s.id) sessoes,
            ROUND(AVG(s.accuracy_pct),1) accuracy,
            ROUND(AVG(s.avg_cents_off),1) cents,
            MAX(s.created_at) ultimo_ensaio
     FROM users u LEFT JOIN practice_sessions s ON s.user_id = u.id
     WHERE u.role='coralista'
     GROUP BY u.id ORDER BY u.voice_type, accuracy DESC`
  ).all();

  res.json({ por_naipe: porNaipe, coralistas });
});

app.get('/api/admin/coralistas', requireAuth, requireMaestro, (_req, res) => {
  res.json({
    coralistas: db.prepare(
      "SELECT id, name, email, voice_type, created_at FROM users WHERE role='coralista' ORDER BY name"
    ).all(),
  });
});

// Maestro cadastra coralista
app.post('/api/admin/coralistas', requireAuth, requireMaestro, (req, res) => {
  const { name, email, password, voice_type } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Dados incompletos.' });
  const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase());
  if (exists) return res.status(409).json({ error: 'E-mail já cadastrado.' });
  const info = db.prepare(
    `INSERT INTO users (name, email, password_hash, role, voice_type)
     VALUES (?, ?, ?, 'coralista', ?)`
  ).run(name.trim(), email.toLowerCase().trim(), hashPassword(password), voice_type || null);
  res.status(201).json({ id: info.lastInsertRowid });
});

// ============================ FRONTEND ESTÁTICO =============================
const CLIENT_DIR = path.join(__dirname, '..', '..', 'client');
app.use(express.static(CLIENT_DIR));
app.get('*', (_req, res) => res.sendFile(path.join(CLIENT_DIR, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  🎵  Coral ADMoema — servidor em http://localhost:${PORT}\n`);
});
