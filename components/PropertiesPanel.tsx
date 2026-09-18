"use client";

import { useEffect, useState } from "react";
import type { Project, SectionSpec, ThemeSpec } from "@/lib/types";
import { componentLabels } from "@/lib/components/registry";
import { flattenEditableProps, pathLabel, setDeepClone } from "@/lib/props-editor";

const FONT_OPTIONS = ["Inter", "Playfair Display", "Poppins", "Fraunces", "Merriweather", "Roboto"];

export default function PropertiesPanel({
  project,
  pageId,
  section,
  onUpdated,
}: {
  project: Project;
  pageId: string | null;
  section: SectionSpec | null;
  onUpdated: (project: Project) => void;
}) {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <ThemeEditor project={project} onUpdated={onUpdated} />
      <div className="border-t border-slate-200 pt-4">
        {section && pageId ? (
          <SectionEditor key={section.id} project={project} pageId={pageId} section={section} onUpdated={onUpdated} />
        ) : (
          <p className="text-sm text-slate-400">
            Click any section in the preview to edit its text, links, and simple settings here.
          </p>
        )}
      </div>
    </div>
  );
}

function SectionEditor({
  project,
  pageId,
  section,
  onUpdated,
}: {
  project: Project;
  pageId: string;
  section: SectionSpec;
  onUpdated: (project: Project) => void;
}) {
  const [working, setWorking] = useState<Record<string, unknown>>(section.props);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setWorking(section.props);
    setDirty(false);
  }, [section.id, section.props]);

  const fields = flattenEditableProps(working);
  const hasArrays = Object.values(section.props).some((v) => Array.isArray(v));

  function setField(path: string[], value: string | number | boolean) {
    setWorking((prev) => setDeepClone(prev, path, value));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/section`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, sectionId: section.id, props: working }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated: Project = await res.json();
      onUpdated(updated);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-slate-900">{componentLabels[section.type]} section</p>
      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.path.join(".")}>
            <label className="mb-1 block text-xs font-medium text-slate-500">{pathLabel(field.path)}</label>
            {field.type === "boolean" ? (
              <input
                type="checkbox"
                checked={field.value as boolean}
                onChange={(e) => setField(field.path, e.target.checked)}
                className="h-4 w-4"
              />
            ) : field.type === "number" ? (
              <input
                type="number"
                value={field.value as number}
                onChange={(e) => setField(field.path, Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            ) : (field.value as string).length > 60 ? (
              <textarea
                value={field.value as string}
                onChange={(e) => setField(field.path, e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            ) : (
              <input
                type="text"
                value={field.value as string}
                onChange={(e) => setField(field.path, e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
              />
            )}
          </div>
        ))}
      </div>
      {hasArrays && (
        <p className="mt-3 text-xs text-slate-400">
          This section also has list content (items, images, links). Ask the chat to add, remove, or
          reorder those &mdash; e.g. &ldquo;add a testimonial from...&rdquo;.
        </p>
      )}
      <button
        onClick={save}
        disabled={!dirty || saving}
        className="mt-4 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

function ThemeEditor({ project, onUpdated }: { project: Project; onUpdated: (project: Project) => void }) {
  const [theme, setTheme] = useState<ThemeSpec>(project.spec.theme);
  const [saving, setSaving] = useState(false);

  useEffect(() => setTheme(project.spec.theme), [project.spec.theme]);

  async function patch(partial: Partial<ThemeSpec>) {
    const next = { ...theme, ...partial };
    setTheme(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/theme`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      if (res.ok) onUpdated(await res.json());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-slate-900">Theme {saving && <span className="text-xs font-normal text-slate-400">saving...</span>}</p>
      <div className="grid grid-cols-2 gap-3">
        <ColorField label="Primary" value={theme.primaryColor} onChange={(v) => patch({ primaryColor: v })} />
        <ColorField label="Accent" value={theme.accentColor} onChange={(v) => patch({ accentColor: v })} />
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Mode</label>
          <select
            value={theme.mode}
            onChange={(e) => patch({ mode: e.target.value as ThemeSpec["mode"] })}
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Density</label>
          <select
            value={theme.density}
            onChange={(e) => patch({ density: e.target.value as ThemeSpec["density"] })}
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
            <option value="spacious">Spacious</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-500">Heading font</label>
          <select
            value={theme.fontHeading}
            onChange={(e) => patch({ fontHeading: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-8 rounded border border-slate-300" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>
    </div>
  );
}
