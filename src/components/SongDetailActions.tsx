"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  songId: string;
  initialIsPublic: boolean;
  initialShareId: string | null;
}

export function SongDetailActions({ songId, initialIsPublic, initialShareId }: Props) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [shareId, setShareId] = useState(initialShareId);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareUrl =
    shareId && typeof window !== "undefined" ? `${window.location.origin}/s/${shareId}` : "";

  async function toggleShare() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/songs/${songId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao atualizar.");
      setIsPublic(data.isPublic);
      setShareId(data.shareId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  async function remove() {
    if (!confirm("Excluir esta musica? Esta acao nao pode ser desfeita.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/songs/${songId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao excluir.");
      }
      router.push("/historico");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro.");
      setBusy(false);
    }
  }

  return (
    <div className="card space-y-4">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-200">Compartilhamento</p>
            <p className="text-xs text-slate-500">
              Gere um link publico para presentear alguem com esta musica.
            </p>
          </div>
          <button
            onClick={toggleShare}
            disabled={busy}
            className={isPublic ? "btn-ghost" : "btn-primary"}
          >
            {isPublic ? "Tornar privada" : "Compartilhar"}
          </button>
        </div>

        {isPublic && shareUrl && (
          <div className="mt-3 flex items-center gap-2">
            <input readOnly className="input text-xs" value={shareUrl} />
            <button onClick={copyLink} className="btn-ghost shrink-0">
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className="border-t border-white/10 pt-4">
        <button onClick={remove} disabled={busy} className="text-sm text-red-400 hover:text-red-300">
          Excluir musica
        </button>
      </div>
    </div>
  );
}
