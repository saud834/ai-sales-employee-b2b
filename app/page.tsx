import Link from "next/link";
import { listLeads } from "@/lib/repo/leads";
import { listProjects } from "@/lib/repo/projects";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const leads = listLeads();
  const projects = listProjects();
  const newLeads = leads.filter((l) => l.status === "new").length;
  const noWebsiteLeads = leads.filter((l) => !l.hasWebsite).length;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Overview</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Find real B2B prospects, then use the built-in AI website builder to generate a demo site
          as your outreach hook &mdash; a working preview of what you can build them, before they've
          said yes.
        </p>
      </div>

      <div className="mb-12 grid gap-4 sm:grid-cols-3">
        <StatCard label="Leads tracked" value={leads.length} />
        <StatCard label="Leads without a website" value={noWebsiteLeads} accent />
        <StatCard label="Demo sites generated" value={projects.length} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent leads</h2>
            <Link href="/leads" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              View all &rarr;
            </Link>
          </div>
          {leads.length === 0 ? (
            <EmptyState
              title="No leads yet"
              body="Add a real prospect — a local business with no website — to start building them a demo."
              href="/leads"
              cta="Add your first lead"
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {leads.slice(0, 5).map((lead) => (
                <li key={lead.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-900">{lead.name}</p>
                    <p className="text-sm text-slate-500">
                      {lead.category} &middot; {lead.city}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                    {lead.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent websites</h2>
            <Link href="/projects" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              View all &rarr;
            </Link>
          </div>
          {projects.length === 0 ? (
            <EmptyState
              title="No websites yet"
              body="Describe a website in plain language and the AI will plan, write, and build it."
              href="/projects/new"
              cta="Generate a website"
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {projects.slice(0, 5).map((project) => (
                <li key={project.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-900">{project.name}</p>
                    <p className="text-sm text-slate-500">{project.spec.meta.websiteType}</p>
                  </div>
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Open &rarr;
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent ? "text-amber-600" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function EmptyState({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
      <p className="font-medium text-slate-900">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{body}</p>
      <Link
        href={href}
        className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        {cta}
      </Link>
    </div>
  );
}
