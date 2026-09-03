import { prisma } from "@/lib/prisma";

// Reads live DB state on every request - never statically prerendered.
export const dynamic = "force-dynamic";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default async function AdminOverviewPage() {
  const [state, character, opportunityCount, eventCount, contentCount] = await Promise.all([
    prisma.companyState.findFirst(),
    prisma.character.findFirst(),
    prisma.opportunity.count(),
    prisma.storyEvent.count(),
    prisma.contentPiece.count(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="mt-1 text-neutral-400">
          Day {state?.dayNumber ?? "—"} · Stage {state?.stage ?? "—"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Cash on hand" value={state?.cashOnHand != null ? `$${state.cashOnHand}` : "—"} />
        <StatCard label="MRR" value={state?.mrr != null ? `$${state.mrr}` : "—"} />
        <StatCard label="Active customers" value={String(state?.activeCustomers ?? 0)} />
        <StatCard label="Opportunities logged" value={String(opportunityCount)} />
        <StatCard label="Story events logged" value={String(eventCount)} />
        <StatCard label="Content pieces planned" value={String(contentCount)} />
      </div>

      {state?.notes && (
        <div className="rounded-lg border border-neutral-800 p-4 text-sm text-neutral-300">
          {state.notes}
        </div>
      )}

      {character && (
        <div className="rounded-lg border border-neutral-800 p-4">
          <h2 className="font-medium">{character.name}</h2>
          <p className="mt-1 text-sm text-neutral-400">
            {character.isFictional ? "Fictional, AI-generated character" : ""} · {character.apparentAge} ·{" "}
            {character.location}
          </p>
          <p className="mt-2 text-sm text-neutral-300">{character.backstory}</p>
        </div>
      )}
    </div>
  );
}
