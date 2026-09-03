#!/usr/bin/env node
// Orchestrator: create_video_job -> generate_script -> generate_voice ->
// generate_video -> combine_audio_video -> generate_subtitles ->
// export_final_mp4.
//
// Gate 2 is enforced in code, not just by convention: generation only
// proceeds if `approved: true` is in the job config. Without it, the
// pipeline prints the cost estimate and stops. This file is called by
// Claude Code after the user has explicitly approved a specific job in
// chat - never run with approved:true on your own initiative.
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

import { generateScript } from "./steps/generateScript.mjs";
import { generateVoice } from "./steps/generateVoice.mjs";
import { generateVideo } from "./steps/generateVideo.mjs";
import { combineAudioVideo } from "./steps/combineAudioVideo.mjs";
import { generateSubtitles } from "./steps/generateSubtitles.mjs";
import { exportFinalMp4, writeJobMetadata, publishToOutputRoot } from "./steps/exportFinalMp4.mjs";

const REPO_OUTPUT_DIR = path.resolve(new URL("../output", import.meta.url).pathname);

/**
 * @param {object} job
 * @param {string} job.jobId
 * @param {string} job.concept - one-line description, for metadata only
 * @param {string} job.script - the voiceover line(s), written by Claude
 * @param {string} job.videoPrompt - the text-to-video prompt
 * @param {number} job.durationSeconds
 * @param {string} job.aspectRatio - e.g. "9:16"
 * @param {import("./providers/video/VideoProvider.mjs").VideoProvider} job.videoProvider
 * @param {import("./providers/voice/VoiceProvider.mjs").VoiceProvider} job.voiceProvider
 * @param {boolean} job.approved - must be true (set only after user approval) to actually generate
 */
export async function runPipeline(job) {
  const jobDir = path.join(REPO_OUTPUT_DIR, job.jobId);
  await mkdir(jobDir, { recursive: true });

  const { estimatedSpeechSeconds } = await generateScript({
    script: job.script,
    targetDurationSeconds: job.durationSeconds,
    outputPath: path.join(jobDir, "script.txt"),
  });

  const [videoCost, voiceCost] = await Promise.all([
    job.videoProvider.estimateCost({ durationSeconds: job.durationSeconds, aspectRatio: job.aspectRatio }),
    job.voiceProvider.estimateCost({ text: job.script }),
  ]);

  console.log("\n=== GATE 2: generation plan ===");
  console.log(`Job: ${job.jobId} - "${job.concept}"`);
  console.log(`Video: ${videoCost.provider} / ${videoCost.model} - est. $${videoCost.estimatedUsd ?? "?"} (${videoCost.notes})`);
  console.log(`Voice: ${voiceCost.provider} / ${voiceCost.model} - est. $${voiceCost.estimatedUsd ?? "?"} (${voiceCost.notes})`);
  console.log(`Script est. speech length: ~${estimatedSpeechSeconds}s vs ${job.durationSeconds}s video`);
  console.log("================================\n");

  if (!job.approved) {
    console.log("Not approved (job.approved !== true) - stopping before any paid call.");
    return { stage: "cost_estimated", videoCost, voiceCost };
  }

  const voicePath = path.join(jobDir, "voice.mp3");
  await generateVoice({
    voiceProvider: job.voiceProvider,
    text: job.script,
    voiceId: job.voiceId,
    outputPath: voicePath,
  });

  const videoPath = path.join(jobDir, "video.mp4");
  await generateVideo({
    videoProvider: job.videoProvider,
    prompt: job.videoPrompt,
    imagePath: job.imagePath,
    durationSeconds: job.durationSeconds,
    aspectRatio: job.aspectRatio,
    outputPath: videoPath,
  });

  const mergedPath = path.join(jobDir, "merged.mp4");
  const combineResult = await combineAudioVideo({ videoPath, audioPath: voicePath, outputPath: mergedPath });

  const subtitlesPath = path.join(jobDir, "subtitles.srt");
  await generateSubtitles({
    script: job.script,
    leadInSeconds: combineResult.leadInSeconds,
    speechDurationSeconds: combineResult.audioDur,
    outputPath: subtitlesPath,
  });

  const finalPath = path.join(jobDir, "final.mp4");
  await exportFinalMp4({ mergedVideoPath: mergedPath, subtitlesPath, outputPath: finalPath });

  const metadata = {
    jobId: job.jobId,
    concept: job.concept,
    createdAt: new Date().toISOString(),
    contentLabel: "AI_GENERATED_TEST", // per truth-system rules: not a real Ava Story Bible event
    script: job.script,
    videoPrompt: job.videoPrompt,
    durationSeconds: job.durationSeconds,
    aspectRatio: job.aspectRatio,
    providers: { video: videoCost, voice: voiceCost },
    trimmed: combineResult.trimmed,
  };
  await writeJobMetadata({ metadataPath: path.join(jobDir, "metadata.json"), metadata });

  const { publishedPath } = await publishToOutputRoot({
    finalPath,
    jobId: job.jobId,
    repoOutputDir: REPO_OUTPUT_DIR,
  });

  console.log(`\nDone. Final video: ${publishedPath}`);
  return { stage: "complete", finalPath, publishedPath, metadata };
}

// CLI entry: node runPipeline.mjs job.json [--approve]
if (import.meta.url === `file://${process.argv[1]}`) {
  const jobFile = process.argv[2];
  if (!jobFile) {
    console.error("Usage: node runPipeline.mjs <job.json> [--approve]");
    process.exit(1);
  }
  const jobSpec = JSON.parse(await readFile(jobFile, "utf-8"));
  const approved = process.argv.includes("--approve");

  const { VeoProvider } = await import("./providers/video/VeoProvider.mjs");
  const { RunwayProvider } = await import("./providers/video/RunwayProvider.mjs");
  const { GoogleTTSProvider } = await import("./providers/voice/GoogleTTSProvider.mjs");
  const { ElevenLabsProvider } = await import("./providers/voice/ElevenLabsProvider.mjs");

  const videoProviders = { veo: VeoProvider, runway: RunwayProvider };
  const voiceProviders = { googleTts: GoogleTTSProvider, elevenlabs: ElevenLabsProvider };

  const VideoProviderClass = videoProviders[jobSpec.videoProvider ?? "veo"];
  const VoiceProviderClass = voiceProviders[jobSpec.voiceProvider ?? "googleTts"];

  await runPipeline({
    ...jobSpec,
    approved,
    videoProvider: new VideoProviderClass(),
    voiceProvider: new VoiceProviderClass(),
  });
}
