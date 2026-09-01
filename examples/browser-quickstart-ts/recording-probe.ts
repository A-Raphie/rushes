/**
 * PHASE0 critical check: launch with recording:true, drive some navigation,
 * then fetch the hosted replay URL. If getReplayUrl is not on the expected
 * namespace, dump the client surface so the next probe knows where it lives.
 */
import { Solari } from "@solarisdk/browser"

const solari = new Solari({ apiKey: process.env.SOLARI_API_KEY! })
const t0 = Date.now()

const browser = await solari.launch({ recording: true })
try {
  const page = await browser.newPage()
  await page.goto("https://example.com")
  const title = await page.title()
  await page.goto("https://news.ycombinator.com")
  const hn = await page.title()
  await page.goto("https://getsolari.com")
  const solariTitle = await page.title()

  console.log("titles:", JSON.stringify({ title, hn, solariTitle }))
  console.log("sessionId:", browser.id)
  console.log("elapsedMs:", Date.now() - t0)

  // Locate getReplayUrl wherever the SDK keeps it
  const anySolari = solari as any
  const attempts: Array<[string, () => Promise<any>]> = [
    ["solari.sessions.getReplayUrl", () => anySolari.sessions.getReplayUrl(browser.id)],
    ["solari.getReplayUrl", () => anySolari.getReplayUrl(browser.id)],
    ["browser.getReplayUrl", () => (browser as any).getReplayUrl()],
    ["browser.replayUrl", async () => (browser as any).replayUrl],
    ["solari.sessions.get", () => anySolari.sessions.get(browser.id)],
  ]
  for (const [name, fn] of attempts) {
    try {
      const r = await fn()
      if (r) {
        console.log("FOUND via", name, ":", JSON.stringify(r))
      }
    } catch (e: any) {
      console.log("miss:", name, "-", String(e?.message || e).slice(0, 120))
    }
  }
  // Dump surface for diagnosis if nothing matched
  console.log("client keys:", Object.keys(anySolari))
  if (anySolari.sessions) console.log("sessions keys:", Object.keys(anySolari.sessions))
} finally {
  await browser.close()
  await solari.close()
}
