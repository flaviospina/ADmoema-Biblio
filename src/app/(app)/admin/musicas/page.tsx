import Link from "next/link";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminMusicasPage() {
  const songs = await prisma.song.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-sm text-slate-400 hover:text-slate-200">
          ← Painel
        </Link>
      </div>
      <h1 className="text-xl font-bold text-slate-100">Todas as musicas</h1>

      {songs.length === 0 ? (
        <div className="card text-sm text-slate-400">Nenhuma musica ainda.</div>
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
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {s.user.name} ({s.user.email}) ·{" "}
                    {new Date(s.createdAt).toLocaleDateString("pt-BR")}
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
