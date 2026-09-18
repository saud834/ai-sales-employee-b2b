"use client";

import Link from "next/link";
import { useState } from "react";
import type { Project } from "@/lib/types";

export default function ProjectsClient({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects);

  async function rename(id: string) {
    const name = prompt("New name for this project?");
    if (!name) return;
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const updated: Project = await res.json();
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }

  async function duplicate(id: string) {
    const res = await fetch(`/api/projects/${id}/duplicate`, { method: "POST" });
    const copy: Project = await res.json();
    setProjects((prev) => [copy, ...prev]);
  }

  async function remove(id: string) {
    if (!confirm("Delete this website? This cannot be undone.")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
        <p className="font-medium text-slate-900">No websites yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          Describe a website in plain language and the AI will plan and build it for you.
        </p>
        <Link
          href="/projects/new"
          className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Generate your first website
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <div key={project.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div
            className="mb-3 h-24 rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${project.spec.theme.primaryColor}22, ${project.spec.theme.accentColor}22)`,
            }}
          />
          <p className="font-semibold text-slate-900">{project.name}</p>
          <p className="text-sm capitalize text-slate-500">{project.spec.meta.websiteType} &middot; {project.spec.pages.length} page(s)</p>
          <div className="mt-4 flex items-center justify-between text-xs">
            <div className="flex gap-3">
              <button onClick={() => rename(project.id)} className="font-medium text-slate-500 hover:text-slate-900">
                Rename
              </button>
              <button onClick={() => duplicate(project.id)} className="font-medium text-slate-500 hover:text-slate-900">
                Duplicate
              </button>
              <button onClick={() => remove(project.id)} className="font-medium text-slate-400 hover:text-red-600">
                Delete
              </button>
            </div>
            <Link href={`/projects/${project.id}`} className="font-semibold text-slate-900 hover:underline">
              Open &rarr;
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
