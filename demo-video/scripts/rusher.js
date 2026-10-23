// demo-video recording engine, fully config-driven, zero hardcoded project values.
// Usage: const { record } = require('./template.js'); await record(config);
// Or: node template.js (reads config from config.json in CWD)
//
// Config shape: { site, chain, signerKey, signerAddr, selectors, scenes, endCard,
//                 viewport?, chrome?, vo?, subtitles?, voScript?, music?, thumbnailAt? }
// The video always ships CLEAN, no burned captions. Subtitles are VO-derived
// soft tracks only (subtitles: true + voScript + vo audio).
// Scene actions: goto | goto_frame | click | wait_for | scroll | move | type |
//                wait | zoom | unzoom | set_content
// See SKILL.md for full documentation.

const path = require('path');
const fs = require('fs');
const { createRequire } = require('module');

// ---- helpers (internal) ----

function loadProjectRequire(projectDir) {
  return createRequire(path.join(projectDir, 'node_modules', 'x.js'));
}

function parseEnv(envPath) {
  if (!envPath || !fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs.readFileSync(envPath, 'utf8').split('\n')
      .filter(l => l.includes('=') && !l.startsWith('#'))
      .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
  );
}

// ---- main recording function ----

async function record(config) {
  const {
    site,
    chain,
    signerKey,
    signerAddr,
    selectors,
    scenes,
    endCard,
    viewport = { width: 1280, height: 920 },
    projectDir = process.cwd(),
    chrome = {},
    vo,
    subtitles = false,
    voScript,
    music,
    thumbnailAt,
  } = config;

  // Validate required fields
  const missing = [];
  if (!site) missing.push('site');
  if (!selectors) missing.push('selectors');
  if (!scenes || !scenes.length) missing.push('scenes');
  if (subtitles && !voScript) missing.push('voScript (required when subtitles: true)');
  if (subtitles && !vo) missing.push('vo (VO audio file, required when subtitles: true)');
  if (missing.length) throw new Error(`Missing required config: ${missing.join(', ')}`);

  const req = loadProjectRequire(projectDir);
  const { chromium } = req('playwright');
  const { attachPopupDriver } = require(path.join(__dirname, 'popup-driver.js'));
  // web-only products skip the wallet stack entirely
  let wc = null, account = null;
  const chainActive = Boolean(chain && signerKey && signerAddr);
  if (chainActive) {
    const { createWalletClient, http } = req('viem');
    const { privateKeyToAccount } = req('viem/accounts');
    const rpc = chain.rpcUrls?.default?.http?.[0];
    if (!rpc) throw new Error('chain.rpcUrls.default.http[0] is required');
    const key = signerKey.startsWith('0x') ? signerKey : `0x${signerKey}`;
    account = privateKeyToAccount(key);
    wc = createWalletClient({ account, chain, transport: http(rpc) });
  }

  const realMode = !!(chrome.realPopups);
  if (realMode) {
    if (!chrome.profileDir) missing.push('chrome.profileDir (required when realPopups)');
    if (!chrome.extensionDir) missing.push('chrome.extensionDir (required when realPopups)');
    if (!chrome.rabbyPassword) missing.push('chrome.rabbyPassword (required when realPopups)');
    if (missing.length) throw new Error(`Missing required config: ${missing.join(', ')}`);
  }

  // Marker system for ffmpeg cutting
  const markers = [];
  const t0 = Date.now();
  const mark = (name) => markers.push({ name, t: +((Date.now() - t0) / 1000).toFixed(1) });

  let b = null;
  let ctx;
  let p;
  if (!chainActive && realMode) throw new Error('realMode needs a chain config');
  if (realMode) {
    // Real-extension mode: persistent profile, real Rabby, TWO video streams
    // (stage page + each popup window). No mock provider, the app talks to
    // the real injected wallet.
    ctx = await chromium.launchPersistentContext(chrome.profileDir, {
      headless: false,
      viewport,
      recordVideo: { dir: '/tmp/pwvideo', size: viewport },
      args: [
        `--disable-extensions-except=${chrome.extensionDir}`,
        `--load-extension=${chrome.extensionDir}`,
        '--no-first-run', '--no-default-browser-check',
        '--window-size=1300,940',
      ],
    });
    p = ctx.pages()[0] || (await ctx.newPage());
  } else {
    b = await chromium.launch();
    ctx = await b.newContext({
      viewport,
      recordVideo: { dir: '/tmp/pwvideo', size: viewport },
    });
    p = await ctx.newPage();
  }

  // ---- Mock EIP-1193 provider (template mode only) ----

  if (chainActive && !realMode) {
  // RPC bridge: page provider calls proxy to real node.
  // Context-level (not page-level) so the bridges exist inside the app IFRAME
  // too, page.exposeFunction/addInitScript do not cover cross-origin frames.
  await ctx.exposeFunction('__pw_rpc', async (method, params) => {
    const r = await fetch(rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    const j = await r.json();
    if (j.error) throw new Error(JSON.stringify(j.error));
    return j.result;
  });

  // Signing bridge: REAL key signs + broadcasts server-side (context-level: frame coverage)
  await ctx.exposeFunction('__pw_signAndSend', async (tx) =>
    wc.sendTransaction({
      account,
      chain,
      to: tx.to,
      data: tx.data,
      value: tx.value ? BigInt(tx.value) : 0n,
    })
  );

  // Mock provider + visible approval HUD (muteable when the Rabby overlay
  // carries the same moment, never show two wallet UIs at once).
  // ctx-level so it injects into the cross-origin app iframe before its scripts.
  await ctx.addInitScript(({ addr, chainId }) => {
    // Pre-seed wagmi's store so the app boots already-connected (proven path:
    // avoids RainbowKit modal/EIP-6963 detection flakiness in cross-origin
    // iframes). UNCONDITIONAL: if an earlier page (e.g. the landing) already
    // had wagmi write its own empty store on this origin, a guarded seed
    // would skip and the app would boot disconnected. The wallet still
    // signs for real via the bridges below.
    try {
      localStorage.setItem('wagmi.store', JSON.stringify({
        state: {
          connections: { __type: 'Map', value: [['injected', { accounts: [addr], chainId }]] },
          chainId,
          current: 'injected',
        },
        version: 2,
      }));
    } catch {}

    const hud = () => {
      if (window.__hudMuted) return;
      if (document.getElementById('__wallet_hud')) return;
      const el = document.createElement('div');
      el.id = '__wallet_hud';
      el.style.cssText = 'position:fixed;top:18px;right:18px;z-index:2147483647;pointer-events:none;' +
        'min-width:300px;max-width:340px;padding:16px 18px;border-radius:14px;' +
        'background:#1b1f2b;border:1px solid rgba(255,255,255,0.14);box-shadow:0 12px 40px rgba(0,0,0,0.5),0 0 24px rgba(124,108,255,0.25);' +
        'color:#e8eaf2;font:13px/1.5 Inter,Arial,sans-serif;opacity:0;transform:translateY(-8px);transition:all .3s ease';
      el.innerHTML = '<div style="font-weight:700;letter-spacing:.4px;margin-bottom:6px">WALLET REQUEST</div>' +
        '<div id="__wallet_hud_body" style="color:#9aa0b4"></div>' +
        '<div id="__wallet_hud_state" style="margin-top:10px;font-weight:700;color:#7c6cff">Waiting for approval…</div>';
      document.documentElement.appendChild(el);
      requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
    };
    const hudBody = (html) => { const b = document.getElementById('__wallet_hud_body'); if (b) b.innerHTML = html; };
    const hudState = (text, color) => {
      const s = document.getElementById('__wallet_hud_state');
      if (s) { s.textContent = text; s.style.color = color || '#34d399'; }
    };
    const hudHide = () => {
      const el = document.getElementById('__wallet_hud');
      if (!el) return;
      el.style.opacity = '0'; el.style.transform = 'translateY(-8px)';
      setTimeout(() => el.remove(), 400);
    };
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const chainIdHex = '0x' + (1).toString(16); // placeholder, overridden below
    const local = {
      eth_requestAccounts: async () => {
        hud(); hudBody('Connect <b>' + location.host + '</b><br><span style="font-family:monospace">' + addr.slice(0, 6) + '…' + addr.slice(-4) + '</span>');
        await sleep(2000); hudState('Approved ✓'); await sleep(700); hudHide();
        return [addr];
      },
      eth_accounts: () => [addr],
      eth_chainId: () => chainIdHex,
      wallet_switchEthereumChain: () => null,
      wallet_addEthereumChain: () => null,
    };
    window.__walletHudTx = async (summary) => {
      hud(); hudBody(summary);
      await sleep(1200); hudState('Signing…', '#7c6cff'); await sleep(1300);
      hudState('Approved ✓'); await sleep(800); hudHide();
    };
    const prov = {
      request: async ({ method, params }) => {
        if (method === 'eth_sendTransaction') {
          const tx = params[0];
          const short = (tx.to || '').slice(0, 8);
          await window.__walletHudTx('Send transaction to <b>' + short + '…</b><br>' + (tx.data && tx.data.length > 10 ? 'data: ' + tx.data.slice(0, 12) + '…' : ''));
          return await window.__pw_signAndSend(tx);
        }
        if (local[method]) return await local[method]();
        return await window.__pw_rpc(method, params || []);
      },
      on: () => {}, removeListener: () => {}, removeAllListeners: () => {}, off: () => {},
    };
    window.ethereum = prov;
    window.ethereum.isMetaMask = true; // wallet-detection flags so RainbowKit
    window.ethereum.isRabby = true;    // reliably lists the injected option
    window.okxwallet = prov;
  }, { addr: signerAddr, chainId: chain.id });

  // Override chainId in the mock provider to match config (ctx-level for iframe coverage)
  await ctx.addInitScript((chainId) => {
    const origReq = window.ethereum.request;
    window.ethereum.request = async ({ method, params }) => {
      if (method === 'eth_chainId') return '0x' + chainId.toString(16);
      if (method === 'wallet_switchEthereumChain') return null;
      if (method === 'wallet_addEthereumChain') return null;
      return origReq({ method, params });
    };
  }, chain.id);
  } // end template-mode mock provider

  // ---- Mount stage ----

  const stagePath = path.join(__dirname, 'stage.js');
  const { mountStage, setTab, setTabLoading, showRabby, hideRabby, zoomTo, zoomOut } = require(stagePath);
  const title = new URL(site).hostname;
  const frame = await mountStage(p, { title, url: site, extensions: chrome.extensions || [], profile: chrome.profile });

  // ---- Interaction overlays ----

  const cursorPath = path.join(__dirname, 'cursor.js');
  const { injectCursor, moveCursor, clickCursor, typeCursor, driftCursor } = require(cursorPath);
  await injectCursor(p);

  // Real mode: every Rabby window gets its own cursor + state-driven handling
  let popupDriver = null;
  if (realMode) {
    popupDriver = attachPopupDriver(ctx, {
      extId: path.basename(path.dirname(chrome.extensionDir)),
      password: chrome.rabbyPassword,
      holdMs: chrome.rabbyHold || 2600,
      mark,
    });
  }

  const rabbyPath = path.join(__dirname, 'rabby-popup.html');
  const rabbyHtml = fs.readFileSync(rabbyPath, 'utf8');

  async function showWallet(mode, opts = {}) {
    await showRabby(p, {
      mode,
      html: rabbyHtml,
      site: new URL(site).hostname,
      chain: chain.name,
      mark: chain.name.charAt(0),
      account: 'Account 1',
      addr: signerAddr,
      gas: opts.gas || '<$0.0001',
      tx: opts.tx || '{ "to": "0x…" }',
      ...opts,
    });
  }

  const setHudMuted = (m) => p.evaluate((m) => { window.__hudMuted = m; }, m);

  // Element rect in TOP-PAGE coordinates: frame-content boxes are relative to
  // the iframe, so add the iframe's own offset on the stage.
  async function absoluteRect(locator) {
    const host = await p.locator('#__app').boundingBox();
    const box = await locator.boundingBox();
    if (!host || !box) throw new Error('no box');
    return { x: host.x + box.x, y: host.y + box.y, width: box.width, height: box.height };
  }

  // ---- Execute scenes ----

  for (const scene of scenes) {
    const sceneName = scene.mark || scene.action;
    try {
      switch (scene.action) {
        case 'goto': {
          const url = scene.path.startsWith('http') ? scene.path : site + scene.path;
          // networkidle is a trap: wagmi/viem long-poll RPCs hold it open forever.
          await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
          mark(sceneName);
          if (scene.wait) await p.waitForTimeout(scene.wait);
          else await p.waitForTimeout(2000);
          break;
        }
        case 'click': {
          const locator = frame.locator(selectors[scene.selector] || scene.selector);
          if (scene.rabby && !realMode) await setHudMuted(true); // one wallet UI at a time
          // Real UX order: click FIRST, popup appears AFTER the click.
          await clickCursor(p, locator, { timeout: scene.timeout || 10000 });
          mark(sceneName);
          if (scene.rabby && realMode) {
            // Real extension: the sign window opens as its own stream; the
            // driver holds it on camera and closes it (server-side broadcast).
            await popupDriver.settle(scene.rabbyHold ? scene.rabbyHold + 22000 : 28000);
          } else if (scene.rabby) {
            await showWallet(scene.rabbyMode || 'connect', scene.rabbyOpts);
            await p.waitForTimeout(scene.rabbyHold || 1500); // popup reads, cursor approves via template? popup auto-approves on action btn
            await hideRabby(p);
            await setHudMuted(false);
          }
          if (scene.wait) await p.waitForTimeout(scene.wait);
          else await p.waitForTimeout(1500);
          break;
        }
        case 'wallet_flow': {
          // Real mode connect: app button -> RainbowKit modal -> wallet option
          // -> the popup driver handles every Rabby window (unlock/connect/add).
          const btn = frame.locator(selectors[scene.connectSelector || 'connectBtn'] || scene.connectSelector || 'connectBtn');
          await clickCursor(p, btn, { timeout: scene.timeout || 15000 });
          mark(`${sceneName}_clicked`);
          await p.waitForTimeout(1800);
          if (scene.walletOption) {
            const opt = frame.locator('[data-testid^="rk-wallet-option"]').filter({ hasText: new RegExp(scene.walletOption, 'i') }).first();
            await clickCursor(p, opt, { timeout: 9000 });
            mark(`${sceneName}_wallet_picked`);
          }
          if (scene.waitSelector) {
            const loc = frame.locator(selectors[scene.waitSelector] || scene.waitSelector);
            for (let i = 0; i < (scene.timeout || 40); i++) {
              if (await loc.count()) break;
              await Promise.all([p.waitForTimeout(500), driftCursor(p, 480)]);
            }
          } else {
            await popupDriver.settle(scene.wait ? scene.wait * 1000 : 30000);
          }
          mark(sceneName);
          if (scene.wait) await p.waitForTimeout(Math.min(scene.wait, 4000));
          break;
        }
        case 'wait_for': {
          const locator = frame.locator(selectors[scene.selector] || scene.selector);
          let found = false;
          for (let i = 0; i < (scene.timeout || 40); i++) {
            if (await locator.count()) { found = true; break; }
            await Promise.all([p.waitForTimeout(500), driftCursor(p, 480)]); // cursor breathes while polling
          }
          if (!found) console.warn(`WARN: wait_for "${scene.selector}" never appeared (continuing)`);
          mark(sceneName);
          if (scene.wait) await p.waitForTimeout(scene.wait);
          else await p.waitForTimeout(1500);
          break;
        }
        case 'scroll': {
          // Ease in/out wheel steps instead of fixed jumps.
          const steps = scene.steps || 6;
          const dir = scene.direction || 'down';
          const total = scene.distance || steps * 260;
          const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
          for (let i = 1; i <= steps; i++) {
            const d = total * (ease(i / steps) - ease((i - 1) / steps));
            await p.mouse.wheel(0, dir === 'down' ? d : -d);
            await p.waitForTimeout(scene.interval || 350);
          }
          mark(sceneName);
          if (scene.wait) await p.waitForTimeout(scene.wait);
          break;
        }
        case 'move': {
          await moveCursor(p, scene.x, scene.y, scene.steps || 24);
          mark(sceneName);
          if (scene.wait) await p.waitForTimeout(scene.wait);
          break;
        }
        case 'type': {
          const locator = frame.locator(selectors[scene.selector] || scene.selector);
          // Per-character with jitter, instant fill() reads as fake on camera.
          await typeCursor(p, locator, scene.text || '', { timeout: scene.timeout || 10000 });
          mark(sceneName);
          if (scene.wait) await p.waitForTimeout(scene.wait);
          else await p.waitForTimeout(500);
          break;
        }
        case 'zoom': {
          // Punch the camera into a frame element (money moment), hold, and
          // optionally release in the same scene.
          const locator = frame.locator(selectors[scene.selector] || scene.selector);
          await locator.first().waitFor({ state: 'visible', timeout: scene.timeout || 10000 });
          const rect = await absoluteRect(locator.first());
          await zoomTo(p, rect, { level: scene.level || 1.6, duration: scene.duration || 600 });
          mark(sceneName);
          await p.waitForTimeout(scene.hold || 1200);
          if (scene.release !== false) await zoomOut(p);
          break;
        }
        case 'unzoom': {
          await zoomOut(p, { duration: scene.duration || 500 });
          mark(sceneName);
          break;
        }
        case 'hook': {
          // Project-provided async hook: config.hooks[scene.hook]({ page, mark })
          const fn = config.hooks && config.hooks[scene.hook];
          if (!fn) throw new Error(`no hook named "${scene.hook}" in config.hooks`);
          await fn({ page: p, mark });
          mark(sceneName);
          if (scene.wait) await p.waitForTimeout(scene.wait);
          break;
        }
        case 'wait': {
          const d = scene.duration || 2000;
          // Long holds get idle drift so the cursor doesn't freeze on camera.
          if (d >= 3000) await Promise.all([p.waitForTimeout(d), driftCursor(p, d - 300)]);
          else await p.waitForTimeout(d);
          mark(sceneName);
          break;
        }
        case 'goto_frame': {
          const url = scene.path.startsWith('http') ? scene.path : site + scene.path;
          await setTabLoading(p, true); // tab spinner, like a real load
          // Real tab title: server-side fetch (no CORS in node). scene.tabTitle wins.
          let title = scene.tabTitle || null;
          if (!title) {
            try {
              const ctl = new AbortController();
              setTimeout(() => ctl.abort(), 3500);
              const html = await (await fetch(url, { signal: ctl.signal })).text();
              title = html.match(/<title[^>]*>\s*([^<]{1,120})\s*<\/title>/i)?.[1]
                ?.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'") || null;
            } catch { /* keep current title */ }
          }
          await p.evaluate(({ url }) => {
            document.getElementById('__app').src = url;
          }, { url });
          await setTab(p, { url, title }); // omnibox + title update on commit
          await p.waitForTimeout(scene.wait || 3000);
          await setTabLoading(p, false); // spinner resolves to favicon
          mark(sceneName);
          break;
        }
        case 'set_content': {
          await p.setContent(scene.html, { waitUntil: 'domcontentloaded' });
          await p.waitForTimeout(scene.wait || 2000);
          mark(sceneName);
          break;
        }
        default:
          throw new Error(`Unknown scene action: ${scene.action}`);
      }
    } catch (e) {
      // Flake tolerance: one missing element must not kill a 3-minute take.
      if (scene.action === 'goto') throw e; // navigation failure IS fatal
      console.warn(`WARN: scene "${sceneName}" (${scene.action}) failed: ${e.message}, skipping`);
      mark(`skipped_${sceneName}`);
    }
  }

  // ---- End card ----

  if (endCard) {
    await p.goto(endCard).catch(() => {});
    await p.waitForTimeout(3500);
    mark('end_card');
  }

  // ---- Finalize ----

  // Real mode: collect both streams before close (paths resolve now, files land on close)
  let realManifest = null;
  if (realMode && popupDriver) {
    const sessions = await popupDriver.settle(30000);
    const stageVideo = p.video() ? await p.video().path() : null;
    const popups = [];
    for (const s of sessions) popups.push({ video: s.video ? await s.video.path().catch(() => null) : null });
    realManifest = { stage: stageVideo, popups };
  }
  await ctx.close(); // REQUIRED: finalizes the video file
  if (b) await b.close();
  console.log('MARKERS ' + JSON.stringify(markers));
  fs.writeFileSync(path.join(process.cwd(), 'demo-markers.json'), JSON.stringify(markers, null, 2));
  if (realManifest) {
    fs.writeFileSync(path.join(process.cwd(), 'demo-real-videos.json'), JSON.stringify(realManifest, null, 2));
    console.log('REAL-STREAMS ' + JSON.stringify(realManifest));
  }

  // ---- Post-production hints (VO mux / soft subtitles / music / thumbnail) ----

  const post = [];
  const cap = require(path.join(__dirname, 'captions.js'));
  if (vo) {
    post.push(`vo: ${cap.muxVoCmd({ video: '<trimmed>.mp4', vo, out: '<product>-vo.mp4' })}`);
  }
  if (subtitles && vo && voScript) {
    const lines = fs.readFileSync(voScript, 'utf8');
    const srt = cap.buildSrt(cap.cuesFromVo(lines, { audioDuration: '<ffprobe vo duration>' }));
    const srtPath = path.join(process.cwd(), 'demo-subtitles.srt');
    fs.writeFileSync(srtPath, srt);
    post.push(`subtitles (soft track): ${cap.muxSubtitlesCmd({ video: '<product>-vo.mp4', srt: srtPath, out: '<product>-final.mp4' })}`);
  }
  if (music) {
    post.push(`music: ${cap.mixMusicCmd({ video: '<vo or trimmed>.mp4', music, out: '<product>-final.mp4' })}`);
  }
  if (thumbnailAt !== undefined) {
    const at = typeof thumbnailAt === 'number'
      ? thumbnailAt
      : (markers.find(m => m.name === thumbnailAt) || { t: 0 }).t;
    post.push(`thumbnail: ${cap.thumbnailCmd({ video: '<final>.mp4', at, out: 'poster.jpg' })}`);
  }
  if (post.length) console.log('POST-PRODUCTION:\n  ' + post.join('\n  '));

  return { markers };
}

// ---- CLI entry point ----

if (require.main === module) {
  const configPath = path.join(process.cwd(), 'config.json');
  if (!fs.existsSync(configPath)) {
    console.error('No config.json found in ' + process.cwd());
    console.error('Create one with: site, chain, signerKey, signerAddr, selectors, scenes, endCard');
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  // Allow env var overrides for secrets
  if (!config.signerKey) config.signerKey = process.env.SIGNER_PRIVATE_KEY;
  if (!config.signerAddr) config.signerAddr = process.env.SIGNER_ADDRESS;

  record(config).catch(e => { console.error('FAIL', e); process.exit(1); });
}

module.exports = { record };
