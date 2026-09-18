import Link from "next/link";
import { listProjects } from "@/lib/repo/projects";
import ProjectsClient from "@/components/ProjectsClient";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = listProjects();
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Websites</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Every site the AI has generated, ready to edit or export.</p>
        </div>
        <Link href="/projects/new" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          + New Website
        </Link>
      </div>
      <ProjectsClient initialProjects={projects} />
    </main>
  );
}
