import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET  /api/opportunities  -> list all candidate/researched opportunities
// POST /api/opportunities  -> log a new candidate problem into the discovery engine

const SCORE_FIELDS = [
  "painScore",
  "frequency",
  "currentSpending",
  "willingnessToPay",
  "marketSize",
  "aiAdvantage",
  "retentionPotential",
  "expansionPotential",
] as const;

// Fields where a *higher* raw value is worse and should be inverted before
// rolling up into the composite score.
const INVERTED_SCORE_FIELDS = ["competition", "distributionDifficulty", "technicalDifficulty"] as const;

function computeOpportunityScore(input: Record<string, number | null | undefined>): number | null {
  const positives = SCORE_FIELDS.map((f) => input[f]).filter(
    (v): v is number => typeof v === "number"
  );
  const inverted = INVERTED_SCORE_FIELDS.map((f) =>
    typeof input[f] === "number" ? 10 - (input[f] as number) : undefined
  ).filter((v): v is number => typeof v === "number");

  const all = [...positives, ...inverted];
  if (all.length === 0) return null;
  return Math.round((all.reduce((a, b) => a + b, 0) / all.length) * 100) / 100;
}

export async function GET() {
  const opportunities = await prisma.opportunity.findMany({
    orderBy: [{ opportunityScore: "desc" }, { createdAt: "desc" }],
    include: { interviews: true, experiments: true },
  });
  return NextResponse.json(opportunities);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.title || !body.description || !body.source) {
    return NextResponse.json(
      { error: "title, description, and source are required" },
      { status: 400 }
    );
  }

  const scoreInput: Record<string, number | null | undefined> = {};
  for (const f of [...SCORE_FIELDS, ...INVERTED_SCORE_FIELDS]) {
    if (typeof body[f] === "number") scoreInput[f] = body[f];
  }

  const opportunity = await prisma.opportunity.create({
    data: {
      title: body.title,
      description: body.description,
      source: body.source,
      status: body.status ?? "CANDIDATE",
      painScore: body.painScore ?? undefined,
      frequency: body.frequency ?? undefined,
      currentSpending: body.currentSpending ?? undefined,
      willingnessToPay: body.willingnessToPay ?? undefined,
      marketSize: body.marketSize ?? undefined,
      competition: body.competition ?? undefined,
      aiAdvantage: body.aiAdvantage ?? undefined,
      distributionDifficulty: body.distributionDifficulty ?? undefined,
      technicalDifficulty: body.technicalDifficulty ?? undefined,
      retentionPotential: body.retentionPotential ?? undefined,
      expansionPotential: body.expansionPotential ?? undefined,
      opportunityScore: computeOpportunityScore(scoreInput),
    },
  });

  return NextResponse.json(opportunity, { status: 201 });
}
