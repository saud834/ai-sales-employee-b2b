// Official Runway API (dev.runwayml.com), per the target stack. Correct
// and complete, but NOT runnable from inside this Claude Code session:
// api.runwayml.com is rejected by this session's network egress policy
// regardless of API key (verified by testing). This exists so the
// pipeline is provider-swappable and so it works unmodified the moment
// either (a) this environment's network policy allows the host, or
// (b) it's run from a machine with normal internet access.
//
// Written from training knowledge, not verified against live docs
// (dev.runwayml.com docs are also unreachable from here). Confirm field
// names against https://docs.dev.runwayml.com before relying on this.
import { VideoProvider } from "./VideoProvider.mjs";
import { writeFile } from "node:fs/promises";

const BASE_URL = "https://api.runwayml.com/v1";
const DEFAULT_MODEL = "gen4_turbo";

function apiKey() {
  const key = process.env.RUNWAYML_API_SECRET;
  if (!key) throw new Error("Set RUNWAYML_API_SECRET");
  return key;
}

function headers() {
  return {
    Authorization: `Bearer ${apiKey()}`,
    "Content-Type": "application/json",
    "X-Runway-Version": "2024-11-06",
  };
}

export class RunwayProvider extends VideoProvider {
  constructor({ model = DEFAULT_MODEL } = {}) {
    super();
    this.model = model;
  }

  get name() {
    return `Runway (${this.model})`;
  }

  async estimateCost({ durationSeconds = 8 }) {
    // Runway prices in credits, not direct USD; ~5 credits/sec of output
    // for gen4_turbo is the training-era figure, unverified live.
    // Confirm at https://dev.runwayml.com/pricing before approving.
    const approxCreditsPerSecond = 5;
    const credits = approxCreditsPerSecond * durationSeconds;
    return {
      provider: "Runway",
      model: this.model,
      estimatedUsd: null,
      notes: `~${credits} credits (unverified live) for ${durationSeconds}s. Check current credit pricing at dev.runwayml.com before approving.`,
    };
  }

  async generateFromText({ prompt, durationSeconds = 8, aspectRatio = "9:16", outputPath }) {
    // Runway's gen4_turbo is image-conditioned; a pure text->video path
    // may require their text-to-image step first, or a different model.
    // generateFromImage below is the well-documented path.
    throw new Error(
      "RunwayProvider.generateFromText: gen4_turbo requires an input image. Use generateFromImage, or switch this.model to a text-to-video-capable model and update this method."
    );
  }

  async generateFromImage({ imagePath, prompt, durationSeconds = 8, aspectRatio = "9:16", outputPath }) {
    const { readFile } = await import("node:fs/promises");
    const imageBytes = (await readFile(imagePath)).toString("base64");
    const mimeType = imagePath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";

    const startRes = await fetch(`${BASE_URL}/image_to_video`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        model: this.model,
        promptImage: `data:${mimeType};base64,${imageBytes}`,
        promptText: prompt,
        ratio: aspectRatio === "9:16" ? "768:1280" : "1280:768",
        duration: durationSeconds,
      }),
    });
    if (!startRes.ok) throw new Error(`Runway generation start failed: ${startRes.status} ${await startRes.text()}`);
    const { id: taskId } = await startRes.json();
    console.log(`  Runway task started: ${taskId}`);

    const started = Date.now();
    const timeoutMs = 6 * 60 * 1000;
    let task;
    while (Date.now() - started < timeoutMs) {
      const pollRes = await fetch(`${BASE_URL}/tasks/${taskId}`, { headers: headers() });
      if (!pollRes.ok) throw new Error(`Runway poll failed: ${pollRes.status} ${await pollRes.text()}`);
      task = await pollRes.json();
      if (task.status === "SUCCEEDED" || task.status === "FAILED") break;
      console.log(`  ...status: ${task.status}`);
      await new Promise((r) => setTimeout(r, 10000));
    }
    if (task?.status !== "SUCCEEDED") throw new Error(`Runway generation did not succeed: ${JSON.stringify(task)}`);

    const videoUrl = task.output?.[0];
    if (!videoUrl) throw new Error(`No output video URL in task response: ${JSON.stringify(task)}`);

    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) throw new Error(`Video download failed: ${videoRes.status}`);
    await writeFile(outputPath, Buffer.from(await videoRes.arrayBuffer()));

    return { videoPath: outputPath, metadata: { provider: this.name, taskId, durationSeconds, aspectRatio } };
  }
}
