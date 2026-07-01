"use client";

import { useState } from "react";
import {
  GENRES,
  INSTRUMENTS,
  MOODS,
  LANGUAGES,
  VOICE_LABELS,
  TEMPO_LABELS,
} from "@/lib/catalog";
import { VOICE_TYPES, TEMPOS, type Briefing, type VoiceType, type Tempo } from "@/lib/types";

interface Props {
  loading: boolean;
  error: string | null;
  onSubmit: (b: Briefing) => void;
}

export function StoryForm({ loading, error, onSubmit }: Props) {
  const [story, setStory] = useState("");
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [voiceType, setVoiceType] = useState<VoiceType>("feminina");
  const [tempo, setTempo] = useState<Tempo>("moderada");
  const [instruments, setInstruments] = useState<string[]>([]);
  const [arrangement, setArrangement] = useState("");
  const [dedicatedTo, setDedicatedTo] = useState("");
  const [title, setTitle] = useState("");

  function toggleInstrument(name: string) {
    setInstruments((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      story,
      language,
      genre,
      mood,
      voiceType,
      tempo,
      instruments,
      arrangement,
      dedicatedTo,
      title,
    });
  }

  const storyTooShort = story.trim().length < 20;

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <div>
        <label className="label" htmlFor="story">
          Sua historia <span className="text-brand-300">*</span>
        </label>
        <textarea
          id="story"
          className="input min-h-[160px] resize-y"
          placeholder="Conte a historia que deve virar musica: pessoas, momentos, sentimentos, uma data especial, uma homenagem..."
          value={story}
          onChange={(e) => setStory(e.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">
          {story.trim().length} caracteres. Quanto mais detalhes, melhor a letra.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="genre">
            Genero / estilo
          </label>
          <input
            id="genre"
            list="genres"
            className="input"
            placeholder="Ex.: MPB, sertanejo, gospel..."
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          />
          <datalist id="genres">
            {GENRES.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="label" htmlFor="mood">
            Clima / emocao
          </label>
          <input
            id="mood"
            list="moods"
            className="input"
            placeholder="Ex.: emocionante, alegre..."
            value={mood}
            onChange={(e) => setMood(e.target.value)}
          />
          <datalist id="moods">
            {MOODS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="label" htmlFor="voice">
            Voz
          </label>
          <select
            id="voice"
            className="input"
            value={voiceType}
            onChange={(e) => setVoiceType(e.target.value as VoiceType)}
          >
            {VOICE_TYPES.map((v) => (
              <option key={v} value={v}>
                {VOICE_LABELS[v]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="tempo">
            Andamento
          </label>
          <select
            id="tempo"
            className="input"
            value={tempo}
            onChange={(e) => setTempo(e.target.value as Tempo)}
          >
            {TEMPOS.map((t) => (
              <option key={t} value={t}>
                {TEMPO_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="language">
            Idioma da letra
          </label>
          <select
            id="language"
            className="input"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="dedicated">
            Dedicada a (opcional)
          </label>
          <input
            id="dedicated"
            className="input"
            placeholder="Nome da pessoa homenageada"
            value={dedicatedTo}
            onChange={(e) => setDedicatedTo(e.target.value)}
          />
        </div>
      </div>

      <div>
        <span className="label">Instrumentos</span>
        <div className="flex flex-wrap gap-2">
          {INSTRUMENTS.map((name) => {
            const on = instruments.includes(name);
            return (
              <button
                type="button"
                key={name}
                className={on ? "chip-on" : "chip-off"}
                onClick={() => toggleInstrument(name)}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="title">
            Titulo desejado (opcional)
          </label>
          <input
            id="title"
            className="input"
            placeholder="Deixe em branco para a IA sugerir"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="arrangement">
            Arranjo / observacoes (opcional)
          </label>
          <input
            id="arrangement"
            className="input"
            placeholder="Ex.: solo de violao na ponte, crescendo no final"
            value={arrangement}
            onChange={(e) => setArrangement(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        {storyTooShort && (
          <span className="text-xs text-slate-500">Escreva ao menos 20 caracteres.</span>
        )}
        <button type="submit" className="btn-primary" disabled={loading || storyTooShort}>
          {loading ? "Compondo a letra..." : "Gerar letra ✨"}
        </button>
      </div>
    </form>
  );
}
