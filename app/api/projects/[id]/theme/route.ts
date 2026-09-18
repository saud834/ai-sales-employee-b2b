import { NextRequest } from "next/server";
import { getProject, updateProjectSpec } from "@/lib/repo/projects";
import { themeSchema } from "@/lib/schema";
import { handleRoute, jsonError } from "@/lib/api-utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  if (!body || typeof body !== "object") return jsonError("A partial theme object is required");

  return handleRoute(async () => {
    const project = getProject(id);
    if (!project) throw new Error("Project not found");

    const mergedTheme = { ...project.spec.theme, ...body };
    const validated = themeSchema.safeParse(mergedTheme);
    if (!validated.success) {
      throw new Error("Invalid theme values: " + validated.error.issues.map((i) => i.message).join("; "));
    }

    project.spec.theme = validated.data;
    const updated = updateProjectSpec(id, project.spec, "Before theme edit");
    return updated;
  });
}
