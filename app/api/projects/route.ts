import { NextRequest } from "next/server";
import { createProject, listProjects } from "@/lib/repo/projects";
import { getLead } from "@/lib/repo/leads";
import { addChatMessage } from "@/lib/repo/chat";
import { getAIProvider } from "@/lib/ai";
import { handleRoute, jsonError } from "@/lib/api-utils";

export async function GET() {
  return handleRoute(async () => listProjects());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const prompt: string | undefined = body.prompt;
  const leadId: string | undefined = body.leadId;
  if (!prompt || prompt.trim().length < 8) {
    return jsonError("A prompt describing the website (at least 8 characters) is required");
  }

  return handleRoute(async () => {
    const lead = leadId ? getLead(leadId) : null;
    const provider = getAIProvider();
    const spec = await provider.planWebsite({
      prompt,
      lead: lead
        ? {
            name: lead.name,
            category: lead.category,
            city: lead.city,
            country: lead.country,
            whatsapp: lead.whatsapp,
            phone: lead.phone,
            address: lead.address,
          }
        : undefined,
    });

    const project = createProject(body.name || spec.meta.siteName, spec, leadId ?? null);
    addChatMessage(project.id, "user", prompt);
    addChatMessage(
      project.id,
      "assistant",
      `I generated "${project.name}" with ${spec.pages.length} page(s): ${spec.pages
        .map((p) => p.name)
        .join(", ")}. You can now ask me to change anything.`
    );
    return { project, providerUsed: provider.name };
  });
}
