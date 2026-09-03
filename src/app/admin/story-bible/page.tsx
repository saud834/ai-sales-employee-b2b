import { prisma } from "@/lib/prisma";
import { TruthBadge } from "@/components/TruthBadge";

// Reads live DB state on every request - never statically prerendered.
export const dynamic = "force-dynamic";

export default async function StoryBiblePage() {
  const events = await prisma.storyEvent.findMany({
    orderBy: [{ dayNumber: "desc" }, { occurredAt: "desc" }],
    include: { opportunity: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Story Bible</h1>
        <p className="mt-1 text-neutral-400">
          Append-only log of what actually happened. Content is generated from these events, never the other way
          around.
        </p>
      </div>

      <p className="text-xs text-neutral-500">
        Log new events via <code className="rounded bg-neutral-900 px-1 py-0.5">POST /api/story-bible</code>.
      </p>

      <div className="flex flex-col gap-3">
        {events.length === 0 && <p className="text-sm text-neutral-500">No events logged yet.</p>}
        {events.map((event) => (
          <div key={event.id} className="rounded-lg border border-neutral-800 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-neutral-500">Day {event.dayNumber}</span>
              <TruthBadge label={event.truthLabel} />
            </div>
            <h3 className="mt-1 font-medium">{event.title}</h3>
            <p className="mt-1 text-sm text-neutral-300">{event.description}</p>
            {event.opportunity && (
              <p className="mt-2 text-xs text-neutral-500">Related opportunity: {event.opportunity.title}</p>
            )}
            {event.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {event.tags.map((tag) => (
                  <span key={tag} className="rounded bg-neutral-900 px-2 py-0.5 text-xs text-neutral-400">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
