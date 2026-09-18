import { nanoid } from "nanoid";
import { NextRequest } from "next/server";
import { getProject, updateProjectSpec } from "@/lib/repo/projects";
import { navbarSection, footerSection, section } from "@/lib/ai/content-templates";
import { handleRoute, jsonError } from "@/lib/api-utils";
import type { NavLink } from "@/lib/types";

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || nanoid(6)
  );
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const name: string | undefined = body.name;
  if (!name) return jsonError("A page name is required");

  return handleRoute(async () => {
    const project = getProject(id);
    if (!project) throw new Error("Project not found");

    let slug = slugify(name);
    if (project.spec.pages.some((p) => p.slug === slug)) slug = `${slug}-${nanoid(4)}`;

    const navLinks = (project.spec.pages[0]?.sections.find((s) => s.type === "navbar")?.props
      .links ?? []) as NavLink[];

    project.spec.pages.push({
      id: nanoid(8),
      slug,
      name,
      seo: {
        title: `${name} | ${project.spec.meta.siteName}`,
        description: `${name} page for ${project.spec.meta.siteName}.`,
        keywords: [name, project.spec.meta.siteName],
      },
      sections: [
        navbarSection(project.spec.meta, navLinks),
        section("hero", { headline: name, subheadline: "New page — edit this content." }),
        footerSection(project.spec.meta, navLinks),
      ],
    });

    const updated = updateProjectSpec(id, project.spec, `Before adding page "${name}"`);
    return updated;
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { pageId, name, order } = body as { pageId?: string; name?: string; order?: string[] };

  return handleRoute(async () => {
    const project = getProject(id);
    if (!project) throw new Error("Project not found");

    if (pageId && name) {
      const page = project.spec.pages.find((p) => p.id === pageId);
      if (!page) throw new Error("Page not found");
      page.name = name;
    }

    if (order && order.length === project.spec.pages.length) {
      const byId = new Map(project.spec.pages.map((p) => [p.id, p]));
      const reordered = order.map((pid) => byId.get(pid)).filter(Boolean);
      if (reordered.length === project.spec.pages.length) {
        project.spec.pages = reordered as typeof project.spec.pages;
      }
    }

    const updated = updateProjectSpec(id, project.spec, "Before page changes");
    return updated;
  });
}
