import { NextRequest } from "next/server";
import { getProject, updateProjectSpec } from "@/lib/repo/projects";
import { addChatMessage } from "@/lib/repo/chat";
import { getAIProvider } from "@/lib/ai";
import { handleRoute, jsonError } from "@/lib/api-utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const instruction: string | undefined = body.instruction;
  if (!instruction || instruction.trim().length < 3) {
    return jsonError("An edit instruction is required");
  }

  return handleRoute(async () => {
    const project = getProject(id);
    if (!project) throw new Error("Project not found");

    addChatMessage(id, "user", instruction);
    const provider = getAIProvider();
    const { spec, summary } = await provider.modifyWebsite(project.spec, instruction);
    const updated = updateProjectSpec(id, spec, `Before: ${instruction}`);
    addChatMessage(id, "assistant", summary);

    return { project: updated, summary, providerUsed: provider.name };
  });
}
