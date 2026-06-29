// Tela de ensaio de voz do coralista — dois modos:
//   • "Seguir as notas": percorre a linha do naipe nota a nota (para quem lê/acompanha).
//   • "Ouça e repita": o sistema toca cada nota e o coralista imita (sem ler partitura).
// A comparação é tolerante a oitava: cada voz canta na altura confortável do seu naipe.

function TrainerView(root) {
  const user = Auth.current;
  const voice = user.voice_type || 'tenor';
  const range = VOICE_RANGES[voice] || VOICE_RANGES.tenor;

  let mode = 'follow';      // 'follow' | 'echo'
  let hymns = [];
  let melody = [];
  let bpm = 80;
  let currentHymn = null;
  let tracker = null;
  let synth = new RefSynth();
  let idx = 0;
  let noteStats = [];
  let active = false;       // exercício em andamento
  let collecting = false;   // acumulando frames da nota atual
  let noteTimer = null;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function warmupMelody() {
    const base = freqToNote((range.min + range.max) / 2).midi;
    return [0, 2, 4, 5, 7, 5, 4, 2, 0].map((s) => {
      const midi = base + s;
      return { midi, beats: 1, label: freqToNote(noteToFreq(midi)).label };
    });
  }

  root.innerHTML = `
    <h2 class="section-title">🎤 Ensaiar minha voz</h2>
    <div class="grid cols-2">
      <div class="card">
        <div class="row" style="justify-content:space-between">
          <h3 style="margin:0">Exercício de afinação</h3>
          <span class="badge ${voice}">${range.label}</span>
        </div>

        <div class="tabs" style="margin-top:14px">
          <button data-mode="follow" class="active">🎵 Seguir as notas</button>
          <button data-mode="echo">👂 Ouça e repita</button>
        </div>

        <div class="field">
          <label>Hino / Cantata</label>
          <select id="hymnSel"><option value="">Aquecimento (escala)</option></select>
        </div>

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

  const HELP = {
    follow: `<p class="muted" style="line-height:1.6">
        Para quem consegue acompanhar a sequência de notas.<br>
        1. Escolha o <b>hino</b> — carrega a <b>linha do seu naipe (${voice})</b>.<br>
        2. Toque <b>🔊 Ouvir melodia</b> para memorizar.<br>
        3. Toque <b>Iniciar</b> e cante “ah” acompanhando a nota <b>destacada</b>.<br>
        Cada nota fica <span style="color:var(--good)">verde</span> (no tom) ou
        <span style="color:var(--bad)">vermelha</span>.</p>`,
    echo: `<p class="muted" style="line-height:1.6">
        <b>Não precisa ler as notas.</b> Ideal para acompanhar “de ouvido”.<br>
        1. Toque <b>Iniciar</b>.<br>
        2. O sistema <b>🔊 toca uma nota</b> — apenas <b>ouça</b>.<br>
        3. Quando aparecer <b>🎤 Sua vez!</b>, <b>cante a mesma nota</b> (a vogal “ah”).<br>
        4. O sistema confere se você repetiu no tom e passa para a próxima.<br>
        💡 Cante na altura confortável da sua voz — vale em qualquer oitava.</p>`,
  };
  function renderHelp() { el('#help').innerHTML = HELP[mode]; }
  renderHelp();

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
      const a = Math.abs(cents);
      if (a < st.bestCents) st.bestCents = a;
      if (a <= 50) st.inTune++;
    }
  }

  // ---- engines --------------------------------------------------------------
  function noteDurSec(n) {
    const beatSec = Math.max(60 / bpm, 0.7);
    return Math.max(n.beats * beatSec, 1.1);
  }

  function resetStats() { noteStats = melody.map(() => ({ frames: 0, inTune: 0, bestCents: 999 })); }
  function evalNote(i) {
    const st = noteStats[i];
    const silent = st.frames < 3;
    const hit = !silent && (st.inTune / st.frames) >= 0.35;
    colorChip(i, hit, silent);
    return hit;
  }

  async function openMic() {
    tracker = new PitchTracker({ voiceType: voice, onUpdate, octaveTolerant: true });
    await tracker.start();
  }

  async function startExercise() {
    synth.stop();
    startBtn.innerHTML = '<span class="spinner"></span>';
    try { await openMic(); }
    catch {
      startBtn.textContent = 'Iniciar ensaio';
      statusEl.style.color = 'var(--bad)';
      statusEl.textContent = 'Não foi possível acessar o microfone.';
      return;
    }
    resetStats();
    melodyRow.querySelectorAll('.note-chip').forEach((c) =>
      c.classList.remove('hit', 'miss', 'silent', 'current'));
    el('#result').innerHTML = '';
    active = true;
    startBtn.textContent = 'Parar';
    startBtn.onclick = () => finish(false);
    listenBtn.disabled = true;
    el('.tabs') && root.querySelectorAll('.tabs button').forEach((b) => b.disabled = true);
    if (mode === 'follow') playFollowNote(0);
    else runEcho();
  }

  // modo "seguir as notas": avanço contínuo
  function playFollowNote(i) {
    idx = i;
    if (!active) return;
    if (idx >= melody.length) return finish(true);
    tracker.setTarget(melody[idx].midi);
    highlight(idx);
    setStatus('🎤 Acompanhe a nota destacada');
    collecting = true;
    noteTimer = setTimeout(() => {
      collecting = false;
      evalNote(idx);
      playFollowNote(idx + 1);
    }, noteDurSec(melody[idx]) * 1000);
  }

  // modo "ouça e repita": chamada-e-resposta
  async function runEcho() {
    for (idx = 0; idx < melody.length; idx++) {
      if (!active) return;
      tracker.setTarget(melody[idx].midi);
      highlight(idx);
      collecting = false;
      setStatus('🔊 Ouça a nota…');
      await synth.playOne(melody[idx].midi, 0.95);
      if (!active) return;
      noteStats[idx] = { frames: 0, inTune: 0, bestCents: 999 };
      setStatus('🎤 Sua vez! Cante a nota');
      collecting = true;
      await sleep(2600);
      collecting = false;
      if (!active) return;
      evalNote(idx);
    }
    finish(true);
  }

  function setStatus(txt) { statusEl.style.color = 'var(--text)'; statusEl.textContent = txt; }

  async function finish(completed) {
    clearTimeout(noteTimer);
    active = false; collecting = false;
    const summary = tracker ? tracker.stop() : null;
    tracker = null;
    synth.stop();
    listenBtn.disabled = false;
    root.querySelectorAll('.tabs button').forEach((b) => b.disabled = false);
    startBtn.textContent = 'Iniciar ensaio';
    startBtn.onclick = startExercise;
    needle.style.left = '50%';
    melodyRow.querySelectorAll('.note-chip.current').forEach((c) => c.classList.remove('current'));
    statusEl.textContent = '';

    const sung = noteStats.filter((s) => s.frames >= 3);
    if (!sung.length) {
      el('#result').innerHTML = '<p class="muted">Nenhuma voz detectada. Aproxime-se do microfone e tente novamente.</p>';
      return;
    }
    const hits = noteStats.filter((s) => s.frames >= 3 && (s.inTune / s.frames) >= 0.35).length;
    const noteAccuracy = Math.round((hits / melody.length) * 1000) / 10;
    const avgCents = Math.round((sung.reduce((a, s) => a + s.bestCents, 0) / sung.length) * 10) / 10;

    try {
      await api('/sessions', { method: 'POST', body: {
        hymn_id: currentHymn?.id || null, voice_type: voice,
        duration_sec: summary?.duration_sec || 0, accuracy_pct: noteAccuracy,
        avg_cents_off: avgCents, median_freq: summary?.median_freq,
        low_freq: summary?.low_freq, high_freq: summary?.high_freq,
      }});
    } catch {}

    const grade = noteAccuracy >= 70 ? 'good' : noteAccuracy >= 45 ? 'warn' : 'bad';
    el('#result').innerHTML = `
      <div class="card" style="background:var(--card-2)">
        <h3>${completed ? 'Resultado do ensaio' : 'Ensaio interrompido'}
          <span class="muted" style="font-size:13px">· ${mode === 'echo' ? 'Ouça e repita' : 'Seguir as notas'}</span></h3>
        <div class="row" style="gap:24px">
          <div class="kpi"><span class="label">Notas no tom</span><span class="value">${hits}/${melody.length}</span></div>
          <div class="kpi"><span class="label">Afinação</span><span class="value">${noteAccuracy}%</span></div>
          <div class="kpi"><span class="label">Desvio médio</span><span class="value">${avgCents}¢</span></div>
        </div>
        <p style="margin-top:10px"><span class="badge ${grade}">
          ${grade === 'good' ? 'Muito bem! Você está no tom.' : grade === 'warn' ? 'Bom — continue praticando.' : 'Precisa melhorar a afinação.'}
        </span></p>
        <p class="muted" style="font-size:13px">Evolução registrada. Veja em “Minha evolução”.</p>
      </div>`;
  }

  // ---- ouvir melodia de referência -----------------------------------------
  async function listen() {
    if (!melody.length) return;
    listenBtn.disabled = true; startBtn.disabled = true;
    listenBtn.textContent = '♪ Tocando…';
    await synth.play(melody, bpm, (i) => {
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
    synth.stop();
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
}
