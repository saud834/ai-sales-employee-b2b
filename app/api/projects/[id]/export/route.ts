import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/repo/projects";
import { buildExportZip } from "@/lib/codegen/exportProject";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const zip = await buildExportZip(project.spec);
  const filename = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.zip`;

  return new NextResponse(new Uint8Array(zip), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
