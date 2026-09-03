// Official ElevenLabs API, per the target stack. Correct and complete,
// but NOT runnable from inside this Claude Code session: api.elevenlabs.io
// is rejected by this session's network egress policy regardless of API
// key (verified by testing). Kept for provider-swappability and for
// running from a machine with normal internet access.
import { VoiceProvider } from "./VoiceProvider.mjs";
import { writeFile } from "node:fs/promises";

const BASE_URL = "https://api.elevenlabs.io/v1";

// A well-known high-quality American female voice in ElevenLabs' default
// library ("Rachel"). Swap freely - this is explicitly not Ava's final
// voice, just a reasonable default per the brief.
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

function apiKey() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("Set ELEVENLABS_API_KEY");
  return key;
}

export class ElevenLabsProvider extends VoiceProvider {
  constructor({ voiceId = DEFAULT_VOICE_ID, modelId = "eleven_multilingual_v2" } = {}) {
    super();
    this.voiceId = voiceId;
    this.modelId = modelId;
  }

  get name() {
    return `ElevenLabs (${this.voiceId})`;
  }

  async estimateCost({ text }) {
    // Training-era figure, unverified live: Creator tier is roughly
    // $0.00015-0.0003/char depending on plan. Confirm at
    // elevenlabs.io/pricing before approving.
    const chars = text.length;
    const usdPerChar = 0.0002;
    return {
      provider: "ElevenLabs",
      model: this.modelId,
      estimatedUsd: Math.round(chars * usdPerChar * 10000) / 10000,
      notes: `${chars} chars (unverified live rate ~$${usdPerChar}/char). Likely covered by free tier for a short test clip.`,
    };
  }

  async synthesize({ text, voiceId = this.voiceId, outputPath }) {
    const res = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "xi-api-key": apiKey(), "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: this.modelId,
        voice_settings: { stability: 0.35, similarity_boost: 0.8 },
      }),
    });
    if (!res.ok) throw new Error(`ElevenLabs TTS failed: ${res.status} ${await res.text()}`);
    await writeFile(outputPath, Buffer.from(await res.arrayBuffer()));
    return { audioPath: outputPath, metadata: { provider: this.name, voiceId } };
  }
}
