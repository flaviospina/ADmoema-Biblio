'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Em produção, defina JWT_SECRET no ambiente.
const JWT_SECRET = process.env.JWT_SECRET || 'cantata-admoema-dev-secret-change-me';
const TOKEN_TTL = '12h';

function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name, voice_type: user.voice_type },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token ausente.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão expirada ou inválida.' });
  }
}

function requireMaestro(req, res, next) {
  if (!req.user || req.user.role !== 'maestro') {
    return res.status(403).json({ error: 'Acesso restrito ao maestro.' });
  }
  next();
}

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  requireAuth,
  requireMaestro,
};
