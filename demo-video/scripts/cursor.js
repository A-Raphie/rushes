// Human-feeling pointer for Playwright recordVideo (no OS cursor in those files).
// Movement: quadratic-bezier curved path, ease-in-out, overshoot-then-settle.
// Clicks: off-center, with a human pre-click pause. Typing: per-character with jitter.

async function injectCursor(page) {
  await page.evaluate(() => {
    if (document.getElementById('__demo_cursor')) return;
    const el = document.createElement('div');
    el.id = '__demo_cursor';
    el.style.cssText =
      'position:fixed;left:40%;top:50%;width:18px;height:18px;z-index:2147483647;pointer-events:none;transform:translate(-2px,-1px);transition:none';
    el.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M3 2 L3 15 L7.2 11.2 L10.8 17 L13 15.8 L9.3 10 L15 10 Z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>' +
      '</svg>';
    document.documentElement.appendChild(el);
    window.__demoMove = (x, y) => {
      el.style.left = x + 'px';
      el.style.top = y + 'px';
    };
    window.__demoClick = () => {
      const ring = document.createElement('div');
      ring.style.cssText =
        'position:fixed;left:' + el.style.left + ';top:' + el.style.top +
        ';width:10px;height:10px;margin:-4px 0 0 -4px;border:2px solid rgba(80,80,80,.7);border-radius:50%;pointer-events:none;z-index:2147483646';
      document.documentElement.appendChild(ring);
      setTimeout(() => ring.remove(), 280);
    };
  });
}

async function cursorPos(page) {
  return page.evaluate(() => {
    const el = document.getElementById('__demo_cursor');
    return el ? { x: parseFloat(el.style.left) || 400, y: parseFloat(el.style.top) || 400 } : { x: 400, y: 400 };
  });
}

// Curved move with ease-in-out and a small overshoot-settle at the end.
// Phases: 0-86% of steps travel a bezier toward a point ~oversoot px PAST the
// target; the rest settle back to the true target. Fast approach, slow settle.
async function moveCursor(page, x, y, opts = {}) {
  const steps = opts.steps || 24;
  const stepMs = opts.stepMs ?? 14;
  const overshoot = opts.overshoot !== undefined ? opts.overshoot : 8;
  const cur = await cursorPos(page);
  const dx = x - cur.x;
  const dy = y - cur.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const curve = opts.curve !== undefined ? opts.curve : Math.min(60, len * 0.18);
  // control point: midpoint pushed perpendicular to the travel direction
  const cxp = (cur.x + x) / 2 - (dy / len) * curve;
  const cyp = (cur.y + y) / 2 + (dx / len) * curve;
  // overshoot endpoint a little past the target along the travel direction
  const ox = x + (dx / len) * overshoot;
  const oy = y + (dy / len) * overshoot;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const bez = (t, a, c, b) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;
  for (let i = 1; i <= steps; i++) {
    const p = i / steps;
    let nx;
    let ny;
    if (p < 0.86) {
      const t = ease(p / 0.86);
      nx = bez(t, cur.x, cxp, ox);
      ny = bez(t, cur.y, cyp, oy);
    } else {
      const t = (p - 0.86) / 0.14;
      nx = ox + (x - ox) * t;
      ny = oy + (y - oy) * t;
    }
    await page.mouse.move(nx, ny);
    await page.evaluate(({ nx, ny }) => window.__demoMove && window.__demoMove(nx, ny), { nx, ny });
    await page.waitForTimeout(stepMs);
  }
}

// Click like a person: travel on a curve, pause before the click, land off-center.
async function clickCursor(page, locator, opts = {}) {
  await locator.waitFor({ state: 'visible', timeout: opts.timeout || 10000 });
  const box = await locator.boundingBox();
  if (!box) throw new Error('no bounding box for click target');
  const fx = opts.fx ?? 0.4 + Math.random() * 0.09; // 0.40-0.49 of width
  const fy = opts.fy ?? 0.42 + Math.random() * 0.13; // 0.42-0.55 of height
  const x = box.x + box.width * fx;
  const y = box.y + box.height * fy;
  await moveCursor(page, x, y, { steps: opts.steps || 26 });
  await page.waitForTimeout(250 + Math.random() * 150); // pre-click pause
  await page.evaluate(() => window.__demoClick && window.__demoClick());
  await page.waitForTimeout(80);
  await locator.click({ timeout: 4000, force: true, position: { x: box.width * fx, y: box.height * fy } });
}

// Type like a person: move to the field, click it, then per-character with jitter
// and occasional thinking pauses. `fill()` looks instant on camera, never use it.
async function typeCursor(page, locator, text, opts = {}) {
  await locator.waitFor({ state: 'visible', timeout: opts.timeout || 10000 });
  const box = await locator.boundingBox();
  if (box) {
    await moveCursor(page, box.x + box.width * 0.45, box.y + box.height * 0.5, { steps: 20 });
    await page.waitForTimeout(180 + Math.random() * 120);
  }
  await locator.click({ timeout: 4000 });
  if (opts.clear !== false) await locator.fill('');
  for (const ch of String(text)) {
    await page.keyboard.type(ch, { delay: 25 + Math.random() * 60 });
    if (Math.random() < 0.08) await page.waitForTimeout(140 + Math.random() * 60);
  }
}

// Idle drift: slow ±2-3px eased wander so the cursor breathes during long
// waits instead of freezing like a bot. Visual only, no mouse events fired.
async function driftCursor(page, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    await page.evaluate(() => {
      const el = document.getElementById('__demo_cursor');
      if (!el || !window.__demoMove) return;
      const x = parseFloat(el.style.left) || 400;
      const y = parseFloat(el.style.top) || 400;
      el.style.transition = 'left .45s ease-in-out, top .45s ease-in-out';
      window.__demoMove(x + (Math.random() - 0.5) * 5, y + (Math.random() - 0.5) * 4);
      setTimeout(() => { el.style.transition = 'none'; }, 470);
    });
    await page.waitForTimeout(520 + Math.random() * 320);
  }
  // Never leave a transition active: moveCursor steps at 14ms and would lag.
  await page.evaluate(() => {
    const el = document.getElementById('__demo_cursor');
    if (el) el.style.transition = 'none';
  });
}

module.exports = { injectCursor, moveCursor, clickCursor, typeCursor, cursorPos, driftCursor };
