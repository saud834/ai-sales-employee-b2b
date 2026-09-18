import { getLead } from "@/lib/repo/leads";
import NewProjectForm from "@/components/NewProjectForm";

export const dynamic = "force-dynamic";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string }>;
}) {
  const { leadId } = await searchParams;
  const lead = leadId ? getLead(leadId) : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Describe the website</h1>
        <p className="mt-2 text-slate-600">
          Write it like you're briefing a designer. The AI plans the sitemap, writes the content, and
          builds the pages.
        </p>
      </div>
      <NewProjectForm lead={lead} />
    </main>
  );
}
