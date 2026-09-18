import { listLeads } from "@/lib/repo/leads";
import LeadsClient from "@/components/LeadsClient";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = listLeads();
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Leads</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Real prospects worth a demo site &mdash; businesses that don't have a website yet. Add one,
          then generate a website for it directly.
        </p>
      </div>
      <LeadsClient initialLeads={leads} />
    </main>
  );
}
