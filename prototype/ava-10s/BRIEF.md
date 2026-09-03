# Ava Carter — 10-second identity prototype

Purpose: validate visual identity, animation quality, and voice ONLY. Not
wired into the Story Bible / Content Planner app — this is a throwaway
pipeline until Ava's look and voice are locked.

## Why this isn't generated yet

This session's outbound network policy denies every video/voice-generation
host (confirmed by testing api.heygen.com, api.elevenlabs.io, api.d-id.com,
api.runwayml.com — all rejected at the connection level, before any API key
is even checked). No generation API key is configured here either. Both
have to be resolved outside this sandbox: run `generate.mjs` from a machine
with normal internet access and a real API key.

## Pipeline (3 real steps — no single API turns text into Ava's face)

1. **Portrait** — text-to-image tool of your choice (Midjourney, DALL-E,
   SDXL, etc.) generates Ava's reference portrait from the prompt below.
   No generation API can produce a specific, consistent invented 3D
   character straight from a text description with no image source — an
   image (or a few consistent-angle images) has to exist first.
2. **Animate + lip-sync** — feed that portrait into HeyGen (or D-ID/Runway)
   as a photo/talking-photo avatar, which animates it and syncs it to
   audio.
3. **Voice** — either HeyGen's built-in TTS voice library (fastest, one
   vendor), or ElevenLabs for a higher-quality custom voice fed into step 2
   as an audio file.

`generate.mjs` in this folder automates steps 2–3 once you have a portrait
image and API key(s). Step 1 is manual — pick whichever image tool you
already have access to.

## Image prompt (step 1)

Use the identity block from `src/lib/story-bible/ava-character.ts`
(`AVA_CHARACTER.referencePrompt`), reproduced here so it doesn't drift:

> Character: Ava Carter, 23-year-old woman, dark brown shoulder-length wavy
> hair often in a low ponytail, warm brown eyes, light-medium olive skin,
> average athletic-casual build. Wardrobe: oversized neutral hoodie or knit
> sweater, plain t-shirt, straight-leg jeans, white sneakers, thin gold stud
> earrings, mechanical watch. Render style: premium cinematic 3D animated
> character, high-end animated streaming-series aesthetic (not anime, not
> photorealistic human, not cartoonishly childish), cinematic lighting,
> realistic modern environments, expressive facial animation, subtle
> imperfections, cinematic camera movement. This character is explicitly
> fictional/AI-generated and must never be depicted or described as a real
> photographed human.

For this prototype specifically, add: **front-facing portrait, neutral
confident expression, direct eye contact, shoulders-up crop, soft daylight
through a window, blurred modern apartment/co-working background** — a
clean plate that's easy for step 2 to animate and lip-sync.

Generate 2–3 angle variants (front, 3/4 left) if your tool supports it —
gives HeyGen/D-ID more to work with for natural head motion.

## Script (10 seconds, one line)

> "I'm Ava. I'm 23, I have zero dollars, and I'm going to build a
> billion-dollar company."

Beat breakdown so the 10s doesn't feel like a static talking head:

| Time | Beat |
|---|---|
| 0:00–0:01 | Ava looks up from her laptop, confident half-smile, direct to camera. Hook. |
| 0:01–0:07 | Delivers the line. Small self-deprecating shrug on "zero dollars," more intensity/lean-in on "billion-dollar company." |
| 0:07–0:10 | Beat of silence, small breath/smirk, subtle nod. Camera holds or slow push-in. Cliffhanger energy, not a hard stop. |

## Voice direction

Mid-range American female voice, slightly raspy, conversational pace,
speeding up slightly on "zero dollars" (nervous energy) and slowing/landing
harder on "billion-dollar company" (the actual ambition). Matches
`AVA_CHARACTER.voice` in the character sheet.

- HeyGen built-in library: pick a "young adult American female,
  conversational" voice — closest single-vendor match.
- ElevenLabs (higher fidelity): pick a voice matching the above and set
  `stability` moderate-low so the delivery isn't flat.

## What "done" looks like for this test

A single ~10s mp4, Ava direct-to-camera, lip-synced to the line above. This
is purely to sanity-check: does the face/style read as intended, does the
lip-sync/animation hold up, does the voice sound right? It is not meant to
be publishable — expect to regenerate the portrait and re-run this a few
times before locking Ava's final look.
