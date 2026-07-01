export type Step = "briefing" | "lyrics" | "music";

const STEPS: { key: Step; label: string }[] = [
  { key: "briefing", label: "Historia" },
  { key: "lyrics", label: "Letra" },
  { key: "music", label: "Musica" },
];

export function Stepper({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="mb-8 flex items-center justify-center gap-2 text-sm">
      {STEPS.map((step, i) => {
        const state = i < currentIndex ? "done" : i === currentIndex ? "active" : "todo";
        return (
          <li key={step.key} className="flex items-center gap-2">
            <span
              className={
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold " +
                (state === "active"
                  ? "bg-brand-500 text-white"
                  : state === "done"
                    ? "bg-brand-500/30 text-brand-100"
                    : "bg-slate-800 text-slate-500")
              }
            >
              {state === "done" ? "✓" : i + 1}
            </span>
            <span className={state === "todo" ? "text-slate-500" : "text-slate-200"}>
              {step.label}
            </span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-white/10" />}
          </li>
        );
      })}
    </ol>
  );
}
