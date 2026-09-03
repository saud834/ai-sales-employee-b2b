// Script generation is Claude's own job (the orchestrating intelligence),
// not an external API call - the caller passes the finished script text
// in. This step just persists it and does a light pacing sanity check.
import { writeFile } from "node:fs/promises";

// Rough spoken pace for pacing sanity-checks, not exact.
const WORDS_PER_SECOND = 2.5;

export async function generateScript({ script, targetDurationSeconds, outputPath }) {
  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
  const estimatedSpeechSeconds = Math.round((wordCount / WORDS_PER_SECOND) * 10) / 10;

  if (targetDurationSeconds && estimatedSpeechSeconds > targetDurationSeconds) {
    console.warn(
      `  Warning: script is ~${estimatedSpeechSeconds}s at natural pace, longer than the ${targetDurationSeconds}s target video duration. Audio will be trimmed to fit unless the script is shortened.`
    );
  }

  await writeFile(outputPath, script.trim() + "\n");
  return { scriptPath: outputPath, wordCount, estimatedSpeechSeconds };
}
