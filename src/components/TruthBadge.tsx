const STYLES: Record<string, string> = {
  REAL: "bg-emerald-900 text-emerald-300 border-emerald-700",
  HYPOTHETICAL: "bg-amber-900 text-amber-300 border-amber-700",
  SIMULATION: "bg-sky-900 text-sky-300 border-sky-700",
  FICTIONAL: "bg-fuchsia-900 text-fuchsia-300 border-fuchsia-700",
};

export function TruthBadge({ label }: { label: string }) {
  const style = STYLES[label] ?? "bg-neutral-800 text-neutral-300 border-neutral-700";
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${style}`}
    >
      {label}
    </span>
  );
}
