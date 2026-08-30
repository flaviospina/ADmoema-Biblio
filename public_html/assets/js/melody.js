// Interpretação de melodias (linha de voz por naipe) e tom de referência.
// Formato textual: tokens separados por espaço, cada um "Nota[:tempos]".
//   Ex.: "C4 D4 E4:2 F4"  → Mi dura 2 tempos, os demais 1 tempo.

const NOTE_BASE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function noteNameToMidi(name) {
  const m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(name.trim());
  if (!m) return null;
  const semis = NOTE_BASE[m[1].toUpperCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const octave = parseInt(m[3], 10);
  return (octave + 1) * 12 + semis; // C4 = 60, A4 = 69
}

// Texto -> [{ midi, beats, label }]
function parseMelody(text) {
  if (!text) return [];
  return text.trim().split(/\s+/).map((tok) => {
    const [nm, beatsRaw] = tok.split(':');
    const midi = noteNameToMidi(nm);
    if (midi == null) return null;
    const beats = beatsRaw ? Math.max(0.25, parseFloat(beatsRaw)) : 1;
    return { midi, beats, label: freqToNote(noteToFreq(midi)).label };
  }).filter(Boolean);
}

function melodyIsValid(text) {
  const toks = (text || '').trim().split(/\s+/).filter(Boolean);
  return toks.length > 0 && toks.every((t) => noteNameToMidi(t.split(':')[0]) != null);
}

// Sintetizador simples para tocar a melodia de referência (sem microfone ativo).
class RefSynth {
  constructor() { this.ctx = null; this.stopFlag = false; }

  async play(melody, bpm = 90, onNote) {
    this.stop();
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.stopFlag = false;
    const beat = 60 / bpm;
    let t = this.ctx.currentTime + 0.1;
    const timers = [];
    melody.forEach((n, i) => {
      const dur = n.beats * beat;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = noteToFreq(n.midi);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.setValueAtTime(0.25, t + dur - 0.05);
      gain.gain.linearRampToValueAtTime(0, t + dur);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t); osc.stop(t + dur);
      const ms = (t - this.ctx.currentTime) * 1000;
      timers.push(setTimeout(() => { if (!this.stopFlag && onNote) onNote(i); }, ms));
      t += dur;
    });
    this._timers = timers;
    const totalMs = (t - this.ctx.currentTime) * 1000;
    return new Promise((resolve) => {
      this._end = setTimeout(() => { if (onNote) onNote(-1); resolve(); }, totalMs + 100);
    });
  }

  // Toca uma única nota (modo "Ouça e repita", nota-guia e contagem).
  async playOne(midi, durSec = 0.9, vol = 0.28) {
    this.stop();
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.stopFlag = false;
    const t = this.ctx.currentTime + 0.05;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = noteToFreq(midi);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.02);
    gain.gain.setValueAtTime(vol, t + durSec - 0.05);
    gain.gain.linearRampToValueAtTime(0, t + durSec);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t); osc.stop(t + durSec);
    return new Promise((resolve) => { this._end = setTimeout(resolve, (durSec + 0.12) * 1000); });
  }

  stop() {
    this.stopFlag = true;
    (this._timers || []).forEach(clearTimeout);
    clearTimeout(this._end);
    if (this.ctx) { try { this.ctx.close(); } catch {} this.ctx = null; }
  }
}
