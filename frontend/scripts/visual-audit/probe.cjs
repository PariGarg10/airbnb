// Ad-hoc probe of OUR page: node scripts/visual-audit/probe.cjs <width> "<js expression returning JSON>"
const { chromium } = require("@playwright/test");
(async () => {
  const [width = "1440", expr] = process.argv.slice(2);
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const out = await page.evaluate(expr);
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
