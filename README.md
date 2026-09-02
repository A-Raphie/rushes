# Rushes

Every agent run owes the world a demo. Rushes pays up.

You point it at a task. The task executes on Solari and you get the tape
back: an auto-cut clip, a serial-numbered manifest, and a replay hosted on
Solari's own servers. Not your screen recording. Not your claim.

Task types today: web flows (live). Next in the engine: sandbox tasks
(clone, run, verify output) and desktop capture.

Live panel: https://tryrushes.vercel.app

Named after film dailies: rushes are the day's raw footage, watched each
evening to verify what was actually captured. Today's rushes are what your
agents shot.

## Try it

Point it at a task from the site: https://tryrushes.vercel.app/point

Give it up to five pages and what each should contain. A recorded Solari
cloud browser executes the task on GitHub Actions, the receipt commits
itself to this repo (tape, manifest, registry), and your run appears in the
registry within a minute.

Prefer the terminal? The same engine runs locally:

```
git clone https://github.com/A-Raphie/rushes.git
cd rushes
npm install --prefix engine
export SOLARI_API_KEY=slr_live_...   # console.getsolari.com, free tier
npx tsx engine/run.ts engine/specs/demo-flow.json
```

## What a receipt looks like

Every run writes a manifest: see [docs/manifest-schema.md](docs/manifest-schema.md).
Serial, surface, duration, tape size, pages visited, verdict, cost. The
latest receipt renders live, for example
[/runs/RUSH-2026-09-02-0001](https://tryrushes.vercel.app/runs/RUSH-2026-09-02-0001).

## Honest status

| Capability | Status | Notes |
|---|---|---|
| Task composer on the site | works | /point submits; GitHub Actions executes; receipt commits itself |
| Recorded browser sessions + hosted replay | works, replay generation flaky | verified Sep 1; on Sep 2 Solari stopped serving replays for new sessions for hours (runs honestly marked failed; see runs 09-02-0002/0003) |
| Verdict lines by gpt-oss-120b (Groq) | works | grounded only in captured artifacts; deterministic fallback |
| Receipt pages per run | works | live from the committed registry |
| Sandboxes: exec, files, public preview URL | works | verified Sep 1 |
| Desktops | paid tier only | free tier rejects desktop creation; verified |
| Clip assembler (mp4 cut per run) | building | ffmpeg pipeline proven on prior projects |

## Costs, on the record

Built and verified on the Solari free tier ($3.00 monthly credits, no
overage billing). Total verification and demo spend so far: under $0.05.
The credit log lives in [docs/PHASE0-RESULTS.md](docs/PHASE0-RESULTS.md).

## Design

[docs/DESIGN.md](docs/DESIGN.md): the light-table direction, the cutting-bench
signature, and the sponsor tokens mined from getsolari.com's CSS.

Built on [Solari](https://getsolari.com), forked from the
[solari-cookbook](https://github.com/solari-sdk/solari-cookbook) for the
Pinetree Research build challenge.
