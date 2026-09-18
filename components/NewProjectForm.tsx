"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Lead } from "@/lib/types";

const EXAMPLES = [
  "Build a premium website for a luxury Saudi restaurant in Riyadh. Use a dark elegant design, include the menu, gallery, location, opening hours, reservations, WhatsApp contact, customer reviews, and an about section.",
  "Create a modern SaaS landing page for a project management tool aimed at small agencies. Include pricing, testimonials, an FAQ, and a free trial CTA.",
  "Design a portfolio website for a freelance photographer. Minimal, black and white, with a large gallery and a simple contact form.",
];

function defaultBriefForLead(lead: Lead): string {
  return `Build a premium, elegant website for ${lead.name}, a ${lead.category.toLowerCase()} in ${lead.city}, Saudi Arabia. Include the menu or services, gallery, location and hours, reservations or booking, WhatsApp contact, customer reviews, and an about section. Make it feel trustworthy and high quality.`;
}

export default function NewProjectForm({ lead }: { lead: Lead | null }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(lead ? defaultBriefForLead(lead) : "");
  const [name, setName] = useState(lead?.name ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, name: name || undefined, leadId: lead?.id }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Something went wrong");
      }
      const { project } = await res.json();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div>
      {lead && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Building a demo site for a real lead: <strong>{lead.name}</strong> ({lead.category}, {lead.city}).
        </div>
      )}
      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="mb-1 block text-sm font-medium text-slate-700">Project name (optional)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Will use the AI-generated site name if left blank"
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <label className="mb-1 block text-sm font-medium text-slate-700">Describe the website</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={7}
          required
          minLength={8}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Build a premium website for..."
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Planning your website..." : "Generate Website"}
        </button>
      </form>

      {!lead && (
        <div className="mt-8">
          <p className="mb-3 text-sm font-medium text-slate-500">Or try an example:</p>
          <div className="grid gap-2">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPrompt(ex)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
