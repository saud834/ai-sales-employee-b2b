// Burns subtitles onto the merged video and writes the job's metadata.json.
import { writeFile, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { runFfmpeg } from "./_ffutil.mjs";

const SUBTITLE_STYLE =
  "FontName=DejaVu Sans,FontSize=13,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=1,Shadow=0,Alignment=2,MarginV=90";

export async function exportFinalMp4({ mergedVideoPath, subtitlesPath, outputPath }) {
  // ffmpeg's subtitles filter needs colons in the path escaped.
  const escapedSrt = subtitlesPath.replace(/:/g, "\\:");
  await runFfmpeg([
    "-i",
    mergedVideoPath,
    "-vf",
    `subtitles=${escapedSrt}:force_style='${SUBTITLE_STYLE}'`,
    "-c:a",
    "copy",
    outputPath,
  ]);
  return { finalPath: outputPath };
}

export async function writeJobMetadata({ metadataPath, metadata }) {
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  return { metadataPath };
}

export async function publishToOutputRoot({ finalPath, jobId, repoOutputDir }) {
  await mkdir(repoOutputDir, { recursive: true });
  const publishedPath = path.join(repoOutputDir, `${jobId}.mp4`);
  await copyFile(finalPath, publishedPath);
  return { publishedPath };
}
