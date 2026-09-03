// Generates an SRT file. No forced-alignment/word-timestamps available
// from either provider's basic API, so cue timing is a proportional
// estimate: split the script into sentences, distribute the known real
// audio duration across them by character count. Good enough for a short
// single-line-to-a-few-sentence prototype; revisit with real alignment
// (e.g. Whisper word timestamps) if scripts get longer/multi-speaker.
import { writeFile } from "node:fs/promises";

function srtTimestamp(seconds) {
  const ms = Math.round(seconds * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  const msPart = String(ms % 1000).padStart(3, "0");
  return `${h}:${m}:${s},${msPart}`;
}

function splitIntoSentences(text) {
  const parts = text
    .replace(/\s+/g, " ")
    .trim()
    .match(/[^.!?]+[.!?]*/g);
  return (parts ?? [text]).map((s) => s.trim()).filter(Boolean);
}

export async function generateSubtitles({ script, leadInSeconds, speechDurationSeconds, outputPath }) {
  const sentences = splitIntoSentences(script);
  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);

  let cursor = leadInSeconds;
  const cues = sentences.map((sentence, i) => {
    const share = totalChars > 0 ? sentence.length / totalChars : 1 / sentences.length;
    const dur = speechDurationSeconds * share;
    const start = cursor;
    const end = i === sentences.length - 1 ? leadInSeconds + speechDurationSeconds : cursor + dur;
    cursor = end;
    return { index: i + 1, start, end, text: sentence };
  });

  const srt = cues
    .map((c) => `${c.index}\n${srtTimestamp(c.start)} --> ${srtTimestamp(c.end)}\n${c.text}\n`)
    .join("\n");

  await writeFile(outputPath, srt);
  return { subtitlesPath: outputPath, cueCount: cues.length };
}
