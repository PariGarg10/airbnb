// Quick query: node scripts/visual-audit/q.cjs <report.json> <name-regex> [prop,prop]
const fs = require("fs");
const [file, re, props = "x,y,width,height"] = process.argv.slice(2);
const j = JSON.parse(fs.readFileSync(file, "utf8"));
const want = props.split(",");
for (const e of j.report.elements) {
  if (!new RegExp(re).test(e.name)) continue;
  console.log(e.name + ": " + e.rows.filter((r) => want.includes(r.property)).map((r) => `${r.property} ${r.airbnb} | ${r.ours} [${r.status}]`).join("  "));
}
