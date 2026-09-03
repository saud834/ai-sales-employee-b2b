#!/usr/bin/env node
// Free, safe verification: confirms keys are present and reachable, lists
// real available models/voices from the live APIs. Spends nothing. Run
// this before ever approving a real generation (Gate 2) - it's how we
// ground VeoProvider/GoogleTTSProvider's field names in the live API
// instead of trusting training-era docs knowledge.
import { VeoProvider } from "./providers/video/VeoProvider.mjs";

const googleKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
const runwayKey = process.env.RUNWAYML_API_SECRET;
const elevenKey = process.env.ELEVENLABS_API_KEY;

console.log("=== Provider check ===\n");

console.log("Env vars:");
console.log(`  GOOGLE_API_KEY / GEMINI_API_KEY: ${googleKey ? "set" : "NOT set"}`);
console.log(`  RUNWAYML_API_SECRET:             ${runwayKey ? "set" : "NOT set"}`);
console.log(`  ELEVENLABS_API_KEY:               ${elevenKey ? "set" : "NOT set"}`);
console.log("");

if (!googleKey) {
  console.log("No Google key set - nothing further to check. See README.md for where to create one.");
  process.exit(0);
}

console.log("Checking Veo models (free call: models.list)...");
try {
  const veo = new VeoProvider();
  const models = await veo.listModels();
  if (models.length === 0) {
    console.log("  No Veo-named models returned. This Google API key may not have Veo access yet.");
  } else {
    for (const m of models) {
      console.log(`  - ${m.name}  (supported methods: ${(m.supportedGenerationMethods ?? []).join(", ")})`);
    }
  }
} catch (err) {
  console.error(`  FAILED: ${err.message}`);
}

console.log("\nChecking Cloud TTS voices (free call: voices.list, filtered to en-US)...");
try {
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/voices?languageCode=en-US&key=${googleKey}`
  );
  if (!res.ok) {
    console.error(`  FAILED: ${res.status} ${await res.text()}`);
  } else {
    const { voices } = await res.json();
    const females = (voices ?? []).filter((v) => v.ssmlGender === "FEMALE");
    console.log(`  ${females.length} female en-US voices available. Examples:`);
    for (const v of females.slice(0, 8)) {
      console.log(`  - ${v.name} (${v.naturalSampleRateHertz}Hz)`);
    }
  }
} catch (err) {
  console.error(`  FAILED: ${err.message}`);
}

console.log("\nDone. No cost incurred by this check.");
