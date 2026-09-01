/* The run registry: real runs only (mock-hunter gate).
   Day 1 holds the Phase 0 verification run. Day 2 the engine appends
   generated manifests here; nothing is ever invented. */
export const runs = [
  {
    serial: "RUSH-2026-09-01-0001",
    kind: "phase0-verification",
    label: "Engine proof: recorded session, replay fetched, tape rendered",
    surface: "cloud chrome · recorded",
    pages: ["about:blank", "example.com", "news.ycombinator.com", "getsolari.com"],
    durationSec: 6.8,
    tapeBytes: 537120,
    sessionId: "ip-10-0-11-12:7934fde3:…:1788269501680",
    verdict: "verified",
    tapeUrl: "/runs/phase0/tape.ndjson",
    date: "2026-09-01",
  },
];
