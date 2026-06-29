'use strict';
// Zera o banco de dados: remove o arquivo SQLite (e WAL/SHM).
// O banco é recriado limpo no próximo `npm start` (apenas maestro + hinos de exemplo).
const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', 'data');
for (const f of ['cantata.db', 'cantata.db-wal', 'cantata.db-shm']) {
  fs.rmSync(path.join(DATA_DIR, f), { force: true });
}
console.log('✔ Banco zerado. Rode "npm start" para recriar a base limpa.');
