import { prisma } from "@/lib/prisma";

// Reads live DB state on every request - never statically prerendered.
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  CANDIDATE: "text-neutral-400",
  RESEARCHING: "text-sky-400",
  VALIDATING: "text-amber-400",
  VALIDATED: "text-emerald-400",
  REJECTED: "text-red-400",
  CHOSEN: "text-fuchsia-400",
};

export default async function OpportunitiesPage() {
  const opportunities = await prisma.opportunity.findMany({
    orderBy: [{ opportunityScore: "desc" }, { createdAt: "desc" }],
    include: { interviews: true, experiments: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Startup Discovery Engine</h1>
        <p className="mt-1 text-neutral-400">
          100 problems → 20 interesting → 5 strong opportunities → 3 experiments → 1 company. Scores are computed
          from submitted 1-10 ratings; nothing here is chosen until it survives real interviews and a
          willingness-to-pay test.
        </p>
      </div>

      <p className="text-xs text-neutral-500">
        Log candidates via <code className="rounded bg-neutral-900 px-1 py-0.5">POST /api/opportunities</code>.
      </p>

      <div className="flex flex-col gap-3">
        {opportunities.length === 0 && <p className="text-sm text-neutral-500">No opportunities logged yet.</p>}
        {opportunities.map((opp) => (
          <div key={opp.id} className="rounded-lg border border-neutral-800 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium">{opp.title}</h3>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold uppercase ${STATUS_STYLES[opp.status] ?? ""}`}>
                  {opp.status}
                </span>
                <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-300">
                  score {opp.opportunityScore ?? "—"}
                </span>
              </div>
            </div>
            <p className="mt-1 text-sm text-neutral-300">{opp.description}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
              <span>source: {opp.source}</span>
              <span>{opp.interviews.length} interview(s)</span>
              <span>{opp.experiments.length} experiment(s)</span>
            </div>
            {opp.rejectionReason && (
              <p className="mt-2 text-xs text-red-400">Rejected: {opp.rejectionReason}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
