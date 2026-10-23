import puppeteer from "puppeteer-core";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 920 });
// replicate the stage: load the stage page machinery directly via playwright instead
// simpler: load /point in a page with the SAME viewport as the recorder and check
await page.goto("https://tryrushes.vercel.app/point", { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise(r => setTimeout(r, 6000));
const m = await page.evaluate(() => ({
  hasName: Boolean(document.querySelector(".point-label input")),
  inputCount: document.querySelectorAll("input").length,
  bodyW: document.body.scrollWidth,
}));
console.log("plain page:", JSON.stringify(m));
await browser.close();
