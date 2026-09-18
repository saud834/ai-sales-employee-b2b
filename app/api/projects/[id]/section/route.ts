import { NextRequest } from "next/server";
import { getProject, updateProjectSpec } from "@/lib/repo/projects";
import { sectionSchema } from "@/lib/schema";
import { handleRoute, jsonError } from "@/lib/api-utils";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { pageId, sectionId, props } = body as {
    pageId?: string;
    sectionId?: string;
    props?: Record<string, unknown>;
  };
  if (!pageId || !sectionId || !props || typeof props !== "object") {
    return jsonError("pageId, sectionId, and props are required");
  }

  return handleRoute(async () => {
    const project = getProject(id);
    if (!project) throw new Error("Project not found");

    const page = project.spec.pages.find((p) => p.id === pageId);
    if (!page) throw new Error("Page not found");
    const section = page.sections.find((s) => s.id === sectionId);
    if (!section) throw new Error("Section not found");

    const mergedProps = { ...section.props, ...props };
    const validated = sectionSchema.safeParse({ id: section.id, type: section.type, props: mergedProps });
    if (!validated.success) {
      throw new Error(
        "Invalid property values: " + validated.error.issues.map((i) => i.message).join("; ")
      );
    }

    section.props = mergedProps;
    const updated = updateProjectSpec(id, project.spec, "Before manual edit");
    return updated;
  });
}
