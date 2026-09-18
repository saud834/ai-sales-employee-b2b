"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";

export default function PagesPanel({
  project,
  activePageId,
  onSelectPage,
  onUpdated,
}: {
  project: Project;
  activePageId: string;
  onSelectPage: (pageId: string) => void;
  onUpdated: (project: Project) => void;
}) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  async function addPage(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated: Project = await res.json();
      onUpdated(updated);
      setNewName("");
    } finally {
      setAdding(false);
    }
  }

  async function renamePage(pageId: string) {
    const name = prompt("New page name?");
    if (!name) return;
    const res = await fetch(`/api/projects/${project.id}/pages`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, name }),
    });
    if (res.ok) onUpdated(await res.json());
  }

  async function deletePage(pageId: string) {
    if (project.spec.pages.length <= 1) return;
    if (!confirm("Delete this page?")) return;
    const res = await fetch(`/api/projects/${project.id}/pages/${pageId}`, { method: "DELETE" });
    if (res.ok) {
      const updated: Project = await res.json();
      onUpdated(updated);
      if (activePageId === pageId) onSelectPage(updated.spec.pages[0].id);
    }
  }

  return (
    <div className="p-4">
      <p className="mb-3 text-sm font-semibold text-slate-900">Pages</p>
      <ul className="space-y-1.5">
        {project.spec.pages.map((page) => (
          <li
            key={page.id}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
              page.id === activePageId ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-700"
            }`}
          >
            <button onClick={() => onSelectPage(page.id)} className="flex-1 text-left">
              {page.name}
            </button>
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => renamePage(page.id)}
                className={page.id === activePageId ? "text-white/70 hover:text-white" : "text-slate-400 hover:text-slate-900"}
              >
                Rename
              </button>
              {project.spec.pages.length > 1 && (
                <button
                  onClick={() => deletePage(page.id)}
                  className={page.id === activePageId ? "text-white/70 hover:text-red-300" : "text-slate-400 hover:text-red-600"}
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={addPage} className="mt-4 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New page name"
          className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}
