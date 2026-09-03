# Ava 10-second identity prototype

Standalone, throwaway pipeline to test Ava's visual identity, animation
quality, and voice before locking anything into the Story Bible app. See
`BRIEF.md` for the creative brief (image prompt, script, voice direction)
and why this can't run inside the Claude Code session itself.

## Run it (from a machine with normal internet access)

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
