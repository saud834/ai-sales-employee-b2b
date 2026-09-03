import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET  /api/story-bible          -> list StoryEvents, newest first
// POST /api/story-bible          -> log a new real (or explicitly-labeled) event

export async function GET() {
  const events = await prisma.storyEvent.findMany({
    orderBy: [{ dayNumber: "desc" }, { occurredAt: "desc" }],
    include: { opportunity: true, episode: true },
  });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.title || !body.description || typeof body.dayNumber !== "number") {
    return NextResponse.json(
      { error: "title, description, and dayNumber are required" },
      { status: 400 }
    );
  }

  const event = await prisma.storyEvent.create({
    data: {
      dayNumber: body.dayNumber,
      title: body.title,
      description: body.description,
      truthLabel: body.truthLabel ?? "REAL",
      opportunityId: body.opportunityId ?? undefined,
      episodeId: body.episodeId ?? undefined,
      tags: body.tags ?? [],
    },
  });

  return NextResponse.json(event, { status: 201 });
}
