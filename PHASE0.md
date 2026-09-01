# Phase 0 verify runbook

Runs the cookbook's own examples against the real API the moment SOLARI_API_KEY exists. Everything must fit the free tier (3 browsers, 1 sandbox, 1 desktop, 60-minute sessions).

Order matters: cheapest and most load-bearing first. If the browser recording check fails, the thesis needs a re-think before any build.

## 1. Browser quickstart + recording + replay (THE critical check)

cd examples/browser-quickstart-ts
cp ../../.env.example .env  # then fill the key
npm install && npm run start

Expected: prints page title, closes cleanly (`await solari.close()` or Node hangs, per cookbook gotchas).

Then modify to create the session with `recording: true` at create time (must be set at create, cannot be added later) and fetch `sessions.getReplayUrl(id)`. VERIFY: the replay URL opens in a browser and plays. Log the URL.

## 2. Sandbox quickstart

cd examples/sandbox-quickstart-ts
npm install && npm run start

Expected: command output + file write/read round-trip. Then check `previewUrl(port)` returns a working *.preview.getsolari.com URL.

## 3. Desktop computer-use (Python)

cd examples/desktop-computer-use-py
python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
python main.py

Expected: screenshot, click, type against the GUI. Note the +$0.02/hr screen cost line item.

## Credit log

After each step, read remaining credits in console.getsolari.com and record:

| Step | Surface | Minutes | Credits used | Replay URL works? |
|---|---|---|---|---|
| 1 | browser | | | |
| 2 | sandbox | | | n/a |
| 3 | desktop | | | n/a |

The credit log feeds the README honesty table directly. Honest accounting is a feature.

## Free-tier traps to verify explicitly

- Recording flag must be present at session create
- 60-minute cap: what actually happens at timeout (kill vs pause) on the free tier
- Replay URL retention: does it still resolve an hour later? a day later?
- No stealth on free tier: confirm recording works without it
