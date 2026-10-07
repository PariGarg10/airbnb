/**
 * Visual audit CLI.
 *
 *   npx tsx scripts/visual-audit/run.ts --page home --state default --width 1440
 *
 * Options
 *   --page <id>            page definition from targets.ts (default: home)
 *   --state <name>         default | scrolled | where-open | who-open (default: default)
 *   --width <px>           viewport width (default: 1440); height is --height (default: 900)
 *   --only <id,id,...>     measure only these element ids (plus the ones needed for gaps if included)
 *   --headless             run Chrome headless (default is headed; Airbnb blocks headless more often)
 *   --no-screenshots       skip screenshots
 *   --verbose              print rect + tag for every measured element
 *   --out <dir>            output dir (default: <repo>/design-refs/audit)
 *   --airbnb-url / --ours-url   override page URLs
 *
 * Output (in --out): <page>-<state>-<width>.md, .json, -airbnb.png, -ours.png
 */
import { chromium, type BrowserContext, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { buildReport, renderConsoleSummary, renderMarkdown, type AuditMeta } from "./diff";
import { measureAll, measureGaps, type Measurements } from "./measure";
import { PAGES, type PageDef, type Side, type StateName } from "./targets";

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

interface Options {
  page: string;
  state: StateName;
  width: number;
  height: number;
  only?: string[];
  headless: boolean;
  screenshots: boolean;
  verbose: boolean;
  out: string;
  airbnbUrl?: string;
  oursUrl?: string;
}

function parseArgs(argv: string[]): Options {
  const flags = new Map<string, string | true>();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith("--")) {
      flags.set(key, next);
      i++;
    } else {
      flags.set(key, true);
    }
  }
  const str = (key: string) => {
    const value = flags.get(key);
    return typeof value === "string" ? value : undefined;
  };
  const defaultOut = path.resolve(__dirname, "..", "..", "..", "design-refs", "audit");
  return {
    page: str("page") ?? "home",
    state: (str("state") ?? "default") as StateName,
    width: Number(str("width") ?? 1440),
    height: Number(str("height") ?? 900),
    only: str("only")?.split(",").map((s) => s.trim()).filter(Boolean),
    headless: flags.has("headless"),
    screenshots: !flags.has("no-screenshots"),
    verbose: flags.has("verbose"),
    out: path.resolve(str("out") ?? defaultOut),
    airbnbUrl: str("airbnb-url"),
    oursUrl: str("ours-url"),
  };
}

const log = (line: string) => console.log(line);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------------ */
/* Page preparation                                                    */
/* ------------------------------------------------------------------ */

const CAPTCHA_PROBE = `(() => {
  const text = (document.body && document.body.innerText || '').slice(0, 4000).toLowerCase();
  const title = document.title.toLowerCase();
  const frames = [...document.querySelectorAll('iframe')].some((f) => /captcha|px-|challenge/i.test(f.src || f.title || ''));
  return frames || /captcha|press & hold|verify you are (a )?human|are you a robot|pardon our interruption|access denied/.test(text + ' ' + title);
})()`;

/** If a captcha shows up, stop and wait for the user to solve it in the browser window. */
async function waitForCaptcha(page: Page, label: string) {
  const blocked = async () => Boolean(await page.evaluate(CAPTCHA_PROBE).catch(() => false));
  if (!(await blocked())) return;
  log("");
  log(`!! CAPTCHA / bot check detected on ${label}.`);
  log("!! Please solve it in the Chrome window. Waiting up to 10 minutes...");
  const deadline = Date.now() + 10 * 60_000;
  while (Date.now() < deadline) {
    await sleep(2000);
    if (!(await blocked())) {
      log("   captcha cleared, continuing.");
      await page.waitForLoadState("domcontentloaded").catch(() => undefined);
      await sleep(1500);
      return;
    }
  }
  throw new Error(`Captcha on ${label} was not solved within 10 minutes.`);
}

const DISMISS_NAME = /^(close|dismiss|got it|ok|okay|accept|accept all|accept all cookies|agree|no thanks|not now|decline|reject all|only necessary)$/i;

/** Closes cookie / translation / login popups. Never clicks "Continue" or submits anything. */
async function closePopups(page: Page) {
  for (let round = 0; round < 4; round++) {
    let clicked = false;
    for (const role of ["dialog", "alertdialog"] as const) {
      const dialogs = page.getByRole(role);
      const count = await dialogs.count().catch(() => 0);
      for (let i = 0; i < count; i++) {
        const buttons = dialogs.nth(i).getByRole("button", { name: DISMISS_NAME });
        if ((await buttons.count().catch(() => 0)) > 0) {
          await buttons
            .first()
            .click({ timeout: 2000 })
            .then(() => {
              clicked = true;
            })
            .catch(() => undefined);
        }
      }
    }
    // Cookie banners are often plain regions, not dialogs.
    const banner = page.getByRole("button", { name: /^(accept all( cookies)?|got it|ok|accept)$/i });
    if ((await banner.count().catch(() => 0)) > 0) {
      await banner
        .first()
        .click({ timeout: 2000 })
        .then(() => {
          clicked = true;
        })
        .catch(() => undefined);
    }
    if (!clicked) break;
    await sleep(500);
  }
}

/** Scrolls the full page so lazy content mounts, waits for images, then returns to the top. */
async function loadLazyContent(page: Page, viewportHeight: number) {
  for (let step = 0; step < 80; step++) {
    const done = await page.evaluate(`(() => {
      const y = ${step} * ${Math.round(viewportHeight * 0.8)};
      window.scrollTo(0, y);
      return y + window.innerHeight >= document.documentElement.scrollHeight;
    })()`);
    await sleep(250);
    if (done) break;
  }
  await sleep(500);
  await page
    .evaluate(
      `Promise.all([...document.images].filter((i) => !i.complete).slice(0, 150).map((i) => new Promise((r) => { i.addEventListener('load', r); i.addEventListener('error', r); setTimeout(r, 5000); })))`,
    )
    .catch(() => undefined);
  await page.evaluate("window.scrollTo(0, 0)");
  await sleep(800);
}

async function preparePage(page: Page, side: Side, url: string, def: PageDef, state: StateName, opts: Options) {
  const label = side === "airbnb" ? "Airbnb" : "localhost";
  log(`\n[${label}] opening ${url}`);
  await page.bringToFront();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await waitForCaptcha(page, label);
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => log(`   (network never fully idle on ${label}, continuing)`));
  await closePopups(page);
  await waitForCaptcha(page, label);
  await loadLazyContent(page, opts.height);
  await closePopups(page);
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);

  if (state === "scrolled") {
    await page.evaluate(`window.scrollTo(0, ${def.scrolledY})`);
    await sleep(600);
  } else {
    await page.evaluate("window.scrollTo(0, 0)");
    await sleep(1200);
  }

  const mobile = opts.width < 744;
  if (state === "where-open" || state === "who-open") {
    if (mobile) {
      const pill = page.getByRole("button", { name: /Start your search/i }).first();
      await pill.click({ timeout: 10_000 }).catch(() => undefined);
      await sleep(600);
      const step = state === "where-open" ? "Where" : "Who";
      await page.getByRole("button", { name: step, exact: true }).click({ timeout: 5000 }).catch(() => undefined);
    } else if (side === "airbnb") {
      const bar = page.getByTestId("big-search");
      const label = state === "where-open" ? "Where" : "Who";
      await bar.getByText(label, { exact: true }).first().click({ timeout: 10_000 });
    } else {
      const bar = page.locator("[data-guest-search]").filter({ has: page.getByText("Where", { exact: true }) }).first();
      const label = state === "where-open" ? "Where" : "Who";
      await bar.getByText(label, { exact: true }).first().click({ timeout: 10_000 });
    }
    await sleep(mobile ? 900 : 1200);
  }

  // Park the mouse on the scrollbar so no hover state leaks into the measurement.
  await page.mouse.move(opts.width - 6, opts.height - 6);
  await sleep(300);
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function ensureOursIsUp(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!response.ok && response.status >= 500) throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    throw new Error(`Cannot reach ${url} (${(error as Error).message}). Start the app first: npm run dev`);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const def = PAGES[opts.page];
  if (!def) throw new Error(`Unknown page "${opts.page}". Available: ${Object.keys(PAGES).join(", ")}`);
  if (!def.states.includes(opts.state)) throw new Error(`Unknown state "${opts.state}" for page ${def.id}. Available: ${def.states.join(", ")}`);

  const airbnbUrl = opts.airbnbUrl ?? def.airbnbUrl;
  const oursUrl = opts.oursUrl ?? def.oursUrl;
  const viewport = opts.width < 744 ? "mobile" : "desktop";
  const inViewport = (t: { viewports?: string[] }) => !t.viewports || t.viewports.includes(viewport);
  const layoutTargets = def.elements.filter((t) => t.states.includes(opts.state)).filter(inViewport);
  const targets = layoutTargets.filter((t) => !opts.only || opts.only.includes(t.id));
  const layoutIds = new Set(layoutTargets.map((t) => t.id));
  const gaps = def.gaps.filter((g) => g.states.includes(opts.state)).filter(inViewport).filter((g) => layoutIds.has(g.from) && layoutIds.has(g.to));
  if (targets.length === 0) throw new Error("No elements selected.");

  const base = `${def.id}-${opts.state}-${opts.width}`;
  fs.mkdirSync(opts.out, { recursive: true });

  log(`Visual audit  page=${def.id} state=${opts.state} width=${opts.width} height=${opts.height}  (${targets.length} elements)`);
  await ensureOursIsUp(oursUrl);

  const profileDir = path.resolve(__dirname, ".profile");
  let context: BrowserContext | undefined;
  const results: Record<Side, { elements: Measurements; gaps: ReturnType<typeof measureGaps> }> = {
    airbnb: { elements: {}, gaps: {} },
    ours: { elements: {}, gaps: {} },
  };
  const screenshots: AuditMeta["screenshots"] = {};

  try {
    context = await chromium.launchPersistentContext(profileDir, {
      channel: "chrome",
      headless: opts.headless,
      viewport: { width: opts.width, height: opts.height },
      deviceScaleFactor: 1,
      locale: "en-IN",
      timezoneId: "Asia/Kolkata",
      ignoreDefaultArgs: ["--enable-automation"],
      args: ["--disable-blink-features=AutomationControlled", "--no-default-browser-check"],
    });

    for (const side of ["airbnb", "ours"] as const) {
      const page = side === "airbnb" ? (context.pages()[0] ?? (await context.newPage())) : await context.newPage();
      await page.setViewportSize({ width: opts.width, height: opts.height });
      await preparePage(page, side, side === "airbnb" ? airbnbUrl : oursUrl, def, opts.state, opts);

      log(`[${side}] measuring`);
      results[side].elements = await measureAll(page, side, targets, opts.state, opts.verbose ? log : (line) => !line.includes(" ok ") && log(line));
      if (opts.verbose) {
        for (const [id, m] of Object.entries(results[side].elements)) {
          if (m.rect) log(`    ${id}: ${m.tag} ${m.rect.x},${m.rect.y} ${m.rect.width}×${m.rect.height} "${m.text ?? ""}"`);
        }
      }
      results[side].gaps = measureGaps(gaps, results[side].elements, opts.state);

      if (opts.screenshots) {
        const file = `${base}-${side}.png`;
        await page
          .screenshot({ path: path.join(opts.out, file), fullPage: opts.state === "default" })
          .then(() => {
            screenshots[side] = file;
          })
          .catch((error) => log(`   screenshot failed for ${side}: ${(error as Error).message.split("\n")[0]}`));
      }
    }
  } finally {
    await context?.close();
  }

  const meta: AuditMeta = {
    page: def.id,
    state: opts.state,
    width: opts.width,
    height: opts.height,
    airbnbUrl,
    oursUrl,
    generatedAt: new Date().toISOString(),
    screenshots,
  };
  const report = buildReport(meta, targets, gaps, results.airbnb, results.ours);

  const mdPath = path.join(opts.out, `${base}.md`);
  const jsonPath = path.join(opts.out, `${base}.json`);
  fs.writeFileSync(mdPath, renderMarkdown(report), "utf8");
  fs.writeFileSync(jsonPath, JSON.stringify({ report, raw: results }, null, 2), "utf8");

  log(renderConsoleSummary(report));
  log("");
  log(`Report:      ${mdPath}`);
  log(`JSON:        ${jsonPath}`);
  if (screenshots.airbnb || screenshots.ours) log(`Screenshots: ${opts.out}`);
}

main().catch((error) => {
  console.error(`\nvisual-audit failed: ${(error as Error).message}`);
  process.exit(1);
});
