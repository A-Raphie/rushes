// Solari replay-generation recovery probe: launch a 1-step recording session,
// release it, poll getReplayUrl. Exit 0 = replay generation is back.
// Usage: source ../.env && node probe-recovery.mjs
import { Solari } from "@solarisdk/browser";

const apiKey = process.env.SOLARI_API_KEY;
if (!apiKey) { console.error("SOLARI_API_KEY missing"); process.exit(2); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const solari = new Solari({ apiKey });
const browser = await solari.launch({ recording: true });
console.log("probe session:", browser.id);
try {
  const page = await browser.newPage();
  await page.goto("https://example.com", { waitUntil: "domcontentloaded", timeoutMs: 30000 });
  await page.waitForTimeout(800);
} finally {
  await browser.close();
}

// Post-release poll: replay URL appears ~1-3s after release when healthy.
// SDK returns { url, expiresInSeconds, contentEncoding } (verified Sep 3).
const id = browser.id;
for (let i = 1; i <= 30; i++) {
  try {
    const res = await solari.sessions.getReplayUrl(id);
    const u = typeof res === "string" ? res : res?.url;
    if (u) { console.log(`RECOVERED (attempt ${i}):`, String(u).slice(0, 80) + "…"); process.exit(0); }
  } catch (e) {
    console.log(`attempt ${i}: ${String(e.message).slice(0, 90)}`);
  }
  await sleep(3000);
}
console.log("STILL DOWN after 30 attempts (~90s)");
process.exit(1);
