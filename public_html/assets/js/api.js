// Cliente de API — autenticação por sessão PHP (cookie HttpOnly).
// O localStorage guarda apenas os dados de exibição do usuário.
const Store = {
  get user() { try { return JSON.parse(localStorage.getItem('cantata_user')); } catch { return null; } },
  set user(v) { v ? localStorage.setItem('cantata_user', JSON.stringify(v)) : localStorage.removeItem('cantata_user'); },
  clear() { this.user = null; },
};

async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  let payload;
  if (form) { payload = form; }
  else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }

  const res = await fetch(`/api${path}`, { method, headers, body: payload, credentials: 'same-origin' });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && path !== '/auth/login' && path !== '/me') {
    Store.clear();
    navigate('/entrar');
    throw new Error(data.error || 'Sessão expirada.');
  }
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

const Auth = {
  async login(email, password) {
    const { user } = await api('/auth/login', { method: 'POST', body: { email, password } });
    Store.user = user; return user;
  },
  async register(payload) {
    const { user } = await api('/auth/register', { method: 'POST', body: payload });
    Store.user = user; return user;
  },
  async logout() {
    try { await api('/auth/logout', { method: 'POST' }); } catch {}
    Store.clear();
    navigate('/entrar');
  },
  async hydrate() {
    // Confirma a sessão no servidor (cookie) e atualiza os dados locais
    try {
      const { user } = await api('/me');
      Store.user = user;
    } catch { Store.clear(); }
  },
  get current() { return Store.user; },
  get isMaestro() { return Store.user?.role === 'maestro'; },
};
