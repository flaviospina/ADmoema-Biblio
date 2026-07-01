import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { refreshSong } from "@/lib/songs";

export const dynamic = "force-dynamic";

async function loadShared(shareId: string) {
  const base = await prisma.song.findFirst({
    where: { shareId, isPublic: true },
    select: { id: true },
  });
  if (!base) return null;
  // Atualiza junto ao Suno para garantir que as faixas ja estejam persistidas,
  // mesmo que o dono nunca tenha aberto a pagina de detalhe.
  return refreshSong(base.id);
}

export async function generateMetadata({
  params,
}: {
  params: { shareId: string };
}): Promise<Metadata> {
  const song = await loadShared(params.shareId);
  if (!song) return { title: "Musica nao encontrada" };
  return {
    title: `${song.title} · Historia em Musica`,
    description: "Uma musica criada especialmente a partir de uma historia.",
  };
}

export default async function SharedSongPage({ params }: { params: { shareId: string } }) {
  const song = await loadShared(params.shareId);
  if (!song) notFound();

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-12">
      <div className="mb-6 text-center">
        <p className="text-xs uppercase tracking-widest text-brand-300">Uma musica para voce</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-100">{song.title}</h1>
      </div>

      {song.tracks.length > 0 ? (
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
              {t.audioUrl && <audio controls className="w-full" src={t.audioUrl} />}
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center text-sm text-slate-400">
          A musica ainda esta sendo finalizada. Volte em instantes.
        </div>
      )}

      <details className="card mt-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-300">Ver a letra</summary>
        <pre className="mt-3 whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-slate-200">
          {song.lyrics}
        </pre>
      </details>

      <p className="mt-8 text-center text-xs text-slate-600">
        Criada com{" "}
        <Link href="/" className="text-brand-400 hover:underline">
          Historia em Musica
        </Link>
      </p>
    </div>
  );
}
