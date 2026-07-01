import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card">
      <p className="text-3xl font-extrabold text-brand-200">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );
}

export default async function AdminDashboard() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalUsers, totalSongs, completed, songsThisMonth, activeUsers] = await Promise.all([
    prisma.user.count(),
    prisma.song.count(),
    prisma.song.count({ where: { status: "complete" } }),
    prisma.song.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.count({ where: { active: true } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-100">Painel administrativo</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Usuarios" value={totalUsers} />
        <StatCard label="Usuarios ativos" value={activeUsers} />
        <StatCard label="Musicas criadas" value={totalSongs} />
        <StatCard label="Musicas prontas" value={completed} />
        <StatCard label="Musicas neste mes" value={songsThisMonth} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/usuarios" className="btn-primary">
          Gerenciar usuarios
        </Link>
        <Link href="/admin/musicas" className="btn-ghost">
          Ver todas as musicas
        </Link>
      </div>
    </div>
  );
}
