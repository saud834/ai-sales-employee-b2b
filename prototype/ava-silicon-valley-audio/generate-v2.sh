#!/usr/bin/env bash
# v2: "engaging" pass on the Silicon Valley journey script - same real
# constraints as v1 (Piper has no SSML, no per-word emphasis), pushed
# harder on the levers Piper actually has for more energy:
#   - length_scale dropped notably vs v1 (faster = more energetic AND
#     closer to the 15-20s target - still won't fully hit it, see below)
#   - wider volume swing (louder hook, more contrast to the soft close)
#   - wider pitch swing via rubberband (+8% down to -3%, vs v1's +5/-2)
#   - noise_w_scale bumped on the highest-energy sections for a bit more
#     natural variance/liveliness (subtle, not a guaranteed fix)
#
# Honest ceiling: "amy-low" is a 16kHz open-source VITS model, not a
# premium expressive voice - these knobs add real, measurable variation
# (verified below) but won't make it sound like a professional voice
# actor. That's a model-quality limit, not a tuning miss.
#
# Usage: ./generate-v2.sh [output_path]

set -euo pipefail

OUTPUT_PATH="${1:-./output/ava_silicon_valley_engaging.mp3}"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

pip install --quiet piper-tts

VOICE_DIR="$WORKDIR/voice"
mkdir -p "$VOICE_DIR"
curl -sSL -o "$WORKDIR/voice.tar.gz" \
  "https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-amy-low.tar.gz"
tar -xzf "$WORKDIR/voice.tar.gz" -C "$VOICE_DIR"
MODEL="$VOICE_DIR/en-us-amy-low.onnx"

declare -a TEXTS=(
  "Can you feel that? That's the heartbeat of Silicon Valley. And I'm about to jump right into it."
  "Moving here with nothing but a backpack, a laptop, and a crazy dream to build a billion-dollar company. No funding. No connections. Just grit."
  "And I'm taking you with me. Every win. Every failure. Every lesson. From my first dollar, to ten, to a hundred, all the way to a billion."
  "This is our journey. Drop your questions, share your ideas, and let's build this together. I'm Ava, and this is where it all begins."
)
# fast/loud hook -> confident mission -> honest transparency -> warm-but-clear invitation
declare -a LENGTH_SCALES=(0.72 0.85 0.92 0.98)
declare -a VOLUMES=(1.25 1.1 1.0 0.98)
declare -a PITCHES=(1.08 1.03 0.97 0.99)
declare -a NOISE_W=(0.9 0.85 0.8 0.8)
declare -a BREAK_AFTER_MS=(400 300 400 0)

echo "Synthesizing 4 sections (v2: faster pace, wider volume/pitch swing, more energy)..."
for i in 0 1 2 3; do
  echo "  section $((i+1))/4..."
  echo "${TEXTS[$i]}" | python3 -m piper -m "$MODEL" \
    --length-scale "${LENGTH_SCALES[$i]}" \
    --volume "${VOLUMES[$i]}" \
    --noise-w-scale "${NOISE_W[$i]}" \
    -f "$WORKDIR/raw_$i.wav"

  ffmpeg -y -loglevel error -i "$WORKDIR/raw_$i.wav" \
    -af "rubberband=pitch=${PITCHES[$i]}" "$WORKDIR/pitched_$i.wav"

  ms="${BREAK_AFTER_MS[$i]}"
  if [ "$ms" -gt 0 ]; then
    ffmpeg -y -loglevel error -f lavfi -i "anullsrc=r=22050:cl=mono" \
      -t "$(python3 -c "print($ms/1000)")" "$WORKDIR/silence_$i.wav"
  fi
done

echo "Concatenating with breaks..."
{
  for i in 0 1 2 3; do
    echo "file '$WORKDIR/pitched_$i.wav'"
    ms="${BREAK_AFTER_MS[$i]}"
    if [ "$ms" -gt 0 ]; then
      echo "file '$WORKDIR/silence_$i.wav'"
    fi
  done
} > "$WORKDIR/concat.txt"

mkdir -p "$(dirname "$OUTPUT_PATH")"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$WORKDIR/concat.txt" \
  -ar 44100 -ac 2 -b:a 192k "$OUTPUT_PATH"

DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTPUT_PATH")
echo ""
echo "Done: $OUTPUT_PATH"
echo "Actual duration: ${DURATION}s"
