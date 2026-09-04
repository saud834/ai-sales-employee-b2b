#!/usr/bin/env bash
# Generates the Ava prototype: voice only, no face/character.
#
# Fully local - no external API, no API key. Uses:
#   - piper-tts (open-source neural TTS, pip package) for the voice
#   - a Piper voice model pulled from a GitHub release (not Hugging Face -
#     this session's network policy blocks huggingface.co, but reaches
#     github.com/objects.githubusercontent.com fine)
#   - ffmpeg for the waveform visual + caption overlay + mux
#
# Voice quality note: "en-us-amy-low" is an older, 16kHz Piper model -
# decent and clearly a woman's voice, but not premium/ElevenLabs-tier.
# Good enough to validate pacing, the voice-only format, and the caption
# treatment. See README.md for how to swap in a higher-quality voice API
# once you have a key for one this session can reach.
#
# Usage: ./generate-voice-only.sh [output_path]

set -euo pipefail

OUTPUT_PATH="${1:-./output/ava-prototype-voice-only.mp4}"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

TOTAL_DURATION=15
LEAD_IN=0.6

SCRIPT_LINE="I'm Ava. I'm 23, I have zero dollars, and I'm going to build a billion-dollar company. I just don't know what I'm building yet."

echo "1/5 Installing piper-tts..."
pip install --quiet piper-tts

echo "2/5 Fetching voice model (en-us-amy-low, U.S. English, female)..."
VOICE_URL="https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-amy-low.tar.gz"
curl -sSL -o "$WORKDIR/voice.tar.gz" "$VOICE_URL"
mkdir -p "$WORKDIR/voice"
tar -xzf "$WORKDIR/voice.tar.gz" -C "$WORKDIR/voice"

echo "3/5 Synthesizing the line..."
echo "$SCRIPT_LINE" | python3 -m piper -m "$WORKDIR/voice/en-us-amy-low.onnx" -f "$WORKDIR/voice.wav"

echo "4/5 Padding audio to ${TOTAL_DURATION}s (${LEAD_IN}s lead-in + trailing silence/hold)..."
ffmpeg -y -loglevel error -i "$WORKDIR/voice.wav" \
  -af "adelay=$(python3 -c "print(int($LEAD_IN*1000))")|$(python3 -c "print(int($LEAD_IN*1000))"),apad" \
  -t "$TOTAL_DURATION" -ar 44100 -ac 2 "$WORKDIR/padded.wav"

echo "5/5 Composing video (dark background + waveform + synced caption + disclosure)..."
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
FONT_REG=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf

cat > "$WORKDIR/title.txt" <<'EOF'
$0 -> $1,000,000,000
EOF
cat > "$WORKDIR/caption.txt" <<'EOF'
I'm Ava. I'm 23, I have zero
dollars, and I'm going to build
a billion-dollar company.
I just don't know what
I'm building yet.
EOF
cat > "$WORKDIR/disclosure.txt" <<'EOF'
AI-generated fictional founder  |  voice-only identity test  |  Day 0
EOF

mkdir -p "$(dirname "$OUTPUT_PATH")"

ffmpeg -y -loglevel error \
  -f lavfi -i "color=c=0x0a0a0a:s=1080x1920:d=${TOTAL_DURATION}:r=30" \
  -i "$WORKDIR/padded.wav" \
  -filter_complex "
    [1:a]showwaves=s=900x260:mode=cline:colors=0x34d399|0x10b981:rate=30:scale=sqrt[wave];
    [0:v][wave]overlay=(W-w)/2:1050:format=auto[bg1];
    [bg1]drawtext=fontfile=${FONT}:textfile=${WORKDIR}/title.txt:fontcolor=0xf5f5f5:fontsize=54:x=(w-text_w)/2:y=220:line_spacing=10[bg2];
    [bg2]drawtext=fontfile=${FONT_REG}:textfile=${WORKDIR}/caption.txt:fontcolor=0xe5e5e5:fontsize=46:x=(w-text_w)/2:y=1420:line_spacing=16:enable='between(t,0.55,13.5)'[bg3];
    [bg3]drawtext=fontfile=${FONT_REG}:textfile=${WORKDIR}/disclosure.txt:fontcolor=0x9ca3af:fontsize=26:x=(w-text_w)/2:y=1830[outv]
  " \
  -map "[outv]" -map 1:a \
  -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k \
  -shortest -t "$TOTAL_DURATION" \
  "$OUTPUT_PATH"

echo ""
echo "Done: $OUTPUT_PATH"
