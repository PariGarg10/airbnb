/**
 * Diff: compares Airbnb vs ours, property by property.
 *
 * Rules
 *  - font-family and text content are never compared.
 *  - Lengths: <= 2px is equal. Typography is tighter (see TOLERANCE) because a 2px font-size delta is
 *    a visible difference, not noise. Change the table below if you disagree.
 *  - Colours are exact (alpha within 0.01 to absorb float rounding).
 *  - Element missing on Airbnb  -> "n/a" (content differs, not counted as a mismatch).
 *  - Element missing on ours    -> counted as a mismatch.
 */
import { TEXT_PROPS, STYLE_PROPS, type GapMeasured, type Measured, type Measurements } from "./measure";
import type { ElementTarget, GapTarget } from "./targets";

export type Status = "match" | "diff" | "explained" | "n/a (not on Airbnb)" | "missing on ours" | "absent on both";

export interface PropRow {
  property: string;
  airbnb: string;
  ours: string;
  status: Status;
  delta?: string;
  /** Set when status is "explained": why this difference is accepted (content, font, or non-visual DOM structure). */
  reason?: string;
}

export interface ElementReport {
  id: string;
  name: string;
  group: string;
  presence: "both" | "airbnb-only" | "ours-only" | "none";
  compared: number;
  mismatches: number;
  rows: PropRow[];
}

export interface GapReport {
  id: string;
  name: string;
  airbnb: number | null;
  ours: number | null;
  status: Status;
  delta?: string;
  reason?: string;
}

export interface AuditMeta {
  page: string;
  state: string;
  width: number;
  height: number;
  airbnbUrl: string;
  oursUrl: string;
  generatedAt: string;
  screenshots: { airbnb?: string; ours?: string };
}

export interface DiffReport {
  meta: AuditMeta;
  elements: ElementReport[];
  gaps: GapReport[];
  totals: { elements: number; compared: number; mismatches: number; missingOnOurs: number; notOnAirbnb: number; gapMismatches: number; explained: number };
}

/* ------------------------------------------------------------------ */
/* Tolerances                                                          */
/* ------------------------------------------------------------------ */

const DEFAULT_PX_TOLERANCE = 2;
const TOLERANCE_PX: Record<string, number> = {
  "font-size": 0.5,
  "line-height": 1,
  "letter-spacing": 0.1,
};
const TOLERANCE_UNITLESS = 0.01;
const TOLERANCE_SECONDS = 0.05;
const TOLERANCE_PERCENT = 1;
const TOLERANCE_DEG = 1;
const TOLERANCE_ALPHA = 0.01;

/* ------------------------------------------------------------------ */
/* Value comparison                                                    */
/* ------------------------------------------------------------------ */

/** Splits on whitespace/commas that are not inside parentheses. */
function tokenize(value: string): string[] {
  const tokens: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of value.trim()) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (depth === 0 && (ch === " " || ch === ",")) {
      if (current) tokens.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

/** Parses rgb()/rgba() and `color(srgb r g b / a)` (Chrome returns the latter for some sites) into 0-255 channels + alpha. */
function parseColor(token: string): [number, number, number, number] | null {
  const rgb = /^rgba?\(([^)]+)\)$/.exec(token);
  if (rgb) {
    const parts = rgb[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.some(Number.isNaN)) return null;
    return [parts[0], parts[1], parts[2], parts[3] ?? 1];
  }
  const srgb = /^color\(srgb\s+([^)]+)\)$/.exec(token);
  if (srgb) {
    const parts = srgb[1].split(/[\s/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.some(Number.isNaN)) return null;
    return [Math.round(parts[0] * 255), Math.round(parts[1] * 255), Math.round(parts[2] * 255), parts[3] ?? 1];
  }
  return null;
}

function parseNumber(token: string): { n: number; unit: string } | null {
  const m = /^(-?\d*\.?\d+)(px|s|ms|%|deg|em|rem)?$/.exec(token);
  if (!m) return null;
  let n = Number(m[1]);
  let unit = m[2] ?? "";
  if (unit === "ms") {
    n /= 1000;
    unit = "s";
  }
  return { n, unit };
}

function numberTolerance(prop: string, unit: string): number {
  switch (unit) {
    case "px":
    case "em":
    case "rem":
      return TOLERANCE_PX[prop] ?? DEFAULT_PX_TOLERANCE;
    case "s":
      return TOLERANCE_SECONDS;
    case "%":
      return TOLERANCE_PERCENT;
    case "deg":
      return TOLERANCE_DEG;
    default:
      return TOLERANCE_UNITLESS;
  }
}

function formatDelta(n: number, unit: string): string {
  const rounded = Math.round(n * 100) / 100;
  return `${rounded > 0 ? "+" : ""}${rounded}${unit}`;
}

interface Comparison {
  equal: boolean;
  delta?: string;
}

function compareToken(prop: string, a: string, b: string, deltas: string[]): boolean {
  if (a === b) return true;

  const ca = parseColor(a);
  const cb = parseColor(b);
  if (ca && cb) {
    return ca[0] === cb[0] && ca[1] === cb[1] && ca[2] === cb[2] && Math.abs(ca[3] - cb[3]) <= TOLERANCE_ALPHA;
  }

  const na = parseNumber(a);
  const nb = parseNumber(b);
  if (na && nb && na.unit === nb.unit) {
    const diff = nb.n - na.n;
    if (Math.abs(diff) <= numberTolerance(prop, na.unit) + 1e-9) return true;
    deltas.push(formatDelta(diff, na.unit));
    return false;
  }

  // matrix(a, b, c, d, tx, ty): scale/skew exact-ish, translation in px.
  const ma = /^matrix\(([^)]+)\)$/.exec(a);
  const mb = /^matrix\(([^)]+)\)$/.exec(b);
  if (ma && mb) {
    const va = ma[1].split(",").map(Number);
    const vb = mb[1].split(",").map(Number);
    if (va.length === 6 && vb.length === 6) {
      let ok = true;
      va.forEach((value, index) => {
        const tolerance = index < 4 ? TOLERANCE_UNITLESS : DEFAULT_PX_TOLERANCE;
        const diff = vb[index] - value;
        if (Math.abs(diff) > tolerance) {
          ok = false;
          deltas.push(`${["a", "b", "c", "d", "tx", "ty"][index]} ${formatDelta(diff, "")}`);
        }
      });
      return ok;
    }
  }

  return false;
}

/**
 * Shadows: Airbnb reports `color(srgb 0 0 0 / .1)`, ours `rgba(0, 0, 0, .1)`, and Tailwind prepends two empty
 * ring layers (`rgba(0,0,0,0) 0 0 0 0`). None of that is visible, so normalise before comparing.
 */
function normalizeShadow(value: string): string {
  const withRgba = value.replace(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+) \/ ([\d.]+)\)/g, (_m, r, g, bl, al) => {
    const c = (n: string) => Math.round(parseFloat(n) * 255);
    return `rgba(${c(r)}, ${c(g)}, ${c(bl)}, ${parseFloat(al)})`;
  });
  const layers: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of withRgba) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      layers.push(current.trim());
      current = "";
    } else current += ch;
  }
  if (current.trim()) layers.push(current.trim());
  return layers.filter((layer) => layer !== "rgba(0, 0, 0, 0) 0px 0px 0px 0px" && layer !== "none").join(", ") || "none";
}

export function compareValues(prop: string, airbnb: string, ours: string): Comparison {
  let a = (airbnb ?? "").trim();
  let b = (ours ?? "").trim();
  if (prop === "box-shadow") {
    a = normalizeShadow(a);
    b = normalizeShadow(b);
  }
  if (a === b) return { equal: true };

  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.length !== tb.length) return { equal: false };

  const deltas: string[] = [];
  let equal = true;
  for (let i = 0; i < ta.length; i++) {
    if (!compareToken(prop, ta[i], tb[i], deltas)) equal = false;
  }
  return { equal, delta: equal || deltas.length === 0 ? undefined : deltas.slice(0, 4).join(", ") };
}

/* ------------------------------------------------------------------ */
/* Report building                                                     */
/* ------------------------------------------------------------------ */

/** A difference listed in `target.explain` (or in the global structural list) is reported as "explained", not "diff". */
function makeRow(target: ElementTarget, property: string, airbnb: string, ours: string, cmp: Comparison): PropRow {
  if (cmp.equal) return { property, airbnb, ours, status: "match" };
  const reason = target.explain?.[property] ?? STRUCTURAL_PROPS[property];
  if (reason) return { property, airbnb, ours, status: "explained", delta: cmp.delta, reason };
  return { property, airbnb, ours, status: "diff", delta: cmp.delta };
}

/**
 * Computed properties that describe how a box is built, not how it looks (a flex item reports `display:flex`, an
 * inline-flex reports `inline-flex`; `gap` only matters if the children's positions differ, which the geometry rows
 * already catch). A difference is "explained" instead of "diff"; positions/sizes of every child are still compared.
 */
const STRUCTURAL_PROPS: Record<string, string> = {
  display: "DOM structure (box type); not visual, children geometry is compared separately",
  gap: "DOM structure; children geometry is compared separately",
  cursor: "non-visual (pointer vs default)",
  "aspect-ratio": "DOM structure; resulting width/height are compared",
  "object-fit": "image rendering mode; box size compared",
};

function geometryRows(a: Measured, o: Measured, target: ElementTarget): PropRow[] {
  const rows: PropRow[] = [];
  // Only the top-of-page region is compared by absolute position; everywhere else position depends on
  // page content, so only size is compared (distances between elements are covered by the gap table).
  const keys: ("x" | "y" | "width" | "height")[] = target.positional ? ["x", "y", "width", "height"] : ["width", "height"];
  for (const key of keys) {
    if (target.ignore?.includes(key)) continue;
    if (target.only && !target.only.includes(key)) continue;
    const av = a.rect![key];
    const ov = o.rect![key];
    const cmp = compareValues(key, `${av}px`, `${ov}px`);
    rows.push(makeRow(target, key, `${av}px`, `${ov}px`, cmp));
  }
  return rows;
}

function styleRows(a: Measured, o: Measured, target: ElementTarget): PropRow[] {
  const rows: PropRow[] = [];
  const isImage = a.tag === "img" || o.tag === "img";
  for (const prop of STYLE_PROPS) {
    if (!target.text && TEXT_PROPS.has(prop)) continue;
    if (prop === "object-fit" && !isImage) continue;
    if (target.ignore?.includes(prop)) continue;
    if (target.only && !target.only.includes(prop)) continue;
    const av = a.styles?.[prop] ?? "";
    const ov = o.styles?.[prop] ?? "";
    const cmp = compareValues(prop, av, ov);
    rows.push(makeRow(target, prop, av, ov, cmp));
  }
  return rows;
}

function buildElementReport(target: ElementTarget, a: Measured | undefined, o: Measured | undefined): ElementReport {
  const base = { id: target.id, name: target.name, group: target.group };
  const aFound = a?.status === "found";
  const oFound = o?.status === "found";

  if (!aFound && !oFound) {
    return {
      ...base,
      presence: "none",
      compared: 0,
      mismatches: 0,
      rows: [{ property: "(element)", airbnb: "absent", ours: "absent", status: "absent on both" }],
    };
  }
  if (!aFound) {
    return {
      ...base,
      presence: "ours-only",
      compared: 0,
      mismatches: 0,
      rows: [{ property: "(element)", airbnb: "absent", ours: "present", status: "n/a (not on Airbnb)" }],
    };
  }
  if (!oFound) {
    return {
      ...base,
      presence: "airbnb-only",
      compared: 0,
      mismatches: 1,
      rows: [{ property: "(element)", airbnb: "present", ours: "absent", status: "missing on ours" }],
    };
  }

  const rows = [...geometryRows(a!, o!, target), ...styleRows(a!, o!, target)];
  return {
    ...base,
    presence: "both",
    compared: rows.length,
    mismatches: rows.filter((row) => row.status === "diff").length,
    rows,
  };
}

function buildGapReport(gap: GapTarget, a?: GapMeasured, o?: GapMeasured): GapReport {
  const av = a?.value ?? null;
  const ov = o?.value ?? null;
  if (av === null && ov === null) return { id: gap.id, name: gap.name, airbnb: av, ours: ov, status: "absent on both" };
  if (av === null) return { id: gap.id, name: gap.name, airbnb: av, ours: ov, status: "n/a (not on Airbnb)" };
  if (ov === null) return { id: gap.id, name: gap.name, airbnb: av, ours: ov, status: "missing on ours" };
  const cmp = compareValues("gap-distance", `${av}px`, `${ov}px`);
  if (!cmp.equal && gap.explain) {
    return { id: gap.id, name: gap.name, airbnb: av, ours: ov, status: "explained", delta: cmp.delta, reason: gap.explain };
  }
  return { id: gap.id, name: gap.name, airbnb: av, ours: ov, status: cmp.equal ? "match" : "diff", delta: cmp.delta };
}

export function buildReport(
  meta: AuditMeta,
  targets: ElementTarget[],
  gaps: GapTarget[],
  airbnb: { elements: Measurements; gaps: Record<string, GapMeasured> },
  ours: { elements: Measurements; gaps: Record<string, GapMeasured> },
): DiffReport {
  const elements = targets
    .filter((target) => target.id in airbnb.elements || target.id in ours.elements)
    .map((target) => buildElementReport(target, airbnb.elements[target.id], ours.elements[target.id]));

  const gapReports = gaps
    .filter((gap) => gap.id in airbnb.gaps || gap.id in ours.gaps)
    .map((gap) => buildGapReport(gap, airbnb.gaps[gap.id], ours.gaps[gap.id]));

  const totals = {
    elements: elements.length,
    compared: elements.reduce((sum, e) => sum + e.compared, 0),
    mismatches: elements.reduce((sum, e) => sum + e.mismatches, 0),
    missingOnOurs: elements.filter((e) => e.presence === "airbnb-only").length,
    notOnAirbnb: elements.filter((e) => e.presence === "ours-only").length,
    gapMismatches: gapReports.filter((g) => g.status === "diff" || g.status === "missing on ours").length,
    explained:
      elements.reduce((sum, e) => sum + e.rows.filter((row) => row.status === "explained").length, 0) +
      gapReports.filter((g) => g.status === "explained").length,
  };
  return { meta, elements, gaps: gapReports, totals };
}

/* ------------------------------------------------------------------ */
/* Markdown                                                            */
/* ------------------------------------------------------------------ */

const cell = (value: string | number | null | undefined, max = 110) => {
  const text = value === null || value === undefined || value === "" ? "—" : String(value);
  const clipped = text.length > max ? `${text.slice(0, max - 1)}…` : text;
  return clipped.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
};

const icon = (status: Status) =>
  status === "match" ? "✅ match" : status === "diff" ? "❌ diff" : status === "explained" ? "🟡 explained" : status === "missing on ours" ? "❌ missing on ours" : status === "absent on both" ? "⚪ absent on both" : "⚪ n/a (not on Airbnb)";

export function renderMarkdown(report: DiffReport): string {
  const { meta, totals } = report;
  const lines: string[] = [];
  lines.push(`# Visual audit: ${meta.page} / ${meta.state} / ${meta.width}px`);
  lines.push("");
  lines.push(`- Generated: ${meta.generatedAt}`);
  lines.push(`- Airbnb: ${meta.airbnbUrl}`);
  lines.push(`- Ours: ${meta.oursUrl}`);
  lines.push(`- Viewport: ${meta.width} × ${meta.height}`);
  if (meta.screenshots.airbnb) lines.push(`- Screenshots: [airbnb](${meta.screenshots.airbnb}) · [ours](${meta.screenshots.ours ?? ""})`);
  lines.push(
    `- Tolerance: lengths ≤ ${DEFAULT_PX_TOLERANCE}px (font-size ≤ ${TOLERANCE_PX["font-size"]}px, line-height ≤ ${TOLERANCE_PX["line-height"]}px, letter-spacing ≤ ${TOLERANCE_PX["letter-spacing"]}px); colours exact; font-family and text ignored`,
  );
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(
    `**${totals.mismatches} property mismatches** across ${totals.elements} elements (${totals.compared} properties compared), **${totals.gapMismatches} distance mismatches**, ${totals.explained} differences explained (content / font / DOM structure), ` +
      `${totals.missingOnOurs} elements missing on ours, ${totals.notOnAirbnb} elements not present on Airbnb.`,
  );
  lines.push("");
  lines.push("| element | group | presence | compared | mismatches |");
  lines.push("| --- | --- | --- | ---: | ---: |");
  for (const e of report.elements) {
    const presence = e.presence === "both" ? "both" : e.presence === "airbnb-only" ? "❌ missing on ours" : e.presence === "ours-only" ? "⚪ not on Airbnb" : "⚪ absent on both";
    lines.push(`| ${cell(e.name)} | ${cell(e.group)} | ${presence} | ${e.compared} | ${e.mismatches === 0 ? "0" : `**${e.mismatches}**`} |`);
  }
  lines.push("");

  lines.push("## Mismatches");
  lines.push("");
  lines.push("| element | property | airbnb | ours | status |");
  lines.push("| --- | --- | --- | --- | --- |");
  let any = false;
  for (const e of report.elements) {
    for (const row of e.rows) {
      if (row.status === "match") continue;
      any = true;
      lines.push(`| ${cell(e.name)} | ${cell(row.property)} | ${cell(row.airbnb)} | ${cell(row.ours)} | ${icon(row.status)}${row.delta ? ` (Δ ${row.delta})` : ""}${row.reason ? `: ${cell(row.reason, 140)}` : ""} |`);
    }
  }
  if (!any) lines.push("| — | — | — | — | no mismatches |");
  lines.push("");

  lines.push("## Distances between neighbouring elements");
  lines.push("");
  lines.push("| distance | airbnb | ours | status |");
  lines.push("| --- | ---: | ---: | --- |");
  for (const g of report.gaps) {
    lines.push(`| ${cell(g.name)} | ${g.airbnb === null ? "—" : `${g.airbnb}px`} | ${g.ours === null ? "—" : `${g.ours}px`} | ${icon(g.status)}${g.delta ? ` (Δ ${g.delta})` : ""} |`);
  }
  lines.push("");

  lines.push("## Matching properties");
  lines.push("");
  for (const e of report.elements) {
    const ok = e.rows.filter((row) => row.status === "match").map((row) => row.property);
    if (ok.length === 0) continue;
    lines.push(`- **${cell(e.name)}**: ${ok.join(", ")}`);
  }
  lines.push("");
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* Console summary                                                     */
/* ------------------------------------------------------------------ */

export function renderConsoleSummary(report: DiffReport): string {
  const widest = Math.max(...report.elements.map((e) => e.name.length), 10);
  const out: string[] = [];
  out.push("");
  out.push(`Summary: ${report.meta.page}/${report.meta.state}/${report.meta.width}`);
  out.push(`${"element".padEnd(widest)}  mismatches  compared  presence`);
  for (const e of report.elements) {
    const presence = e.presence === "both" ? "" : e.presence === "airbnb-only" ? "MISSING ON OURS" : e.presence === "ours-only" ? "not on Airbnb" : "absent on both";
    out.push(`${e.name.padEnd(widest)}  ${String(e.mismatches).padStart(10)}  ${String(e.compared).padStart(8)}  ${presence}`);
  }
  const bad = report.gaps.filter((g) => g.status === "diff" || g.status === "missing on ours");
  out.push("");
  out.push(
    `Totals: ${report.totals.mismatches} property mismatches over ${report.totals.elements} elements, ${report.totals.gapMismatches}/${report.gaps.length} distance mismatches, ${report.totals.explained} explained, ` +
      `${report.totals.missingOnOurs} missing on ours, ${report.totals.notOnAirbnb} not on Airbnb.`,
  );
  for (const g of bad) out.push(`  distance: ${g.name}: airbnb ${g.airbnb ?? "—"}px vs ours ${g.ours ?? "—"}px ${g.delta ? `(Δ ${g.delta})` : ""}`);
  return out.join("\n");
}
