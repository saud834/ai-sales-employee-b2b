import { notFound } from "next/navigation";
import { getProject } from "@/lib/repo/projects";
import { listVersions } from "@/lib/repo/versions";
import { listChatMessages } from "@/lib/repo/chat";
import { listAssets } from "@/lib/repo/assets";
import BuilderShell from "@/components/BuilderShell";

export const dynamic = "force-dynamic";

export default async function ProjectBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  const versions = listVersions(id);
  const messages = listChatMessages(id);
  const assets = listAssets(id);

  return (
    <BuilderShell initialProject={project} initialVersions={versions} initialMessages={messages} initialAssets={assets} />
  );
}
