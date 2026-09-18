"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Lead, LeadStatus } from "@/lib/types";

const STATUS_OPTIONS: LeadStatus[] = ["new", "contacted", "demo_sent", "won", "lost"];

export default function LeadsClient({ initialLeads }: { initialLeads: Lead[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [showForm, setShowForm] = useState(initialLeads.length === 0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    city: "",
    whatsapp: "",
    phone: "",
    instagram: "",
    address: "",
    evidence: "",
  });

  async function addLead(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, hasWebsite: false }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const lead: Lead = await res.json();
      setLeads((prev) => [lead, ...prev]);
      setShowForm(false);
      setForm({ name: "", category: "", city: "", whatsapp: "", phone: "", instagram: "", address: "", evidence: "" });
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: LeadStatus) {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated: Lead = await res.json();
    setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
  }

  async function removeLead(id: string) {
    if (!confirm("Delete this lead?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {showForm ? "Cancel" : "+ Add Lead"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addLead} className="mb-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
          <Field label="Business name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Category" required placeholder="Restaurant, salon, gym..." value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          <Field label="City" required placeholder="Riyadh" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <Field label="WhatsApp number" placeholder="+9665xxxxxxxx" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Instagram handle" value={form.instagram} onChange={(v) => setForm({ ...form, instagram: v })} />
          <Field
            label="Street address"
            placeholder="Street, district, city"
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
          />
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Evidence they have no website</label>
            <textarea
              value={form.evidence}
              onChange={(e) => setForm({ ...form, evidence: e.target.value })}
              rows={2}
              placeholder="e.g. only shows up on Facebook/Instagram and delivery apps, no indexed website found"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {leads.map((lead) => (
          <div key={lead.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900">{lead.name}</p>
                <p className="text-sm text-slate-500">
                  {lead.category} &middot; {lead.city}
                </p>
              </div>
              <select
                value={lead.status}
                onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                className="rounded-full border-0 bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            {lead.evidence && <p className="mt-3 text-xs text-slate-500">{lead.evidence}</p>}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => removeLead(lead.id)}
                className="text-xs font-medium text-slate-400 hover:text-red-600"
              >
                Delete
              </button>
              <button
                onClick={() => router.push(`/projects/new?leadId=${lead.id}`)}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Generate Website &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
