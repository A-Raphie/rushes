# Phase 0 verification results

Date: Sep 1, 2026 · key: slr_live_3bv3 (free tier, org "Legend's Personal") · every claim below executed against the live API

## Results table

| Check | Surface | Result | Evidence |
|---|---|---|---|
| Launch + read a page | browser | PASS, ~6s round trip, clean exit after `solari.close()` | `Example Domain` title + session id printed |
| Record a session (`recording: true` at create) | browser | PASS | session drove 3 pages; 537,120 bytes of replay NDJSON downloaded |
| Replay URL after release | browser | PASS, resolved on poll attempt 3, ~7s after `browser.close()` | presigned S3 URL (`pinetree-browser-replays.s3.us-west-1.amazonaws.com`) |
| THE TAPE RENDERS | browser | PASS, eyes-on in his Chrome | rrweb-player 2.x rendered the recorded getsolari.com page from the downloaded bytes; screenshot taken; runs/replay-player.html |
| Command exec + file round trip | sandbox | PASS, ~6s total | `python3 -c print(sum(range(101)))` -> 5050; write/readText/list ok |
| Public preview URL | sandbox | PASS, ~8s total | server inside VM on :3000, fetched from outside via *.preview.getsolari.com with pt_token |
| Desktop | desktop | FAIL: `PlanError: Desktop requires a paid plan` | free tier has NO desktops (earlier research said otherwise; wrong) |

## What the tape actually is

- Format: NDJSON of rrweb events (Meta type 4 + FullSnapshot type 2 per page state + IncrementalSnapshot type 3 + Load/DomContentLoaded). 17 events for a 3-page navigation.
- Contact-sheet implication: one full snapshot per page state = one bench frame per navigation. Interaction-heavy runs add incremental events between frames.
- The bench player renders from downloaded bytes with `rrweb-player@2.x`: `new rrwebPlayer.default({ target, props: { events } })` (2.x API; 1.x callable-style does NOT work with the 2.x UMD build).

## Constraints learned (product-shaping)

1. Replay presigned URLs expire in 900s (15 min). Rushes re-fetches them live via `sessions.getReplayUrl(sessionId)` with the key; the NDJSON also downloads and can be stored as the local artifact. Retention of the underlying S3 object: UNKNOWN, open question.
2. Free tier: browsers + sandboxes only. Desktop (computer-use capture) requires a paid plan. v1 evidence = browser + sandbox surfaces; manifest keeps `desktop: null`. A one-month Starter ($20) would unlock desktop filming for the demo if wanted.
3. `getReplayUrl` is only available ~1-3s AFTER release (`releaseAndWait` per SDK docs). Pipeline: close session first, then poll.
4. Replay probe v1 in this folder documents the pre-release failure mode on purpose.
5. Sandbox: `commands.run` waits for exit (background via `sh -c nohup ... &`), `exec`/`execStream`/`runCode`/`createCodeContext`/`previewUrl` on the handle; no `runBg` method in SDK 0.1.x.

## Credit log (console showed key Active, last used minutes ago)

| Step | Surface | Est. minutes | Est. cost |
|---|---|---|---|
| quickstart | browser | ~0.1 | ~$0.0003 |
| probe v1 (no replay: pre-release) | browser | ~0.1 | ~$0.0003 |
| probe v2 (recording + download) | browser | ~0.2 | ~$0.0005 |
| sandbox quickstart | sandbox | ~0.1 | ~$0.0002 |
| port preview | sandbox | ~0.2 | ~$0.0004 |
| desktop attempt | desktop | rejected at create | $0 |
| **total** | | | **< $0.01 of $3.00** |

## Verdict

Phase 0 = DONE, one scope correction. The thesis holds on the free tier: recorded sessions + hosted replay + local render all work end to end for browser and sandbox. v1 of Rushes = browser + sandbox tapes. The Cutting Bench renders real frames from real run artifacts, verified with eyes.
