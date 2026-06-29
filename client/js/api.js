// Cliente de API + sessão (token JWT em localStorage)
const Store = {
  get token() { return localStorage.getItem('cantata_token'); },
  set token(v) { v ? localStorage.setItem('cantata_token', v) : localStorage.removeItem('cantata_token'); },
  get user() { try { return JSON.parse(localStorage.getItem('cantata_user')); } catch { return null; } },
  set user(v) { v ? localStorage.setItem('cantata_user', JSON.stringify(v)) : localStorage.removeItem('cantata_user'); },
  clear() { this.token = null; this.user = null; },
};

async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  if (Store.token) headers.Authorization = `Bearer ${Store.token}`;
  let payload;
  if (form) { payload = form; }
  else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }

  const res = await fetch(`/api${path}`, { method, headers, body: payload });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

const Auth = {
  async login(email, password) {
    const { token, user } = await api('/auth/login', { method: 'POST', body: { email, password } });
    Store.token = token; Store.user = user; return user;
  },
  async register(payload) {
    const { token, user } = await api('/auth/register', { method: 'POST', body: payload });
    Store.token = token; Store.user = user; return user;
  },
  logout() { Store.clear(); location.hash = '#/login'; },
  get current() { return Store.user; },
  get isMaestro() { return Store.user?.role === 'maestro'; },
};
