// Scrolls the home page, clicks the compact pill and dumps the re-expanded header + overlay (geometry/colour only).
//   node scripts/visual-audit/pillclick.cjs <airbnb|ours> [width]
const { chromium } = require("@playwright/test");
const path = require("node:path");

(async () => {
  const [side = "airbnb", width = "1440"] = process.argv.slice(2);
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
  await page.mouse.move(Number(width) / 2, 500);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(2000);

  const pill = side === "airbnb" ? page.locator("div[role=search]").first() : page.locator("header [data-guest-search]").filter({ has: page.locator("button[aria-label=Search]") }).first();
  const box = await pill.boundingBox();
  console.log("pill box", JSON.stringify(box));
  await pill.click({ position: { x: 60, y: 23 } });
  await page.waitForTimeout(1500);

  const dump = await page.evaluate(`(() => {
    const R = (n) => { if (!n) return 'n/a'; const r = n.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 100) / 100).join(' '); };
    const out = { scrollY: Math.round(scrollY) };
    const hdr = document.querySelector('header');
    out.header = hdr ? R(hdr) + ' bg=' + getComputedStyle(hdr).backgroundImage.slice(0, 60) + ' bb=' + getComputedStyle(hdr).borderBottom : 'n/a';
    out.fixedLayers = [...document.querySelectorAll('body *')].filter((e) => { const cs = getComputedStyle(e); return cs.position === 'fixed' && /rgba\\(0, 0, 0, 0?\\.\\d+\\)/.test(cs.backgroundColor) && e.getBoundingClientRect().width > 600; }).map((e) => { const cs = getComputedStyle(e); return e.tagName + ' ' + R(e) + ' bg=' + cs.backgroundColor + ' op=' + cs.opacity + ' tr=' + cs.transition.slice(0, 80) + ' z=' + cs.zIndex; });
    const where = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && (e.textContent || '').trim() === 'Where' && e.getBoundingClientRect().height > 0);
    out.where = where ? R(where) : 'n/a';
    out.tabs = R(document.querySelector('[role=tablist]') || document.querySelector('nav[aria-label=Explore]'));
    return out;
  })()`);
  console.log(JSON.stringify(dump, null, 1));
  await page.screenshot({ path: path.join(__dirname, "..", "..", "..", "design-refs", "audit", "pillclick-" + side + ".png") });
  await context.close();
})();
