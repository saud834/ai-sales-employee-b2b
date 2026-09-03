# Ava 10-second identity prototype

Standalone, throwaway pipeline to test Ava's visual identity, animation
quality, and voice before locking anything into the Story Bible app. See
`BRIEF.md` for the creative brief (image prompt, script, voice direction).

## Voice-only version (works today, zero API keys)

`generate-voice-only.sh` runs entirely locally - open-source Piper TTS for
the voice, ffmpeg for a waveform + synced-caption visual, no face, no
external API. This is what produced `output/ava-10s-voice-only-v1.mp4`.

```bash
cd prototype/ava-10s
./generate-voice-only.sh
```

Voice quality is real but dated (Piper's "amy-low" model, 16kHz open-source
TTS) - clearly a woman's voice, good enough to judge pacing/format, not
premium/ElevenLabs-tier. To upgrade quality, give me an API key for a TTS
service and I'll swap it in:

- **Google Cloud Text-to-Speech** - the one voice API this session can
  actually reach (texttospeech.googleapis.com isn't blocked here, unlike
  ElevenLabs/OpenAI/Azure/PlayHT/Deepgram/Cartesia, which all are). If you
  have or can create a GCP API key, this is the path I can run myself,
  end-to-end, from inside this session.
- **ElevenLabs or any other TTS provider** - better voice selection/quality
  generally, but this session cannot reach it at all (tested, blocked by
  network policy). You'd run `generate-voice-only.sh`'s TTS step swapped
  for that provider's API from your own machine instead.

## Full face+voice version (needs your own machine + keys)

```bash
cd prototype/ava-10s
cp .env.example .env

# Step 1 (manual): generate Ava's portrait with any text-to-image tool,
# using the prompt in BRIEF.md. Save it, then point .env's
# PORTRAIT_IMAGE_PATH at it.

# Step 2-3 (scripted):
export $(cat .env | xargs)   # or use a tool like dotenv-cli
node generate.mjs
```

Output lands at `output/ava-10s.mp4` (gitignored - regenerate, don't
commit renders here).

## If HeyGen's API has moved on since this was written

`generate.mjs` was written from general knowledge of HeyGen's v2 API, not
verified against live docs (this session's network policy blocked fetching
them too). The auth pattern, multipart upload, and poll/download loop are
solid; if an endpoint 404s or a field is rejected, check
https://docs.heygen.com/reference and adjust - the script is structured so
that's a small, localized fix.
