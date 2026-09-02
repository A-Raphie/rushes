/**
 * Rushes runner: a task spec in, a run on the record out.
 *
 * Spec: JSON with { kind, name, steps: [{ label, url, expect?, dwellMs? }] }.
 * Flow: recorded Solari cloud Chrome executes the steps, the session is
 * released, the replay URL is polled (it only exists ~1-3s after release),
 * the NDJSON tape is downloaded, and a manifest is assembled per
 * docs/manifest-schema.md. The verdict is written by Groq when a key exists,
 * otherwise from the deterministic facts alone (never invented).
 *
 * Outputs:
 *   runs/<serial>/manifest.json          (local raw, gitignored)
 *   runs/<serial>/tape.ndjson            (local raw, gitignored)
 *   panel/public/runs/<serial>/tape.ndjson  (site evidence, committed)
 *   panel/data/runs.json                 (panel data, committed)
 */
import { Solari } from "@solarisdk/browser";
import {
  writeFileSync,
  mkdirSync,
  copyFileSync,
  existsSync,
  readFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const specPath = process.argv[2] ?? join(ROOT, "engine/specs/demo-flow.json");
const spec = JSON.parse(readFileSync(specPath, "utf8"));
const apiKey = process.env.SOLARI_API_KEY;
if (!apiKey) throw new Error("SOLARI_API_KEY missing: source .env first");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- serial: monotonic per day across the existing registry ----
const dataDir = join(ROOT, "panel", "data");
const dataFile = join(dataDir, "runs.json");
const existing = existsSync(dataFile) ? JSON.parse(readFileSync(dataFile, "utf8")) : [];
const today = new Date().toISOString().slice(0, 10);
const seq = existing.filter((r) => r.serial?.startsWith(`RUSH-${today}`)).length + 1;
const serial = `RUSH-${today}-${String(seq).padStart(4, "0")}`;

// ---- execute ----
const solari = new Solari({ apiKey });
const t0 = Date.now();
const browser = await solari.launch({ recording: true });
const sessionId = browser.id;
console.log("session:", sessionId);
const steps = [];
try {
  const page = await browser.newPage();
  let n = 0;
  for (const step of spec.steps) {
    n += 1;
    const startedAt = new Date().toISOString();
    await page.goto(step.url, { waitUntil: "domcontentloaded", timeoutMs: 30000 });
    await page.waitForTimeout(step.dwellMs ?? 1800);
    const title = await page.title();
    let ok = true;
    if (step.expect) {
      ok = (await page.getByText(step.expect).count()) > 0;
    }
    steps.push({
      n,
      label: step.label ?? step.url,
      url: page.url(),
      title,
      startedAt,
      endedAt: new Date().toISOString(),
      ok,
      expect: step.expect ?? null,
    });
    console.log(`step ${n}: ${step.url} -> "${title}" ${ok ? "OK" : "MISS"}`);
  }
} finally {
  await browser.close();
}
const openMs = Date.now() - t0;
console.log("open ms:", openMs);

// ---- replay: presigned URL exists only after the session is released ----
// Two-stage poll: first wait for the session to actually reach released
// (the RUSH-2026-09-02-0002 failure was a blind ~14s window giving up on a
// busy free-tier session), then poll the replay URL for up to ~60s.
let released = false;
for (let i = 1; i <= 15; i++) {
  try {
    const anySolari = solari as any;
    const state = await anySolari.sessions.client.get(`/sessions/${encodeURIComponent(sessionId)}`);
    const status = state?.data?.status ?? state?.status;
    if (status === "released" || status === "deleted") {
      released = true;
      console.log(`session released (attempt ${i})`);
      break;
    }
  } catch {
    /* state check is best-effort; the replay poll below still runs */
  }
  await sleep(2000);
}
let replay = null;
for (let i = 1; i <= 20; i++) {
  try {
    replay = await solari.sessions.getReplayUrl(sessionId);
    console.log(`replay resolved on attempt ${i}`);
    break;
  } catch (e) {
    console.log(`replay attempt ${i} missed`);
    await sleep(3000);
  }
}

// ---- tape: the local evidence artifact ----
let tapeBytes = 0;
if (replay) {
  const bytes = await solari.sessions.downloadReplay(sessionId);
  tapeBytes = bytes.length;
  const runDir = join(ROOT, "runs", serial);
  mkdirSync(runDir, { recursive: true });
  writeFileSync(join(runDir, "tape.ndjson"), bytes);
}

// ---- verdict: Groq when a key exists, deterministic facts otherwise ----
const facts = {
  task: spec.name,
  steps: steps.map((s) => ({ label: s.label, url: s.url, title: s.title, ok: s.ok })),
  tapeBytes,
  openSeconds: +(openMs / 1000).toFixed(1),
  replayCaptured: Boolean(replay),
};
const allOk = steps.every((s) => s.ok) && tapeBytes > 0;
const outcome = allOk ? "verified" : "failed";
let verdict = {
  outcome,
  summary:
    `${steps.filter((s) => s.ok).length}/${steps.length} checks passed in ` +
    `${facts.openSeconds}s on the recorded cloud browser; tape ` +
    `${(tapeBytes / 1024).toFixed(0)} KB ${replay ? "and the Solari-hosted replay were captured" : "captured, replay URL did not resolve in time"}.`,
  model: "deterministic-facts",
};
if (process.env.GROQ_API_KEY) {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content:
              "You write the verdict line for a run receipt. Use ONLY the observed facts given. Two sentences max, plain verbs, no em dashes, no superlatives. State what passed or failed and what the evidence is.",
          },
          { role: "user", content: JSON.stringify(facts) },
        ],
        temperature: 0.2,
      }),
    });
    if (res.status === 429 || res.status >= 500) throw new Error(`groq ${res.status}`);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (text) verdict = { outcome, summary: text, model: "openai/gpt-oss-120b" };
  } catch (e) {
    console.log("groq unavailable, deterministic verdict kept:", String(e).slice(0, 120));
  }
}

// ---- manifest per docs/manifest-schema.md ----
const manifest = {
  serial,
  createdAt: new Date(t0).toISOString(),
  task: { kind: spec.kind, name: spec.name, specFile: specPath },
  surface: {
    browser: {
      sessionId,
      recorded: true,
      replayUrl: replay?.url ?? null,
      replayExpiresInSeconds: replay?.expiresInSeconds ?? null,
      region: "us-west",
    },
    sandbox: null,
    desktop: null,
  },
  steps,
  verdict,
  clip: null,
  cost: {
    solariCredits: +(openMs / 3_600_000 * 0.15).toFixed(4),
    minutesBySurface: { browser: +(openMs / 60000).toFixed(1) },
  },
  tapeBytes,
  tapeUrl: `https://raw.githubusercontent.com/A-Raphie/rushes/main/panel/public/runs/${serial}/tape.ndjson`,
};

const runDir = join(ROOT, "runs", serial);
mkdirSync(runDir, { recursive: true });
writeFileSync(join(runDir, "manifest.json"), JSON.stringify(manifest, null, 2));

// ---- panel: evidence bytes + registry, so the static site carries the run ----
const pubDir = join(ROOT, "panel", "public", "runs", serial);
mkdirSync(pubDir, { recursive: true });
if (tapeBytes > 0) {
  copyFileSync(join(runDir, "tape.ndjson"), join(pubDir, "tape.ndjson"));
}
copyFileSync(join(runDir, "manifest.json"), join(pubDir, "manifest.json"));
const panelRun = {
  serial,
  kind: spec.kind,
  label: spec.name,
  surface: manifest.surface.browser ? "cloud chrome · recorded" : "sandbox",
  pages: steps.map((s) => s.url),
  durationSec: +(openMs / 1000).toFixed(1),
  tapeBytes,
  sessionId,
  verdict: outcome,
  summary: verdict.summary,
  tapeUrl: manifest.tapeUrl,
  date: today,
  replayCaptured: Boolean(replay),
};
mkdirSync(dataDir, { recursive: true });
writeFileSync(join(dataDir, "runs.json"), JSON.stringify([panelRun, ...existing], null, 2));

console.log("RUN COMPLETE:", serial, "| verdict:", outcome, "| tape:", tapeBytes, "bytes");

// Cookbook gotcha: without this the client's loopback proxy keeps the event
// loop alive and the process hangs forever after its output is printed.
await solari.close();
