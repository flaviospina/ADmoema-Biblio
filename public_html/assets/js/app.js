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

const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
// Naipe como ponto colorido + rótulo
function badge(voice) {
  return voice ? `<span class="naipe v-${voice}"><i class="dot"></i>${cap(voice)}</span>` : '<span class="muted">—</span>';
}
function initials(name) {
  const p = (name || '').trim().split(/\s+/);
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?';
}
function avatar(name, voice) {
  return `<span class="avatar v-${voice || 'none'}">${initials(name)}</span>`;
}
function person(name, voice) {
  return `<span class="person">${avatar(name, voice)}<b>${name}</b></span>`;
}
function fmtDate(s) { return s ? new Date(s.replace(' ', 'T') + 'Z').toLocaleString('pt-BR') : '—'; }
function gradeOf(v) { return v >= 80 ? 'good' : v >= 55 ? 'warn' : 'bad'; }
function accBadge(v) {
  if (v == null) return '<span class="muted">—</span>';
  return `<span class="badge ${gradeOf(v)}">${v}%</span>`;
}
// mini-barra inline (coluna de afinação)
function miniBar(v, fillClass) {
  if (v == null) return '<span class="muted">—</span>';
  return `<span class="minibar"><span class="track"><span class="${fillClass || ('fill-' + gradeOf(v))}" style="width:${Math.max(0, Math.min(100, v))}%"></span></span><b>${v}%</b></span>`;
}
// barra horizontal de relatório
function hBar(label, valueText, pct, fillClass) {
  return `<div class="hbar-row">
    <div class="hbar-head"><span>${label}</span><span class="val">${valueText}</span></div>
    <div class="hbar"><span class="${fillClass}" style="width:${Math.max(2, Math.min(100, pct))}%"></span></div>
  </div>`;
}

// ---------------------------------------------------------------- LOGIN
function LoginView() {
  let mode = 'login';
  app.innerHTML = `
    <div class="auth-wrap"><div class="card auth-card">
      <div class="logo"><span class="mark">♪</span><div>
        <b>ADMoema</b><small>Ministério Belém · Cantata</small></div></div>
      <div class="tabs">
        <button data-m="login" class="active">Entrar</button>
        <button data-m="register">Criar conta</button>
      </div>
      <div id="formArea"></div>
      <div class="hint">Acesso do maestro: <b>maestro@admoema.com.br</b> · senha <b>admoema123</b> (troque após o 1º acesso)</div>
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
      navigate(Auth.isMaestro ? '/painel' : '/inicio');
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
    ['/painel', 'Painel'],
    ['/painel/acessos', 'Quem ensaia em casa'],
    ['/painel/naipes', 'Relatório por naipe'],
    ['/painel/hinos', 'Hinos & melodias'],
    ['/painel/coralistas', 'Coralistas'],
    ['/painel/materiais', 'Materiais'],
  ] : [
    ['/inicio', 'Início'],
    ['/ensaiar', 'Ensaiar minha voz'],
    ['/evolucao', 'Minha evolução'],
    ['/materiais', 'Materiais'],
  ];

  app.innerHTML = `
    <button class="menu-toggle" id="menuToggle" aria-label="Menu">☰</button>
    <div class="backdrop" id="backdrop"></div>
    <div class="shell">
      <aside class="sidebar" id="sidebar">
        <div class="logo"><span class="mark">♪</span><div>
          <b>ADMoema</b><small>Ministério Belém · 124</small></div></div>
        ${nav.map(([h, l]) =>
          `<a class="nav-item ${active === h ? 'active' : ''}" href="${h}">${l}</a>`).join('')}
        <div class="spacer"></div>
        <button class="nav-item" id="logout">Sair</button>
      </aside>
      <main class="main">
        <div class="topbar">
          <div class="who">Olá, <b>${u.name}</b></div>
          <span class="role-pill">${Auth.isMaestro ? 'Maestro' : (u.voice_type ? cap(u.voice_type) : 'Coralista')}</span>
        </div>
        <div id="content"></div>
      </main>
    </div>`;

  app.querySelector('#logout').onclick = () => Auth.logout();

  // menu responsivo
  const sidebar = app.querySelector('#sidebar');
  const backdrop = app.querySelector('#backdrop');
  const closeMenu = () => { sidebar.classList.remove('open'); backdrop.classList.remove('show'); };
  app.querySelector('#menuToggle').onclick = () => { sidebar.classList.toggle('open'); backdrop.classList.toggle('show'); };
  backdrop.onclick = closeMenu;
  sidebar.querySelectorAll('a.nav-item').forEach((a) => a.addEventListener('click', closeMenu));

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
      <a class="btn lg" href="/ensaiar">🎤 Iniciar ensaio</a>
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
      <div class="card"><h3>Afinação ao longo do tempo (%)</h3><div class="chart-box"><canvas id="accChart"></canvas></div></div>
      <div class="card"><h3>Timbre — frequência central (Hz)</h3><div class="chart-box"><canvas id="timbreChart"></canvas></div></div>
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
      borderColor: '#4f7a52', backgroundColor: 'rgba(79,122,82,.12)', fill: true, tension: .3, pointRadius: 3 }] },
    options: chartOpts({ max: 100 }),
  }));
  chartRefs.push(new Chart(root.querySelector('#timbreChart'), {
    type: 'line',
    data: { labels, datasets: [
      { label: 'Central', data: sessions.map((s) => s.median_freq), borderColor: '#3b4f7d', tension: .3, pointRadius: 2 },
      { label: 'Grave', data: sessions.map((s) => s.low_freq), borderColor: '#9c988a', borderDash: [4, 4], tension: .3, pointRadius: 0 },
      { label: 'Agudo', data: sessions.map((s) => s.high_freq), borderColor: '#b5654a', borderDash: [4, 4], tension: .3, pointRadius: 0 },
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
        ${m.file_name ? `<a class="btn ghost" href="${APP_BASE}/api/materials/${m.id}/file" target="_blank">Abrir</a>` : ''}
      </div>
      ${m.content ? `<pre class="muted" style="white-space:pre-wrap;font-family:inherit;margin:8px 0 0">${m.content}</pre>` : ''}
    </div>`).join('');
}

// ---------------------------------------------------------------- MAESTRO: dashboard
async function AdminDashView(root) {
  root.innerHTML = '<h2 class="section-title">Painel</h2><p class="muted">Carregando…</p>';
  const { kpis, por_naipe } = await api('/admin/dashboard');
  root.innerHTML = `
    <h2 class="section-title">Painel</h2>
    <div class="grid cols-4">
      <div class="card kpi"><span class="label">Coralistas</span><span class="value">${kpis.total_coralistas}</span></div>
      <div class="card kpi"><span class="label">Ativos (7 dias)</span><span class="value">${kpis.ativos_7d}</span><span class="sub">ensaiando em casa</span></div>
      <div class="card kpi"><span class="label">Ensaios totais</span><span class="value">${kpis.total_sessoes}</span><span class="sub">${kpis.minutos_totais} min</span></div>
      <div class="card kpi"><span class="label">Afinação média</span><span class="value">${kpis.accuracy_media}%</span></div>
    </div>
    <div class="grid cols-2" style="margin-top:18px">
      <div class="card"><h3>Afinação média por naipe</h3>
        ${por_naipe.length ? por_naipe.map((n) => hBar(cap(n.voice_type), n.accuracy + '%', n.accuracy, 'fill-' + n.voice_type)).join('') : '<p class="muted">Sem dados de ensaio ainda.</p>'}
      </div>
      <div class="card"><h3>Quem está no tom?</h3>
        ${por_naipe.length ? `<table><thead><tr><th>Naipe</th><th>Ensaios</th><th>Afinação</th><th>Desvio</th></tr></thead><tbody>
          ${por_naipe.map((n) => `<tr><td>${badge(n.voice_type)}</td><td>${n.sessoes}</td><td>${miniBar(n.accuracy)}</td><td>${n.cents}¢</td></tr>`).join('')}
        </tbody></table>` : '<p class="muted">Aguardando ensaios dos coralistas.</p>'}
      </div>
    </div>`;
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
        ${buckets.length ? '<div class="chart-box"><canvas id="accessChart"></canvas></div>' : '<p class="muted">Sem acessos registrados.</p>'}</div>
      <div class="card" style="margin-top:18px"><h3>Ranking de dedicação (coralistas)</h3>
        <table><thead><tr><th>#</th><th>Coralista</th><th>Naipe</th><th>Acessos</th><th>Último acesso</th></tr></thead><tbody>
          ${ranking.length ? ranking.map((r, i) => `<tr><td class="rank">${String(i + 1).padStart(2, '0')}</td><td>${person(r.name, r.voice_type)}</td><td>${badge(r.voice_type)}</td><td><b>${r.acessos}</b></td><td class="muted">${fmtDate(r.ultimo_acesso)}</td></tr>`).join('') : '<tr><td colspan="5" class="muted">Nenhum acesso ainda.</td></tr>'}
        </tbody></table>
      </div>`;
    root.querySelectorAll('.tabs button').forEach((b) => b.onclick = () => { period = b.dataset.p; load(); });
    if (buckets.length) {
      const WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const labels = buckets.map((b) => period === 'day'
        ? WD[new Date(b.bucket + 'T00:00:00').getDay()] : b.bucket);
      chartRefs.push(new Chart(root.querySelector('#accessChart'), {
        type: 'bar',
        data: { labels, datasets: [
          { label: 'Acessos', data: buckets.map((b) => b.acessos), backgroundColor: '#4f7a52', borderRadius: 6, borderSkipped: false, maxBarThickness: 30 },
          { label: 'Coralistas distintos', data: buckets.map((b) => b.usuarios), backgroundColor: '#cabfa8', borderRadius: 6, borderSkipped: false, maxBarThickness: 30 },
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
      <div class="card"><h3>Afinação média por naipe</h3>
        ${por_naipe.length ? por_naipe.map((n) => hBar(cap(n.voice_type), n.accuracy + '%', n.accuracy, 'fill-' + n.voice_type)).join('') : '<p class="muted">Sem dados.</p>'}
      </div>
      <div class="card"><h3>Desvio médio <span class="muted" style="font-size:13px;font-weight:400">(cents — menor é melhor)</span></h3>
        ${por_naipe.length ? por_naipe.map((n) => hBar(cap(n.voice_type), n.cents + '¢', Math.min(n.cents / 30 * 100, 100), 'fill-' + n.voice_type)).join('') : '<p class="muted">Sem dados.</p>'}
      </div>
    </div>
    <div class="card" style="margin-top:18px"><h3>Coralistas — quem está no tom e quem precisa melhorar</h3>
      <table><thead><tr><th>Coralista</th><th>Naipe</th><th>Ensaios</th><th>Afinação</th><th>Desvio</th><th>Situação</th></tr></thead><tbody>
        ${coralistas.map((c) => {
          const sit = c.sessoes ? (c.accuracy >= 80 ? '<span class="badge good">No tom</span>' : c.accuracy >= 55 ? '<span class="badge warn">Atenção</span>' : '<span class="badge bad">Precisa melhorar</span>') : '<span class="muted">Sem ensaio</span>';
          return `<tr><td>${person(c.name, c.voice_type)}</td><td>${badge(c.voice_type)}</td><td>${c.sessoes || 0}</td><td>${c.sessoes ? miniBar(c.accuracy) : '<span class="muted">—</span>'}</td><td>${c.cents != null ? c.cents + '¢' : '—'}</td><td>${sit}</td></tr>`;
        }).join('')}
      </tbody></table>
    </div>`;
}

// ---------------------------------------------------------------- MAESTRO: hinos & melodias
async function AdminHinosView(root) {
  const NAIPES = ['soprano', 'contralto', 'tenor', 'baixo'];
  root.innerHTML = '<h2 class="section-title">Hinos & melodias</h2><p class="muted">Carregando…</p>';
  const { hymns } = await api('/hymns');
  let selectedId = hymns[0]?.id || null;

  root.innerHTML = `
    <h2 class="section-title">Hinos & melodias</h2>
    <div class="grid cols-2">
      <div class="card"><h3>Novo hino</h3>
        <div class="field"><label>Título</label><input id="h_title" /></div>
        <div class="row">
          <div class="field" style="flex:1"><label>Tonalidade</label><input id="h_key" placeholder="C, G, D…" /></div>
          <div class="field" style="flex:1"><label>BPM</label><input id="h_bpm" type="number" value="84" /></div>
        </div>
        <div class="error" id="h_err"></div>
        <button class="btn" id="h_save">Criar hino</button>
      </div>
      <div class="card"><h3>Hinos cadastrados</h3>
        <div id="h_list"></div>
      </div>
    </div>
    <div class="card" style="margin-top:18px"><h3>Linha de voz por naipe (melodia-alvo)</h3>
      <p class="muted" style="font-size:13px">Digite as notas separadas por espaço, no formato <b>Nota[:tempos]</b> — ex.: <code>C4 D4 E4:2 F4 G4</code>. O coralista vai ensaiar exatamente a linha do seu naipe.</p>
      <div class="field"><label>Hino</label><select id="vl_hymn">${hymns.map((h) => `<option value="${h.id}">${h.title}</option>`).join('')}</select></div>
      <div id="vl_editor"></div>
    </div>`;

  function renderHymnList() {
    root.querySelector('#h_list').innerHTML = hymns.length
      ? `<table><thead><tr><th>Título</th><th>Tom</th><th>BPM</th></tr></thead><tbody>
          ${hymns.map((h) => `<tr><td>${h.title}</td><td>${h.music_key || '—'}</td><td>${h.bpm || '—'}</td></tr>`).join('')}
        </tbody></table>`
      : '<p class="muted">Nenhum hino ainda.</p>';
  }
  renderHymnList();

  root.querySelector('#h_save').onclick = async () => {
    const err = root.querySelector('#h_err'); err.textContent = '';
    try {
      await api('/hymns', { method: 'POST', body: {
        title: root.querySelector('#h_title').value,
        music_key: root.querySelector('#h_key').value,
        bpm: root.querySelector('#h_bpm').value,
      }});
      AdminHinosView(root);
    } catch (e) { err.textContent = e.message; }
  };

  const vlHymn = root.querySelector('#vl_hymn');
  if (selectedId) vlHymn.value = selectedId;
  vlHymn.onchange = loadEditor;

  async function loadEditor() {
    const id = vlHymn.value;
    const editor = root.querySelector('#vl_editor');
    editor.innerHTML = '<p class="muted">Carregando…</p>';
    const { voice_lines } = await api(`/hymns/${id}/voice-lines`);
    const byVoice = Object.fromEntries(voice_lines.map((l) => [l.voice_type, l.notes_text]));
    editor.innerHTML = NAIPES.map((v) => `
      <div class="field">
        <label>${badge(v)} ${v}</label>
        <textarea data-voice="${v}" style="min-height:60px" placeholder="Ex.: C4 D4 E4 F4 G4">${byVoice[v] || ''}</textarea>
        <div class="row" style="justify-content:space-between;margin-top:6px">
          <span class="muted" style="font-size:12px" id="info_${v}"></span>
          <button class="btn" data-save="${v}">Salvar linha de ${v}</button>
        </div>
      </div>`).join('');

    editor.querySelectorAll('textarea').forEach((ta) => {
      const v = ta.dataset.voice;
      const info = editor.querySelector(`#info_${v}`);
      const upd = () => {
        const valid = melodyIsValid(ta.value);
        const n = melodyIsValid(ta.value) ? parseMelody(ta.value).length : 0;
        info.innerHTML = !ta.value.trim() ? 'vazio'
          : valid ? `<span style="color:var(--good)">✓ ${n} notas reconhecidas</span>`
          : '<span style="color:var(--bad)">⚠ formato inválido</span>';
      };
      ta.oninput = upd; upd();
    });

    editor.querySelectorAll('[data-save]').forEach((btn) => {
      btn.onclick = async () => {
        const v = btn.dataset.save;
        const ta = editor.querySelector(`textarea[data-voice="${v}"]`);
        if (!melodyIsValid(ta.value)) { editor.querySelector(`#info_${v}`).innerHTML = '<span style="color:var(--bad)">⚠ corrija o formato antes de salvar</span>'; return; }
        btn.disabled = true; btn.textContent = 'Salvando…';
        try {
          await api(`/hymns/${id}/voice-lines`, { method: 'PUT', body: { voice_type: v, notes_text: ta.value } });
          btn.textContent = '✓ Salvo';
          setTimeout(() => { btn.disabled = false; btn.textContent = `Salvar linha de ${v}`; }, 1200);
        } catch (e) { btn.disabled = false; btn.textContent = `Salvar linha de ${v}`; editor.querySelector(`#info_${v}`).textContent = e.message; }
      };
    });
  }
  if (selectedId) loadEditor();
  else root.querySelector('#vl_editor').innerHTML = '<p class="muted">Crie um hino primeiro.</p>';
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
          ${coralistas.map((c) => `<tr><td>${person(c.name, c.voice_type)}</td><td class="muted">${c.email}</td><td>${badge(c.voice_type)}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">Nenhum coralista.</td></tr>'}
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
    plugins: { legend: { labels: { color: '#5b5f51', boxWidth: 12, usePointStyle: true, font: { size: 12 } } } },
    scales: {
      x: { ticks: { color: '#8d8a7c' }, grid: { display: false }, border: { display: false } },
      y: { beginAtZero: true, max: scale.max, ticks: { color: '#8d8a7c' }, grid: { color: 'rgba(60,50,30,.06)' }, border: { display: false } },
    },
  };
}

// ---------------------------------------------------------------- ROUTER
const routes = {
  '/entrar': () => LoginView(),
  '/inicio': () => Shell('/inicio', InicioView),
  '/ensaiar': () => Shell('/ensaiar', TrainerView),
  '/evolucao': () => Shell('/evolucao', EvolucaoView),
  '/materiais': () => Shell('/materiais', (r) => MateriaisView(r, false)),
  '/painel': () => Shell('/painel', AdminDashView),
  '/painel/acessos': () => Shell('/painel/acessos', AdminAcessosView),
  '/painel/naipes': () => Shell('/painel/naipes', AdminNaipesView),
  '/painel/hinos': () => Shell('/painel/hinos', AdminHinosView),
  '/painel/coralistas': () => Shell('/painel/coralistas', AdminCoralistasView),
  '/painel/materiais': () => Shell('/painel/materiais', (r) => MateriaisView(r, true)),
};

// Navegação com URLs amigáveis (History API), ciente da subpasta (APP_BASE)
function appPath() {
  let p = location.pathname;
  if (APP_BASE && p.startsWith(APP_BASE)) p = p.slice(APP_BASE.length);
  if (p.endsWith('/index.php')) p = '/';
  return p.replace(/\/+$/, '') || '/';
}

function navigate(to) {
  const full = APP_BASE + to;
  if (location.pathname !== full) history.pushState({}, '', full);
  render();
}

function render() {
  clearCharts();
  let path = appPath();
  if (!Auth.current) {
    if (path !== '/entrar') history.replaceState({}, '', APP_BASE + '/entrar');
    LoginView();
    return;
  }
  // proteção de papel
  if (path.startsWith('/painel') && !Auth.isMaestro) { navigate('/inicio'); return; }
  const home = Auth.isMaestro ? '/painel' : '/inicio';
  if (path === '/' || path === '/entrar') { history.replaceState({}, '', APP_BASE + home); path = home; }
  const route = routes[path];
  if (route) route();
  else navigate(home);
}

// Intercepta cliques em links internos para navegar sem recarregar a página.
// Os href do app são "lógicos" (ex.: /ensaiar) — o APP_BASE entra no navigate().
document.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a) return;
  const href = a.getAttribute('href') || '';
  if (href.startsWith('/') && !href.includes('/api/') && !href.includes('/assets/') && a.target !== '_blank') {
    e.preventDefault();
    navigate(href.startsWith(APP_BASE + '/') && APP_BASE ? href.slice(APP_BASE.length) : href);
  }
});

window.addEventListener('popstate', render);

// Inicialização: confirma a sessão no servidor antes da primeira renderização
(async () => {
  await Auth.hydrate();
  render();
})();
