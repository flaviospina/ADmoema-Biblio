// Tela de ensaio de voz do coralista.
// Exibe um exercício guiado: o sistema mostra uma nota-alvo dentro do naipe do
// coralista e indica, em tempo real, se ele está no tom, agudo ou grave.

function TrainerView(root) {
  const user = Auth.current;
  const voice = user.voice_type || 'tenor';
  const range = VOICE_RANGES[voice] || VOICE_RANGES.tenor;

  // Escala-guia: 5 notas confortáveis no centro do naipe.
  const baseMidi = freqToNote((range.min + range.max) / 2).midi;
  const exercise = [0, 2, 4, 5, 7].map((s) => baseMidi + s); // dó-ré-mi-fá-sol
  let step = 0;
  let tracker = null;

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
          <select id="hymnSel"><option value="">Treino livre (escala)</option></select>
        </div>

        <div class="tuner">
          <div class="target-note" id="target">Nota-alvo: <b>${freqToNote(exercise[0]).label}</b></div>
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
          <button class="btn lg" id="startBtn">Iniciar ensaio</button>
          <button class="btn ghost lg" id="prevBtn" disabled>◀ Nota</button>
          <button class="btn ghost lg" id="nextBtn" disabled>Nota ▶</button>
        </div>
      </div>

      <div class="card">
        <h3>Como funciona</h3>
        <p class="muted" style="line-height:1.6">
          1. Toque <b>Iniciar ensaio</b> e permita o uso do microfone.<br>
          2. Cante a vogal <b>“ah”</b> tentando alcançar a <b>nota-alvo</b>.<br>
          3. O ponteiro fica <span style="color:var(--good)">verde</span> quando você está no tom (±25¢).<br>
          4. Avance pelas notas do exercício e finalize para registrar sua evolução.
        </p>
        <div id="live" class="grid cols-2" style="margin-top:10px"></div>
        <div id="result" style="margin-top:16px"></div>
      </div>
    </div>
  `;

  const el = (id) => root.querySelector(id);
  const needle = el('#needle'), noteEl = el('#note'), freqEl = el('#freq');
  const statusEl = el('#status'), targetEl = el('#target');
  const startBtn = el('#startBtn'), prevBtn = el('#prevBtn'), nextBtn = el('#nextBtn');

  api('/hymns').then(({ hymns }) => {
    el('#hymnSel').innerHTML = '<option value="">Treino livre (escala)</option>' +
      hymns.map((h) => `<option value="${h.id}">${h.title}</option>`).join('');
  }).catch(() => {});

  function setTarget() {
    const midi = exercise[step];
    targetEl.innerHTML = `Nota-alvo: <b>${freqToNote(midi).label}</b> &nbsp;<span class="muted">(${step + 1}/${exercise.length})</span>`;
    if (tracker) tracker.setTarget(midi);
  }

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
      needle.style.background = 'var(--good)';
      statusEl.style.color = 'var(--good)';
      statusEl.textContent = '✓ No tom!';
    } else if (cents < 0) {
      needle.style.background = 'var(--bad)';
      statusEl.style.color = 'var(--warn)';
      statusEl.textContent = '▲ Suba um pouco';
    } else {
      needle.style.background = 'var(--bad)';
      statusEl.style.color = 'var(--warn)';
      statusEl.textContent = '▼ Abaixe um pouco';
    }
  }

  async function start() {
    startBtn.innerHTML = '<span class="spinner"></span>';
    try {
      tracker = new PitchTracker({ voiceType: voice, onUpdate });
      await tracker.start();
      setTarget();
      startBtn.textContent = 'Finalizar e salvar';
      startBtn.onclick = finish;
      prevBtn.disabled = nextBtn.disabled = false;
    } catch (e) {
      startBtn.textContent = 'Iniciar ensaio';
      statusEl.style.color = 'var(--bad)';
      statusEl.textContent = 'Não foi possível acessar o microfone.';
    }
  }

  async function finish() {
    const sel = el('#hymnSel').value;
    const summary = tracker.stop();
    tracker = null;
    startBtn.textContent = 'Iniciar ensaio';
    startBtn.onclick = start;
    prevBtn.disabled = nextBtn.disabled = true;
    needle.style.left = '50%';

    if (!summary.voiced_frames) {
      el('#result').innerHTML = '<p class="muted">Nenhuma voz detectada. Tente novamente.</p>';
      return;
    }
    try {
      await api('/sessions', { method: 'POST', body: {
        hymn_id: sel || null, voice_type: voice,
        duration_sec: summary.duration_sec, accuracy_pct: summary.accuracy_pct,
        avg_cents_off: summary.avg_cents_off, median_freq: summary.median_freq,
        low_freq: summary.low_freq, high_freq: summary.high_freq,
      }});
    } catch (e) {}

    const grade = summary.accuracy_pct >= 80 ? 'good' : summary.accuracy_pct >= 55 ? 'warn' : 'bad';
    el('#result').innerHTML = `
      <div class="card" style="background:var(--card-2)">
        <h3>Resultado do ensaio</h3>
        <div class="row" style="gap:24px">
          <div class="kpi"><span class="label">Afinação</span><span class="value">${summary.accuracy_pct}%</span></div>
          <div class="kpi"><span class="label">Desvio médio</span><span class="value">${summary.avg_cents_off}¢</span></div>
          <div class="kpi"><span class="label">Duração</span><span class="value">${Math.round(summary.duration_sec)}s</span></div>
        </div>
        <p style="margin-top:10px"><span class="badge ${grade}">
          ${grade === 'good' ? 'Excelente! Você está no tom.' : grade === 'warn' ? 'Bom — continue praticando.' : 'Precisa melhorar a afinação.'}
        </span></p>
        <p class="muted" style="font-size:13px">Sua evolução foi registrada. Veja em “Minha evolução”.</p>
      </div>`;
  }

  startBtn.onclick = start;
  prevBtn.onclick = () => { step = (step - 1 + exercise.length) % exercise.length; setTarget(); };
  nextBtn.onclick = () => { step = (step + 1) % exercise.length; setTarget(); };
}
