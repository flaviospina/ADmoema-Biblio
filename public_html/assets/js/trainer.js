// ============================================================================
//  Ensaio de voz do coralista — versão aprimorada.
//  Modos: "Seguir as notas" (linha do naipe) e "Ouça e repita" (de ouvido).
//  Novidades: contagem regressiva, andamento ajustável, nota-guia opcional,
//  gráfico ao vivo da afinação e diagnóstico nota a nota ao final.
// ============================================================================

function TrainerView(root) {
  const user = Auth.current;
  const voice = user.voice_type || 'tenor';
  const range = VOICE_RANGES[voice] || VOICE_RANGES.tenor;

  let mode = 'follow';        // 'follow' | 'echo'
  let tempoFactor = 1;        // 1 normal · 0.8 calmo · 0.65 lento
  let guideOn = false;        // nota-guia durante o "Seguir as notas"
  let hymns = [];
  let melody = [];
  let bpm = 80;
  let currentHymn = null;
  let tracker = null;
  let synth = new RefSynth();
  let guideSynth = new RefSynth();
  let idx = 0;
  let noteStats = [];
  let active = false;
  let collecting = false;
  let noteTimer = null;
  // gráfico ao vivo
  let trace = [];             // {t: seg, cents, inTune}
  let traceStart = 0;
  let traceTotal = 30;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function warmupMelody() {
    const base = freqToNote((range.min + range.max) / 2).midi;
    return [0, 2, 4, 5, 7, 5, 4, 2, 0].map((s) => {
      const midi = base + s;
      return { midi, beats: 1, label: freqToNote(noteToFreq(midi)).label };
    });
  }

  root.innerHTML = `
    <h2 class="section-title">Ensaiar minha voz</h2>
    <div class="grid cols-2">
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Exercício de afinação</h3>
          <span class="naipe v-${voice}"><i class="dot"></i>${range.label}</span>
        </div>

        <div class="tabs" style="margin-top:14px">
          <button data-mode="follow" class="active">🎵 Seguir as notas</button>
          <button data-mode="echo">👂 Ouça e repita</button>
        </div>

        <div class="row">
          <div class="field" style="flex:2;min-width:180px">
            <label>Hino / Cantata</label>
            <select id="hymnSel"><option value="">Aquecimento (escala)</option></select>
          </div>
          <div class="field" style="flex:1;min-width:120px">
            <label>Andamento</label>
            <select id="tempoSel">
              <option value="1">Normal</option>
              <option value="0.8">Calmo</option>
              <option value="0.65">Lento</option>
            </select>
          </div>
        </div>

        <label class="row" id="guideRow" style="font-size:13px;color:var(--text-soft);gap:8px;margin-bottom:10px;cursor:pointer">
          <input type="checkbox" id="guideChk" style="width:auto" />
          Tocar nota-guia durante o exercício <span class="muted">(use fones 🎧)</span>
        </label>

        <div id="melodyRow" class="melody-row"></div>

        <div class="tuner">
          <div class="target-note" id="target">—</div>
          <div class="note-display"><span id="note">—</span></div>
          <div class="freq-line" id="freq">aguardando microfone…</div>
          <div class="gauge">
            <div class="center"></div>
            <div class="needle" id="needle"></div>
            <div class="scale"><span>-50¢</span><span>no tom</span><span>+50¢</span></div>
          </div>
          <div class="status-line" id="status"></div>
        </div>

        <div class="trace-wrap">
          <div class="muted" style="font-size:12px;margin-bottom:4px">Sua afinação durante o exercício <span style="float:right">▲ agudo · ▼ grave</span></div>
          <canvas id="trace" height="110"></canvas>
        </div>

        <div class="mic-controls">
          <button class="btn ghost lg" id="listenBtn">🔊 Ouvir melodia</button>
          <button class="btn lg" id="startBtn">Iniciar ensaio</button>
        </div>
      </div>

      <div class="card">
        <h3 id="helpTitle">Como funciona</h3>
        <div id="help"></div>
        <div id="result" style="margin-top:16px"></div>
      </div>
    </div>
  `;

  const el = (s) => root.querySelector(s);
  const needle = el('#needle'), noteEl = el('#note'), freqEl = el('#freq');
  const statusEl = el('#status'), targetEl = el('#target'), melodyRow = el('#melodyRow');
  const startBtn = el('#startBtn'), listenBtn = el('#listenBtn'), hymnSel = el('#hymnSel');
  const traceCanvas = el('#trace');

  const HELP = {
    follow: `<p class="muted" style="line-height:1.6">
        Para quem consegue acompanhar a sequência de notas.<br>
        1. Escolha o <b>hino</b> — carrega a <b>linha do seu naipe (${voice})</b>.<br>
        2. Toque <b>🔊 Ouvir melodia</b> para memorizar.<br>
        3. Toque <b>Iniciar</b>: após a contagem <b>3-2-1</b>, cante “ah” acompanhando a nota <b>destacada</b>.<br>
        4. Se precisar, reduza o <b>andamento</b> (Calmo/Lento) ou ative a <b>nota-guia</b> 🎧.<br>
        Cada nota fica <span style="color:var(--good)">verde</span> (no tom) ou
        <span style="color:var(--bad)">vermelha</span>.</p>`,
    echo: `<p class="muted" style="line-height:1.6">
        <b>Não precisa ler as notas.</b> Ideal para acompanhar “de ouvido”.<br>
        1. Toque <b>Iniciar</b>.<br>
        2. O sistema <b>🔊 toca uma nota</b> — apenas <b>ouça</b>.<br>
        3. Quando aparecer <b>🎤 Sua vez!</b>, <b>cante a mesma nota</b> (a vogal “ah”).<br>
        4. O sistema confere e passa para a próxima.<br>
        💡 Cante na altura confortável da sua voz — vale em qualquer oitava.</p>`,
  };
  function renderHelp() { el('#help').innerHTML = HELP[mode]; el('#guideRow').style.display = mode === 'follow' ? '' : 'none'; }
  renderHelp();

  el('#tempoSel').onchange = (e) => { tempoFactor = parseFloat(e.target.value); };
  el('#guideChk').onchange = (e) => { guideOn = e.target.checked; };

  // ---- hinos ----------------------------------------------------------------
  api('/hymns').then((d) => {
    hymns = d.hymns;
    hymnSel.innerHTML = '<option value="">Aquecimento (escala)</option>' +
      hymns.map((h) => `<option value="${h.id}">${h.title}</option>`).join('');
    loadMelody();
  }).catch(() => loadMelody());

  hymnSel.onchange = loadMelody;

  async function loadMelody() {
    stopAll();
    const id = hymnSel.value;
    if (!id) {
      currentHymn = null; bpm = 80; melody = warmupMelody();
      renderMelody('Aquecimento — escala do seu naipe.');
      return;
    }
    currentHymn = hymns.find((h) => String(h.id) === id);
    bpm = currentHymn?.bpm || 80;
    try {
      const { voice_lines } = await api(`/hymns/${id}/voice-lines`);
      const line = voice_lines.find((l) => l.voice_type === voice);
      if (line) {
        melody = parseMelody(line.notes_text);
        renderMelody(`Linha do naipe <b>${voice}</b> · ${melody.length} notas · ${bpm} BPM`);
      } else {
        melody = warmupMelody();
        renderMelody(`<span style="color:var(--warn)">O maestro ainda não definiu a linha de ${voice} para este hino.</span> Usando aquecimento.`);
      }
    } catch {
      melody = warmupMelody();
      renderMelody('Aquecimento — escala do seu naipe.');
    }
  }

  function renderMelody(caption) {
    melodyRow.innerHTML = `<div class="muted" style="font-size:13px;margin-bottom:8px">${caption}</div>
      <div class="chips">${melody.map((n, i) =>
        `<span class="note-chip" data-i="${i}">${mode === 'echo' ? (i + 1) : n.label}</span>`).join('')}</div>`;
    targetEl.innerHTML = melody.length ? `Nota-alvo: <b>${melody[0].label}</b>` : '';
    drawTrace();
  }

  function highlight(i) {
    melodyRow.querySelectorAll('.note-chip').forEach((c, j) =>
      c.classList.toggle('current', j === i));
    if (melody[i]) targetEl.innerHTML = `Nota-alvo: <b>${melody[i].label}</b> <span class="muted">(${i + 1}/${melody.length})</span>`;
  }

  function colorChip(i, hit, silent) {
    const c = melodyRow.querySelector(`.note-chip[data-i="${i}"]`);
    if (!c) return;
    c.classList.remove('current');
    c.classList.add(silent ? 'silent' : hit ? 'hit' : 'miss');
  }

  // ---- gráfico ao vivo (erro em cents ao longo do exercício) ----------------
  function drawTrace() {
    const ctx = traceCanvas.getContext('2d');
    const W = traceCanvas.width = traceCanvas.clientWidth * (window.devicePixelRatio || 1);
    const H = traceCanvas.height = 110 * (window.devicePixelRatio || 1);
    const css = getComputedStyle(document.documentElement);
    ctx.clearRect(0, 0, W, H);
    // fundo e faixas de tolerância
    ctx.fillStyle = css.getPropertyValue('--surface-2').trim() || '#f7f4ec';
    ctx.fillRect(0, 0, W, H);
    const yOf = (cents) => H / 2 - (Math.max(-200, Math.min(200, cents)) / 200) * (H / 2 - 6);
    ctx.fillStyle = 'rgba(79,122,82,.10)';
    ctx.fillRect(0, yOf(50), W, yOf(-50) - yOf(50));
    ctx.fillStyle = 'rgba(79,122,82,.16)';
    ctx.fillRect(0, yOf(25), W, yOf(-25) - yOf(25));
    ctx.strokeStyle = 'rgba(79,122,82,.55)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    // pontos cantados
    if (!trace.length) return;
    const xOf = (t) => Math.min(1, t / traceTotal) * (W - 8) + 4;
    for (const p of trace) {
      ctx.fillStyle = p.inTune ? '#4f7a52' : '#c0584a';
      ctx.beginPath();
      ctx.arc(xOf(p.t), yOf(p.cents), 2.2 * (window.devicePixelRatio || 1), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- tempo real -----------------------------------------------------------
  function onUpdate(p) {
    if (!p.freq) {
      noteEl.textContent = '—'; freqEl.textContent = 'cante mais forte…';
      needle.style.left = '50%'; return;
    }
    noteEl.innerHTML = `${p.note.name}<small>${p.note.octave}</small>`;
    freqEl.textContent = `${p.freq.toFixed(1)} Hz`;
    const cents = p.targetCents != null ? p.targetCents : p.cents;
    const clamped = Math.max(-50, Math.min(50, cents));
    needle.style.left = `${50 + clamped}%`;
    needle.style.background = Math.abs(cents) <= 50 ? 'var(--good)' : 'var(--bad)';

    if (collecting && noteStats[idx]) {
      const st = noteStats[idx];
      st.frames++;
      st.sum += cents;
      const a = Math.abs(cents);
      if (a < st.bestCents) st.bestCents = a;
      if (a <= 50) st.inTune++;
      trace.push({ t: (performance.now() - traceStart) / 1000, cents, inTune: a <= 50 });
      drawTrace();
    }
  }

  // ---- engines --------------------------------------------------------------
  function noteDurSec(n) {
    const beatSec = Math.max(60 / (bpm * tempoFactor), 0.7 / tempoFactor);
    return Math.max(n.beats * beatSec, 1.1 / tempoFactor);
  }

  function estimateTotal() {
    if (mode === 'follow') return melody.reduce((a, n) => a + noteDurSec(n), 0);
    return melody.reduce((a) => a + 0.95 + 0.12 + 2.6 / Math.max(tempoFactor, 0.8), 0);
  }

  function resetStats() {
    noteStats = melody.map(() => ({ frames: 0, inTune: 0, sum: 0, bestCents: 999 }));
    trace = [];
    traceTotal = Math.max(estimateTotal(), 5);
  }

  function evalNote(i) {
    const st = noteStats[i];
    const silent = st.frames < 3;
    const hit = !silent && (st.inTune / st.frames) >= 0.35;
    colorChip(i, hit, silent);
    return hit;
  }

  function setStatus(txt, color) {
    statusEl.style.color = color || 'var(--text)';
    statusEl.textContent = txt;
  }

  async function countIn() {
    for (const n of [3, 2, 1]) {
      if (!active) return false;
      setStatus(`Começando em ${n}…`, 'var(--brand-ink)');
      synth.playOne(81, 0.12, 0.18); // tique curto (A5)
      await sleep(600);
    }
    setStatus('');
    return active;
  }

  async function startExercise() {
    synth.stop();
    startBtn.innerHTML = '<span class="spinner"></span>';
    try {
      tracker = new PitchTracker({ voiceType: voice, onUpdate, octaveTolerant: true });
      await tracker.start();
    } catch {
      startBtn.textContent = 'Iniciar ensaio';
      setStatus('Não foi possível acessar o microfone.', 'var(--bad)');
      return;
    }
    resetStats();
    melodyRow.querySelectorAll('.note-chip').forEach((c) =>
      c.classList.remove('hit', 'miss', 'silent', 'current'));
    el('#result').innerHTML = '';
    drawTrace();
    active = true;
    startBtn.textContent = 'Parar';
    startBtn.onclick = () => finish(false);
    listenBtn.disabled = true;
    root.querySelectorAll('.tabs button').forEach((b) => b.disabled = true);

    if (mode === 'follow') {
      if (!(await countIn())) return;
      traceStart = performance.now();
      playFollowNote(0);
    } else {
      traceStart = performance.now();
      runEcho();
    }
  }

  // modo "seguir as notas": avanço contínuo
  function playFollowNote(i) {
    idx = i;
    if (!active) return;
    if (idx >= melody.length) return finish(true);
    tracker.setTarget(melody[idx].midi);
    highlight(idx);
    setStatus('🎤 Acompanhe a nota destacada');
    const dur = noteDurSec(melody[idx]);
    if (guideOn) guideSynth.playOne(melody[idx].midi, Math.min(dur * 0.85, 2.5), 0.10);
    collecting = true;
    noteTimer = setTimeout(() => {
      collecting = false;
      evalNote(idx);
      playFollowNote(idx + 1);
    }, dur * 1000);
  }

  // modo "ouça e repita": chamada-e-resposta
  async function runEcho() {
    const respondMs = 2600 / Math.max(tempoFactor, 0.8);
    for (idx = 0; idx < melody.length; idx++) {
      if (!active) return;
      tracker.setTarget(melody[idx].midi);
      highlight(idx);
      collecting = false;
      setStatus('🔊 Ouça a nota…');
      await synth.playOne(melody[idx].midi, 0.95);
      if (!active) return;
      setStatus('🎤 Sua vez! Cante a nota');
      collecting = true;
      await sleep(respondMs);
      collecting = false;
      if (!active) return;
      evalNote(idx);
    }
    finish(true);
  }

  async function finish(completed) {
    clearTimeout(noteTimer);
    active = false; collecting = false;
    const summary = tracker ? tracker.stop() : null;
    tracker = null;
    synth.stop(); guideSynth.stop();
    listenBtn.disabled = false;
    root.querySelectorAll('.tabs button').forEach((b) => b.disabled = false);
    startBtn.textContent = 'Iniciar ensaio';
    startBtn.onclick = startExercise;
    needle.style.left = '50%';
    melodyRow.querySelectorAll('.note-chip.current').forEach((c) => c.classList.remove('current'));
    setStatus('');

    const sung = noteStats.filter((s) => s.frames >= 3);
    if (!sung.length) {
      el('#result').innerHTML = '<p class="muted">Nenhuma voz detectada. Aproxime-se do microfone e tente novamente.</p>';
      return;
    }

    const detail = noteStats.map((st, i) => {
      const silent = st.frames < 3;
      const hit = !silent && (st.inTune / st.frames) >= 0.35;
      const mean = silent ? null : Math.round(st.sum / st.frames);
      return { n: melody[i].label, hit, c: mean, silent };
    });
    const hits = detail.filter((d) => d.hit).length;
    const noteAccuracy = Math.round((hits / melody.length) * 1000) / 10;
    const avgCents = Math.round((sung.reduce((a, s) => a + s.bestCents, 0) / sung.length) * 10) / 10;

    try {
      await api('/sessions', { method: 'POST', body: {
        hymn_id: currentHymn?.id || null, voice_type: voice,
        duration_sec: summary?.duration_sec || 0, accuracy_pct: noteAccuracy,
        avg_cents_off: avgCents, median_freq: summary?.median_freq,
        low_freq: summary?.low_freq, high_freq: summary?.high_freq,
        details: { mode, tempo: tempoFactor, notes: detail.map(({ n, hit, c }) => ({ n, hit, c })) },
      }});
    } catch {}

    // diagnóstico nota a nota: onde e como melhorar
    const misses = detail
      .map((d, i) => ({ ...d, pos: i + 1 }))
      .filter((d) => !d.hit && !d.silent);
    const tips = misses.slice(0, 6).map((d) => {
      const dir = (d.c ?? 0) > 12 ? '▼ você ficou <b>agudo</b> — relaxe e desça um pouco'
        : (d.c ?? 0) < -12 ? '▲ você ficou <b>grave</b> — apoie o ar e suba'
        : 'oscilou — sustente a nota com o ar firme';
      return `<li><b>${mode === 'echo' ? 'Nota ' + d.pos : d.n}</b>: ${dir} <span class="muted">(${d.c > 0 ? '+' : ''}${d.c}¢)</span></li>`;
    }).join('');
    const silentCount = detail.filter((d) => d.silent).length;

    const grade = noteAccuracy >= 70 ? 'good' : noteAccuracy >= 45 ? 'warn' : 'bad';
    el('#result').innerHTML = `
      <div class="card" style="background:var(--surface-2)">
        <h3 style="margin-bottom:10px">${completed ? 'Resultado do ensaio' : 'Ensaio interrompido'}
          <span class="muted" style="font-size:13px">· ${mode === 'echo' ? 'Ouça e repita' : 'Seguir as notas'}${tempoFactor < 1 ? ' · andamento reduzido' : ''}</span></h3>
        <div class="row" style="gap:24px">
          <div class="kpi"><span class="label">Notas no tom</span><span class="value">${hits}/${melody.length}</span></div>
          <div class="kpi"><span class="label">Afinação</span><span class="value">${noteAccuracy}%</span></div>
          <div class="kpi"><span class="label">Desvio médio</span><span class="value">${avgCents}¢</span></div>
        </div>
        <p style="margin:12px 0 6px"><span class="badge ${grade}">
          ${grade === 'good' ? 'Muito bem! Você está no tom.' : grade === 'warn' ? 'Bom — continue praticando.' : 'Precisa melhorar a afinação.'}
        </span></p>
        ${misses.length ? `<div style="margin-top:10px"><b style="font-size:14px">Onde melhorar</b>
          <ul class="muted" style="font-size:13.5px;line-height:1.7;margin:6px 0 0;padding-left:18px">${tips}</ul></div>` : ''}
        ${silentCount ? `<p class="muted" style="font-size:13px;margin-top:8px">${silentCount} nota(s) sem voz detectada — cante mais perto do microfone.</p>` : ''}
        <p class="muted" style="font-size:13px;margin-top:10px">Evolução registrada. Veja em “Minha evolução”.</p>
      </div>`;
  }

  // ---- ouvir melodia de referência -----------------------------------------
  async function listen() {
    if (!melody.length) return;
    listenBtn.disabled = true; startBtn.disabled = true;
    listenBtn.textContent = '♪ Tocando…';
    await synth.play(melody, bpm * tempoFactor, (i) => {
      melodyRow.querySelectorAll('.note-chip').forEach((c, j) =>
        c.classList.toggle('current', j === i));
    });
    melodyRow.querySelectorAll('.note-chip').forEach((c) => c.classList.remove('current'));
    listenBtn.disabled = false; startBtn.disabled = false;
    listenBtn.textContent = '🔊 Ouvir melodia';
  }

  function stopAll() {
    clearTimeout(noteTimer); active = false; collecting = false;
    if (tracker) { tracker.stop(); tracker = null; }
    synth.stop(); guideSynth.stop();
  }

  // ---- troca de modo --------------------------------------------------------
  root.querySelectorAll('.tabs button').forEach((b) => b.onclick = () => {
    if (active) return;
    mode = b.dataset.mode;
    root.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('active', x === b));
    renderHelp();
    renderMelody(melodyRow.querySelector('.muted')?.innerHTML || '');
  });

  startBtn.onclick = startExercise;
  listenBtn.onclick = listen;
  drawTrace();
}
