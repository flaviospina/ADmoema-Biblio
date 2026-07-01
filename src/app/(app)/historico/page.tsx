import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function HistoricoPage() {
  const session = await getSession();
  const songs = await prisma.song.findMany({
    where: { userId: session!.sub },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      isPublic: true,
      createdAt: true,
      _count: { select: { tracks: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">Minhas musicas</h1>
        <Link href="/" className="btn-primary">
          + Nova musica
        </Link>
      </div>

      {songs.length === 0 ? (
        <div className="card text-center text-sm text-slate-400">
          Voce ainda nao criou nenhuma musica.{" "}
          <Link href="/" className="text-brand-300 hover:underline">
            Comece agora
          </Link>
          .
        </div>
      ) : (
        <ul className="space-y-3">
          {songs.map((s) => (
            <li key={s.id}>
              <Link
                href={`/musica/${s.id}`}
                className="card flex items-center justify-between gap-4 transition hover:border-brand-400/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-100">{s.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {new Date(s.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    {s._count.tracks > 0 && ` · ${s._count.tracks} faixa(s)`}
                    {s.isPublic && " · compartilhada"}
                  </p>
                </div>
                <StatusBadge status={s.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
