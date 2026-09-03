import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET  /api/content   -> list ContentPieces, newest first
// POST /api/content   -> add a content piece to the planner.
//
// sourceEventIds is required unless truthLabel is not REAL - content
// claiming real traction must trace back to logged StoryEvents.

export async function GET() {
  const pieces = await prisma.contentPiece.findMany({
    orderBy: { createdAt: "desc" },
    include: { episode: true, analytics: true },
  });
  return NextResponse.json(pieces);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.title || !body.platform || !body.type) {
    return NextResponse.json(
      { error: "title, platform, and type are required" },
      { status: 400 }
    );
  }

  const truthLabel = body.truthLabel ?? "REAL";
  const sourceEventIds: string[] = body.sourceEventIds ?? [];

  if (truthLabel === "REAL" && sourceEventIds.length === 0) {
    return NextResponse.json(
      {
        error:
          "REAL content must cite at least one sourceEventIds entry. Use a non-REAL truthLabel for hypothetical/simulated content.",
      },
      { status: 400 }
    );
  }

  const piece = await prisma.contentPiece.create({
    data: {
      episodeId: body.episodeId ?? undefined,
      platform: body.platform,
      type: body.type,
      title: body.title,
      hook: body.hook ?? undefined,
      script: body.script ?? undefined,
      status: body.status ?? "IDEA",
      truthLabel,
      sourceEventIds,
    },
  });

  return NextResponse.json(piece, { status: 201 });
}
