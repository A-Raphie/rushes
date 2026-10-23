// Shared Jorqeth-style stage: wallpaper + floating Chrome + optional Rabby.
// Used by product recorders. No secrets.

const fs = require('fs');
const path = require('path');

function wallpaperCss() {
  return `
    html, body { margin:0; height:100%; overflow:hidden; }
    body {
      background:
        radial-gradient(1200px 700px at 20% 0%, #d7e8ff 0%, transparent 55%),
        radial-gradient(900px 600px at 90% 20%, #b9d4f5 0%, transparent 50%),
        linear-gradient(180deg, #c5d8ef 0%, #8eafd4 45%, #6b93c4 100%);
    }
    #__stage {
      position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
    }
    #__win {
      width: min(1180px, 88vw);
      height: min(810px, 92vh);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 28px 80px rgba(20,40,70,.38), 0 2px 0 rgba(255,255,255,.12) inset;
      background: #202124;
      display: flex; flex-direction: column;
    }
    /* Chrome dark-mode palette: strip #202124, tab+toolbar #35363a, omnibox #202124 */
    #__chrome {
      height: 84px; flex: none; color: #e8eaed;
      font: 12px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #35363a;
    }
    #__tabs {
      height: 40px; display:flex; align-items:flex-end; gap:6px; padding:0 10px;
      background:#202124;
    }
    .lights { display:flex; gap:8px; align-self:center; margin-right:6px; flex:none; }
    .dot { width:12px; height:12px; border-radius:50%; }
    .r { background:#ff5f57 } .y { background:#febc2e } .g { background:#28c840 }
    /* active tab merges into the toolbar below, like real Chrome */
    #__tab {
      display:flex; align-items:center; gap:8px; height:34px;
      background:#35363a; border-radius:10px 10px 0 0; padding:0 12px 0 10px;
      max-width:300px; color:#f1f3f4;
    }
    #__tab .ttl { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    #__tab svg { width:16px; height:16px; flex:none; }
    #__favbox { display:flex; align-items:center; justify-content:center; flex:none; width:16px; height:16px; }
    #__favbox svg, #__favbox img { width:16px; height:16px; display:block; }
    #__favbox.spin svg { animation:__spin .7s linear infinite; }
    @keyframes __spin { to { transform: rotate(360deg); } }
    .__fade { transition: opacity .16s ease; }
    @keyframes __pop {
      from { opacity:0; transform: scale(.96) translateY(-6px); }
      to { opacity:1; transform: none; }
    }
    .__tabbtn {
      width:28px; height:28px; border-radius:50%; display:flex; align-items:center;
      justify-content:center; color:#c7c8cc; flex:none; align-self:center;
    }
    .__tabbtn svg { width:14px; height:14px; }
    .__tspace { flex:1; }
    #__omniwrap { height:44px; display:flex; align-items:center; padding:0 8px; gap:2px; }
    .__navbtn {
      width:28px; height:28px; border-radius:50%; display:flex; align-items:center;
      justify-content:center; color:#c7c8cc; flex:none;
    }
    .__navbtn svg { width:16px; height:16px; }
    .__navbtn.off { color:#5f6368; }
    #__omni {
      flex:1; height:30px; border-radius:15px; background:#202124;
      display:flex; align-items:center; padding:0 14px; margin:0 6px;
      font-size:13px; gap:8px; min-width:0;
    }
    #__omni .tune { width:14px; height:14px; color:#9aa0a6; flex:none; }
    #__omni .host { color:#e8eaed; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    #__omni .path { color:#9aa0a6; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .__extbar { display:flex; align-items:center; gap:2px; flex:none; }
    .__ext {
      width:28px; height:28px; border-radius:6px; display:flex; align-items:center;
      justify-content:center; flex:none; transition:background .15s ease, box-shadow .15s ease;
    }
    .__ext svg { width:17px; height:17px; border-radius:4px; }
    .__ext img { width:17px; height:17px; display:block; }
    .__ext.puzzle svg { width:15px; height:15px; border-radius:0; color:#9aa0ab; }
    /* active state while the extension popup is open, like real Chrome */
    .__ext.on { background:#46484c; }
    .__avatar {
      width:24px; height:24px; border-radius:50%; background:#5f6368;
      display:flex; align-items:center; justify-content:center; flex:none;
    }
    .__avatar svg { width:14px; height:14px; color:#e8eaed; }
    /* monogram profile, like Chrome's signed-in avatar (ultralight, optically centered) */
    .__avatar.mono { font-weight:100; font-size:13px; color:#fff; }
    .__avatar.mono .init { display:block; line-height:1; }
    .__kebab { color:#c7c8cc; }
    .__kebab svg { width:16px; height:16px; }
    #__app {
      flex:1; border:0; width:100%; background:#0a0b0f;
    }
  `;
}

// Toolbar SVGs: nav glyphs, tab strip, omnibox, Chrome's puzzle piece, wallet icon.
const NAV_BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
const NAV_FWD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';
const NAV_RELOAD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11.5a8 8 0 1 0-2.3 6.1"/><path d="M20 5v6.5h-6.5"/></svg>';
// Chrome's default gray globe favicon
const FAV_GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg>';
const NEW_TAB = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 6v12M6 12h12"/></svg>';
// macOS Chrome's tab-search chevron, top-right of the tab strip
const TAB_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 10.5L12 14l3.5-3.5"/></svg>';
// Chrome's current omnibox permissions icon (sliders, replaced the padlock)
const TUNE = '<svg class="tune" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></svg>';
// Tab loading spinner (Chrome's tab-load state)
const SPINNER = '<svg viewBox="0 0 24 24" fill="none" stroke="#e8eaed" stroke-width="2.4" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9"/></svg>';
const AVATAR = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
const KEBAB = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';
const PUZZLE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/></svg>';
// Rabby's real toolbar icon (copied from the installed extension), embedded
// as a data URI so recording never touches the browser profile.
const RABBY_ICON = 'data:image/png;base64,'
  + fs.readFileSync(path.join(__dirname, 'assets', 'rabby-icon.png'), 'base64');

// Known extension ids -> toolbar icon. Unknown ids are ignored.
const EXT_ICONS = { rabby: '<span class="__ext" id="__ext_rabby" title="Rabby"><img alt="" src="' + RABBY_ICON + '"/></span>' };

async function mountStage(page, { title, url, extensions = [], profile }) {
  // Chrome's real chrome order: lights + tab + new-tab + tab-search, then
  // nav / omnibox / extensions / avatar / kebab.
  const extHtml = (extensions.includes('rabby') ? EXT_ICONS.rabby : '')
    + '<span class="__ext puzzle" title="Extensions">' + PUZZLE + '</span>';
  // Monogram avatar when configured ({ initial, color }); generic person otherwise.
  const safeInitial = profile && String(profile.initial || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 1).toUpperCase();
  const safeColor = profile && /^#[0-9a-fA-F]{3,8}$/.test(profile.color || '') ? profile.color : '#7c3aed';
  const avatarHtml = safeInitial
    ? `<span class="__avatar mono" style="background:${safeColor}"><span class="init">${safeInitial}</span></span>`
    : `<span class="__avatar">${AVATAR}</span>`;
  await page.setContent(`<!doctype html><html><head><style>${wallpaperCss()}</style></head>
  <body><div id="__stage"><div id="__win">
    <div id="__chrome">
      <div id="__tabs">
        <span class="lights"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span></span>
        <div id="__tab"><span id="__favbox">${FAV_GLOBE}</span><span class="ttl __fade"></span></div>
        <span class="__tabbtn">${NEW_TAB}</span>
        <span class="__tspace"></span>
        <span class="__tabbtn">${TAB_SEARCH}</span>
      </div>
      <div id="__omniwrap">
        <span class="__navbtn off">${NAV_BACK}</span>
        <span class="__navbtn off">${NAV_FWD}</span>
        <span class="__navbtn">${NAV_RELOAD}</span>
        <div id="__omni">${TUNE}<span class="host __fade"></span><span class="path __fade"></span></div>
        <div class="__extbar">${extHtml}</div>
        ${avatarHtml}
        <span class="__tabbtn __kebab">${KEBAB}</span>
      </div>
    </div>
    <iframe id="__app"></iframe>
  </div></div></body></html>`);
  await page.evaluate(({ title, url }) => {
    document.querySelector('#__tab .ttl').textContent = title;
    // Chrome renders the hostname bright and the path/query dim.
    const u = new URL(url);
    document.querySelector('#__omni .host').textContent = u.hostname;
    document.querySelector('#__omni .path').textContent = u.pathname === '/' ? '' : u.pathname + u.search;
    document.getElementById('__app').src = url;

    // Real favicon: try the site's own /favicon.ico, then Google's s2 service,
    // then keep the globe. Display-only <img>, no CORS reading involved.
    // The resolved URL is cached for the Rabby popup header.
    window.__globeHtml = document.getElementById('__favbox').innerHTML;
    (async () => {
      const box = document.getElementById('__favbox');
      const u = new URL(url);
      const tries = [u.origin + '/favicon.ico', 'https://www.google.com/s2/favicons?domain=' + u.hostname + '&sz=32'];
      for (const src of tries) {
        const ok = await new Promise((res) => {
          const im = new Image();
          im.onload = () => res(im.naturalWidth > 0);
          im.onerror = () => res(false);
          im.src = src;
          setTimeout(() => res(false), 3500);
        });
        if (ok) {
          if (!box.classList.contains('spin')) {
            box.innerHTML = '';
            const im = document.createElement('img');
            im.src = src;
            box.appendChild(im);
          }
          window.__favHtml = '<img src="' + src + '">';
          window.__siteFavicon = src;
          break;
        }
      }
    })();

    // Deterministic monogram centering: measure the glyph's INK box (canvas
    // TextMetrics) and translate so ink center == span center. Font string and
    // size must stay in sync with .__avatar.mono.
    const initEl = document.querySelector('.__avatar.mono .init');
    if (initEl) {
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = '100 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const m = ctx.measureText(initEl.textContent);
      const lh = 13; // line-height:1 → box height == font-size
      const halfLeading = (lh - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
      const baseline = halfLeading + m.fontBoundingBoxAscent;
      const inkTop = baseline - m.actualBoundingBoxAscent;
      const inkBottom = baseline + m.actualBoundingBoxDescent;
      const dy = lh / 2 - (inkTop + inkBottom) / 2;
      const dx = m.width / 2 - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
      initEl.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`;
    }
  }, { title, url });
  const frame = page.frameLocator('#__app');
  return frame;
}

// Tab-load state: spinner in the favicon slot while the iframe navigates.
// Resolving (on=false) restores the real favicon if it ever loaded.
async function setTabLoading(page, on = true) {
  await page.evaluate((on) => {
    const box = document.getElementById('__favbox');
    if (!box) return;
    if (on) {
      box.classList.add('spin');
      box.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#e8eaed" stroke-width="2.4" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9"/></svg>';
    } else {
      box.classList.remove('spin');
      box.innerHTML = window.__favHtml || window.__globeHtml || '';
    }
  }, on);
}

// Navigation commit: crossfade the omnibox host/path (and optionally the tab
// title) to the new URL, the way Chrome updates them on commit.
async function setTab(page, { url, title } = {}) {
  await page.evaluate(async ({ url, title }) => {
    const fadeSwap = async (el, apply) => {
      if (!el) return;
      el.style.opacity = '0';
      await new Promise((r) => setTimeout(r, 170));
      apply();
      el.style.opacity = '1';
    };
    const u = new URL(url);
    await Promise.all([
      fadeSwap(document.querySelector('#__omni .host'), () => {
        document.querySelector('#__omni .host').textContent = u.hostname;
      }),
      fadeSwap(document.querySelector('#__omni .path'), () => {
        document.querySelector('#__omni .path').textContent = u.pathname === '/' ? '' : u.pathname + u.search;
      }),
      title != null
        ? fadeSwap(document.querySelector('#__tab .ttl'), () => {
            document.querySelector('#__tab .ttl').textContent = title;
          })
        : Promise.resolve(),
    ]);
  }, { url, title });
}

async function showRabby(page, opts) {
  const q = new URLSearchParams({
    mode: opts.mode || 'connect',
    site: opts.site || 'example.com',
    chain: opts.chain || 'Ethereum',
    mark: opts.mark || '•',
    account: opts.account || 'Account 1',
    addr: opts.addr || '0x…',
    gas: opts.gas || '<$0.0001',
    tx: opts.tx || '{ "to": "0x…" }',
  });
  const html = opts.html || require('fs').readFileSync(
    require('path').join(__dirname, 'rabby-popup.html'),
    'utf8',
  );
  await page.evaluate(({ html, q }) => {
    document.getElementById('__rabby_host')?.remove();
    // Chrome highlights the toolbar icon while its popup is open.
    document.getElementById('__ext_rabby')?.classList.add('on');
    const win = document.getElementById('__win');
    const host = document.createElement('div');
    host.id = '__rabby_host';
    // Anchor below the rendered toolbar so chrome-height changes can't drift.
    const ch = document.getElementById('__chrome').offsetHeight;
    host.style.cssText =
      `position:absolute;inset:${ch}px 0 0 0;z-index:20;background:rgba(0,0,0,.28);display:flex;align-items:flex-start;justify-content:flex-end;padding:16px 18px 0 0`;
    const frame = document.createElement('iframe');
    frame.id = '__rabby_frame';
    // Fit the 400x700 real-size popup into whatever height the stage leaves;
    // never overflow the window bottom.
    const winBox = document.getElementById('__win');
    const chromeH2 = document.getElementById('__chrome').offsetHeight;
    const avail = winBox.clientHeight - chromeH2 - 24; // top pad + breathing room
    const frameH = Math.max(480, Math.min(700, avail));
    frame.style.cssText =
      `width:400px;height:${frameH}px;border:0;border-radius:12px;box-shadow:0 22px 70px rgba(0,0,0,.5),0 0 0 1px rgba(0,0,0,.06);background:#fafafa;` +
      'transform-origin:top right;animation:__pop .16s cubic-bezier(.2,.9,.3,1);';
    host.appendChild(frame);
    win.style.position = 'relative';
    win.appendChild(host);
    const doc = frame.contentDocument;
    doc.open();
    doc.write(html);
    doc.close();
    const u = new URLSearchParams(q);
    const script = doc.createElement('script');
    script.textContent = `location.hash = ${JSON.stringify('?' + u.toString())};`;
    // Re-apply params the popup script already read from location.search (empty on srcdoc).
    const mode = u.get('mode') || 'connect';
    doc.getElementById('connect')?.classList.toggle('hidden', mode !== 'connect');
    doc.getElementById('sign')?.classList.toggle('hidden', mode !== 'sign');
    const set = (id, v) => { const el = doc.getElementById(id); if (el && v != null) el.textContent = v; };
    const acctName = u.get('account') || 'Account 1';
    set('origin', u.get('site'));
    set('connectChain', u.get('chain'));
    set('signChain', u.get('chain'));
    set('netMark', u.get('mark'));
    set('signMark', u.get('mark'));
    set('acct', acctName);
    set('acct2', u.get('addr') || '');
    set('acctSign', acctName);
    set('acctAddr', u.get('addr') || '');
    set('av1', acctName.charAt(0).toUpperCase());
    set('av2', acctName.charAt(0).toUpperCase());
    set('gasLine', u.get('gas') || '<$0.0001');
    set('txjson', u.get('tx') || '{ "to": "0x…" }');
    // Site favicon in the popup origin rows, like the real notification window.
    if (window.__siteFavicon) {
      for (const id of ['origin', 'origin2']) {
        const el = doc.getElementById(id);
        const holder = el && el.parentElement;
        if (holder && !holder.querySelector('img')) {
          const im = doc.createElement('img');
          im.src = window.__siteFavicon;
          im.style.cssText = 'width:16px;height:16px;border-radius:3px;flex:none';
          holder.insertBefore(im, el);
          holder.querySelector('.fav')?.remove();
        }
      }
    }
    const btn = doc.getElementById('btnAction');
    if (btn) {
      btn.id = mode === 'sign' ? 'btnSign' : 'btnConnect';
      btn.textContent = mode === 'sign' ? 'Sign' : 'Connect';
      if (mode === 'connect') doc.getElementById('actions')?.classList.add('stack');
      btn.addEventListener('click', () => { btn.classList.add('done'); btn.textContent = 'Approved'; });
    }
  }, { html, q: q.toString() });
}

async function hideRabby(page) {
  await page.evaluate(() => {
    document.getElementById('__rabby_host')?.remove();
    document.getElementById('__ext_rabby')?.classList.remove('on');
  });
}

// Camera moves: scale/translate the window wrapper so a region of the app
// fills the frame. `rect` must be in TOP-PAGE (stage) coordinates, callers
// add the iframe's offset to element boxes measured inside the frame.
async function zoomTo(page, rect, opts = {}) {
  const level = opts.level || 1.6;
  const dur = opts.duration || 600;
  await page.evaluate(({ rect, level, dur }) => {
    const win = document.getElementById('__win');
    if (!win) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    // transform: translate(...) scale(level) with origin 0 0 maps p -> t + level*p,
    // so solve for the target center landing at the viewport center.
    const tx = vw / 2 - level * cx;
    const ty = vh / 2 - level * cy;
    win.style.transformOrigin = '0 0';
    win.style.transition = `transform ${dur}ms cubic-bezier(.22,.61,.36,1)`;
    win.style.transform = `translate(${tx}px, ${ty}px) scale(${level})`;
  }, { rect, level, dur });
  await page.waitForTimeout(dur + 80);
}

async function zoomOut(page, opts = {}) {
  const dur = opts.duration || 500;
  await page.evaluate((dur) => {
    const win = document.getElementById('__win');
    if (!win) return;
    win.style.transition = `transform ${dur}ms cubic-bezier(.22,.61,.36,1)`;
    win.style.transform = 'translate(0px, 0px) scale(1)';
  }, dur);
  await page.waitForTimeout(dur + 80);
}

module.exports = { mountStage, setTab, setTabLoading, showRabby, hideRabby, zoomTo, zoomOut };
