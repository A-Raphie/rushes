# Run manifest schema (v0)

One JSON file per run at `runs/<serial>/manifest.json`. The manifest IS the product: the clip is the friendly face, the manifest is the receipt. Everything in it must come from observed reality, never inferred.

```json
{
  "serial": "RUSH-2026-09-10-0007",
  "createdAt": "2026-09-10T14:03:22Z",
  "task": {
    "kind": "repo-command",
    "repo": "https://github.com/<owner>/<repo>",
    "commit": "<sha pinned at clone>",
    "command": "npm test"
  },
  "surface": {
    "browser": { "sessionId": "bst_<id>", "recorded": true, "replayUrl": "https://...", "region": "us-west" },
    "sandbox": { "id": "sbx_<id>", "template": "base", "cpu": 1, "memMb": 2048 },
    "desktop": null
  },
  "steps": [
    {
      "n": 1,
      "label": "clone",
      "startedAt": "...Z",
      "endedAt": "...Z",
      "artifacts": ["shots/01-clone.png"],
      "stdoutExcerpt": "..."
    }
  ],
  "verdict": {
    "outcome": "pass",
    "summary": "written by groq gpt-oss-120b, grounded ONLY in the artifacts",
    "model": "openai/gpt-oss-120b"
  },
  "clip": { "file": "clip.mp4", "durationSec": 41, "chapters": ["clone", "install", "test", "verdict"] },
  "cost": { "solariCredits": 0.11, "minutesBySurface": { "browser": 22, "sandbox": 41 } }
}
```

Rules:
- serials are monotonic per day and burned into the clip's last frame
- replayUrl is captured from `sessions.getReplayUrl(id)` at run time and re-verified before anything ships; a dead replay link fails the pre-ship gate
- verdict text is generated only after artifacts exist; the model sees artifacts, never vibes
- cost is measured from session lifetimes, priced at the documented tier rates, and rounded up
