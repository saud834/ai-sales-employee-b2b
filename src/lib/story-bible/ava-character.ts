// Ava Carter's canonical character sheet.
//
// This is the single source of truth for her identity across every
// generated asset (scripts, image prompts, voice). Do not regenerate her
// appearance ad hoc per episode - always derive from this file, and if a
// trait needs to change, change it here (and bump the Character row in
// the DB via an update, not a new row).
//
// Ava is explicitly, permanently fictional (isFictional: true everywhere
// this record is used or displayed). The company she is documenting is
// real; she is not.

export const AVA_CHARACTER = {
  name: "Ava Carter",
  isFictional: true as const,
  apparentAge: 23,
  nationality: "American",
  location: "Silicon Valley, California",

  personality: {
    traits: [
      "ambitious",
      "curious",
      "intelligent but not perfect",
      "occasionally anxious",
      "funny and relatable",
      "willing to admit mistakes",
      "obsessed with building a real company",
      "learns from customers rather than pretending to know everything",
    ],
    speakingStyle:
      "Direct, fast-talking, self-aware. Thinks out loud. Uses precise numbers instead of vague claims ('we made $340 today', not 'we're crushing it'). Undercuts her own confidence with honest asides when she's unsure.",
  },

  appearance: {
    hairstyle: "Dark brown, shoulder-length, straight with slight wave, often in a low ponytail when working",
    eyeColor: "Warm brown",
    skinTone: "Light-medium olive",
    bodyProportions: "Average height (5'6\"), athletic-casual build",
    clothingStyle:
      "Minimalist startup-founder wardrobe: oversized neutral hoodies or knit sweaters, plain t-shirts, straight-leg jeans, white sneakers. Rotates a small consistent capsule wardrobe rather than a new outfit every scene.",
    accessories: "Thin gold stud earrings, a mechanical watch, a laptop covered in small stickers from tools she's used",
  },

  voice: {
    characteristics: "Mid-range female voice, slightly raspy, conversational pace with quick bursts when excited or stressed",
    tone: "Warm but blunt; drops into a quieter, more vulnerable register during failure/reflection scenes",
  },

  backstory:
    "Ava Carter is a 23-year-old aspiring founder in Silicon Valley starting with literally nothing: no company, no product, no chosen market, no customers, and $0. She is documenting, in public, her attempt to find a real, painful, high-value problem and build it into a company. She is not a former operator at a famous startup and has no built-in advantage - her edge is that she talks to an unreasonable number of people and is willing to be wrong on camera.",

  visualStyle:
    "Premium cinematic 3D animated character, in the register of a high-end animated streaming series - not anime, not photorealistic human, not cartoonishly childish. Cinematic lighting, realistic environments (Silicon Valley offices, cafes, apartments), expressive facial animation, subtle imperfections, cinematic camera movement.",

  /**
   * Base reference block to prepend to every image/video generation prompt
   * for Ava, so appearance stays consistent across tools and episodes.
   * Extend per-scene with setting/action/camera direction - never override
   * the identity block below.
   */
  referencePrompt: [
    "Character: Ava Carter, 23-year-old woman, dark brown shoulder-length wavy hair often in a low ponytail, warm brown eyes, light-medium olive skin, average athletic-casual build.",
    "Wardrobe: oversized neutral hoodie or knit sweater, plain t-shirt, straight-leg jeans, white sneakers, thin gold stud earrings, mechanical watch.",
    "Render style: premium cinematic 3D animated character, high-end animated streaming-series aesthetic (not anime, not photorealistic human, not cartoonishly childish), cinematic lighting, realistic modern environments, expressive facial animation, subtle imperfections, cinematic camera movement.",
    "This character is explicitly fictional/AI-generated and must never be depicted or described as a real photographed human.",
  ].join(" "),

  /** Important prior events, appended to as episodes ship. Kept here only
   * as the code-level fallback/default seed; the DB Character.memories
   * field is the live, editable source of truth once seeded. */
  memories: [{ day: 0, summary: "Project started. $0. No idea chosen yet." }],
} as const;

export type AvaCharacter = typeof AVA_CHARACTER;
