"use client";

import { useState } from "react";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string | Date;
  _count: { songs: number };
}

export function AdminUsers({
  initialUsers,
  currentUserId,
}: {
  initialUsers: AdminUser[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function patch(id: string, data: Partial<Pick<AdminUser, "role" | "active">>) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Falha ao atualizar.");
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...body.user } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir este usuario e todas as suas musicas?")) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Falha ao excluir.");
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="space-y-3">
        {users.map((u) => {
          const isSelf = u.id === currentUserId;
          const busy = busyId === u.id;
          return (
            <div key={u.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium text-slate-100">
                  {u.name}
                  {u.role === "ADMIN" && (
                    <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-xs text-brand-200">
                      admin
                    </span>
                  )}
                  {!u.active && (
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
                      inativo
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {u.email} · {u._count.songs} musica(s)
                </p>
              </div>

              {isSelf ? (
                <span className="text-xs text-slate-500">voce</span>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => patch(u.id, { role: u.role === "ADMIN" ? "USER" : "ADMIN" })}
                    disabled={busy}
                    className="chip-off"
                  >
                    {u.role === "ADMIN" ? "Rebaixar" : "Tornar admin"}
                  </button>
                  <button
                    onClick={() => patch(u.id, { active: !u.active })}
                    disabled={busy}
                    className="chip-off"
                  >
                    {u.active ? "Desativar" : "Reativar"}
                  </button>
                  <button
                    onClick={() => remove(u.id)}
                    disabled={busy}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Excluir
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
