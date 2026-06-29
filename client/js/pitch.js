// ============================================================================
//  Motor de análise de voz — detecção de altura (pitch) em tempo real.
//  Processamento 100% no navegador (Web Audio API): a voz não sai do dispositivo.
// ============================================================================

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Faixas de referência aproximadas por naipe (Hz) — usadas para fixar a oitava
// e evitar o "erro de oitava" que atrapalha detectores genéricos com cantores.
const VOICE_RANGES = {
  soprano:   { min: 261.6, max: 1046.5, label: 'Soprano (C4–C6)' },
  contralto: { min: 174.6, max: 698.5,  label: 'Contralto (F3–F5)' },
  tenor:     { min: 130.8, max: 523.3,  label: 'Tenor (C3–C5)' },
  baixo:     { min: 82.4,  max: 329.6,  label: 'Baixo (E2–E4)' },
};

function freqToNote(freq) {
  const noteNum = 12 * (Math.log2(freq / 440)) + 69; // A4 = 440Hz = MIDI 69
  const rounded = Math.round(noteNum);
  const cents = Math.round((noteNum - rounded) * 100);
  const name = NOTE_NAMES[(rounded % 12 + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return { name, octave, cents, midi: rounded, label: `${name}${octave}` };
}

function noteToFreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

// Autocorrelação normalizada (ACF) — robusta para voz cantada.
function autoCorrelate(buf, sampleRate, minFreq, maxFreq) {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // silêncio / sinal fraco

  const maxLag = Math.floor(sampleRate / minFreq);
  const minLag = Math.floor(sampleRate / maxFreq);
  let bestLag = -1, bestCorr = 0;
  let lastCorr = 1;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i < SIZE - lag; i++) corr += buf[i] * buf[i + lag];
    corr /= (SIZE - lag);
    if (corr > 0.9 * bestCorr && corr > lastCorr) {
      if (corr > bestCorr) { bestCorr = corr; bestLag = lag; }
    }
    lastCorr = corr;
  }
  if (bestLag === -1 || bestCorr < 0.01) return -1;

  // Interpolação parabólica para refinar o lag
  const y1 = corrAt(buf, bestLag - 1, SIZE);
  const y2 = corrAt(buf, bestLag, SIZE);
  const y3 = corrAt(buf, bestLag + 1, SIZE);
  const shift = (y3 - y1) / (2 * (2 * y2 - y1 - y3) || 1);
  return sampleRate / (bestLag + shift);
}

function corrAt(buf, lag, SIZE) {
  if (lag < 1) return 0;
  let corr = 0;
  for (let i = 0; i < SIZE - lag; i++) corr += buf[i] * buf[i + lag];
  return corr / (SIZE - lag);
}

// ----------------------------------------------------------------------------
//  PitchTracker — encapsula o microfone + loop de análise.
// ----------------------------------------------------------------------------
class PitchTracker {
  constructor({ voiceType = 'tenor', onUpdate } = {}) {
    this.range = VOICE_RANGES[voiceType] || VOICE_RANGES.tenor;
    this.onUpdate = onUpdate;
    this.running = false;
    this.samples = [];        // frequências detectadas
    this.centsErrors = [];    // |cents| em relação à nota alvo (se houver)
    this.inTuneFrames = 0;
    this.totalVoicedFrames = 0;
    this.startedAt = null;
    this.targetMidi = null;   // nota alvo (MIDI) para o exercício
  }

  setTarget(midi) { this.targetMidi = midi; }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    src.connect(this.analyser);
    this.buf = new Float32Array(this.analyser.fftSize);
    this.running = true;
    this.startedAt = performance.now();
    this._loop();
  }

  _loop() {
    if (!this.running) return;
    this.analyser.getFloatTimeDomainData(this.buf);
    // amplia um pouco a faixa de busca além do naipe para tolerar extremos
    const f = autoCorrelate(this.buf, this.ctx.sampleRate, this.range.min * 0.7, this.range.max * 1.4);

    let payload = { freq: null, note: null, cents: null, targetCents: null, inTune: false };
    if (f > 0) {
      this.samples.push(f);
      const note = freqToNote(f);
      payload.freq = f;
      payload.note = note;
      payload.cents = note.cents;
      this.totalVoicedFrames++;

      if (this.targetMidi != null) {
        const targetFreq = noteToFreq(this.targetMidi);
        const centsOff = Math.round(1200 * Math.log2(f / targetFreq));
        payload.targetCents = centsOff;
        payload.inTune = Math.abs(centsOff) <= 25;       // ±25 cents = "no tom"
        this.centsErrors.push(Math.abs(centsOff));
        if (payload.inTune) this.inTuneFrames++;
      } else {
        payload.inTune = Math.abs(note.cents) <= 25;
        this.centsErrors.push(Math.abs(note.cents));
        if (payload.inTune) this.inTuneFrames++;
      }
    }
    this.onUpdate && this.onUpdate(payload);
    this._raf = requestAnimationFrame(() => this._loop());
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this._raf);
    this.stream && this.stream.getTracks().forEach((t) => t.stop());
    this.ctx && this.ctx.close();
    return this.summary();
  }

  // Métricas agregadas da sessão
  summary() {
    const dur = this.startedAt ? (performance.now() - this.startedAt) / 1000 : 0;
    const freqs = [...this.samples].sort((a, b) => a - b);
    const median = freqs.length ? freqs[Math.floor(freqs.length / 2)] : null;
    const low = freqs.length ? freqs[Math.floor(freqs.length * 0.05)] : null;
    const high = freqs.length ? freqs[Math.floor(freqs.length * 0.95)] : null;
    const avgCents = this.centsErrors.length
      ? this.centsErrors.reduce((a, b) => a + b, 0) / this.centsErrors.length : 0;
    const accuracy = this.totalVoicedFrames
      ? (this.inTuneFrames / this.totalVoicedFrames) * 100 : 0;
    return {
      duration_sec: dur,
      accuracy_pct: Math.round(accuracy * 10) / 10,
      avg_cents_off: Math.round(avgCents * 10) / 10,
      median_freq: median,
      low_freq: low,
      high_freq: high,
      voiced_frames: this.totalVoicedFrames,
    };
  }
}
