import { NextRequest } from "next/server";
import { duplicateProject } from "@/lib/repo/projects";
import { handleRoute } from "@/lib/api-utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return handleRoute(async () => {
    const copy = duplicateProject(id, body.name);
    if (!copy) throw new Error("Project not found");
    return copy;
  });
}
