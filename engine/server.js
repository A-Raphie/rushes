/**
 * Rushes engine service: POST /run with { name, steps[] } executes the
 * recorded engine flow and commits the evidence to the repo (tape,
 * manifest, registry). Same logic as run.ts, wrapped in an HTTP server so
 * the site's "Point it at a task" can run tasks for real.
 */
import { Solari } from "@solarisdk/browser";
import http from "node:http";

const REPO = "A-Raphie/rushes";
const BRANCH = "main";
const REGISTRY_PATH = "panel/data/runs.json";
const GH = "https://api.github.com";
const PORT = process.env.PORT || 8080;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function ghHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "rushes-engine",
  };
}

async function ghGetFile(token, path) {
  const res = await fetch(`${GH}/repos/${REPO}/contents/${path}?ref=${BRANCH}`, {
    headers: ghHeaders(token),
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`github get ${path}: ${res.status}`);
  return res.json();
}

async function ghPutFile(token, path, message, contentUtf8, sha) {
  const body = { message, content: Buffer.from(contentUtf8, "utf8").toString("base64"), branch: BRANCH };
  if (sha) body.sha = sha;
  const res = await fetch(`${GH}/repos/${REPO}/contents/${path}`, {
    method: "PUT",
    headers: ghHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`github put ${path}: ${res.status} ${text.slice(0, 160)}`);
  }
  return res.json();
}

function validate(body) {
  const name = String(body?.name ?? "").trim().slice(0, 80) || "Unnamed task";
  const raw = Array.isArray(body?.steps) ? body.steps : [];
  if (raw.length < 1 || raw.length > 5) {
    throw new Error("A task needs 1 to 5 steps.");
  }
  const steps = raw.map((s, i) => {
    const url = String(s?.url ?? "").trim();
    if (!/^https:\/\//.test(url)) {
      throw new Error(`Step ${i + 1}: only https URLs are supported.`);
    }
    return {
      label: String(s?.label ?? `step ${i + 1}`).slice(0, 60),
      url: url.slice(0, 300),
      expect: s?.expect ? String(s.expect).slice(0, 60) : null,
      dwellMs: Math.min(3000, Math.max(800, Number(s?.dwellMs) || 1800)),
    };
  });
  return { name, steps };
}

async function execute(body) {
  const token = process.env.SOLARI_API_KEY;
  if (!token) throw new Error("Engine is not configured (SOLARI_API_KEY missing).");
  const { name, steps } = validate(body);

  const registryFile = await ghGetFile(process.env.GH_TOKEN, REGISTRY_PATH);
  const registry = registryFile
    ? JSON.parse(Buffer.from(registryFile.content, "base64").toString("utf8"))
    : [];
  const today = new Date().toISOString().slice(0, 10);
  const seq = registry.filter((r) => r.serial?.startsWith(`RUSH-${today}`)).length + 1;
  const serial = `RUSH-${today}-${String(seq).padStart(4, "0")}`;

  const solari = new Solari({ apiKey: token });
  const t0 = Date.now();
  const browser = await solari.launch({ recording: true });
  const sessionId = browser.id;
  const observed = [];
  try {
    const page = await browser.newPage();
    let n = 0;
    for (const step of steps) {
      n += 1;
      const startedAt = new Date().toISOString();
      await page.goto(step.url, { waitUntil: "domcontentloaded", timeoutMs: 30000 });
      await page.waitForTimeout(step.dwellMs);
      const title = await page.title();
      const ok = step.expect ? (await page.getByText(step.expect).count()) > 0 : true;
      observed.push({
        n, label: step.label, url: page.url(), title, startedAt,
        endedAt: new Date().toISOString(), ok, expect: step.expect,
      });
    }
  } catch (e) {
    await browser.close().catch(() => {});
    await solari.close().catch(() => {});
    throw new Error(`The run failed on step ${observed.length + 1}: ${String(e.message).slice(0, 140)}`);
  }
  await browser.close();
  const openMs = Date.now() - t0;

  let replay = null;
  for (let i = 1; i <= 8; i++) {
    try {
      replay = await solari.sessions.getReplayUrl(sessionId);
      break;
    } catch {
      await sleep(1500);
    }
  }

  let tapeBytes = 0;
  let tapeB64 = null;
  if (replay) {
    const bytes = await solari.sessions.downloadReplay(sessionId);
    tapeBytes = bytes.length;
    tapeB64 = Buffer.from(bytes).toString("base64");
  }
  await solari.close().catch(() => {});

  const allOk = observed.every((s) => s.ok) && tapeBytes > 0;
  const outcome = allOk ? "verified" : "failed";
  let verdict = {
    outcome,
    summary:
      `${observed.filter((s) => s.ok).length}/${observed.length} checks passed in ` +
      `${(openMs / 1000).toFixed(1)}s on the recorded cloud browser; tape ` +
      `${(tapeBytes / 1024).toFixed(0)} KB ${replay ? "and the Solari-hosted replay were captured" : "captured, replay URL did not resolve in time"}.`,
    model: "deterministic-facts",
  };
  if (process.env.GROQ_API_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            {
              role: "system",
              content:
                "You write the verdict line for a run receipt. Use ONLY the observed facts given. Two sentences max, plain verbs, no em dashes, no superlatives. State what passed or failed and what the evidence is.",
            },
            {
              role: "user",
              content: JSON.stringify({
                task: name,
                steps: observed.map((s) => ({ label: s.label, url: s.url, title: s.title, ok: s.ok })),
                tapeBytes,
                openSeconds: +(openMs / 1000).toFixed(1),
                replayCaptured: Boolean(replay),
              }),
            },
          ],
          temperature: 0.2,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) verdict = { outcome, summary: text, model: "openai/gpt-oss-120b" };
      }
    } catch {
      /* deterministic verdict stands */
    }
  }

  const manifest = {
    serial,
    createdAt: new Date(t0).toISOString(),
    task: { kind: "url-flow", name, origin: "web" },
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
    steps: observed,
    verdict,
    clip: null,
    cost: {
      solariCredits: +((openMs / 3_600_000) * 0.15).toFixed(4),
      minutesBySurface: { browser: +(openMs / 60000).toFixed(1) },
    },
    tapeBytes,
    tapeUrl: `https://raw.githubusercontent.com/A-Raphie/rushes/main/panel/public/runs/${serial}/tape.ndjson`,
  };

  const panelRun = {
    serial,
    kind: "url-flow",
    label: name,
    surface: "cloud chrome · recorded",
    pages: observed.map((s) => s.url),
    durationSec: +(openMs / 1000).toFixed(1),
    tapeBytes,
    sessionId,
    verdict: outcome,
    summary: verdict.summary,
    tapeUrl: manifest.tapeUrl,
    date: today,
    replayCaptured: Boolean(replay),
  };

  if (tapeB64) {
    const res = await fetch(`${GH}/repos/${REPO}/contents/panel/public/runs/${serial}/tape.ndjson`, {
      method: "PUT",
      headers: ghHeaders(process.env.GH_TOKEN),
      body: JSON.stringify({
        message: `run ${serial}: tape ${tapeBytes} bytes`,
        content: tapeB64,
        branch: BRANCH,
      }),
    });
    if (!res.ok) throw new Error(`tape commit ${res.status}`);
  }
  await ghPutFile(process.env.GH_TOKEN, `runs/${serial}/manifest.json`, `run ${serial}: manifest`, JSON.stringify(manifest, null, 2), null);
  await ghPutFile(process.env.GH_TOKEN, REGISTRY_PATH, `run ${serial}: registry`, JSON.stringify([panelRun, ...registry], null, 2), registryFile?.sha ?? null);

  return { serial, committed: true, receipt: `/runs/${serial}`, verdict };
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  if (req.method === "POST" && req.url === "/run") {
    let body = "";
    req.on("data", (c) => {
      body += c;
      if (body.length > 20_000) req.destroy();
    });
    req.on("end", async () => {
      try {
        const parsed = JSON.parse(body || "{}");
        const result = await execute(parsed);
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(502, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify({ error: String(e.message || e).slice(0, 200) }));
      }
    });
    return;
  }
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "POST /run is the only door." }));
});

server.listen(PORT, () => {
  console.log("rushes engine listening on", PORT);
});
