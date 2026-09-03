import { prisma } from "@/lib/prisma";
import { TruthBadge } from "@/components/TruthBadge";

// Reads live DB state on every request - never statically prerendered.
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  IDEA: "text-neutral-400",
  SCRIPTED: "text-sky-400",
  IN_PRODUCTION: "text-amber-400",
  PUBLISHED: "text-emerald-400",
};

export default async function ContentPlannerPage() {
  const pieces = await prisma.contentPiece.findMany({
    orderBy: { createdAt: "desc" },
    include: { episode: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Content Planner</h1>
        <p className="mt-1 text-neutral-400">
          Every piece here should trace back to one or more Story Bible events via sourceEventIds.
        </p>
      </div>

      <p className="text-xs text-neutral-500">
        Add content via <code className="rounded bg-neutral-900 px-1 py-0.5">POST /api/content</code>.
      </p>

      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-800 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Platform</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Truth</th>
            </tr>
          </thead>
          <tbody>
            {pieces.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                  No content planned yet.
                </td>
              </tr>
            )}
            {pieces.map((piece) => (
              <tr key={piece.id} className="border-b border-neutral-900 last:border-0">
                <td className="px-4 py-2">{piece.title}</td>
                <td className="px-4 py-2 text-neutral-400">{piece.platform}</td>
                <td className="px-4 py-2 text-neutral-400">{piece.type}</td>
                <td className={`px-4 py-2 font-medium ${STATUS_STYLES[piece.status] ?? ""}`}>{piece.status}</td>
                <td className="px-4 py-2">
                  <TruthBadge label={piece.truthLabel} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
