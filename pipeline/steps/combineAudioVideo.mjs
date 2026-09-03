// Muxes the (silent) generated video with the generated voice track.
// Video duration is authoritative (it's a fixed generation parameter);
// audio is padded with trailing silence if shorter, or trimmed with a
// warning if the script ran long for the requested video duration.
import { getDurationSeconds, runFfmpeg } from "./_ffutil.mjs";

const LEAD_IN_SECONDS = 0.4;

export async function combineAudioVideo({ videoPath, audioPath, outputPath }) {
  const videoDur = await getDurationSeconds(videoPath);
  const audioDur = await getDurationSeconds(audioPath);
  const speechEnd = LEAD_IN_SECONDS + audioDur;

  let trimmed = false;
  if (speechEnd > videoDur) {
    trimmed = true;
    console.warn(
      `  Warning: voice track (${audioDur.toFixed(1)}s + ${LEAD_IN_SECONDS}s lead-in) is longer than the video (${videoDur.toFixed(1)}s). Audio will be trimmed to fit - shorten the script next run.`
    );
  }

  await runFfmpeg([
    "-i",
    videoPath,
    "-i",
    audioPath,
    "-filter_complex",
    `[1:a]adelay=${Math.round(LEAD_IN_SECONDS * 1000)}|${Math.round(LEAD_IN_SECONDS * 1000)},apad[a]`,
    "-map",
    "0:v",
    "-map",
    "[a]",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-t",
    String(videoDur),
    outputPath,
  ]);

  return { mergedPath: outputPath, videoDur, audioDur, leadInSeconds: LEAD_IN_SECONDS, trimmed };
}
