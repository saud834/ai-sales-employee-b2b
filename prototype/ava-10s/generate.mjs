#!/usr/bin/env node
// Generates the 10-second Ava identity prototype via HeyGen (animation +
// lip-sync) with an optional ElevenLabs voice upgrade.
//
// NOT runnable from inside this Claude Code session: this session's
// network policy rejects connections to api.heygen.com and
// api.elevenlabs.io outright (confirmed by testing, see BRIEF.md). Run
// this from a machine with normal internet access.
//
// IMPORTANT: written from training knowledge, not verified against live
// docs (this session couldn't fetch docs.heygen.com either - same policy
// block). Endpoint paths/field names below are HeyGen's v2 video API and
// upload API as of general knowledge; check https://docs.heygen.com and
// https://elevenlabs.io/docs before relying on this as-is. The auth
// headers, multipart upload shape, and poll/download loop are the
// reusable scaffolding regardless of minor field-name drift.
//
// Usage:
//   HEYGEN_API_KEY=... PORTRAIT_IMAGE_PATH=./ava-portrait.png node generate.mjs
//
// Optional (higher-quality voice via ElevenLabs instead of HeyGen's
// built-in TTS):
//   ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=... node generate.mjs
//
// See .env.example for the full list of variables and BRIEF.md for the
// script/prompt this generates.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const SCRIPT_LINE =
  "I'm Ava. I'm 23, I have zero dollars, and I'm going to build a billion-dollar company.";

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const PORTRAIT_IMAGE_PATH = process.env.PORTRAIT_IMAGE_PATH;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const HEYGEN_VOICE_ID = process.env.HEYGEN_VOICE_ID; // used only if no ElevenLabs key
const OUTPUT_PATH = process.env.OUTPUT_PATH ?? "./output/ava-10s.mp4";

function requireEnv(name, value) {
  if (!value) {
    console.error(`Missing required env var: ${name} (see .env.example)`);
    process.exit(1);
  }
  return value;
}

async function elevenLabsTextToSpeech(text) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.35, similarity_boost: 0.8 },
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${await res.text()}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function heygenUpload(buffer, contentType) {
  // HeyGen's upload host is separate from the main API host.
  const res = await fetch("https://upload.heygen.com/v1/asset", {
    method: "POST",
    headers: {
      "X-Api-Key": HEYGEN_API_KEY,
      "Content-Type": contentType,
    },
    body: buffer,
  });
  if (!res.ok) {
    throw new Error(`HeyGen asset upload failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  // Expected shape: { data: { id, url, ... } } - adjust if the live API differs.
  return json.data;
}

async function heygenGenerateVideo({ talkingPhotoId, audioAssetId, voiceId, text }) {
  const voice = audioAssetId
    ? { type: "audio", audio_asset_id: audioAssetId }
    : { type: "text", input_text: text, voice_id: voiceId ?? HEYGEN_VOICE_ID };

  const res = await fetch("https://api.heygen.com/v2/video/generate", {
    method: "POST",
    headers: {
      "X-Api-Key": HEYGEN_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      video_inputs: [
        {
          character: { type: "talking_photo", talking_photo_id: talkingPhotoId },
          voice,
        },
      ],
      dimension: { width: 1080, height: 1920 }, // vertical, short-form friendly
    }),
  });
  if (!res.ok) {
    throw new Error(`HeyGen video generate failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.data.video_id;
}

async function heygenPollUntilDone(videoId) {
  const started = Date.now();
  const timeoutMs = 5 * 60 * 1000;

  while (Date.now() - started < timeoutMs) {
    const res = await fetch(
      `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
      { headers: { "X-Api-Key": HEYGEN_API_KEY } }
    );
    if (!res.ok) {
      throw new Error(`HeyGen status check failed: ${res.status} ${await res.text()}`);
    }
    const json = await res.json();
    const status = json.data.status;
    console.log(`  status: ${status}`);

    if (status === "completed") return json.data.video_url;
    if (status === "failed") throw new Error(`HeyGen generation failed: ${JSON.stringify(json.data)}`);

    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("Timed out waiting for HeyGen video generation");
}

async function downloadTo(url, outputPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  requireEnv("HEYGEN_API_KEY", HEYGEN_API_KEY);
  requireEnv("PORTRAIT_IMAGE_PATH", PORTRAIT_IMAGE_PATH);

  console.log("1/4 Uploading Ava's portrait to HeyGen as a talking photo...");
  const imageBuffer = await readFile(PORTRAIT_IMAGE_PATH);
  const ext = path.extname(PORTRAIT_IMAGE_PATH).toLowerCase();
  const contentType = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
  const talkingPhoto = await heygenUpload(imageBuffer, contentType);
  console.log(`  talking_photo_id: ${talkingPhoto.id}`);

  let audioAssetId;
  if (ELEVENLABS_API_KEY) {
    requireEnv("ELEVENLABS_VOICE_ID", ELEVENLABS_VOICE_ID);
    console.log("2/4 Generating voice line via ElevenLabs...");
    const audioBuffer = await elevenLabsTextToSpeech(SCRIPT_LINE);
    console.log("  uploading generated audio to HeyGen...");
    const audioAsset = await heygenUpload(audioBuffer, "audio/mpeg");
    audioAssetId = audioAsset.id;
  } else {
    console.log("2/4 No ELEVENLABS_API_KEY set - using HeyGen's built-in voice.");
  }

  console.log("3/4 Requesting video generation from HeyGen...");
  const videoId = await heygenGenerateVideo({
    talkingPhotoId: talkingPhoto.id,
    audioAssetId,
    text: SCRIPT_LINE,
  });
  console.log(`  video_id: ${videoId}`);

  console.log("3/4 Polling until render completes (can take a couple of minutes)...");
  const videoUrl = await heygenPollUntilDone(videoId);

  console.log(`4/4 Downloading to ${OUTPUT_PATH}...`);
  await downloadTo(videoUrl, OUTPUT_PATH);

  console.log(`\nDone: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
