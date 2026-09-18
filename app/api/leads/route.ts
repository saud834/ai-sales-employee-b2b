import { NextRequest } from "next/server";
import { createLead, listLeads } from "@/lib/repo/leads";
import { handleRoute, jsonError } from "@/lib/api-utils";

export async function GET() {
  return handleRoute(async () => listLeads());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name || !body.category || !body.city) {
    return jsonError("name, category, and city are required");
  }
  return handleRoute(async () => createLead(body));
}
