# Rushes

Every agent run owes the world a demo. Rushes pays up.

You point it at a task. The task executes on Solari (cloud browser, sandbox, or
desktop). You get the tape back: an auto-cut clip, a serial-numbered manifest,
and a replay hosted on Solari\'s own servers. Not your screen recording. Not
your claim.

Live panel: https://rushes-kappa.vercel.app

Named after film dailies: rushes are the day\'s raw footage, watched each
evening to verify what was actually captured. Today\'s rushes are what your
agents shot.

## Try it

Record a real session and fetch its notarized replay in under two minutes:

```
git clone https://github.com/A-Raphie/rushes.git
cd rushes/examples/browser-quickstart-ts
npm install
export SOLARI_API_KEY=slr_live_...   # console.getsolari.com, free tier
npx tsx recording-probe2.ts
```

You will get: the recorded session\'s page titles, a presigned replay URL from
Solari\'s storage, and a downloaded NDJSON tape of the run. Open the panel and
the landing plays a real recorded run through the same pipeline.

## What a receipt looks like

Every run writes a manifest: see [docs/manifest-schema.md](docs/manifest-schema.md).
Serial, surface, duration, tape size, pages visited, verdict, cost. The
landing page renders one: RUSH-2026-09-01-0001.

## Honest status

| Capability | Status | Notes |
|---|---|---|
| Recorded browser sessions + hosted replay | works | verified Sep 1 on the free tier |
| Sandboxes: exec, files, public preview URL | works | verified Sep 1 |
| Desktops | paid tier only | free tier rejects desktop creation; verified |
| Task runner (spec in, run out) | building | lands next |
| Per-run receipt pages | building | schema committed |
| Clip assembler | building | ffmpeg pipeline proven on prior projects |

## Costs, on the record

Built and verified on the Solari free tier ($3.00 monthly credits). Phase 0
verification spend: under $0.01. The credit log lives in
[docs/PHASE0-RESULTS.md](docs/PHASE0-RESULTS.md).

## Design

[docs/DESIGN.md](docs/DESIGN.md): the light-table direction, the cutting-bench
signature, and the sponsor tokens mined from getsolari.com\'s CSS.

Built on [Solari](https://getsolari.com), forked from the
[solari-cookbook](https://github.com/solari-sdk/solari-cookbook) for the
Pinetree Research build challenge.
