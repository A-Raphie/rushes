// Dress rehearsal: validate stage + goto_frame + composer selectors resolve.
// No recording, ~40s. Exits 0 only if every selector is visible in-frame.
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire(path.join(__dirname, 'node_modules', 'x.js'));
const { chromium } = req('playwright');

const site = 'https://tryrushes.vercel.app';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 920 } });
const p = await ctx.newPage();

const { mountStage, setTabLoading, setTab } = req(path.join(__dirname, 'scripts', 'stage.js'));
const frame = await mountStage(p, { title: 'tryrushes.vercel.app', url: site });

async function gotoFrame(pathname, waitMs) {
  const url = site + pathname;
  await setTabLoading(p, true);
  await p.evaluate((u) => { document.getElementById('__app').src = u; }, url);
  await setTab(p, { url });
  await p.waitForTimeout(waitMs);
  await setTabLoading(p, false);
}

async function check(name, locator) {
  try {
    await locator.first().waitFor({ state: 'visible', timeout: 8000 });
    console.log('OK  ', name);
    return true;
  } catch {
    console.log('FAIL', name);
    return false;
  }
}

let ok = true;
// landing renders in-frame
ok = (await check('landing hero (in-frame)', frame.locator('h1, .hero, section'))) && ok;

// bench reachable by wheel at iframe center (on the landing)
await p.mouse.move(640, 500);
await p.mouse.wheel(0, 1500);
await p.waitForTimeout(1200);
ok = (await check('bench section after wheel', frame.locator('.bench'))) && ok;

await gotoFrame('/point', 3500);
ok = (await check('nameField', frame.locator('.point-label input'))) && ok;
ok = (await check('urlField', frame.locator('.point-row input[type=url]'))) && ok;
ok = (await check('expectField', frame.locator('.point-row input[type=text]'))) && ok;
ok = (await check('submitBtn', frame.locator('.point-foot .btn-primary'))) && ok;

await p.screenshot({ path: path.join(__dirname, 'rehearse.png') });
await ctx.close();
await b.close();
console.log(ok ? 'REHEARSAL PASS' : 'REHEARSAL FAIL');
process.exit(ok ? 0 : 1);
