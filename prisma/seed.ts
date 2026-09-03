// Seeds ONLY what is actually true at project start:
//   - Ava's character sheet (fictional by definition - that's fine)
//   - Day 0 company state ($0, no idea chosen, PRE_IDEA stage)
//   - The Day 0 StoryEvent describing that
//   - Opportunity #1: "AI Sales Employee for B2B", logged as a CANDIDATE
//     sourced from this repo's original name/description - not scored,
//     not chosen, just entered into the discovery engine like anything
//     else would be.
//
// Do not add customers, revenue, interviews, or experiments here. Those
// only get inserted when they really happen, through the app/API, not
// via seed data.

import { PrismaClient } from "@prisma/client";
import { AVA_CHARACTER } from "../src/lib/story-bible/ava-character";

const prisma = new PrismaClient();

async function main() {
  const existingCharacter = await prisma.character.findFirst();
  if (!existingCharacter) {
    await prisma.character.create({
      data: {
        name: AVA_CHARACTER.name,
        isFictional: AVA_CHARACTER.isFictional,
        apparentAge: AVA_CHARACTER.apparentAge,
        nationality: AVA_CHARACTER.nationality,
        location: AVA_CHARACTER.location,
        personality: AVA_CHARACTER.personality,
        appearance: AVA_CHARACTER.appearance,
        voice: AVA_CHARACTER.voice,
        backstory: AVA_CHARACTER.backstory,
        memories: AVA_CHARACTER.memories,
        visualStyle: AVA_CHARACTER.visualStyle,
        referencePrompt: AVA_CHARACTER.referencePrompt,
      },
    });
    console.log("Seeded Character: Ava Carter");
  } else {
    console.log("Character already exists, skipping");
  }

  let opportunity = await prisma.opportunity.findFirst({
    where: { title: "AI Sales Employee for B2B" },
  });
  if (!opportunity) {
    opportunity = await prisma.opportunity.create({
      data: {
        title: "AI Sales Employee for B2B",
        description:
          "AI-powered B2B sales employee for lead generation, outreach, and CRM automation. Logged as a candidate because it was the repository's original name/brief - not yet interviewed or scored. Evaluate through the same discovery framework as every other candidate before treating it as chosen.",
        source: "repo-brief",
        status: "CANDIDATE",
      },
    });
    console.log("Seeded Opportunity #1: AI Sales Employee for B2B (candidate, unscored)");
  } else {
    console.log("Opportunity #1 already exists, skipping");
  }

  const existingState = await prisma.companyState.findFirst();
  if (!existingState) {
    await prisma.companyState.create({
      data: {
        dayNumber: 0,
        stage: "PRE_IDEA",
        cashOnHand: 0,
        mrr: 0,
        arr: 0,
        activeCustomers: 0,
        notes: "Day 0. $0. No startup, no product, no chosen market, no customers.",
      },
    });
    console.log("Seeded CompanyState: Day 0");
  } else {
    console.log("CompanyState already exists, skipping");
  }

  const existingEvent = await prisma.storyEvent.findFirst({
    where: { dayNumber: 0 },
  });
  if (!existingEvent) {
    await prisma.storyEvent.create({
      data: {
        dayNumber: 0,
        title: "Project started",
        description:
          "Ava Carter's $0 -> $1B build-in-public project begins. No startup, no product, no chosen market, no customers, $0 cash. First candidate opportunity (AI Sales Employee for B2B) logged for evaluation.",
        truthLabel: "REAL",
        opportunityId: opportunity.id,
        tags: ["milestone", "day-0"],
      },
    });
    console.log("Seeded StoryEvent: Day 0");
  } else {
    console.log("Day 0 StoryEvent already exists, skipping");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
