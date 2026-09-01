/**
 * PHASE0 critical check v2: replay URL is presigned and only available
 * ~1-3s after release. Flow: launch recording session, drive 3 pages,
 * close (release), poll getReplayUrl until it resolves, download the
 * NDJSON replay bytes as a local artifact.
 */
import { Solari } from "@solarisdk/browser"
import { writeFileSync, mkdirSync } from "node:fs"

const solari = new Solari({ apiKey: process.env.SOLARI_API_KEY! })
const t0 = Date.now()

const browser = await solari.launch({ recording: true })
const sessionId = browser.id
try {
  const page = await browser.newPage()
  await page.goto("https://example.com")
  const title = await page.title()
  await page.goto("https://news.ycombinator.com")
  const hn = await page.title()
  await page.goto("https://getsolari.com")
  const solariTitle = await page.title()
  console.log("titles:", JSON.stringify({ title, hn, solariTitle }))
  console.log("sessionId:", sessionId)
  console.log("elapsedMs while open:", Date.now() - t0)
} finally {
  await browser.close()
}

// Poll for the presigned replay URL after release
let replay: { url: string; expiresInSeconds: number; contentEncoding: string } | null = null
let lastErr = ""
for (let i = 1; i <= 8; i++) {
  try {
    replay = await solari.sessions.getReplayUrl(sessionId)
    console.log(`replay resolved on attempt ${i} (${Date.now() - t0}ms since start)`)
    break
  } catch (e: any) {
    lastErr = String(e?.message || e)
    console.log(`attempt ${i} missed: ${lastErr.slice(0, 140)}`)
    await new Promise((r) => setTimeout(r, 1500))
  }
}

if (replay) {
  console.log("replayUrl:", replay.url.slice(0, 100) + "...")
  console.log("expiresInSeconds:", replay.expiresInSeconds, "encoding:", replay.contentEncoding)

  // Download the replay NDJSON bytes: the local evidence artifact
  try {
    const bytes = await solari.sessions.downloadReplay(sessionId)
    mkdirSync("../../runs", { recursive: true })
    const file = `../../runs/replay-phase0.ndjson`
    writeFileSync(file, bytes)
    console.log("replay bytes:", bytes.length, "->", file)
    // Peek at the first events so we know the shape for the bench renderer
    const head = new TextDecoder().decode(bytes.slice(0, 600))
    console.log("replay head:", head.slice(0, 400))
  } catch (e: any) {
    console.log("downloadReplay failed:", String(e?.message || e).slice(0, 200))
  }
} else {
  console.log("NO REPLAY URL. Last error:", lastErr)
}

await solari.close()
console.log("totalElapsedMs:", Date.now() - t0)
