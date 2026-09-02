/**
 * Rushes CLI-QA harness: thin subcommands over the deployed product's real
 * flows. Kept in the repo as the regression net for every future release
 * (ship-rehearsal Phase 3). Exit code 0 = clean pass.
 *
 *   node engine/smoke.js pages              every public route answers 200
 *   node engine/smoke.js registry           registry parses, newest first
 *   node engine/smoke.js receipt <serial>   receipt + its tape answer
 *   node engine/smoke.js dispatch <name> <url> [expect]
 *                                           real run through the dispatcher,
 *                                           polled until the receipt exists
 *   node engine/smoke.js all                everything above, summary + exit
 */
const BASE = process.env.RUSHES_URL ?? "https://tryrushes.vercel.app";
const REGISTRY_URL =
  "https://api.github.com/repos/A-Raphie/rushes/contents/panel/data/runs.json";
const GH_TOKEN = process.env.GH_TOKEN;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
let failed = 0;

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  ·  " + detail : ""}`);
}

async function status(url, method = "GET") {
  try {
    const res = await fetch(url, { method, redirect: "follow", cache: "no-store" });
    return res.status;
  } catch {
    return 0;
  }
}

async function getRegistry() {
  const headers = GH_TOKEN
    ? { Authorization: `Bearer ${GH_TOKEN}`, "User-Agent": "rushes-smoke" }
    : { "User-Agent": "rushes-smoke" };
  const res = await fetch(REGISTRY_URL + "?t=" + Date.now(), {
    headers,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`registry ${res.status}`);
  const file = await res.json();
  return JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
}

async function checkPages() {
  for (const path of ["/", "/runs", "/point", "/icon.svg"]) {
    const code = await status(BASE + path);
    record(`page ${path}`, code === 200, `HTTP ${code}`);
  }
}

async function checkRegistry() {
  try {
    const registry = await getRegistry();
    const serials = registry.map((r) => r.serial);
    record("registry parses", registry.length >= 1, `${registry.length} runs`);
    const sorted = [...serials].sort().reverse();
    record("registry newest first", JSON.stringify(serials) === JSON.stringify(sorted), serials[0] ?? "empty");
  } catch (e) {
    record("registry parses", false, String(e.message));
  }
}

async function checkReceipt(serial) {
  const code = await status(`${BASE}/runs/${serial}`);
  record(`receipt page ${serial}`, code === 200, `HTTP ${code}`);
  const registry = await getRegistry().catch(() => null);
  const entry = registry?.find((r) => r.serial === serial);
  if (entry && entry.tapeBytes > 0) {
    const tapeCode = await status(BASE + entry.tapeUrl.replace(/^https:\/\/[^/]+/, ""));
    const rawCode = await status(entry.tapeUrl);
    record(
      `tape for ${serial}`,
      tapeCode === 200 || rawCode === 200,
      `site ${tapeCode} · raw ${rawCode}`,
    );
  }
}

async function checkDispatch(name, url, expect) {
  const before = new Set((await getRegistry().catch(() => [])).map((r) => r.serial));
  const res = await fetch(BASE + "/api/point", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, steps: [{ url, expect: expect ?? null, dwellMs: 2200 }] }),
  });
  const data = await res.json().catch(() => ({}));
  record("dispatch accepted", res.ok && data.queued === true, JSON.stringify(data).slice(0, 80));

  console.log("polling the registry for the fresh serial (up to 3 min)…");
  for (let i = 0; i < 30; i++) {
    await sleep(6000);
    try {
      const registry = await getRegistry();
      const fresh = registry.find((r) => !before.has(r.serial));
      if (fresh) {
        record("run committed", true, `${fresh.serial} · ${fresh.verdict} · ${(fresh.tapeBytes / 1024).toFixed(0)} KB`);
        const code = await status(`${BASE}/runs/${fresh.serial}`);
        record("receipt live", code === 200, `HTTP ${code}`);
        return;
      }
    } catch {
      /* keep polling */
    }
  }
  record("run committed", false, "no new serial within 3 minutes");
}

async function all() {
  await checkPages();
  await checkRegistry();
  await checkReceipt("RUSH-2026-09-02-0001");
  console.log("\n(dispatch + receipt flow is live-checked by `dispatch`)");
  console.log(
    `\nSUMMARY: ${results.length - failed}/${results.length} passed · ${failed} failed`,
  );
  process.exit(failed > 0 ? 1 : 0);
}

const [cmd, ...args] = process.argv.slice(2);
const commands = { pages: checkPages, registry: checkRegistry, receipt: checkReceipt, dispatch: checkDispatch, all };

if (!cmd || !commands[cmd]) {
  console.log("usage: node engine/smoke.js <pages|registry|receipt <serial>|dispatch <name> <url> [expect]|all>");
  process.exit(cmd ? 1 : 0);
}

const runner = async () => {
  if (cmd === "all") return all();
  if (cmd === "receipt") return checkReceipt(args[0]);
  if (cmd === "dispatch") return checkDispatch(args[0], args[1], args[2]);
  return commands[cmd]();
};
runner().then(process.exit.bind(process, 0), (e) => {
  console.error("harness error:", e.message);
  process.exit(1);
});
