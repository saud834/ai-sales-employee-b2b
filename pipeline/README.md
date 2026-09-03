# Video pipeline

`INPUT (concept/script) -> AI voice -> AI video -> subtitles -> final MP4`,
orchestrated by Claude Code. Standalone, zero npm dependencies (built-in
`fetch`, `fs`, ffmpeg/ffprobe as external binaries) - not wired into the
Next.js app.

## Provider abstraction

```
VideoProvider  -> VeoProvider (Google, reachable from this session)
               -> RunwayProvider (target stack, portable, blocked here)
VoiceProvider  -> GoogleTTSProvider (reachable from this session)
               -> ElevenLabsProvider (target stack, portable, blocked here)
```

Runway and ElevenLabs are the preferred target stack and are fully
implemented, but `api.runwayml.com` / `api.elevenlabs.io` are rejected by
this Claude Code session's network egress policy regardless of API key
(verified by testing, not assumed). Veo + Google Cloud TTS are the
provider pair actually usable from inside this session today
(`*.googleapis.com` is reachable). Swapping which pair a job uses is a
one-line change in the job JSON (`videoProvider`/`voiceProvider`) - that's
the point of the interface.

## Setup

```bash
cp pipeline/.env.example pipeline/.env
# fill in GOOGLE_API_KEY (see .env.example for where to create it)
export $(cat pipeline/.env | xargs)
```

## Verify before spending anything (free)

```bash
node pipeline/checkProviders.mjs
```

Confirms the key works and lists real, current Veo model IDs and Cloud TTS
voice names straight from the live API - this project's docs sites are
also blocked from this session, so this is how the provider code gets
grounded in reality instead of training-era guesses.

## Run a job

Edit or copy `pipeline/jobs/prototype-001.json`, then:

```bash
# 1. Cost estimate only, no spend:
node pipeline/runPipeline.mjs pipeline/jobs/prototype-001.json

# 2. After reviewing the estimate and approving:
node pipeline/runPipeline.mjs pipeline/jobs/prototype-001.json --approve
```

`runPipeline.mjs` refuses to call any paid API unless `--approve` is
passed - this mirrors the Gate 2 approval flow so the code can't
accidentally spend money on its own.

## Output

```
output/
  prototype-001.mp4            <- final published video
  prototype-001/
    script.txt
    voice.mp3
    video.mp4                  <- silent, straight from the video provider
    merged.mp4                 <- video + voice, muxed
    subtitles.srt
    final.mp4                  <- merged + burned-in subtitles
    metadata.json               <- providers used, costs, truth-label, timestamps
```

`output/` is gitignored - it's regenerable, not source.

## Notes on accuracy

`VeoProvider` and `RunwayProvider`'s exact request/response field names
are written from training knowledge, not verified live docs (every docs
host tried - ai.google.dev, cloud.google.com, dev.runwayml.com - is also
blocked from this session, same policy as the API hosts for the blocked
providers). `checkProviders.mjs`'s free calls are the safety net: if a
field name has drifted, that shows up there before any paid call, not
during one. `GoogleTTSProvider` is on a long-stable, simple REST API and
carries higher confidence.
