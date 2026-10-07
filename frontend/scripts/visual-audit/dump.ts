/**
 * Prints the raw measurements of an audit run side by side (rect + the most useful styles).
 *
 *   npx tsx scripts/visual-audit/dump.ts home-default-1440 [id-substring ...]
 */
import fs from "node:fs";
import path from "node:path";

const [base, ...filters] = process.argv.slice(2);
const file = path.resolve(__dirname, "..", "..", "..", "design-refs", "audit", `${base}.json`);
const data = JSON.parse(fs.readFileSync(file, "utf8")) as {
  raw: Record<"airbnb" | "ours", { elements: Record<string, { status: string; rect?: { x: number; y: number; width: number; height: number }; styles?: Record<string, string>; tag?: string; text?: string }>; gaps: Record<string, { value: number | null }> }>;
};

const KEYS = ["font-size", "font-weight", "line-height", "letter-spacing", "color", "background-color", "border", "border-radius", "box-shadow", "padding", "margin", "gap", "transition", "opacity", "transform"];
const fmt = (m?: { status: string; rect?: { x: number; y: number; width: number; height: number }; styles?: Record<string, string>; tag?: string; text?: string }) => {
  if (!m || m.status !== "found" || !m.rect) return "ABSENT";
  const r = m.rect;
  const s = m.styles ?? {};
  const extras = KEYS.map((k) => `${k}=${(s[k] ?? "").slice(0, 70)}`).filter((x) => !/=(none|normal|0px|rgba\(0, 0, 0, 0\)|1|)$/.test(x));
  return `${m.tag} @${r.x},${r.y} ${r.width}x${r.height} "${(m.text ?? "").slice(0, 24)}"\n      ${extras.join(" | ")}`;
};

const ids = Object.keys(data.raw.airbnb.elements).filter((id) => filters.length === 0 || filters.some((f) => id.includes(f)));
for (const id of ids) {
  console.log(`\n## ${id}`);
  console.log(`  A ${fmt(data.raw.airbnb.elements[id])}`);
  console.log(`  O ${fmt(data.raw.ours.elements[id])}`);
}
