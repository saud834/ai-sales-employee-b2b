"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChatMessage, Project, SectionSpec, Version } from "@/lib/types";
import type { AssetRecord } from "@/lib/repo/assets";
import ChatPanel from "@/components/ChatPanel";
import PropertiesPanel from "@/components/PropertiesPanel";
import PagesPanel from "@/components/PagesPanel";
import AssetsPanel from "@/components/AssetsPanel";
import VersionsPanel from "@/components/VersionsPanel";
import DeviceToggle, { DEVICE_WIDTHS, type Device } from "@/components/DeviceToggle";

type RightTab = "edit" | "pages" | "assets" | "history";

export default function BuilderShell({
  initialProject,
  initialVersions,
  initialMessages,
  initialAssets,
}: {
  initialProject: Project;
  initialVersions: Version[];
  initialMessages: ChatMessage[];
  initialAssets: AssetRecord[];
}) {
  const [project, setProject] = useState(initialProject);
  const [activePageId, setActivePageId] = useState(initialProject.spec.pages[0]?.id);
  const [device, setDevice] = useState<Device>("desktop");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>("edit");
  const [previewKey, setPreviewKey] = useState(0);
  const [nameEditing, setNameEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(initialProject.name);

  const activePage = useMemo(
    () => project.spec.pages.find((p) => p.id === activePageId) ?? project.spec.pages[0],
    [project, activePageId]
  );

  const selectedSection: SectionSpec | null = useMemo(() => {
    if (!activePage || !selectedSectionId) return null;
    return activePage.sections.find((s) => s.id === selectedSectionId) ?? null;
  }, [activePage, selectedSectionId]);

  useEffect(() => {
    function handler(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "select-section") {
        setSelectedSectionId(e.data.sectionId);
        setRightTab("edit");
      }
    }
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  function applyUpdatedProject(updated: Project) {
    setProject(updated);
    setPreviewKey((k) => k + 1);
    if (!updated.spec.pages.some((p) => p.id === activePageId)) {
      setActivePageId(updated.spec.pages[0]?.id);
    }
  }

  async function saveName() {
    setNameEditing(false);
    if (nameDraft === project.name) return;
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameDraft }),
    });
    if (res.ok) setProject(await res.json());
  }

  if (!activePage) return null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          {nameEditing ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              className="rounded border border-slate-300 px-2 py-1 text-sm font-semibold"
            />
          ) : (
            <button onClick={() => setNameEditing(true)} className="text-sm font-semibold text-slate-900 hover:underline">
              {project.name}
            </button>
          )}
          <div className="flex gap-1">
            {project.spec.pages.map((page) => (
              <button
                key={page.id}
                onClick={() => {
                  setActivePageId(page.id);
                  setSelectedSectionId(null);
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  page.id === activePageId ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {page.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DeviceToggle device={device} onChange={setDevice} />
          <a
            href={`/api/projects/${project.id}/export`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export
          </a>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-[320px_1fr_340px] overflow-hidden">
        <div className="overflow-hidden border-r border-slate-200 bg-white">
          <ChatPanel projectId={project.id} initialMessages={initialMessages} onProjectUpdated={applyUpdatedProject} />
        </div>

        <div className="flex items-center justify-center overflow-auto bg-slate-100 p-6">
          <div
            className="h-full overflow-hidden rounded-xl border border-slate-300 bg-white shadow-lg transition-all"
            style={{ width: DEVICE_WIDTHS[device], maxWidth: "100%" }}
          >
            <iframe
              key={previewKey}
              title="Website preview"
              src={`/preview/${project.id}?page=${activePage.slug}&edit=1&v=${previewKey}`}
              className="h-full w-full"
            />
          </div>
        </div>

        <div className="flex flex-col overflow-hidden border-l border-slate-200 bg-white">
          <div className="flex border-b border-slate-200 text-xs font-medium">
            {(["edit", "pages", "assets", "history"] as RightTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`flex-1 py-2 capitalize ${
                  rightTab === tab ? "border-b-2 border-slate-900 text-slate-900" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {rightTab === "edit" && (
              <PropertiesPanel project={project} pageId={activePage.id} section={selectedSection} onUpdated={applyUpdatedProject} />
            )}
            {rightTab === "pages" && (
              <PagesPanel
                project={project}
                activePageId={activePage.id}
                onSelectPage={setActivePageId}
                onUpdated={applyUpdatedProject}
              />
            )}
            {rightTab === "assets" && <AssetsPanel projectId={project.id} initialAssets={initialAssets} />}
            {rightTab === "history" && (
              <VersionsPanel projectId={project.id} initialVersions={initialVersions} onRestored={applyUpdatedProject} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
