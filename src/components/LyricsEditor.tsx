"use client";

import { useState } from "react";
import type { SongDraft } from "@/lib/types";

interface Props {
  draft: SongDraft;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onConfirm: (draft: SongDraft, instrumental: boolean) => void;
}

export function LyricsEditor({ draft, loading, error, onBack, onConfirm }: Props) {
  const [title, setTitle] = useState(draft.title);
  const [lyrics, setLyrics] = useState(draft.lyrics);
  const [stylePrompt, setStylePrompt] = useState(draft.stylePrompt);
  const [instrumental, setInstrumental] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard indisponivel */
    }
  }

  function handleConfirm() {
    onConfirm({ ...draft, title, lyrics, stylePrompt }, instrumental);
  }

  return (
    <div className="card space-y-6">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="label mb-0" htmlFor="edit-title">
            Titulo
          </label>
          <button className="text-xs text-brand-300 hover:underline" onClick={() => copy(title, "title")}>
            {copied === "title" ? "Copiado!" : "Copiar"}
          </button>
        </div>
        <input
          id="edit-title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="label mb-0" htmlFor="edit-lyrics">
            Letra (com marcacoes do Suno)
          </label>
          <button className="text-xs text-brand-300 hover:underline" onClick={() => copy(lyrics, "lyrics")}>
            {copied === "lyrics" ? "Copiado!" : "Copiar"}
          </button>
        </div>
        <textarea
          id="edit-lyrics"
          className="input min-h-[280px] resize-y font-mono text-[13px] leading-relaxed"
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="label mb-0" htmlFor="edit-style">
            Estilo (prompt Suno)
          </label>
          <span className={stylePrompt.length > 200 ? "text-xs text-red-400" : "text-xs text-slate-500"}>
            {stylePrompt.length}/200
          </span>
        </div>
        <input
          id="edit-style"
          className="input"
          value={stylePrompt}
          maxLength={200}
          onChange={(e) => setStylePrompt(e.target.value)}
        />
      </div>

      {draft.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {draft.tags.map((t) => (
            <span key={t} className="chip-off cursor-default">
              {t}
            </span>
          ))}
        </div>
      )}

      {draft.notes && (
        <p className="rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Notas da IA: </span>
          {draft.notes}
        </p>
      )}

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          className="h-4 w-4 accent-brand-500"
          checked={instrumental}
          onChange={(e) => setInstrumental(e.target.checked)}
        />
        Gerar versao instrumental (sem vocais)
      </label>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <button className="btn-ghost" onClick={onBack} disabled={loading}>
          ← Voltar
        </button>
        <button className="btn-primary" onClick={handleConfirm} disabled={loading}>
          {loading ? "Enviando ao Suno..." : "Gerar musica 🎵"}
        </button>
      </div>
    </div>
  );
}
