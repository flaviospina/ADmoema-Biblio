// ============================================================================
//  Roteador (hash) + telas da aplicação.
// ============================================================================
const app = document.getElementById('app');
let chartRefs = [];
function clearCharts() { chartRefs.forEach((c) => c.destroy()); chartRefs = []; }

const VOICE_OPTS = `
  <option value="">Selecione o naipe</option>
  <option value="soprano">Soprano</option>
  <option value="contralto">Contralto</option>
  <option value="tenor">Tenor</option>
  <option value="baixo">Baixo</option>`;

function badge(voice) { return voice ? `<span class="badge ${voice}">${voice}</span>` : '<span class="muted">—</span>'; }
function fmtDate(s) { return s ? new Date(s.replace(' ', 'T') + 'Z').toLocaleString('pt-BR') : '—'; }
function accBadge(v) {
  if (v == null) return '<span class="muted">—</span>';
  const c = v >= 80 ? 'good' : v >= 55 ? 'warn' : 'bad';
  return `<span class="badge ${c}">${v}%</span>`;
}

// ---------------------------------------------------------------- LOGIN
function LoginView() {
  let mode = 'login';
  app.innerHTML = `
    <div class="auth-wrap"><div class="card auth-card">
      <div class="logo"><span class="mark">🎼</span><div>
        <b>Coral ADMoema</b><small>Cantata · Ensaio Inteligente</small></div></div>
      <div class="tabs">
        <button data-m="login" class="active">Entrar</button>
        <button data-m="register">Criar conta</button>
      </div>
      <div id="formArea"></div>
      <div class="hint">Maestro de teste: <b>maestro@admoema.com.br</b> · senha <b>admoema123</b></div>
    </div></div>`;

  const formArea = app.querySelector('#formArea');
  function renderForm() {
    formArea.innerHTML = mode === 'login' ? `
      <div class="field"><label>E-mail</label><input id="email" type="email" autocomplete="email" /></div>
      <div class="field"><label>Senha</label><input id="password" type="password" autocomplete="current-password" /></div>
      <div class="error" id="err"></div>
      <button class="btn block" id="submit">Entrar</button>
    ` : `
      <div class="field"><label>Nome completo</label><input id="name" /></div>
      <div class="field"><label>E-mail</label><input id="email" type="email" /></div>
      <div class="field"><label>Naipe (tipo de voz)</label><select id="voice">${VOICE_OPTS}</select></div>
      <div class="field"><label>Senha</label><input id="password" type="password" autocomplete="new-password" /></div>
      <div class="error" id="err"></div>
      <button class="btn block" id="submit">Criar conta de coralista</button>`;

    formArea.querySelector('#submit').onclick = submit;
    formArea.querySelectorAll('input').forEach((i) =>
      i.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); }));
  }

  async function submit() {
    const err = formArea.querySelector('#err'); err.textContent = '';
    const btn = formArea.querySelector('#submit'); btn.disabled = true;
    try {
      const email = formArea.querySelector('#email').value;
      const password = formArea.querySelector('#password').value;
      if (mode === 'login') await Auth.login(email, password);
      else await Auth.register({
        name: formArea.querySelector('#name').value,
        email, password,
        voice_type: formArea.querySelector('#voice').value || null,
      });
      location.hash = Auth.isMaestro ? '#/admin' : '#/inicio';
    } catch (e) { err.textContent = e.message; btn.disabled = false; }
  }

  app.querySelectorAll('.tabs button').forEach((b) => b.onclick = () => {
    mode = b.dataset.m;
    app.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('active', x === b));
    renderForm();
  });
  renderForm();
}

// ---------------------------------------------------------------- SHELL
function Shell(active, contentFn) {
  const u = Auth.current;
  const nav = Auth.isMaestro ? [
    ['#/admin', '📊', 'Dashboard'],
    ['#/admin/acessos', '🏠', 'Quem ensaia em casa'],
    ['#/admin/naipes', '🎚️', 'Relatório por naipe'],
    ['#/admin/coralistas', '👥', 'Coralistas'],
    ['#/admin/materiais', '📚', 'Materiais'],
  ] : [
    ['#/inicio', '🏠', 'Início'],
    ['#/ensaiar', '🎤', 'Ensaiar minha voz'],
    ['#/evolucao', '📈', 'Minha evolução'],
    ['#/materiais', '📚', 'Materiais'],
  ];

  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="logo"><span class="mark">🎼</span><div>
          <b>ADMoema</b><small>${Auth.isMaestro ? 'Maestro' : 'Coralista'}</small></div></div>
        ${nav.map(([h, ic, l]) =>
          `<a class="nav-item ${active === h ? 'active' : ''}" href="${h}"><span class="ic">${ic}</span>${l}</a>`).join('')}
        <div class="spacer"></div>
        <button class="nav-item" id="logout"><span class="ic">⏻</span>Sair</button>
      </aside>
      <main class="main">
        <div class="topbar">
          <div class="who">Olá, <b>${u.name}</b> ${u.voice_type ? badge(u.voice_type) : ''}</div>
        </div>
        <div id="content"></div>
      </main>
    </div>`;
  app.querySelector('#logout').onclick = () => Auth.logout();
  contentFn(app.querySelector('#content'));
}

// ---------------------------------------------------------------- CORALISTA: início
async function InicioView(root) {
  root.innerHTML = '<h2 class="section-title">Início</h2><p class="muted">Carregando…</p>';
  const { sessions } = await api('/sessions/mine').catch(() => ({ sessions: [] }));
  const total = sessions.length;
  const last = sessions[sessions.length - 1];
  const best = sessions.reduce((m, s) => Math.max(m, s.accuracy_pct), 0);
  root.innerHTML = `
    <h2 class="section-title">Início</h2>
    <div class="grid cols-3">
      <div class="card kpi"><span class="label">Ensaios realizados</span><span class="value">${total}</span></div>
      <div class="card kpi"><span class="label">Melhor afinação</span><span class="value">${best || 0}%</span></div>
      <div class="card kpi"><span class="label">Último ensaio</span><span class="value" style="font-size:20px">${last ? last.accuracy_pct + '%' : '—'}</span><span class="sub">${last ? fmtDate(last.created_at) : 'nenhum ainda'}</span></div>
    </div>
    <div class="card" style="margin-top:18px">
      <h3>Pronto para ensaiar?</h3>
      <p class="muted">Treine sua voz e acompanhe sua evolução de afinação e timbre.</p>
      <a class="btn lg" href="#/ensaiar">🎤 Iniciar ensaio</a>
    </div>`;
}

// ---------------------------------------------------------------- CORALISTA: evolução
async function EvolucaoView(root) {
  root.innerHTML = '<h2 class="section-title">Minha evolução</h2><p class="muted">Carregando…</p>';
  const { sessions } = await api('/sessions/mine');
  if (!sessions.length) {
    root.innerHTML = '<h2 class="section-title">Minha evolução</h2><div class="card"><p class="muted">Você ainda não tem ensaios registrados. Faça seu primeiro ensaio!</p></div>';
    return;
  }
  root.innerHTML = `
    <h2 class="section-title">Minha evolução</h2>
    <div class="grid cols-2">
      <div class="card"><h3>Afinação ao longo do tempo (%)</h3><canvas id="accChart" height="200"></canvas></div>
      <div class="card"><h3>Timbre — frequência central (Hz)</h3><canvas id="timbreChart" height="200"></canvas></div>
    </div>
    <div class="card" style="margin-top:18px"><h3>Histórico</h3>
      <table><thead><tr><th>Data</th><th>Hino</th><th>Afinação</th><th>Desvio</th><th>Faixa (Hz)</th></tr></thead><tbody>
        ${sessions.slice().reverse().map((s) => `<tr>
          <td>${fmtDate(s.created_at)}</td><td>${s.hymn_title || 'Treino livre'}</td>
          <td>${accBadge(s.accuracy_pct)}</td><td>${s.avg_cents_off}¢</td>
          <td>${s.low_freq ? Math.round(s.low_freq) : '—'}–${s.high_freq ? Math.round(s.high_freq) : '—'}</td></tr>`).join('')}
      </tbody></table>
    </div>`;

  const labels = sessions.map((s, i) => `#${i + 1}`);
  chartRefs.push(new Chart(root.querySelector('#accChart'), {
    type: 'line',
    data: { labels, datasets: [{ label: 'Afinação %', data: sessions.map((s) => s.accuracy_pct),
      borderColor: '#3ecf8e', backgroundColor: 'rgba(62,207,142,.15)', fill: true, tension: .3 }] },
    options: chartOpts({ max: 100 }),
  }));
  chartRefs.push(new Chart(root.querySelector('#timbreChart'), {
    type: 'line',
    data: { labels, datasets: [
      { label: 'Central', data: sessions.map((s) => s.median_freq), borderColor: '#6c8cff', tension: .3 },
      { label: 'Grave', data: sessions.map((s) => s.low_freq), borderColor: '#94a3c4', borderDash: [4, 4], tension: .3 },
      { label: 'Agudo', data: sessions.map((s) => s.high_freq), borderColor: '#f0a93b', borderDash: [4, 4], tension: .3 },
    ] },
    options: chartOpts(),
  }));
}

// ---------------------------------------------------------------- MATERIAIS (compartilhado)
async function MateriaisView(root, isAdmin) {
  root.innerHTML = `<h2 class="section-title">Materiais de ensino</h2><p class="muted">Carregando…</p>`;
  const voice = Auth.current.voice_type;
  const q = (!isAdmin && voice) ? `?voice_type=${voice}` : '';
  const { materials } = await api('/materials' + q);

  const adminForm = isAdmin ? `
    <div class="card"><h3>Adicionar material</h3>
      <div class="field"><label>Título</label><input id="m_title" /></div>
      <div class="row">
        <div class="field" style="flex:1"><label>Tipo</label><select id="m_type">
          <option value="cifra">Letra cifrada</option><option value="letra">Letra do hino</option>
          <option value="audio">Áudio (por naipe)</option><option value="partitura">Partitura</option>
        </select></div>
        <div class="field" style="flex:1"><label>Naipe (opcional)</label><select id="m_voice">${VOICE_OPTS}</select></div>
      </div>
      <div class="field" id="textWrap"><label>Conteúdo (letra/cifra)</label><textarea id="m_content"></textarea></div>
      <div class="field" id="fileWrap" style="display:none"><label>Arquivo (áudio/partitura)</label><input id="m_file" type="file" /></div>
      <div class="error" id="m_err"></div>
      <button class="btn" id="m_save">Salvar material</button>
    </div>` : '';

  root.innerHTML = `<h2 class="section-title">Materiais de ensino</h2>
    <div class="grid ${isAdmin ? 'cols-2' : ''}">
      ${adminForm}
      <div class="card"><h3>Disponíveis ${!isAdmin && voice ? `· ${voice}` : ''}</h3>
        <div id="mlist"></div></div>
    </div>`;
  renderMaterialList(root.querySelector('#mlist'), materials);

  if (isAdmin) {
    const typeSel = root.querySelector('#m_type');
    typeSel.onchange = () => {
      const isFile = ['audio', 'partitura'].includes(typeSel.value);
      root.querySelector('#fileWrap').style.display = isFile ? '' : 'none';
      root.querySelector('#textWrap').style.display = isFile ? 'none' : '';
    };
    root.querySelector('#m_save').onclick = async () => {
      const err = root.querySelector('#m_err'); err.textContent = '';
      const fd = new FormData();
      fd.append('title', root.querySelector('#m_title').value);
      fd.append('type', typeSel.value);
      fd.append('voice_type', root.querySelector('#m_voice').value);
      fd.append('content', root.querySelector('#m_content').value || '');
      const file = root.querySelector('#m_file').files[0];
      if (file) fd.append('file', file);
      try {
        await api('/materials', { method: 'POST', form: fd });
        MateriaisView(root, true);
      } catch (e) { err.textContent = e.message; }
    };
  }
}

function renderMaterialList(node, materials) {
  if (!materials.length) { node.innerHTML = '<p class="muted">Nenhum material publicado ainda.</p>'; return; }
  const icons = { cifra: '🎸', letra: '📝', audio: '🔊', partitura: '🎼' };
  node.innerHTML = materials.map((m) => `
    <div style="padding:12px 0;border-bottom:1px solid var(--line)">
      <div class="row" style="justify-content:space-between">
        <div><b>${icons[m.type] || '📄'} ${m.title}</b> ${m.voice_type ? badge(m.voice_type) : ''}
          ${m.hymn_title ? `<span class="muted"> · ${m.hymn_title}</span>` : ''}</div>
        ${m.file_name ? `<a class="btn ghost" href="/api/materials/${m.id}/file" target="_blank">Abrir</a>` : ''}
      </div>
      ${m.content ? `<pre class="muted" style="white-space:pre-wrap;font-family:inherit;margin:8px 0 0">${m.content}</pre>` : ''}
    </div>`).join('');
}

// ---------------------------------------------------------------- MAESTRO: dashboard
async function AdminDashView(root) {
  root.innerHTML = '<h2 class="section-title">Dashboard administrativo</h2><p class="muted">Carregando…</p>';
  const { kpis, por_naipe } = await api('/admin/dashboard');
  root.innerHTML = `
    <h2 class="section-title">Dashboard administrativo</h2>
    <div class="grid cols-4">
      <div class="card kpi"><span class="label">Coralistas</span><span class="value">${kpis.total_coralistas}</span></div>
      <div class="card kpi"><span class="label">Ativos (7 dias)</span><span class="value">${kpis.ativos_7d}</span><span class="sub">ensaiando em casa</span></div>
      <div class="card kpi"><span class="label">Ensaios totais</span><span class="value">${kpis.total_sessoes}</span><span class="sub">${kpis.minutos_totais} min</span></div>
      <div class="card kpi"><span class="label">Afinação média</span><span class="value">${kpis.accuracy_media}%</span></div>
    </div>
    <div class="grid cols-2" style="margin-top:18px">
      <div class="card"><h3>Afinação média por naipe</h3>${por_naipe.length ? '<canvas id="naipeChart" height="220"></canvas>' : '<p class="muted">Sem dados de ensaio ainda.</p>'}</div>
      <div class="card"><h3>Quem está no tom?</h3>
        ${por_naipe.length ? `<table><thead><tr><th>Naipe</th><th>Ensaios</th><th>Afinação</th><th>Desvio</th></tr></thead><tbody>
          ${por_naipe.map((n) => `<tr><td>${badge(n.voice_type)}</td><td>${n.sessoes}</td><td>${accBadge(n.accuracy)}</td><td>${n.cents}¢</td></tr>`).join('')}
        </tbody></table>` : '<p class="muted">Aguardando ensaios dos coralistas.</p>'}
      </div>
    </div>`;
  if (por_naipe.length) {
    chartRefs.push(new Chart(root.querySelector('#naipeChart'), {
      type: 'bar',
      data: { labels: por_naipe.map((n) => n.voice_type),
        datasets: [{ label: 'Afinação %', data: por_naipe.map((n) => n.accuracy),
          backgroundColor: ['#c77dff', '#56a8ff', '#5cffa0', '#ffc56b'] }] },
      options: chartOpts({ max: 100 }),
    }));
  }
}

// ---------------------------------------------------------------- MAESTRO: acessos
async function AdminAcessosView(root) {
  let period = 'day';
  async function load() {
    root.innerHTML = `<h2 class="section-title">Quem ensaia em casa</h2><p class="muted">Carregando…</p>`;
    const { buckets, ranking } = await api(`/admin/access-report?period=${period}`);
    root.innerHTML = `
      <div class="row" style="justify-content:space-between">
        <h2 class="section-title" style="margin:0">Quem ensaia em casa</h2>
        <div class="tabs" style="width:auto;margin:0">
          ${['day', 'week', 'month'].map((p) => `<button data-p="${p}" class="${p === period ? 'active' : ''}">${{ day: 'Dia', week: 'Semana', month: 'Mês' }[p]}</button>`).join('')}
        </div>
      </div>
      <div class="card"><h3>Acessos por ${{ day: 'dia', week: 'semana', month: 'mês' }[period]}</h3>
        ${buckets.length ? '<canvas id="accessChart" height="160"></canvas>' : '<p class="muted">Sem acessos registrados.</p>'}</div>
      <div class="card" style="margin-top:18px"><h3>Ranking de dedicação (coralistas)</h3>
        <table><thead><tr><th>#</th><th>Coralista</th><th>Naipe</th><th>Acessos</th><th>Último acesso</th></tr></thead><tbody>
          ${ranking.length ? ranking.map((r, i) => `<tr><td>${i + 1}</td><td>${r.name}</td><td>${badge(r.voice_type)}</td><td><b>${r.acessos}</b></td><td>${fmtDate(r.ultimo_acesso)}</td></tr>`).join('') : '<tr><td colspan="5" class="muted">Nenhum acesso ainda.</td></tr>'}
        </tbody></table>
      </div>`;
    root.querySelectorAll('.tabs button').forEach((b) => b.onclick = () => { period = b.dataset.p; load(); });
    if (buckets.length) {
      chartRefs.push(new Chart(root.querySelector('#accessChart'), {
        type: 'bar',
        data: { labels: buckets.map((b) => b.bucket), datasets: [
          { label: 'Acessos', data: buckets.map((b) => b.acessos), backgroundColor: '#6c8cff' },
          { label: 'Coralistas distintos', data: buckets.map((b) => b.usuarios), backgroundColor: '#f0a93b' },
        ] },
        options: chartOpts(),
      }));
    }
  }
  await load();
}

// ---------------------------------------------------------------- MAESTRO: naipes
async function AdminNaipesView(root) {
  root.innerHTML = '<h2 class="section-title">Relatório por naipe</h2><p class="muted">Carregando…</p>';
  const { por_naipe, coralistas } = await api('/admin/voice-report');
  root.innerHTML = `
    <h2 class="section-title">Relatório por naipe</h2>
    <div class="grid cols-2">
      <div class="card"><h3>Afinação média por naipe</h3>${por_naipe.length ? '<canvas id="vChart" height="220"></canvas>' : '<p class="muted">Sem dados.</p>'}</div>
      <div class="card"><h3>Desvio médio (cents) — menor é melhor</h3>${por_naipe.length ? '<canvas id="cChart" height="220"></canvas>' : '<p class="muted">Sem dados.</p>'}</div>
    </div>
    <div class="card" style="margin-top:18px"><h3>Coralistas — quem está no tom e quem precisa melhorar</h3>
      <table><thead><tr><th>Coralista</th><th>Naipe</th><th>Ensaios</th><th>Afinação</th><th>Desvio</th><th>Situação</th><th>Último ensaio</th></tr></thead><tbody>
        ${coralistas.map((c) => {
          const sit = c.sessoes ? (c.accuracy >= 80 ? '<span class="badge good">No tom</span>' : c.accuracy >= 55 ? '<span class="badge warn">Regular</span>' : '<span class="badge bad">Melhorar</span>') : '<span class="muted">Sem ensaio</span>';
          return `<tr><td>${c.name}</td><td>${badge(c.voice_type)}</td><td>${c.sessoes || 0}</td><td>${accBadge(c.sessoes ? c.accuracy : null)}</td><td>${c.cents != null ? c.cents + '¢' : '—'}</td><td>${sit}</td><td>${c.ultimo_ensaio ? fmtDate(c.ultimo_ensaio) : '—'}</td></tr>`;
        }).join('')}
      </tbody></table>
    </div>`;
  if (por_naipe.length) {
    chartRefs.push(new Chart(root.querySelector('#vChart'), {
      type: 'bar', data: { labels: por_naipe.map((n) => n.voice_type),
        datasets: [{ label: 'Afinação %', data: por_naipe.map((n) => n.accuracy), backgroundColor: '#3ecf8e' }] },
      options: chartOpts({ max: 100 }) }));
    chartRefs.push(new Chart(root.querySelector('#cChart'), {
      type: 'bar', data: { labels: por_naipe.map((n) => n.voice_type),
        datasets: [{ label: 'Desvio ¢', data: por_naipe.map((n) => n.cents), backgroundColor: '#f0a93b' }] },
      options: chartOpts() }));
  }
}

// ---------------------------------------------------------------- MAESTRO: coralistas
async function AdminCoralistasView(root) {
  root.innerHTML = '<h2 class="section-title">Coralistas</h2><p class="muted">Carregando…</p>';
  const { coralistas } = await api('/admin/coralistas');
  root.innerHTML = `
    <h2 class="section-title">Coralistas</h2>
    <div class="grid cols-2">
      <div class="card"><h3>Cadastrar coralista</h3>
        <div class="field"><label>Nome</label><input id="c_name" /></div>
        <div class="field"><label>E-mail</label><input id="c_email" type="email" /></div>
        <div class="field"><label>Naipe</label><select id="c_voice">${VOICE_OPTS}</select></div>
        <div class="field"><label>Senha provisória</label><input id="c_pass" type="text" /></div>
        <div class="error" id="c_err"></div>
        <button class="btn" id="c_save">Cadastrar</button>
      </div>
      <div class="card"><h3>${coralistas.length} coralista(s)</h3>
        <table><thead><tr><th>Nome</th><th>E-mail</th><th>Naipe</th></tr></thead><tbody>
          ${coralistas.map((c) => `<tr><td>${c.name}</td><td class="muted">${c.email}</td><td>${badge(c.voice_type)}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">Nenhum coralista.</td></tr>'}
        </tbody></table>
      </div>
    </div>`;
  root.querySelector('#c_save').onclick = async () => {
    const err = root.querySelector('#c_err'); err.textContent = '';
    try {
      await api('/admin/coralistas', { method: 'POST', body: {
        name: root.querySelector('#c_name').value,
        email: root.querySelector('#c_email').value,
        password: root.querySelector('#c_pass').value,
        voice_type: root.querySelector('#c_voice').value || null,
      }});
      AdminCoralistasView(root);
    } catch (e) { err.textContent = e.message; }
  };
}

// ---------------------------------------------------------------- chart helper
function chartOpts(scale = {}) {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#94a3c4' } } },
    scales: {
      x: { ticks: { color: '#94a3c4' }, grid: { color: 'rgba(255,255,255,.05)' } },
      y: { beginAtZero: true, max: scale.max, ticks: { color: '#94a3c4' }, grid: { color: 'rgba(255,255,255,.05)' } },
    },
  };
}

// ---------------------------------------------------------------- ROUTER
const routes = {
  '#/login': () => LoginView(),
  '#/inicio': () => Shell('#/inicio', InicioView),
  '#/ensaiar': () => Shell('#/ensaiar', TrainerView),
  '#/evolucao': () => Shell('#/evolucao', EvolucaoView),
  '#/materiais': () => Shell('#/materiais', (r) => MateriaisView(r, false)),
  '#/admin': () => Shell('#/admin', AdminDashView),
  '#/admin/acessos': () => Shell('#/admin/acessos', AdminAcessosView),
  '#/admin/naipes': () => Shell('#/admin/naipes', AdminNaipesView),
  '#/admin/coralistas': () => Shell('#/admin/coralistas', AdminCoralistasView),
  '#/admin/materiais': () => Shell('#/admin/materiais', (r) => MateriaisView(r, true)),
};

function render() {
  clearCharts();
  const hash = location.hash || '';
  if (!Auth.current) { LoginView(); if (hash !== '#/login') location.hash = '#/login'; return; }
  // proteção de papel
  if (hash.startsWith('#/admin') && !Auth.isMaestro) { location.hash = '#/inicio'; return; }
  const route = routes[hash];
  if (route) route();
  else location.hash = Auth.isMaestro ? '#/admin' : '#/inicio';
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);
render();
