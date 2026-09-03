// Google Veo via the Gemini API. This is the video provider this
// environment can actually reach (generativelanguage.googleapis.com is
// not blocked here, unlike api.runwayml.com/api.elevenlabs.io - verified
// by testing, not assumed).
//
// IMPORTANT: written from training knowledge, not verified against live
// docs - ai.google.dev and cloud.google.com are both blocked by this
// session's egress policy same as every other docs host, so exact field
// names below could have drifted. That's exactly why `listModels()`
// exists: it's a free, safe call against the real API that confirms the
// current model ID and lets us sanity-check before ever calling
// generateFromText (which spends money). Always run checkProviders.mjs
// before a real generation.
import { VideoProvider } from "./VideoProvider.mjs";
import { writeFile } from "node:fs/promises";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "veo-2.0-generate-001";

function apiKey() {
  const key = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Set GOOGLE_API_KEY or GEMINI_API_KEY");
  return key;
}

export class VeoProvider extends VideoProvider {
  constructor({ model = DEFAULT_MODEL } = {}) {
    super();
    this.model = model;
  }

  get name() {
    return `Veo (${this.model})`;
  }

  /** Free. Lists models so we can confirm the exact Veo model ID/capabilities live. */
  async listModels() {
    const res = await fetch(`${BASE_URL}/models?key=${apiKey()}`);
    if (!res.ok) throw new Error(`listModels failed: ${res.status} ${await res.text()}`);
    const json = await res.json();
    return (json.models ?? []).filter((m) => m.name?.includes("veo"));
  }

  async estimateCost({ durationSeconds = 8, aspectRatio = "9:16" }) {
    // Approximate, from training-era public pricing - NOT verified live
    // (pricing docs are also blocked). Confirm current per-second rate at
    // https://ai.google.dev/gemini-api/docs/pricing before approving spend.
    const approxUsdPerSecond = 0.35;
    return {
      provider: "Google",
      model: this.model,
      estimatedUsd: Math.round(approxUsdPerSecond * durationSeconds * 100) / 100,
      notes: `Rough estimate (~$${approxUsdPerSecond}/sec, unverified live) for ${durationSeconds}s at ${aspectRatio}. Confirm actual pricing before approving.`,
    };
  }

  async generateFromText({ prompt, durationSeconds = 8, aspectRatio = "9:16", outputPath }) {
    return this._generate({
      instance: { prompt },
      durationSeconds,
      aspectRatio,
      outputPath,
    });
  }

  async generateFromImage({ imagePath, prompt, durationSeconds = 8, aspectRatio = "9:16", outputPath }) {
    const { readFile } = await import("node:fs/promises");
    const imageBytes = (await readFile(imagePath)).toString("base64");
    const mimeType = imagePath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    return this._generate({
      instance: { prompt, image: { bytesBase64Encoded: imageBytes, mimeType } },
      durationSeconds,
      aspectRatio,
      outputPath,
    });
  }

  async _generate({ instance, durationSeconds, aspectRatio, outputPath }) {
    const startRes = await fetch(
      `${BASE_URL}/models/${this.model}:predictLongRunning?key=${apiKey()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [instance],
          parameters: { aspectRatio, durationSeconds },
        }),
      }
    );
    if (!startRes.ok) {
      throw new Error(`Veo generation start failed: ${startRes.status} ${await startRes.text()}`);
    }
    const { name: operationName } = await startRes.json();
    console.log(`  Veo operation started: ${operationName}`);

    const started = Date.now();
    const timeoutMs = 6 * 60 * 1000;
    let operation;
    while (Date.now() - started < timeoutMs) {
      const pollRes = await fetch(`${BASE_URL}/${operationName}?key=${apiKey()}`);
      if (!pollRes.ok) throw new Error(`Veo poll failed: ${pollRes.status} ${await pollRes.text()}`);
      operation = await pollRes.json();
      if (operation.done) break;
      console.log("  ...still generating");
      await new Promise((r) => setTimeout(r, 10000));
    }
    if (!operation?.done) throw new Error("Timed out waiting for Veo generation");
    if (operation.error) throw new Error(`Veo generation failed: ${JSON.stringify(operation.error)}`);

    // Response shape for the generated video file is the least-certain
    // part of this file (verify against operation JSON if this throws).
    const sample = operation.response?.generateVideoResponse?.generatedSamples?.[0];
    const fileUri = sample?.video?.uri;
    if (!fileUri) {
      throw new Error(
        `Could not find generated video URI in operation response. Raw response: ${JSON.stringify(operation.response)}`
      );
    }

    const videoRes = await fetch(`${fileUri}${fileUri.includes("?") ? "&" : "?"}key=${apiKey()}`);
    if (!videoRes.ok) throw new Error(`Video download failed: ${videoRes.status}`);
    await writeFile(outputPath, Buffer.from(await videoRes.arrayBuffer()));

    return {
      videoPath: outputPath,
      metadata: { provider: this.name, operationName, durationSeconds, aspectRatio },
    };
  }
}
