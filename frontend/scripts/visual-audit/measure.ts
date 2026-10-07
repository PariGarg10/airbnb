/**
 * Measurement: bounding boxes + computed styles for every target, plus distances between targets.
 */
import type { Locator, Page } from "@playwright/test";
import type { ElementTarget, GapTarget, Side, StateName } from "./targets";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Measured {
  /** `found` = a visible box was measured; `absent` = no match / nothing visible. */
  status: "found" | "absent";
  matches: number;
  tag?: string;
  /** Short text snippet, for debugging only. Never compared. */
  text?: string;
  /** Document coordinates (viewport rect + scroll offset). */
  rect?: Rect;
  styles?: Record<string, string>;
  note?: string;
}

export type Measurements = Record<string, Measured>;

export interface GapMeasured {
  value: number | null;
}

/** Computed-style properties collected for every element (kebab-case CSS names). */
export const STYLE_PROPS = [
  "display",
  "gap",
  "padding",
  "margin",
  "border",
  "border-radius",
  "box-shadow",
  "background-color",
  "background-image",
  "color",
  "opacity",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "text-transform",
  "transition",
  "transform",
  "cursor",
  "object-fit",
  "aspect-ratio",
] as const;

/** Properties that only make sense for text-bearing elements. */
export const TEXT_PROPS = new Set(["font-size", "font-weight", "line-height", "letter-spacing", "text-transform"]);

/**
 * In-page collector, kept as a plain JS string on purpose: `tsx`/esbuild injects `__name(...)` helpers
 * into serialised functions which do not exist in the page context.
 */
const COLLECT_BODY = `
  const out = [];
  for (const el of els.slice(0, cfg.max)) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const styles = {};
    for (const p of cfg.props) {
      if (p === 'gap') {
        const rg = cs.getPropertyValue('row-gap'), cg = cs.getPropertyValue('column-gap');
        styles[p] = rg === cg ? rg : rg + ' ' + cg;
      } else if (p === 'border') {
        const sides = ['top', 'right', 'bottom', 'left'].map((s) => {
          const w = cs.getPropertyValue('border-' + s + '-width');
          const st = cs.getPropertyValue('border-' + s + '-style');
          const c = cs.getPropertyValue('border-' + s + '-color');
          return st === 'none' || w === '0px' ? 'none' : w + ' ' + st + ' ' + c;
        });
        styles[p] = sides.every((s) => s === sides[0]) ? sides[0] : sides.join(' | ');
      } else {
        styles[p] = cs.getPropertyValue(p);
      }
    }
    let opacity = 1;
    let hidden = cs.display === 'none' || cs.visibility === 'hidden';
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const c = getComputedStyle(n);
      opacity *= parseFloat(c.opacity);
      if (c.display === 'none') hidden = true;
    }
    out.push({
      rect: { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height },
      styles,
      effectiveOpacity: opacity,
      hidden,
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 60),
    });
  }
  return out;
`;

// Built at runtime with `new Function` so Playwright serialises a plain function (no bundler helpers).
const collect = new Function("els", "cfg", COLLECT_BODY) as unknown as (els: Element[], cfg: { props: string[]; max: number }) => RawCandidate[];

interface RawCandidate {
  rect: Rect;
  styles: Record<string, string>;
  effectiveOpacity: number;
  hidden: boolean;
  tag: string;
  text: string;
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Picks the first candidate that is really visible: not display:none/visibility:hidden, effective opacity > 0,
 * and not an empty or 1x1 "sr-only" box. Thin bars (2-3px underlines) are fine.
 */
function pick(candidates: RawCandidate[]): RawCandidate | undefined {
  const visible = (c: RawCandidate) =>
    !c.hidden && c.effectiveOpacity > 0.01 && c.rect.width > 0 && c.rect.height > 0 && !(c.rect.width <= 1 && c.rect.height <= 1);
  return candidates.find(visible);
}

export async function measureLocator(locator: Locator): Promise<Measured> {
  let matches = 0;
  try {
    matches = await locator.count();
  } catch (error) {
    return { status: "absent", matches: 0, note: `locator error: ${(error as Error).message.split("\n")[0]}` };
  }
  if (matches === 0) return { status: "absent", matches: 0, note: "no match" };

  let candidates: RawCandidate[] = [];
  try {
    candidates = await locator.evaluateAll(collect, { props: [...STYLE_PROPS], max: 25 });
  } catch (error) {
    return { status: "absent", matches, note: `evaluate error: ${(error as Error).message.split("\n")[0]}` };
  }
  const chosen = pick(candidates);
  if (!chosen) return { status: "absent", matches, note: `${matches} match(es) but none visible` };

  return {
    status: "found",
    matches,
    tag: chosen.tag,
    text: chosen.text,
    rect: {
      x: round(chosen.rect.x),
      y: round(chosen.rect.y),
      width: round(chosen.rect.width),
      height: round(chosen.rect.height),
    },
    styles: chosen.styles,
  };
}

export async function measureAll(
  page: Page,
  side: Side,
  targets: ElementTarget[],
  state: StateName,
  log: (line: string) => void,
): Promise<Measurements> {
  const result: Measurements = {};
  for (const target of targets) {
    if (!target.states.includes(state)) continue;
    const locator = target[side](page);
    result[target.id] = await measureLocator(locator);
    const m = result[target.id];
    log(`  ${side === "airbnb" ? "A" : "O"} ${m.status === "found" ? "ok    " : "ABSENT"} ${target.id}${m.status === "found" ? "" : `  (${m.note ?? ""})`}`);
  }
  return result;
}

export function measureGap(gap: GapTarget, set: Measurements): number | null {
  const a = set[gap.from];
  const b = set[gap.to];
  if (!a?.rect || !b?.rect) return null;
  const f = a.rect;
  const t = b.rect;
  switch (gap.mode) {
    case "v-after":
      return round(t.y - (f.y + f.height));
    case "h-after":
      return round(t.x - (f.x + f.width));
    case "left-offset":
      return round(t.x - f.x);
    case "top-offset":
      return round(t.y - f.y);
    case "center-dy":
      return round(t.y + t.height / 2 - (f.y + f.height / 2));
    default:
      return null;
  }
}

export function measureGaps(gaps: GapTarget[], set: Measurements, state: StateName): Record<string, GapMeasured> {
  const out: Record<string, GapMeasured> = {};
  for (const gap of gaps) {
    if (!gap.states.includes(state)) continue;
    out[gap.id] = { value: measureGap(gap, set) };
  }
  return out;
}
