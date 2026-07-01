"use client";

import Link from "next/link";
import type { MusicJob } from "@/lib/types";

interface Props {
  job: MusicJob | null;
  songId?: string | null;
  polling: boolean;
  error: string | null;
  onRestart: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  queued: "Na fila...",
  processing: "Compondo a musica...",
  complete: "Pronto!",
  failed: "Falhou",
};

export function MusicPlayer({ job, songId, polling, error, onRestart }: Props) {
  const status = job?.status ?? "queued";
  const done = status === "complete";
  const failed = status === "failed" || Boolean(error);

  return (
    <div className="card space-y-6">
      {!done && !failed && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-400" />
          <p className="text-sm text-slate-300">{STATUS_LABEL[status]}</p>
          <p className="text-xs text-slate-500">
            A geracao no Suno costuma levar de 30s a 2 minutos. Nao feche a pagina.
          </p>
        </div>
      )}

      {failed && (
        <div className="space-y-4 py-4 text-center">
          <p className="text-sm text-red-300">{error || job?.error || "Nao foi possivel gerar a musica."}</p>
          <button className="btn-ghost" onClick={onRestart}>
            Tentar de novo
          </button>
        </div>
      )}

      {done && job && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-sm text-brand-200">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/30">
              ✓
            </span>
            Musica gerada! {job.tracks.length > 1 && "Escolha a versao que preferir."}
          </div>

          {job.tracks.map((track) => (
            <div key={track.id} className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium text-slate-100">{track.title}</p>
                {track.audioUrl && (
                  <a
                    href={track.audioUrl}
                    download
                    className="shrink-0 text-xs text-brand-300 hover:underline"
                  >
                    Baixar
                  </a>
                )}
              </div>
              {track.audioUrl ? (
                <audio controls preload="none" className="w-full" src={track.audioUrl} />
              ) : (
                <p className="text-xs text-slate-500">Audio indisponivel.</p>
              )}
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {songId && (
              <Link href={`/musica/${songId}`} className="btn-primary">
                Ver detalhes e compartilhar
              </Link>
            )}
            <button className="btn-ghost" onClick={onRestart}>
              Criar outra musica
            </button>
          </div>
        </div>
      )}

      {polling && !done && !failed && (
        <p className="text-center text-xs text-slate-600">Atualizando status automaticamente...</p>
      )}
    </div>
  );
}
