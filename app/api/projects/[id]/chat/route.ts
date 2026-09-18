import { NextRequest } from "next/server";
import { listChatMessages } from "@/lib/repo/chat";
import { handleRoute } from "@/lib/api-utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleRoute(async () => listChatMessages(id));
}
