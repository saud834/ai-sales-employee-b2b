import { NextRequest } from "next/server";
import { getVersion } from "@/lib/repo/versions";
import { updateProjectSpec } from "@/lib/repo/projects";
import { addChatMessage } from "@/lib/repo/chat";
import { handleRoute } from "@/lib/api-utils";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id, versionId } = await params;
  return handleRoute(async () => {
    const version = getVersion(versionId);
    if (!version || version.projectId !== id) throw new Error("Version not found");
    const updated = updateProjectSpec(id, version.spec, `Before restoring "${version.label}"`);
    if (!updated) throw new Error("Project not found");
    addChatMessage(id, "assistant", `Restored the version from ${new Date(version.createdAt).toLocaleString()} ("${version.label}").`);
    return updated;
  });
}
