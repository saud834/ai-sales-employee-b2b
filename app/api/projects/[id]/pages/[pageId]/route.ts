import { NextRequest } from "next/server";
import { getProject, updateProjectSpec } from "@/lib/repo/projects";
import { handleRoute } from "@/lib/api-utils";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const { id, pageId } = await params;
  return handleRoute(async () => {
    const project = getProject(id);
    if (!project) throw new Error("Project not found");
    if (project.spec.pages.length <= 1) {
      throw new Error("Cannot delete the last remaining page");
    }
    project.spec.pages = project.spec.pages.filter((p) => p.id !== pageId);
    return updateProjectSpec(id, project.spec, "Before removing a page");
  });
}
