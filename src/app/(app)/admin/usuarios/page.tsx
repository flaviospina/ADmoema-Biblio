import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminUsers } from "@/components/AdminUsers";

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  const session = await getSession();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      _count: { select: { songs: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-sm text-slate-400 hover:text-slate-200">
          ← Painel
        </Link>
      </div>
      <h1 className="text-xl font-bold text-slate-100">Usuarios</h1>
      <AdminUsers initialUsers={users} currentUserId={session!.sub} />
    </div>
  );
}
