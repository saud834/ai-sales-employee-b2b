import { notFound } from "next/navigation";
import { getProject } from "@/lib/repo/projects";
import PreviewFrame from "@/components/PreviewFrame";

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

  return <PreviewFrame spec={project.spec} page={page} projectId={projectId} editable={edit === "1"} />;
}
