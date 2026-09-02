# Judge path: 90 seconds through Rushes

Every link below is live and was clicked before this file was written. If any
dead ends, that is a bug: the entry fails on the spot.

## 0:00 · The landing

https://tryrushes.vercel.app

The hero says what it is: "Your agent did the work. Here is the tape."
Below the fold: the cutting bench, playing the latest verified run. The tape
is the real recording, committed byte for byte to the repo you are standing
in. The slate on it is the run's serial.

## 0:20 · The registry

https://tryrushes.vercel.app/runs

Every run Rushes has executed, newest first. Cards show the serial, the
verdict stamp, duration, tape size, and the pages visited. Runs that failed
during the Sep 2 replay outage are listed as failed: a receipts product that
hides its own failures would be the wrong product.

## 0:35 · A receipt

https://tryrushes.vercel.app/runs/RUSH-2026-09-02-0009

This run proves interactions: the recorded browser opened getsolari.com,
clicked DOCS, landed on the docs page, and the expect check passed on the
post-click title. The manifest below the bench records every step, the
actions, the timings, and the cost in credits.

## 0:50 · Submit your own

https://tryrushes.vercel.app/point

Up to five pages, and a word or phrase expected on each. Submitting fires a
GitHub Actions run: a recorded Solari cloud browser executes your task, and
the receipt (tape, manifest, registry entry) commits itself to this repo.
Your serial appears in the registry within about two minutes.

## 1:05 · The engine and the workflow

https://github.com/A-Raphie/rushes

- engine/run.ts: the runner (recorded sessions, replay poll, tape download)
- engine/smoke.js: the CLI-QA harness used before every deploy
- .github/workflows/rushes-run.yml: the public dispatcher that commits receipts
- docs/DESIGN.md: the design system, mined from Solari's own CSS
- docs/PHASE0-RESULTS.md: the verification log, costs included

## 1:20 · The one honest caveat

Solari's replay generation went down on Sep 2 (their side, reported to them).
Runs since then execute every check and commit their manifest, but the tape
reads "no tape" until replay capture recovers. Runs from Sep 1 have tapes and
play fine. A receipts product that hides an outage would not be a receipts
product.
