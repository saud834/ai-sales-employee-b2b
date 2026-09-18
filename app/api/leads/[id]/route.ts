import { NextRequest } from "next/server";
import { deleteLead, getLead, updateLead } from "@/lib/repo/leads";
import { handleRoute, jsonError } from "@/lib/api-utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleRoute(async () => {
    const lead = getLead(id);
    if (!lead) throw new Error("Lead not found");
    return lead;
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return handleRoute(async () => {
    const updated = updateLead(id, body);
    if (!updated) throw new Error("Lead not found");
    return updated;
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleRoute(async () => {
    deleteLead(id);
    return { ok: true };
  });
}
