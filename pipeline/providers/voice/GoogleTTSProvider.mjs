// Google Cloud Text-to-Speech REST API. Reachable from this session
// (texttospeech.googleapis.com is not blocked, verified by testing).
// This is a long-stable, well-documented API - higher confidence than
// VeoProvider on exact field names, but still written from training
// knowledge since the docs host itself is blocked here too.
import { VoiceProvider } from "./VoiceProvider.mjs";
import { writeFile } from "node:fs/promises";

const BASE_URL = "https://texttospeech.googleapis.com/v1";

// Neural2 is the "cheapest reasonable" natural-sounding tier; Studio
// voices are the premium/most natural tier at higher cost. Swap DEFAULT
// below to a Studio voice once quality needs to go up.
const DEFAULT_VOICE = "en-US-Neural2-F"; // young-adult-leaning American female

function apiKey() {
  const key = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Set GOOGLE_API_KEY or GEMINI_API_KEY");
  return key;
}

export class GoogleTTSProvider extends VoiceProvider {
  constructor({ voiceId = DEFAULT_VOICE, languageCode = "en-US" } = {}) {
    super();
    this.voiceId = voiceId;
    this.languageCode = languageCode;
  }

  get name() {
    return `Google Cloud TTS (${this.voiceId})`;
  }

  async estimateCost({ text }) {
    // Neural2 pricing (training-era, unverified live): ~$16 per 1M chars.
    // Confirm at Google Cloud TTS pricing page before approving.
    const chars = text.length;
    const usdPerMillionChars = 16;
    return {
      provider: "Google",
      model: this.voiceId,
      estimatedUsd: Math.round((chars / 1_000_000) * usdPerMillionChars * 10000) / 10000,
      notes: `${chars} chars (unverified live rate ~$${usdPerMillionChars}/1M chars). Free tier may cover this entirely for a short test clip.`,
    };
  }

  async synthesize({ text, voiceId = this.voiceId, outputPath }) {
    const res = await fetch(`${BASE_URL}/text:synthesize?key=${apiKey()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: this.languageCode, name: voiceId },
        audioConfig: { audioEncoding: "MP3" },
      }),
    });
    if (!res.ok) throw new Error(`Google TTS failed: ${res.status} ${await res.text()}`);
    const { audioContent } = await res.json();
    await writeFile(outputPath, Buffer.from(audioContent, "base64"));
    return { audioPath: outputPath, metadata: { provider: this.name, voiceId } };
  }
}
