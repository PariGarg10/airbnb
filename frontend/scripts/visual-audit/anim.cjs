// Records the header collapse (or re-expand) animation frame by frame.
//   node scripts/visual-audit/anim.cjs <airbnb|ours> <collapse|expand> [width] [wheelDelta]
// Measures geometry/opacity only (no markup, CSS or assets are copied from Airbnb).
const { chromium } = require("@playwright/test");
const path = require("node:path");

const SAMPLERS = {
  airbnb: `(() => {
    const form = document.querySelector('form[role=search]');
    return {
      layer: [...form.children].pop(),
      tabs: document.querySelector('[role=tablist]'),
      big: document.querySelector('[data-testid=big-search]'),
      get compact() { return document.querySelector('div[role=search]'); },
      header: document.querySelector('header') || form,
    };
  })()`,
  ours: `(() => {
    const header = document.querySelector('header');
    const pills = [...document.querySelectorAll('header [data-guest-search]')];
    return {
      layer: header,
      tabs: document.querySelector('nav[aria-label=Explore]'),
      big: pills.find((p) => /Where/.test(p.textContent || '')),
      compact: pills.find((p) => p.querySelector('button[aria-label=Search]')),
      header,
    };
  })()`,
};

(async () => {
  const [side = "airbnb", mode = "collapse", width = "1440", delta = "120"] = process.argv.slice(2);
  const url = side === "airbnb" ? "https://www.airbnb.co.in/" : "http://localhost:3000/";
  const context = await chromium.launchPersistentContext(path.join(__dirname, ".profile-anim-" + side), {
    channel: "chrome",
    headless: false,
    viewport: { width: Number(width), height: 900 },
    locale: "en-IN",
    ignoreDefaultArgs: ["--enable-automation"],
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(6000);
  for (const name of [/^got it$/i, /^close$/i, /^accept/i]) {
    const btn = page.getByRole("button", { name }).first();
    if (await btn.count().catch(() => 0)) await btn.click({ timeout: 2000 }).catch(() => undefined);
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(__dirname, "..", "..", "..", "design-refs", "audit", "anim-load-" + side + ".png") });
  await page.mouse.move(Number(width) / 2, 500);
  if (mode === "expand") {
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(2500);
  }
  await page.evaluate(`(() => {
    const T = ${SAMPLERS[side]};
    const eff = (n) => { let o = 1; for (let e = n; e && e !== document.documentElement; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return Math.round(o * 1000) / 1000; };
    const R = (n) => { if (!n) return 'n/a'; const r = n.getBoundingClientRect(); return [r.y, r.height, r.width].map((v) => Math.round(v * 10) / 10).join('x'); };
    const CH = (n) => { const o = []; for (let e = n, i = 0; e && i < 5; e = e.parentElement, i++) { const cs = getComputedStyle(e); const m = cs.transform === 'none' ? '' : cs.transform.replace('matrix(', 'm(').replace(/\\.(\\d{3})\\d+/g, '.$1'); const op = cs.opacity === '1' ? '' : 'o' + (Math.round(parseFloat(cs.opacity) * 100) / 100); if (m || op) o.push(i + ':' + m + op); } return o.join(' '); };
    const DESC = (n) => { if (!n) return ''; const out = []; const walk = (e, d, id) => { const cs = getComputedStyle(e); const m = cs.transform === 'none' ? '' : cs.transform.replace('matrix(', 'm(').replace(/\\.(\\d{3})\\d+/g, '.$1'); const op = cs.opacity === '1' ? '' : 'o' + (Math.round(parseFloat(cs.opacity) * 100) / 100); if ((m || op) && out.length < 5) out.push(id + ':' + m + op); if (d < 4) [...e.children].forEach((c, i) => walk(c, d + 1, id + '.' + i)); }; walk(n, 0, 'r'); return out.join(' ; '); };
    window.__rows = [];
    const t0 = performance.now();
    const tick = () => {
      const tt = Math.round(performance.now() - t0);
      window.__rows.push([tt, Math.round(scrollY), 'hdr ' + R(T.header), 'layer ' + getComputedStyle(T.layer).transform.replace('matrix(', 'm('), 'tabs ' + R(T.tabs) + ' op' + eff(T.tabs), 'big ' + R(T.big) + ' op' + eff(T.big), 'cmp ' + R(T.compact) + ' op' + eff(T.compact), 'bigchain ' + CH(T.big), 'bigdesc ' + DESC(T.big), 'cmpdesc ' + DESC(T.compact)].join(' | '));
      if (tt < 1400) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  })()`);
  await page.waitForTimeout(250);
  if (mode === "expand") await page.mouse.wheel(0, -2000);
  else await page.mouse.wheel(0, Number(delta));
  await page.waitForTimeout(1700);
  const rows = await page.evaluate("window.__rows");
  console.log(rows.filter((_, i) => i % 2 === 0).join("\n"));
  await context.close();
})();
