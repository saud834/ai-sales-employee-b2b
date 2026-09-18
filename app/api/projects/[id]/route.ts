import { NextRequest } from "next/server";
import { deleteProject, getProject, renameProject } from "@/lib/repo/projects";
import { handleRoute, jsonError } from "@/lib/api-utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleRoute(async () => {
    const project = getProject(id);
    if (!project) throw new Error("Project not found");
    return project;
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  if (!body.name || typeof body.name !== "string") {
    return jsonError("name is required");
  }
  return handleRoute(async () => {
    const updated = renameProject(id, body.name);
    if (!updated) throw new Error("Project not found");
    return updated;
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleRoute(async () => {
    deleteProject(id);
    return { ok: true };
  });
}
