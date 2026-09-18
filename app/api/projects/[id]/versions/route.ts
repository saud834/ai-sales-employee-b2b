import { NextRequest } from "next/server";
import { listVersions } from "@/lib/repo/versions";
import { handleRoute } from "@/lib/api-utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleRoute(async () => listVersions(id));
}
