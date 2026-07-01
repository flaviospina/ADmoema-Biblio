import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { refreshSong, serializeSong } from "@/lib/songs";
import { StatusBadge } from "@/components/StatusBadge";
import { SongDetailActions } from "@/components/SongDetailActions";

export const dynamic = "force-dynamic";

export default async function MusicaPage({ params }: { params: { id: string } }) {
  const session = await getSession();

  const owner = await prisma.song.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!owner) notFound();
  if (owner.userId !== session!.sub && session!.role !== "ADMIN") notFound();

  const fresh = await refreshSong(params.id);
  if (!fresh) notFound();
  const song = serializeSong(fresh);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/historico" className="text-sm text-slate-400 hover:text-slate-200">
          ← Historico
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-100">{song.title}</h1>
        <StatusBadge status={song.status} />
      </div>

      {song.status === "complete" && song.tracks.length > 0 ? (
        <div className="space-y-3">
          {song.tracks.map((t) => (
            <div key={t.id} className="card">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium text-slate-100">{t.title}</p>
                {t.audioUrl && (
                  <a href={t.audioUrl} download className="text-xs text-brand-300 hover:underline">
                    Baixar
                  </a>
                )}
              </div>
              {t.audioUrl ? (
                <audio controls preload="none" className="w-full" src={t.audioUrl} />
              ) : (
                <p className="text-xs text-slate-500">Audio indisponivel.</p>
              )}
            </div>
          ))}
        </div>
      ) : song.status === "failed" ? (
        <div className="card text-sm text-red-300">A geracao desta musica falhou.</div>
      ) : (
        <div className="card text-sm text-slate-400">
          Esta musica ainda esta sendo gerada. Atualize a pagina em instantes.
        </div>
      )}

      <div className="card space-y-4">
        <div>
          <p className="label">Estilo (Suno)</p>
          <p className="text-sm text-slate-300">{song.stylePrompt}</p>
        </div>
        <div>
          <p className="label">Letra</p>
          <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-slate-200">
            {song.lyrics}
          </pre>
        </div>
        {song.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {song.tags.map((t) => (
              <span key={t} className="chip-off cursor-default">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <SongDetailActions
        songId={song.id}
        initialIsPublic={song.isPublic}
        initialShareId={song.shareId}
      />
    </div>
  );
}
