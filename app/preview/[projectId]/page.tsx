import { notFound } from "next/navigation";
import { getProject } from "@/lib/repo/projects";
import SiteRenderer from "@/lib/components/SiteRenderer";
import PreviewInteractivity from "@/components/PreviewInteractivity";

export const dynamic = "force-dynamic";

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ page?: string; edit?: string; v?: string }>;
}) {
  const { projectId } = await params;
  const { page: pageSlug, edit } = await searchParams;
  const project = getProject(projectId);
  if (!project) notFound();

  const page = project.spec.pages.find((p) => p.slug === (pageSlug || "home")) ?? project.spec.pages[0];
  if (!page) notFound();

  if (edit === "1") {
    return <PreviewInteractivity spec={project.spec} page={page} />;
  }
  return <SiteRenderer spec={project.spec} page={page} />;
}
