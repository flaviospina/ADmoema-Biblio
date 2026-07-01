const MAP: Record<string, { label: string; cls: string }> = {
  queued: { label: "Na fila", cls: "bg-slate-500/20 text-slate-300" },
  processing: { label: "Gerando", cls: "bg-amber-500/20 text-amber-300" },
  complete: { label: "Pronta", cls: "bg-emerald-500/20 text-emerald-300" },
  failed: { label: "Falhou", cls: "bg-red-500/20 text-red-300" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? MAP.queued;
  return (
    <span className={"rounded-full px-2.5 py-0.5 text-xs font-medium " + s.cls}>{s.label}</span>
  );
}
