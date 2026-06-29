// Tela de ensaio de voz do coralista.
// Modo guiado: o sistema percorre a MELODIA real do naipe (linha de voz do hino,
// definida pelo maestro) ou uma escala de aquecimento, e pontua nota a nota se o
// coralista está no tom — comparando o pitch cantado à nota-alvo do seu naipe.

function TrainerView(root) {
  const user = Auth.current;
  const voice = user.voice_type || 'tenor';
  const range = VOICE_RANGES[voice] || VOICE_RANGES.tenor;

  let hymns = [];
  let melody = [];          // [{midi, beats, label}]
  let bpm = 80;
  let currentHymn = null;
  let tracker = null;
  let synth = new RefSynth();
  let idx = 0;
  let noteStats = [];
  let running = false;
  let noteTimer = null;

  // Escala de aquecimento no centro do naipe (dó-ré-mi-fá-sol-fá-mi-ré-dó)
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

        <div class="field" style="margin-top:14px">
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
        <h3>Como funciona</h3>
        <p class="muted" style="line-height:1.6">
          1. Escolha o <b>hino</b> — o sistema carrega a <b>linha do seu naipe (${voice})</b>.<br>
          2. Toque <b>🔊 Ouvir melodia</b> para memorizar as notas.<br>
          3. Toque <b>Iniciar ensaio</b> e cante a vogal <b>“ah”</b> acompanhando cada nota destacada.<br>
          4. Cada nota fica <span style="color:var(--good)">verde</span> se você acertou o tom e
          <span style="color:var(--bad)">vermelha</span> se passou longe.
        </p>
        <div id="result" style="margin-top:16px"></div>
      </div>
    </div>
  `;

  const el = (s) => root.querySelector(s);
  const needle = el('#needle'), noteEl = el('#note'), freqEl = el('#freq');
  const statusEl = el('#status'), targetEl = el('#target'), melodyRow = el('#melodyRow');
  const startBtn = el('#startBtn'), listenBtn = el('#listenBtn'), hymnSel = el('#hymnSel');

  // ---- carregamento de hinos ------------------------------------------------
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
        `<span class="note-chip" data-i="${i}">${n.label}</span>`).join('')}</div>`;
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

  // ---- atualização em tempo real (tuner + coleta por nota) ------------------
  function onUpdate(p) {
    if (!p.freq) {
      noteEl.textContent = '—'; freqEl.textContent = 'cante mais forte…';
      statusEl.textContent = ''; needle.style.left = '50%'; return;
    }
    noteEl.innerHTML = `${p.note.name}<small>${p.note.octave}</small>`;
    freqEl.textContent = `${p.freq.toFixed(1)} Hz`;
    const cents = p.targetCents != null ? p.targetCents : p.cents;
    const clamped = Math.max(-50, Math.min(50, cents));
    needle.style.left = `${50 + clamped}%`;
    if (Math.abs(cents) <= 25) {
      needle.style.background = 'var(--good)'; statusEl.style.color = 'var(--good)';
      statusEl.textContent = '✓ No tom!';
    } else {
      needle.style.background = 'var(--bad)'; statusEl.style.color = 'var(--warn)';
      statusEl.textContent = cents < 0 ? '▲ Suba um pouco' : '▼ Abaixe um pouco';
    }
    if (running && noteStats[idx]) {
      const st = noteStats[idx];
      st.frames++;
      const a = Math.abs(cents);
      if (a < st.bestCents) st.bestCents = a;
      if (a <= 50) st.inTune++;
    }
  }

  // ---- engine guiado --------------------------------------------------------
  function noteDurSec(n) {
    const beatSec = Math.max(60 / bpm, 0.7);
    return Math.max(n.beats * beatSec, 1.0);
  }

  async function startExercise() {
    synth.stop();
    startBtn.innerHTML = '<span class="spinner"></span>';
    try {
      tracker = new PitchTracker({ voiceType: voice, onUpdate });
      await tracker.start();
    } catch {
      startBtn.textContent = 'Iniciar ensaio';
      statusEl.style.color = 'var(--bad)';
      statusEl.textContent = 'Não foi possível acessar o microfone.';
      return;
    }
    idx = 0;
    noteStats = melody.map(() => ({ frames: 0, inTune: 0, bestCents: 999 }));
    melodyRow.querySelectorAll('.note-chip').forEach((c) =>
      c.classList.remove('hit', 'miss', 'silent', 'current'));
    running = true;
    startBtn.textContent = 'Parar';
    startBtn.onclick = () => finish(false);
    listenBtn.disabled = true;
    el('#result').innerHTML = '';
    playNote();
  }

  function playNote() {
    if (!running) return;
    if (idx >= melody.length) return finish(true);
    tracker.setTarget(melody[idx].midi);
    highlight(idx);
    noteTimer = setTimeout(() => {
      const st = noteStats[idx];
      const hit = st.frames > 0 && (st.inTune / st.frames) >= 0.4;
      colorChip(idx, hit, st.frames === 0);
      idx++;
      playNote();
    }, noteDurSec(melody[idx]) * 1000);
  }

  async function finish(completed) {
    clearTimeout(noteTimer);
    running = false;
    const summary = tracker ? tracker.stop() : null;
    tracker = null;
    listenBtn.disabled = false;
    startBtn.textContent = 'Iniciar ensaio';
    startBtn.onclick = startExercise;
    needle.style.left = '50%';
    melodyRow.querySelectorAll('.note-chip.current').forEach((c) => c.classList.remove('current'));

    const sung = noteStats.filter((s) => s.frames > 0);
    if (!sung.length) {
      el('#result').innerHTML = '<p class="muted">Nenhuma voz detectada. Tente novamente mais perto do microfone.</p>';
      return;
    }
    const hits = noteStats.filter((s) => s.frames > 0 && (s.inTune / s.frames) >= 0.4).length;
    const noteAccuracy = Math.round((hits / melody.length) * 1000) / 10;
    const avgCents = Math.round(
      (sung.reduce((a, s) => a + s.bestCents, 0) / sung.length) * 10) / 10;

    try {
      await api('/sessions', { method: 'POST', body: {
        hymn_id: currentHymn?.id || null, voice_type: voice,
        duration_sec: summary?.duration_sec || 0, accuracy_pct: noteAccuracy,
        avg_cents_off: avgCents, median_freq: summary?.median_freq,
        low_freq: summary?.low_freq, high_freq: summary?.high_freq,
      }});
    } catch {}

    const grade = noteAccuracy >= 80 ? 'good' : noteAccuracy >= 55 ? 'warn' : 'bad';
    el('#result').innerHTML = `
      <div class="card" style="background:var(--card-2)">
        <h3>${completed ? 'Resultado do ensaio' : 'Ensaio interrompido'}</h3>
        <div class="row" style="gap:24px">
          <div class="kpi"><span class="label">Notas no tom</span><span class="value">${hits}/${melody.length}</span></div>
          <div class="kpi"><span class="label">Afinação</span><span class="value">${noteAccuracy}%</span></div>
          <div class="kpi"><span class="label">Desvio médio</span><span class="value">${avgCents}¢</span></div>
        </div>
        <p style="margin-top:10px"><span class="badge ${grade}">
          ${grade === 'good' ? 'Excelente! Você está no tom.' : grade === 'warn' ? 'Bom — continue praticando.' : 'Precisa melhorar a afinação.'}
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
    clearTimeout(noteTimer); running = false;
    if (tracker) { tracker.stop(); tracker = null; }
    synth.stop();
  }

  startBtn.onclick = startExercise;
  listenBtn.onclick = listen;
}
