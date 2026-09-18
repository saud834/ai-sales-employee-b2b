"use client";

import { useState } from "react";
import type { Project, Version } from "@/lib/types";

export default function VersionsPanel({
  projectId,
  initialVersions,
  onRestored,
}: {
  projectId: string;
  initialVersions: Version[];
  onRestored: (project: Project) => void;
}) {
  const [versions, setVersions] = useState(initialVersions);
  const [restoring, setRestoring] = useState<string | null>(null);

  async function restore(versionId: string) {
    if (!confirm("Restore this version? Your current state will be saved as a new version first.")) return;
    setRestoring(versionId);
    try {
      const res = await fetch(`/api/projects/${projectId}/versions/${versionId}/restore`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated: Project = await res.json();
      onRestored(updated);
      const refreshed = await fetch(`/api/projects/${projectId}/versions`).then((r) => r.json());
      setVersions(refreshed);
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className="p-4">
      <p className="mb-3 text-sm font-semibold text-slate-900">Version history</p>
      {versions.length === 0 ? (
        <p className="text-sm text-slate-400">No snapshots yet.</p>
      ) : (
        <ul className="space-y-2">
          {versions.map((v) => (
            <li key={v.id} className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm text-slate-800">{v.label}</p>
              <p className="text-xs text-slate-400">{new Date(v.createdAt).toLocaleString()}</p>
              <button
                onClick={() => restore(v.id)}
                disabled={restoring === v.id}
                className="mt-2 text-xs font-semibold text-slate-900 hover:underline disabled:opacity-50"
              >
                {restoring === v.id ? "Restoring..." : "Restore this version"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
