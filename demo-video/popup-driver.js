// Real-extension popup driver: watches for Rabby notification windows and
// drives every prompt with visible cursor choreography (popup stream).
// The popup is its own page/video stream, the injected cursor enters from
// the left edge and continues the stage stream's motion grammar.
const { injectCursor, moveCursor, clickCursor, typeCursor } = require('./cursor.js');

const PW_PLACEHOLDER = '__RABBY_PASSWORD__';

// Attach to a context: every Rabby window that opens gets a cursor, is
// recorded, and is driven by the state machine below.
//
// opts: { password, holdMs, mark, onSignHold, approveSign }
// - mark(name) writes engine markers for compositing
// - onSignHold: async (page) => void, called while the Sign screen is on
//   camera (hold the money shot); after it resolves the window is closed
//   WITHOUT clicking Sign (tx broadcasts server-side).
function attachPopupDriver(ctx, { extId, password, holdMs = 2600, mark, onSignHold }) {
  const sessions = []; // { page, video, openedAt }
  const state = { busy: false, queue: [] };

  ctx.on('page', (pg) => {
    if (!pg.url().includes(extId)) return;
    sessions.push({ page: pg, video: pg.video() });
    state.queue.push(pg);
    pump();
  });

  async function pump() {
    if (state.busy) return;
    state.busy = true;
    try {
      while (state.queue.length) {
        const pg = state.queue.shift();
        if (pg.isClosed()) continue;
        try { await driveOne(pg); } catch (e) { console.warn('WARN popup drive:', e.message.split('\n')[0]); }
      }
    } finally { state.busy = false; }
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const body = async (pg) => (await pg.evaluate(() => document.body.innerText).catch(() => ''));

  // One popup window, one state screen at a time.
  async function driveOne(pg) {
    await sleep(1200); // let React paint
    if (pg.isClosed()) return;
    await injectCursor(pg);
    mark('rabby_window_open');
    for (let round = 0; round < 8; round++) {
      if (pg.isClosed()) break;
      await sleep(1200);
      const t = await body(pg);
      if (!t) break;

      if (/unlock/i.test(t)) {
        await gesture(pg, 'input[type="password"], input', { fx: 0.5, fy: 0.5 });
        const inp = pg.locator('input:visible').first();
        await typeCursor(pg, inp, password, { clear: false });
        await sleep(420);
        await pg.keyboard.press('Enter');
        mark('rabby_unlock_enter');
        await sleep(3200);
        continue;
      }

      if (/connect to dapp/i.test(t)) {
        if (/alert/i.test(t)) { await gesture(pg, 'text=Ignore all'); await sleep(1400); }
        await sleep(holdMs); // popup breathes on camera
        await gesture(pg, 'button:has-text("Connect")');
        mark('rabby_connect_approved');
        await sleep(2600);
        continue;
      }

      if (/add custom network/i.test(t)) {
        await sleep(Math.max(1400, holdMs - 800));
        await gesture(pg, 'button:has-text("Add")');
        mark('rabby_network_added');
        await sleep(2600);
        continue;
      }

      if (/switch/i.test(t) && /network/i.test(t)) {
        await gesture(pg, 'button:has-text("Switch"), button:has-text("Approve")');
        mark('rabby_network_switched');
        await sleep(2400);
        continue;
      }

      if (/signature|sign request|transaction data/i.test(t)) {
        // The money shot: hold, optional project beat, then close, the real
        // tx is broadcast server-side; the Sign button is never clicked.
        mark('rabby_sign_hold');
        await gesture(pg, 'button:has-text("Sign")', { hoverOnly: true });
        if (onSignHold) await onSignHold(pg).catch(() => {});
        await sleep(holdMs);
        mark('rabby_sign_close');
        await pg.close().catch(() => {});
        break;
      }

      // unknown screen: brief hold, then leave it (a human staring beat)
      await sleep(holdMs);
      break;
    }
    if (!pg.isClosed()) { await sleep(600); await pg.close().catch(() => {}); }
    mark('rabby_window_closed');
  }

  // Cursor grammar inside the popup: enter from the left edge, curved travel
  // to the target, pre-click pause, off-center landing, ripple.
  async function gesture(pg, selector, { hoverOnly = false, fx, fy } = {}) {
    try {
      const loc = pg.locator(selector).first();
      await loc.waitFor({ state: 'visible', timeout: 5000 });
      const box = await loc.boundingBox();
      if (!box) return;
      const y = box.y + box.height * (fy ?? 0.5);
      await moveCursor(pg, Math.max(6, box.x - 130), Math.max(20, y - 60), { steps: 4, overshoot: 0 });
      if (hoverOnly) { await moveCursor(pg, box.x + box.width * 0.5, y, { steps: 22 }); return; }
      await clickCursor(pg, loc, { timeout: 4000, ...(fx || fy ? { fx, fy } : {}) });
    } catch (e) {
      console.warn('WARN gesture miss:', selector, e.message.split('\n')[0]);
    }
  }

  return {
    sessions,
    // settle(): all popup driving finished (windows processed or closed)
    settle: async (timeoutMs = 20000) => {
      const t0 = Date.now();
      while (state.busy && Date.now() - t0 < timeoutMs) await sleep(400);
      await sleep(800);
      return sessions;
    },
  };
}

module.exports = { attachPopupDriver, PW_PLACEHOLDER };
