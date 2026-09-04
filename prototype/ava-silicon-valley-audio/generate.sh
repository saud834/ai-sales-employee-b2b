#!/usr/bin/env bash
# Generates the "From Zero to Billion: Ava's Silicon Valley Journey" audio
# script - 4 sections with varied delivery (pace/volume/pitch), $0 cost,
# fully local (Piper TTS + ffmpeg).
#
# NOTE ON SSML: Piper (the piper-tts pip package) does NOT support SSML at
# all - no --ssml flag, no <prosody>/<break> tag parsing. Verified via
# `python3 -m piper --help`. The emotional-delivery goal (varied pace,
# volume, pitch per section) is instead approximated with real, supported
# mechanisms:
#   - pace: --length-scale (lower = faster, higher = slower)
#   - volume: --volume (exact multiplier per section, matches the brief's
#     "loud / medium / medium / soft" guide directly)
#   - pitch: NOT supported by Piper itself. Approximated post-hoc with
#     ffmpeg's rubberband filter (pitch-only shift, doesn't affect speed) -
#     this build of ffmpeg has --enable-librubberband, confirmed.
#   - breaks between sections: real silence, inserted via ffmpeg concat.
#
# Usage: ./generate.sh [output_path]

set -euo pipefail

OUTPUT_PATH="${1:-./output/ava_silicon_valley.mp3}"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

pip install --quiet piper-tts

VOICE_DIR="$WORKDIR/voice"
mkdir -p "$VOICE_DIR"
curl -sSL -o "$WORKDIR/voice.tar.gz" \
  "https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-amy-low.tar.gz"
tar -xzf "$WORKDIR/voice.tar.gz" -C "$VOICE_DIR"
MODEL="$VOICE_DIR/en-us-amy-low.onnx"

# Section text, and the delivery params mapped from the brief's guide:
#   length_scale: fast=0.88, medium=1.0, medium-slow=1.08, slow=1.18
#   volume: loud=1.15, normal=1.0, medium=0.95, soft=0.9
#   pitch (rubberband pitch-scale, applied after synthesis): +5%=1.05, 0%=1.0, -2%=0.98
declare -a TEXTS=(
  "I'm Ava, and I'm about to do something crazy. I'm moving to Silicon Valley with absolutely nothing, to build a billion-dollar company from scratch."
  "No funding. No connections. Just an idea, a laptop, and a relentless drive. And I'm taking you with me, every single step."
  "I'll share every win, every failure, and every lesson. From finding my first dollar, to hitting ten, to a hundred, to one million, all the way to one billion."
  "This isn't just my journey, it's ours. Follow along, learn with me, and let's build the future together. I'm Ava, and this is our story."
)
declare -a LENGTH_SCALES=(0.88 1.0 1.08 1.18)
declare -a VOLUMES=(1.15 1.0 0.95 0.9)
declare -a PITCHES=(1.05 1.0 0.98 0.98)
declare -a BREAK_AFTER_MS=(400 300 500 0)

echo "Synthesizing 4 sections with varied pace/volume/pitch..."
for i in 0 1 2 3; do
  echo "  section $((i+1))/4..."
  echo "${TEXTS[$i]}" | python3 -m piper -m "$MODEL" \
    --length-scale "${LENGTH_SCALES[$i]}" \
    --volume "${VOLUMES[$i]}" \
    -f "$WORKDIR/raw_$i.wav"

  # Pitch-only shift (tempo unaffected) via rubberband.
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
echo "Actual duration: ${DURATION}s (natural pace - see script comments re: the 15-20s target in the brief)"
