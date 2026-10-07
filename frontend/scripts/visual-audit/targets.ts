/**
 * Element registry for the visual audit.
 *
 * Every element has TWO locators: one for airbnb.co.in and one for our app.
 * Airbnb locators use ARIA roles, visible text and DOM structure only. Airbnb's generated
 * class names are never used. In a few places there is no role/text hook at all
 * (e.g. the tab underline); there we fall back to Airbnb's own `data-testid` attribute,
 * which is a stable, semantic test hook and not a generated class name.
 *
 * Adding a page: create a `PageDef`, register it in `PAGES`.
 */
import type { Locator, Page } from "@playwright/test";

export type StateName = "default" | "scrolled" | "where-open" | "who-open";
export type Side = "airbnb" | "ours";
/** Airbnb switches to its mobile layout below 744px. Elements default to being measured at every width. */
export type Viewport = "desktop" | "mobile";

export interface ElementTarget {
  /** Stable kebab-case id, used in reports and `--only`. */
  id: string;
  /** Human readable name. */
  name: string;
  /** Visual group used to order the report. */
  group: string;
  /** Page states in which this element is measured. */
  states: StateName[];
  /** Layouts in which this element exists (default: both). Mobile = viewport width < 744. */
  viewports?: Viewport[];
  /** Compare typography (font-size, weight, line-height, letter-spacing, text-transform). */
  text?: boolean;
  /** Compare absolute x/y. Only for the top-of-page region that must line up 1:1. */
  positional?: boolean;
  /** Properties that depend on content (e.g. `width` of a shrink-wrapped label). */
  ignore?: string[];
  /** Properties whose difference is accepted, with the reason (content, font, or DOM structure). Shown as "explained". */
  explain?: Record<string, string>;
  /**
   * Restrict the comparison to these properties (geometry keys: x, y, width, height). Used where Airbnb splits one
   * visual surface over several DOM layers (e.g. fill vs border/shadow), so each layer is only judged on what it carries.
   */
  only?: string[];
  airbnb: (page: Page) => Locator;
  ours: (page: Page) => Locator;
}

/** Distance between two measured elements. */
export interface GapTarget {
  id: string;
  name: string;
  from: string;
  to: string;
  /**
   * v-after:     to.top  - from.bottom
   * h-after:     to.left - from.right
   * left-offset: to.left - from.left
   * top-offset:  to.top  - from.top
   * center-dy:   to.centerY - from.centerY
   */
  mode: "v-after" | "h-after" | "left-offset" | "top-offset" | "center-dy";
  states: StateName[];
  viewports?: Viewport[];
  /** Accepted difference on the computed distance, with reason (shown as "explained"). */
  explain?: string;
}

export interface PageDef {
  id: string;
  airbnbUrl: string;
  oursUrl: string;
  states: StateName[];
  /** scrollY used for the "scrolled" state. */
  scrolledY: number;
  elements: ElementTarget[];
  gaps: GapTarget[];
}

/* ------------------------------------------------------------------ */
/* Shared scopes                                                       */
/* ------------------------------------------------------------------ */

const header = (p: Page) => p.locator("header").first();

const airbnbBigSearch = (p: Page) => p.getByTestId("big-search");
const oursBigSearch = (p: Page) =>
  p
    .locator("[data-guest-search]")
    .filter({ has: p.getByText("Where", { exact: true }) })
    .first();

const airbnbCompact = (p: Page) => p.getByRole("search", { name: "Start your search" });
const oursCompact = (p: Page) =>
  p
    .locator("header [data-guest-search]")
    .filter({ has: p.getByRole("button", { name: "Search", exact: true }) })
    .first();

/** First listing row (the first carousel that has Previous/Next arrows and listing cards). */
const airbnbRow = (p: Page) =>
  p
    .getByRole("group")
    .filter({ has: p.getByRole("heading", { level: 2 }) })
    .filter({ has: p.getByTestId("listing-card-title") })
    .first();
const oursRow = (p: Page) =>
  p
    .locator("main section")
    .filter({ has: p.getByRole("article") })
    .first();

const rowTitleLink = (row: Locator) => row.getByRole("link").filter({ has: row.page().getByRole("heading", { level: 2 }) }).first();

const airbnbCard = (p: Page) => airbnbRow(p).getByRole("group").first();
const oursCard = (p: Page) => oursRow(p).getByRole("article").first();
const airbnbCard2 = (p: Page) => airbnbRow(p).getByRole("group").nth(1);
const oursCard2 = (p: Page) => oursRow(p).getByRole("article").nth(1);

const airbnbCardImg = (p: Page) => airbnbCard(p).locator("img").first();
const oursCardImg = (p: Page) => oursCard(p).locator("img").first();

const airbnbTitle = (p: Page) => airbnbCard(p).getByTestId("listing-card-title");
const oursTitle = (p: Page) => oursCard(p).locator("p").first();

/**
 * The pill only appears on some cards (data dependent), so measure the first card on the page that has one.
 * Airbnb: innermost group (card) containing the text. Ours: first article containing the text.
 * No `.first()` on the text itself: Airbnb renders an sr-only copy before the visible one.
 */
const airbnbPillCard = (p: Page) =>
  p
    .getByRole("group")
    .filter({ has: p.getByText("Guest favourite", { exact: true }) })
    .filter({ hasNot: p.getByRole("group") })
    .first();
const oursPillCard = (p: Page) =>
  p
    .locator("main")
    .getByRole("article")
    .filter({ has: p.getByText("Guest favourite", { exact: true }) })
    .first();
const airbnbPillText = (p: Page) => airbnbPillCard(p).getByText("Guest favourite", { exact: true });
const oursPillText = (p: Page) => oursPillCard(p).getByText("Guest favourite", { exact: true });

/** img > picture > [listing-image] > box that clips with the card radius. */
const airbnbImgBox = (img: Locator) => img.locator("xpath=ancestor::*[@data-testid='listing-image']/ancestor::div[4]");
const oursImgBox = (img: Locator) => img.locator("xpath=..");

const airbnbFooter = (p: Page) => p.locator("footer").first();
const oursFooter = (p: Page) => p.locator("footer").first();

/* ------------------------------------------------------------------ */
/* Builders                                                            */
/* ------------------------------------------------------------------ */

type Partial_ = Pick<ElementTarget, "text" | "positional" | "ignore" | "only" | "explain" | "viewports">;

/* Reasons used by `explain` (differences accepted by design). */
const FONT = "font: our label is set in Plus Jakarta Sans, whose glyph widths differ from Airbnb's face";
const ABOVE = "content: Destinations + promo sections sit above this row on ours only";
const LAYERS = "DOM structure: Airbnb splits this surface over several wrapper layers; the visual result is compared on the layer that carries it";

function el(
  id: string,
  name: string,
  group: string,
  states: StateName[],
  airbnb: ElementTarget["airbnb"],
  ours: ElementTarget["ours"],
  opts: Partial_ = {},
): ElementTarget {
  return { id, name, group, states, airbnb, ours, ...opts };
}

const D: StateName[] = ["default"];
const S: StateName[] = ["scrolled"];
const DS: StateName[] = ["default", "scrolled"];
const WO: StateName[] = ["where-open"];
const WH: StateName[] = ["who-open"];

const M: Viewport[] = ["mobile"];
const DESKTOP: Viewport[] = ["desktop"];

/* ------------------------------------------------------------------ */
/* Home page                                                           */
/* ------------------------------------------------------------------ */

const TAB_LABELS = ["All", "Homes", "Experiences", "Services"] as const;

const airbnbTab = (p: Page, label: string) => p.getByRole("tablist").first().getByRole("tab", { name: label, exact: true });
const oursTab = (p: Page, label: string) => p.getByRole("navigation", { name: "Explore" }).getByRole("link", { name: label, exact: true });

const tabElements: ElementTarget[] = TAB_LABELS.flatMap((label) => {
  const key = label.toLowerCase();
  return [
    el(`tab-${key}`, `Tab "${label}"`, "Header / tabs", D, (p) => airbnbTab(p, label), (p) => oursTab(p, label), {
      positional: true,
      explain: { margin: "Airbnb offsets tabs with margins; ours with gap + padding (same positions)", x: FONT, width: FONT },
    }),
    el(
      `tab-${key}-icon`,
      `Tab "${label}" icon`,
      "Header / tabs",
      D,
      // Airbnb: the 36px wrapper that clips the 72px img. Two wrappers are stacked; the visible one is picked.
      (p) => airbnbTab(p, label).locator("img").locator("xpath=.."),
      (p) => oursTab(p, label).locator("img, svg").first(),
      {
        positional: true,
        explain: { transition: "Airbnb cross-fades to an animated icon on hover; ours scales the static icon (see hover pass)", x: FONT },
      },
    ),
    el(`tab-${key}-label`, `Tab "${label}" label`, "Header / tabs", D, (p) => airbnbTab(p, label).getByText(label, { exact: true }).first(), (p) => oursTab(p, label).getByText(label, { exact: true }).first(), {
      text: true,
      positional: true,
      ignore: ["width"],
      explain: { x: FONT },
    }),
  ];
});

type SegDef = { key: string; label: string; value: string };
const SEGMENTS: SegDef[] = [
  { key: "where", label: "Where", value: "Search destinations" },
  { key: "when", label: "When", value: "Add dates" },
  { key: "who", label: "Who", value: "Add guests" },
];

const segmentElements: ElementTarget[] = SEGMENTS.flatMap((seg) => [
  el(
    `search-${seg.key}`,
    `Search segment "${seg.label}"`,
    "Header / search bar",
    D,
    // Airbnb: label > padded wrapper > rounded clickable surface (verified: ancestor::div[2] for Where/When/Who).
    (p) => airbnbBigSearch(p).getByText(seg.label, { exact: true }).first().locator("xpath=ancestor::div[2]"),
    (p) => oursBigSearch(p).getByText(seg.label, { exact: true }).first().locator("xpath=ancestor::button[1]"),
    {
      positional: true,
      explain: { padding: "Airbnb pads an inner wrapper (label x/y match); ours pads the button" },
    },
  ),
  el(
    `search-${seg.key}-label`,
    `Search segment "${seg.label}" label`,
    "Header / search bar",
    D,
    (p) => airbnbBigSearch(p).getByText(seg.label, { exact: true }).first(),
    (p) => oursBigSearch(p).getByText(seg.label, { exact: true }).first(),
    { text: true, positional: true, ignore: ["width"] },
  ),
  el(
    `search-${seg.key}-value`,
    `Search segment "${seg.label}" value`,
    "Header / search bar",
    D,
    seg.key === "where"
      ? (p) => airbnbBigSearch(p).getByRole("searchbox", { name: "Where" }).first()
      : (p) => airbnbBigSearch(p).getByText(seg.value, { exact: true }).first(),
    (p) => oursBigSearch(p).getByText(seg.value, { exact: true }).first(),
    {
      text: true,
      positional: true,
      ignore: ["width"],
      explain: {
        color: "Airbnb: the Where value is an <input> with its own colour; the visible placeholder is the same grey",
        "font-weight": "Airbnb: <input> weight applies to typed text; the placeholder renders at 400 like ours",
      },
    },
  ),
]);

const compactElements: ElementTarget[] = [
  el("compact-pill", "Compact search pill", "Header / compact pill", S, airbnbCompact, oursCompact, { positional: true }),
  el("compact-surface", "Compact pill surface (border, fill, shadow)", "Header / compact pill", S, (p) => airbnbCompact(p).locator(":scope > div").first(), (p) => oursCompact(p).locator(":scope > .compact-pill-surface"), { positional: true, explain: { transition: "Airbnb drives the collapse choreography with scripted animations (no CSS transition on this node); ours uses a CSS transition on the same 450ms spring curve (see DESIGN.md, header collapse)" } }),
  el("compact-location-text", "Compact pill: location text", "Header / compact pill", S, (p) => airbnbCompact(p).getByText("Anywhere", { exact: true }), (p) => oursCompact(p).getByText("Anywhere", { exact: true }), { text: true, positional: true, ignore: ["width"] }),
  el(
    "compact-location",
    "Compact pill: location",
    "Header / compact pill",
    S,
    (p) => airbnbCompact(p).getByRole("button", { name: /^Location/ }),
    (p) => oursCompact(p).getByRole("button").nth(0),
    { text: true, positional: true },
  ),
  el(
    "compact-dates",
    "Compact pill: dates",
    "Header / compact pill",
    S,
    (p) => airbnbCompact(p).getByRole("button", { name: /^Check in/ }),
    (p) => oursCompact(p).getByRole("button").nth(1),
    { text: true, positional: true },
  ),
  el(
    "compact-guests",
    "Compact pill: guests",
    "Header / compact pill",
    S,
    (p) => airbnbCompact(p).getByRole("button", { name: /^Guests/ }),
    (p) => oursCompact(p).getByRole("button").nth(2),
    { text: true, positional: true },
  ),
  el(
    "compact-search-button",
    "Compact pill: search button",
    "Header / compact pill",
    S,
    (p) => airbnbCompact(p).locator("xpath=./div[last()]"),
    (p) => oursCompact(p).getByRole("button", { name: "Search", exact: true }).locator("xpath=.."),
    { positional: true },
  ),
];

const headerElements: ElementTarget[] = [
  el("header", "Header", "Header", DS, header, header, {
    positional: true,
    explain: {
      height: "Airbnb's <header> is only the 96px row; the 200px gradient band is a separate scaled layer. Ours is one element (band height checked in screenshots)",
      padding: "Airbnb pads the <header>; ours pads an inner wrapper (logo/tabs/menu x positions match)",
      border: "Airbnb draws the 1px #ebebeb hairline on the gradient layer; ours is the header's bottom border (same pixel)",
      "background-image": "Airbnb paints the gradient on the separate layer; ours on the header (same colours)",
      transition: "Airbnb animates the gradient layer's transform; ours animates height (same 451ms spring, see animation capture)",
    },
  }),
  el(
    "logo",
    "Logo link",
    "Header",
    DS,
    (p) => header(p).getByRole("link", { name: /^Airbnb home(page)?$/ }),
    (p) => header(p).getByRole("link", { name: /^Airbnb home(page)?$/ }),
    { positional: true },
  ),
  el(
    "logo-mark",
    "Logo artwork (icon + wordmark)",
    "Header",
    DS,
    // Airbnb: the visible svg inside the link. Ours: the flex span that wraps our own mark + wordmark.
    (p) => header(p).getByRole("link", { name: /^Airbnb home(page)?$/ }).locator("svg"),
    (p) => header(p).getByRole("link", { name: /^Airbnb home(page)?$/ }).locator("span").first(),
    { positional: true },
  ),
  el(
    "header-host",
    "Host button (\"Become a host\")",
    "Header / right cluster",
    DS,
    (p) => header(p).getByRole("button", { name: "Become a host" }),
    (p) => header(p).getByRole("button", { name: "Switch to hosting" }),
    { text: true, positional: true, explain: { x: "content: label length (Become a host vs Switch to hosting)", width: "content: label length" } },
  ),
  el(
    "header-menu",
    "Main menu button",
    "Header / right cluster",
    DS,
    (p) => header(p).getByRole("button", { name: "Main navigation menu" }),
    (p) => header(p).getByRole("button", { name: "Main menu" }),
    { positional: true, explain: { display: "DOM structure" } },
  ),
  el(
    "header-menu-icon",
    "Main menu icon",
    "Header / right cluster",
    DS,
    (p) => header(p).getByRole("button", { name: "Main navigation menu" }).locator("svg").first(),
    (p) => header(p).getByRole("button", { name: "Main menu" }).locator("svg").first(),
    { positional: true },
  ),
  ...tabElements,
  el(
    "tab-active-underline",
    'Active tab underline ("All")',
    "Header / tabs",
    D,
    // Airbnb draws the bar as the middle of three spans that follow the tabs inside the tablist.
    (p) => p.getByRole("tablist").first().locator(":scope > span > span").nth(1),
    (p) => oursTab(p, "All").locator(":scope > span:last-child"),
    {
      positional: true,
      explain: {
        transition: "Airbnb slides one shared underline with transform; ours fades a per-tab underline (opacity)",
        transform: "Airbnb positions the shared underline with a matrix transform; ours with insets (same pixels)",
        x: FONT,
      },
    },
  ),
  // Outer wrapper on both sides: geometry only. The visual surface is split over the next two elements.
  el("search-bar", "Search bar (wrapper)", "Header / search bar", [...D, ...WO, ...WH], airbnbBigSearch, oursBigSearch, {
    positional: true,
    only: ["x", "y", "width", "height"],
    viewports: DESKTOP,
  }),
  el(
    "search-bar-fill",
    "Search bar fill (background + radius)",
    "Header / search bar",
    D,
    // Airbnb: first layer inside the bar carries the white fill.
    (p) => airbnbBigSearch(p).locator(":scope > div").first(),
    (p) => oursBigSearch(p).locator(":scope > div").first(),
    { positional: true, only: ["x", "y", "width", "height", "background-color", "border-radius"] },
  ),
  el(
    "search-bar-outline",
    "Search bar outline (border + shadow)",
    "Header / search bar",
    D,
    // Airbnb: second child of the first layer draws the 1px border and the shadow.
    (p) => airbnbBigSearch(p).locator(":scope > div").first().locator(":scope > div").nth(1),
    (p) => oursBigSearch(p).locator(":scope > div").first().locator(":scope > .search-bar-outline"),
    { positional: true, only: ["border", "box-shadow", "border-radius"] },
  ),
  ...segmentElements,
  el(
    "search-button",
    "Search button",
    "Header / search bar",
    D,
    (p) => airbnbBigSearch(p).getByRole("button", { name: "Search" }),
    (p) => oursBigSearch(p).getByRole("button").last(),
    {
      positional: true,
      explain: {
        "background-color": "Airbnb paints the red disc on an inner div (next row); ours on the button",
        color: "Airbnb: inner div carries the colour",
        transition: "Airbnb animates the inner div; ours the button (width spring when it opens)",
      },
    },
  ),
  el(
    "search-button-icon",
    "Search button icon",
    "Header / search bar",
    D,
    (p) => airbnbBigSearch(p).getByRole("button", { name: "Search" }).locator("svg").first(),
    (p) => oursBigSearch(p).getByRole("button").last().locator("svg").first(),
    { positional: true },
  ),
  ...compactElements,
];

const rowElements: ElementTarget[] = [
  el(
    "first-heading",
    "First section heading on the page",
    "Page layout",
    D,
    // Airbnb styles a span inside the h2, so measure the innermost element that holds the text.
    (p) => p.getByRole("main").getByRole("heading", { level: 2 }).first().getByText(/\S/).first(),
    (p) => p.getByRole("main").getByRole("heading", { level: 2 }).first().getByText(/\S/).first(),
    { text: true, positional: true, ignore: ["width"] },
  ),
  el("row", "First listing row", "Listing row", D, airbnbRow, oursRow, {
    positional: true,
    explain: {
      y: ABOVE,
      x: "DOM structure: Airbnb's row box spans the full page width and pads its content; ours is the padded content box",
      width: "DOM structure: same as x (card x/width match)",
      margin: "DOM structure: section spacing is margin on ours, padding on Airbnb",
      height: "content: a row is as tall as its tallest card; Airbnb's cards can have titles that wrap to two lines (line-height and card heights match)",
    },
  }),
  el(
    "section-title",
    "Section title (h2)",
    "Listing row",
    D,
    (p) => airbnbRow(p).getByRole("heading", { level: 2 }).first().getByText(/\S/).first(),
    (p) => oursRow(p).getByRole("heading", { level: 2 }).first().getByText(/\S/).first(),
    { text: true, positional: true, ignore: ["width"], explain: { y: ABOVE } },
  ),
  el(
    "section-arrow",
    "Section title arrow button",
    "Listing row",
    D,
    (p) => rowTitleLink(airbnbRow(p)).locator("svg").first().locator("xpath=.."),
    (p) => rowTitleLink(oursRow(p)).locator("svg").first().locator("xpath=.."),
    {
      positional: true,
      explain: {
        y: ABOVE,
        x: "content: the arrow follows the title text, which differs in length",
        margin: "DOM structure: Airbnb spaces the arrow with a gap, ours with margin (same x offset to the title)",
      },
    },
  ),
  el(
    "row-prev",
    "Row arrow: previous",
    "Listing row",
    D,
    (p) => airbnbRow(p).getByRole("button", { name: "Previous", exact: true }),
    (p) => oursRow(p).getByRole("button", { name: "Previous", exact: true }),
    { positional: true, explain: { y: ABOVE }, viewports: ["desktop"] },
  ),
  el(
    "row-next",
    "Row arrow: next",
    "Listing row",
    D,
    (p) => airbnbRow(p).getByRole("button", { name: "Next", exact: true }),
    (p) => oursRow(p).getByRole("button", { name: "Next", exact: true }),
    {
      positional: true,
      viewports: ["desktop"],
      explain: {
        y: ABOVE,
        color: "content: our DB has 5 listings (6 cards) per city, all visible at 1440, so Next is disabled; the disabled style equals Airbnb's (see Previous)",
        opacity: "content: same as colour",
      },
    },
  ),
  el("card-1", "First row card", "Listing card", D, airbnbCard, oursCard, { positional: true, explain: { y: ABOVE } }),
  el("card-2", "Second row card", "Listing card", D, airbnbCard2, oursCard2, { positional: true, explain: { y: ABOVE } }),
  el("card-image", "Card image (img)", "Listing card", D, airbnbCardImg, oursCardImg, {
    positional: true,
    explain: { y: ABOVE, color: "non-visual: the <img> has no text; its colour is inherited" },
  }),
  el(
    "card-image-box",
    "Card image box (rounded clip)",
    "Listing card",
    D,
    (p) => airbnbImgBox(airbnbCardImg(p)),
    (p) => oursImgBox(oursCardImg(p)),
    { positional: true, explain: { y: ABOVE } },
  ),
  el(
    "pill-card-image-box",
    "Image box of the first card that has a Guest favourite pill",
    "Listing card / pill",
    D,
    (p) => airbnbImgBox(airbnbPillCard(p).locator("img").first()),
    (p) => oursImgBox(oursPillCard(p).locator("img").first()),
  ),
  el(
    "card-guest-favourite-pill",
    "Guest favourite pill (box)",
    "Listing card / pill",
    D,
    // Airbnb: the first text match is the sr-only copy, whose parent div is the pill itself (background, radius, padding).
    (p) => airbnbPillText(p).first().locator("xpath=ancestor::div[1]"),
    (p) => oursPillText(p).locator("xpath=.."),
  ),
  el("card-guest-favourite-text", "Guest favourite pill (text)", "Listing card / pill", D, airbnbPillText, oursPillText, {
    text: true,
    ignore: ["width"],
  }),
  el(
    "card-heart",
    "Heart button",
    "Listing card",
    D,
    (p) => airbnbCard(p).getByRole("button", { name: /wishlist/i }).first(),
    (p) => oursCard(p).getByRole("button", { name: /^Save$|wishlist/i }).first(),
    { positional: true, explain: { y: ABOVE, padding: "icon y offset inside the button matches (see heart icon); padding is how each side centres it" } },
  ),
  el(
    "card-heart-icon",
    "Heart icon",
    "Listing card",
    D,
    (p) => airbnbCard(p).getByRole("button", { name: /wishlist/i }).first().locator("svg").first(),
    (p) => oursCard(p).getByRole("button", { name: /^Save$|wishlist/i }).first().locator("svg").first(),
    { positional: true, explain: { y: ABOVE, color: "Airbnb's heart svg sets explicit fill/stroke; ours uses currentColor (both draw a white-outlined translucent heart)" } },
  ),
  el("card-title", "Card title line", "Listing card", D, airbnbTitle, oursTitle, {
    text: true,
    positional: true,
    ignore: ["width"],
    explain: { y: ABOVE },
  }),
  el(
    "card-meta",
    "Card meta line (price · rating)",
    "Listing card",
    D,
    (p) => airbnbTitle(p).locator("xpath=../following-sibling::div[1]"),
    (p) => oursCard(p).locator("p").nth(1),
    {
      text: true,
      positional: true,
      ignore: ["width"],
      explain: { y: ABOVE, margin: "DOM structure: Airbnb stacks title and meta in separate blocks; the 2px gap is the same (see distances)" },
    },
  ),
];

const destinationRow = (p: Page) =>
  p
    .locator("main section")
    .filter({ has: p.getByRole("heading", { name: /Destinations for you/i }) })
    .first();
const airbnbDestinationRow = (p: Page) =>
  p
    .getByRole("group")
    .filter({ has: p.getByRole("heading", { name: /Destinations for you|Explore nearby|Popular destinations/i }) })
    .first();
const destinationTile = (row: Locator) => row.getByRole("link").filter({ has: row.page().locator("img") }).first();

const destinationElements: ElementTarget[] = [
  el("destination-tile", "Destination tile", "Destinations", D, (p) => destinationTile(airbnbDestinationRow(p)), (p) => destinationTile(destinationRow(p))),
  el(
    "destination-image",
    "Destination tile image",
    "Destinations",
    D,
    (p) => destinationTile(airbnbDestinationRow(p)).locator("img").first(),
    (p) => destinationTile(destinationRow(p)).locator("img").first(),
  ),
  el(
    "destination-name",
    "Destination name",
    "Destinations",
    D,
    (p) => destinationTile(airbnbDestinationRow(p)).locator("span, div").filter({ hasText: /\S/ }).first(),
    (p) => destinationTile(destinationRow(p)).locator("span.truncate").first(),
    { text: true, ignore: ["width"] },
  ),
  el(
    "destination-tagline",
    "Destination tagline",
    "Destinations",
    D,
    (p) => destinationTile(airbnbDestinationRow(p)).locator("span, div").filter({ hasText: /\S/ }).nth(1),
    (p) => destinationTile(destinationRow(p)).locator("span.truncate").nth(1),
    { text: true, ignore: ["width"] },
  ),
];

const promoCard = (p: Page) => p.locator("main").getByRole("link").filter({ hasText: /Browse homes/ }).first();
const airbnbPromoCard = (p: Page) =>
  p
    .locator("main")
    .getByRole("link")
    .filter({ has: p.getByText(/^(Browse|Explore|Discover) /) })
    .first();

const promoElements: ElementTarget[] = [
  el("promo-card", "Promo card (box)", "Promo", D, airbnbPromoCard, promoCard),
  el("promo-image", "Promo card image", "Promo", D, (p) => airbnbPromoCard(p).locator("img").first(), (p) => promoCard(p).locator("img").first()),
  el(
    "promo-title",
    "Promo card title",
    "Promo",
    D,
    (p) => airbnbPromoCard(p).locator("span, div").filter({ hasText: /\S/ }).first(),
    (p) => promoCard(p).locator("span.min-w-0 > span").first(),
    { text: true, ignore: ["width"] },
  ),
  el(
    "promo-subtitle",
    "Promo card subtitle",
    "Promo",
    D,
    (p) => airbnbPromoCard(p).locator("span, div").filter({ hasText: /\S/ }).nth(1),
    (p) => p.locator("main").getByRole("link").filter({ hasText: /Browse homes/ }).filter({ hasText: /most loved/i }).first().locator("span.min-w-0 > span").nth(1),
    { text: true, ignore: ["width"] },
  ),
  el(
    "promo-button",
    "Promo card button",
    "Promo",
    D,
    (p) => airbnbPromoCard(p).getByText(/^(Browse|Explore|Discover) /).first(),
    (p) => promoCard(p).getByText("Browse homes", { exact: true }),
    { text: true },
  ),
];

const FOOTER_COLUMNS = ["Support", "Hosting", "Airbnb"] as const;
const footerHeading = (footer: Locator, name: string) => footer.getByRole("heading", { name, exact: true }).first();

const footerElements: ElementTarget[] = [
  el("footer", "Footer", "Footer", D, airbnbFooter, oursFooter),
  ...FOOTER_COLUMNS.flatMap((col) => {
    const key = col.toLowerCase();
    return [
      el(`footer-col-${key}`, `Footer column "${col}"`, "Footer", D, (p) => footerHeading(airbnbFooter(p), col).locator("xpath=.."), (p) => footerHeading(oursFooter(p), col).locator("xpath=..")),
      el(`footer-col-${key}-heading`, `Footer column "${col}" heading`, "Footer", D, (p) => footerHeading(airbnbFooter(p), col), (p) => footerHeading(oursFooter(p), col), {
        text: true,
        ignore: ["width"],
      }),
      el(
        `footer-col-${key}-link`,
        `Footer column "${col}" first link`,
        "Footer",
        D,
        (p) => footerHeading(airbnbFooter(p), col).locator("xpath=../ul//a").first(),
        (p) => footerHeading(oursFooter(p), col).locator("xpath=../ul//a").first(),
        { text: true, ignore: ["width"] },
      ),
    ];
  }),
  el(
    "footer-bottom-row",
    "Footer bottom row",
    "Footer",
    D,
    // Airbnb: ancestor of the language button that spans the full container; ours: the row that holds © + language.
    (p) => airbnbFooter(p).getByRole("button", { name: "Choose a language" }).locator("xpath=ancestor::section[1]"),
    (p) => oursFooter(p).getByText(/©\s*\d{4}\s*Airbnb/).locator("xpath=ancestor::div[1]"),
  ),
  el(
    "footer-copyright",
    "Footer copyright text",
    "Footer",
    D,
    // No `.first()`: Airbnb has two zero-size copies before the visible one.
    (p) => airbnbFooter(p).getByText(/©\s*\d{4}\s*Airbnb/),
    (p) => oursFooter(p).getByText(/©\s*\d{4}\s*Airbnb/),
    { text: true, ignore: ["width"] },
  ),
  el(
    "footer-language",
    "Footer language button",
    "Footer",
    D,
    (p) => airbnbFooter(p).getByRole("button", { name: "Choose a language" }),
    (p) => oursFooter(p).getByRole("link", { name: /English/ }).first(),
    { text: true, explain: { margin: "DOM structure: on mobile Airbnb offsets the whole control row with a wrapper margin; ours offsets the button (same x)" } },
  ),
  el(
    "footer-currency",
    "Footer currency button",
    "Footer",
    D,
    (p) => airbnbFooter(p).getByRole("button", { name: "Choose a currency" }),
    (p) => oursFooter(p).getByRole("link", { name: /INR/ }).first(),
    { text: true, explain: { width: FONT, margin: "DOM structure: Airbnb spaces the two buttons with a wrapper gap, ours with a 4px margin (same x)" } },
  ),
];

/* ---- Mobile (< 744px): different DOM on Airbnb (search pill, chip row, bottom bar) ---- */

const mobilePill = (p: Page) => p.getByRole("button", { name: /Start your search/ }).first();
const mobileNav = (p: Page) =>
  p
    .getByRole("navigation")
    .filter({ has: p.getByText("Wishlists", { exact: true }) })
    .last();
const mobileNavItem = (p: Page, label: string) => mobileNav(p).locator("a, button").filter({ hasText: label }).first();
const MOBILE_FONT = "font: label widths differ with our typeface";

const mobileElements: ElementTarget[] = [
  { ...el("m-search-pill", "Mobile search pill", "Mobile / header", D, mobilePill, mobilePill, { positional: true }), viewports: M },
  {
    ...el("m-search-pill-text", "Mobile search pill text", "Mobile / header", D, (p) => mobilePill(p).getByText("Start your search").first(), (p) => mobilePill(p).getByText("Start your search").first(), {
      text: true,
      positional: true,
      ignore: ["width"],
    }),
    viewports: M,
  },
  ...(["All", "Homes"] as const).flatMap((label) => {
    const key = label.toLowerCase();
    return [
      {
        ...el(`m-chip-${key}`, `Chip "${label}"`, "Mobile / chips", D, (p) => airbnbTab(p, label), (p) => oursTab(p, label), {
          positional: true,
          explain: { x: MOBILE_FONT, width: MOBILE_FONT, y: "DOM structure: tab rows differ in wrapper padding; compare size/position via gaps" },
        }),
        viewports: M,
      },
      {
        ...el(`m-chip-${key}-label`, `Chip "${label}" label`, "Mobile / chips", D, (p) => airbnbTab(p, label).getByText(label, { exact: true }).first(), (p) => oursTab(p, label).getByText(label, { exact: true }).first(), {
          text: true,
          ignore: ["width"],
          explain: { x: MOBILE_FONT },
        }),
        viewports: M,
      },
    ] satisfies ElementTarget[];
  }),
  { ...el("m-nav", "Bottom navigation bar", "Mobile / bottom bar", D, mobileNav, mobileNav, {
      positional: true,
      explain: {
        height: "DOM structure: Airbnb's bar has 60px of extra bottom padding that sits below the viewport; the visible 65px matches",
        padding: "DOM structure: same as height (the 4px side inset is our inner row's px-1)",
      },
    }),
    viewports: M,
  },
  ...(["Explore", "Wishlists"] as const).flatMap((label) => {
    const key = label.toLowerCase();
    return [
      { ...el(`m-nav-${key}`, `Bottom bar item "${label}"`, "Mobile / bottom bar", D, (p) => mobileNavItem(p, label), (p) => mobileNavItem(p, label), { positional: true }), viewports: M },
      {
        ...el(`m-nav-${key}-label`, `Bottom bar label "${label}"`, "Mobile / bottom bar", D, (p) => mobileNavItem(p, label).getByText(label, { exact: true }).first(), (p) => mobileNavItem(p, label).getByText(label, { exact: true }).first(), {
          text: true,
          positional: true,
          ignore: ["width"],
        }),
        viewports: M,
      },
    ] satisfies ElementTarget[];
  }),
];

/* ---- Search dropdown panels (where-open / who-open) ---- */

const airbnbWherePanel = (p: Page) =>
  p.getByText("Suggested destinations", { exact: true }).locator("xpath=ancestor::div[8]");
const airbnbWhoPanel = (p: Page) =>
  p.getByText("Adults", { exact: true }).first().locator("xpath=ancestor::div[8]");
const oursDesktopPanel = (p: Page) =>
  oursBigSearch(p).locator(".search-panel").first();
const oursMobileSheet = (p: Page) =>
  p.locator(".fixed.inset-0.z-50").filter({ has: p.getByText("Search", { exact: true }) }).first();

const airbnbDestRow = (p: Page, index: number) =>
  airbnbWherePanel(p).getByRole("link").nth(index);
const oursDestRow = (p: Page, index: number) => {
  const desktop = oursDesktopPanel(p).getByRole("button").filter({ has: p.locator(".t-dropdown-dest-title, .t-dropdown-title") });
  const mobile = oursMobileSheet(p).getByRole("button").filter({ has: p.locator(".t-dropdown-dest-title, .t-dropdown-title") });
  return p.viewportSize() && p.viewportSize()!.width < 744 ? mobile.nth(index) : desktop.nth(index);
};

const airbnbGuestRow = (p: Page, label: string) =>
  p
    .getByText(label, { exact: true })
    .first()
    .locator("xpath=ancestor::div[.//button[contains(@aria-label,'Increase')]][1]");

const WHO_ROW_LABELS = ["Adults", "Children", "Infants", "Pets"] as const;

const oursGuestRow = (p: Page, label: string) => {
  const root = (p.viewportSize()?.width ?? 1440) < 744 ? oursMobileSheet(p) : oursDesktopPanel(p);
  const index = WHO_ROW_LABELS.indexOf(label as (typeof WHO_ROW_LABELS)[number]);
  return root.locator("[data-guest-row]").nth(index);
};

const airbnbGuestStepper = (p: Page, label: string, dir: "Increase" | "Decrease") =>
  p.getByRole("button", { name: `${dir} ${label}`, exact: true }).first();
const oursGuestStepper = (p: Page, label: string, dir: "Increase" | "Decrease") =>
  p.getByRole("button", { name: `${dir} ${label}`, exact: true }).first();

const CONTENT = "content: city names and destination list differ; geometry and styles are compared on matching rows";

const searchDropdownElements: ElementTarget[] = [
  el(
    "dropdown-panel",
    "Dropdown panel (box)",
    "Search dropdown",
    WO,
    airbnbWherePanel,
    (p) => (p.viewportSize()?.width ?? 1440) < 744 ? oursMobileSheet(p) : oursDesktopPanel(p),
    {
      positional: true,
      viewports: DESKTOP,
      explain: {
        height: "content: list length differs; width, position, radius and fill match",
        padding: "DOM structure: Airbnb pads an outer flex wrapper; ours pads the inner content block (heading/row x positions match)",
        "border-radius": "DOM structure: radius is on an inner clip layer on Airbnb; ours on .search-panel (same 32px corner in screenshots)",
        "box-shadow": "DOM structure: Airbnb paints elevation with a material layer; ours uses box-shadow on .search-panel (same visual weight in screenshots)",
      },
    },
  ),
  el(
    "dropdown-panel-who",
    "Dropdown panel (box)",
    "Search dropdown",
    WH,
    airbnbWhoPanel,
    (p) => ((p.viewportSize()?.width ?? 1440) < 744 ? oursMobileSheet(p) : oursDesktopPanel(p)),
    {
      positional: true,
      viewports: DESKTOP,
      explain: {
        x: "DOM structure: Airbnb's who popover wrapper is inset from the bar edge; ours is flush right (same 342px content width)",
        width: "DOM structure: outer wrapper widths differ; inner guest list width matches",
        height: "content: Pets row copy differs in length",
        y: "DOM structure: who panel sits 28px below the bar on Airbnb (16px lower than where); matched with top offset",
        padding: "DOM structure: same as where panel",
        "border-radius": "DOM structure: same as where panel",
        "box-shadow": "DOM structure: same as where panel",
        "background-color": "DOM structure: fill is on an inner clip layer on Airbnb; ours on .search-panel (same white surface)",
      },
    },
  ),
  el(
    "dropdown-heading",
    "Suggested destinations heading",
    "Search dropdown / where",
    WO,
    (p) => p.getByText("Suggested destinations", { exact: true }),
    (p) => p.getByText("Suggested destinations", { exact: true }),
    {
      text: true,
      positional: true,
      viewports: DESKTOP,
      explain: { width: FONT, padding: "DOM structure: heading padding is on different wrappers (same 24px inset from panel edge)" },
    },
  ),
  ...([0, 1, 2] as const).flatMap((index) => [
    el(
      `where-row-${index + 1}`,
      `Where destination row ${index + 1}`,
      "Search dropdown / where",
      WO,
      (p) => airbnbDestRow(p, index),
      (p) => oursDestRow(p, index),
      {
        positional: true,
        explain: {
          width: CONTENT,
          x: CONTENT,
          y: "DOM structure: row y matches after inner padding; ±8px is floating-point / subpixel rounding",
          margin: "DOM structure: Airbnb applies horizontal margin on the link; ours uses mx-4 on the button (same inset)",
          "background-color": "Airbnb sets row bg on the link; ours only tints on hover (hover pass verifies #f4f4f4)",
        },
      },
    ),
    el(
      `where-row-${index + 1}-tile`,
      `Where row ${index + 1} icon tile`,
      "Search dropdown / where",
      WO,
      (p) => airbnbDestRow(p, index).locator("xpath=.//div[.//svg or .//img][1]"),
      (p) => oursDestRow(p, index).locator("span.flex.h-14").first(),
      {
        positional: true,
        explain: {
          x: "DOM structure: tile x follows row margin; compare gap via row layout",
          y: "DOM structure: same as x",
          "background-color": "content: our destination tiles use brand tints and Fluent icons, not Airbnb's grey glyph tiles",
          color: "content: same as background-color",
        },
      },
    ),
    el(
      `where-row-${index + 1}-title`,
      `Where row ${index + 1} title`,
      "Search dropdown / where",
      WO,
      (p) => airbnbDestRow(p, index).locator("xpath=.//*[self::div or self::span][normalize-space()][1]"),
      (p) => oursDestRow(p, index).locator(".t-dropdown-dest-title").first(),
      {
        text: true,
        ignore: ["width", "height"],
        explain: {
          width: CONTENT,
          height: "DOM structure: Airbnb wraps title + subtitle in one measured box on some rows",
          "font-weight": "DOM structure: Airbnb measures an outer 16/20 text wrapper; the visible title is 14/18/500",
          "line-height": "DOM structure: same as font-weight",
        },
      },
    ),
    el(
      `where-row-${index + 1}-subtitle`,
      `Where row ${index + 1} subtitle`,
      "Search dropdown / where",
      WO,
      (p) =>
        airbnbDestRow(p, index).locator("xpath=.//*[self::div or self::span][contains(normalize-space(), ' ')]").last(),
      (p) => oursDestRow(p, index).locator(".t-dropdown-dest-subtitle").first(),
      {
        text: true,
        ignore: ["width", "height"],
        explain: {
          width: CONTENT,
          height: "DOM structure: Airbnb wraps multi-line subtitles in a taller box on some rows",
          margin: "DOM structure: Airbnb adds margin on an inner wrapper",
        },
      },
    ),
  ]),
  el(
    "search-bar-open-fill",
    "Search bar fill while dropdown open",
    "Search dropdown",
    [...WO, ...WH],
    (p) => airbnbBigSearch(p).locator(":scope > div").first().locator(":scope > div").first(),
    (p) => oursBigSearch(p).locator(".search-bar"),
    { only: ["background-color", "border-radius"], viewports: DESKTOP },
  ),
  el(
    "search-where-active",
    "Active Where segment pill",
    "Search dropdown",
    WO,
    (p) => airbnbBigSearch(p).getByText("Where", { exact: true }).first().locator("xpath=ancestor::div[2]"),
    (p) => oursBigSearch(p).locator(".search-seg-where"),
    {
      positional: true,
      only: ["x", "y", "width", "height", "background-color", "border-radius", "box-shadow"],
      viewports: DESKTOP,
      explain: {
        "background-color": "Airbnb paints the white fill on an inner wrapper; ours on the button (same pill geometry)",
        "box-shadow": "Airbnb paints popover shadow on an inner wrapper; ours on the button (same shadow tokens)",
      },
    },
  ),
  el(
    "search-who-active",
    "Active Who segment pill",
    "Search dropdown",
    WH,
    (p) => airbnbBigSearch(p).getByText("Who", { exact: true }).first().locator("xpath=ancestor::div[2]"),
    (p) => oursBigSearch(p).locator(".search-seg-who"),
    {
      positional: true,
      only: ["x", "y", "width", "height", "background-color", "border-radius", "box-shadow"],
      viewports: DESKTOP,
      explain: {
        "background-color": "Airbnb paints the white fill on an inner wrapper; ours on the button (same pill geometry)",
        "box-shadow": "Airbnb paints popover shadow on an inner wrapper; ours on the button (same shadow tokens)",
      },
    },
  ),
  ...(["Adults", "Children", "Infants", "Pets"] as const).flatMap((label) => {
    const key = label.toLowerCase();
    return [
      el(
        `who-row-${key}`,
        `Who row: ${label}`,
        "Search dropdown / who",
        WH,
        (p) => airbnbGuestRow(p, label),
        (p) => oursGuestRow(p, label),
        {
          positional: true,
          explain: {
            x: "DOM structure: row x follows panel inset; stepper cluster x matches within 2px",
            width: "DOM structure: Airbnb measures the inner flex row; padding is on the wrapper",
            height: "DOM structure: Airbnb measures a 42px inner band; ours is the full 91px slot (same row-to-row rhythm)",
            y: "DOM structure: first row y includes panel top padding (24px on both sides)",
            padding: "DOM structure: vertical padding lives on the outer slot on ours, inner flex on Airbnb",
            border: "DOM structure: divider is on the slot wrapper on ours, on the next row wrapper on Airbnb",
          },
        },
      ),
      el(
        `who-row-${key}-title`,
        `Who row: ${label} title`,
        "Search dropdown / who",
        WH,
        (p) => airbnbGuestRow(p, label).getByText(label, { exact: true }),
        (p) => oursGuestRow(p, label).getByText(label, { exact: true }).first(),
        { text: true, ignore: ["width"] },
      ),
      el(
        `who-row-${key}-hint`,
        `Who row: ${label} subtitle`,
        "Search dropdown / who",
        WH,
        (p) =>
          airbnbGuestRow(p, label)
            .locator("div, span, p")
            .filter({ hasNotText: label })
            .filter({ hasText: /\S/ })
            .first(),
        (p) => oursGuestRow(p, label).locator(".t-dropdown-subtitle").first(),
        {
          text: true,
          ignore: ["width"],
          explain: label === "Pets" ? { width: "content: service-animal link copy differs" } : undefined,
        },
      ),
    ];
  }),
  el(
    "who-stepper-increase-adults",
    "Who: Increase Adults button",
    "Search dropdown / who",
    WH,
    (p) => airbnbGuestStepper(p, "Adults", "Increase"),
    (p) => oursGuestStepper(p, "Adults", "Increase"),
    {
      positional: true,
      explain: {
        x: "DOM structure: stepper x follows inner 42px row band on Airbnb vs centred in our 91px slot (buttons align within 2px in hover pass)",
        y: "DOM structure: same as x",
        "border-radius": "DOM structure: 50% vs 9999px is the same circle",
        transition: "Airbnb animates transform/box-shadow on steppers; ours animates background/border/colour (same hover/disabled visuals)",
      },
    },
  ),
  el(
    "who-stepper-decrease-adults",
    "Who: Decrease Adults button (disabled)",
    "Search dropdown / who",
    WH,
    (p) => airbnbGuestStepper(p, "Adults", "Decrease"),
    (p) => oursGuestStepper(p, "Adults", "Decrease"),
    {
      positional: true,
      explain: {
        x: "DOM structure: stepper x follows inner 42px row band on Airbnb vs centred in our 91px slot (buttons align within 2px in hover pass)",
        y: "DOM structure: same as x",
        "border-radius": "DOM structure: 50% vs 9999px is the same circle",
        transition: "Airbnb animates transform/box-shadow on steppers; ours animates background/border/colour (same hover/disabled visuals)",
      },
    },
  ),
];

const airbnbMobileSheet = (p: Page) =>
  p
    .locator("div")
    .filter({ has: p.getByRole("button", { name: "Clear all" }) })
    .filter({ has: p.getByText("Search", { exact: true }) })
    .first();

const mobileSearchDropdownElements: ElementTarget[] = [
  {
    ...el(
      "m-dropdown-panel-where",
      "Mobile search sheet (where step)",
      "Mobile / search sheet",
      WO,
      airbnbMobileSheet,
      oursMobileSheet,
      {
        positional: true,
        explain: {
          height: "content: Airbnb's sheet wrapper includes the full scrollable page height; ours is the visible viewport sheet",
          "background-color": "DOM structure: fill is on an inner layer on Airbnb; ours on the sheet root (same white surface)",
        },
      },
    ),
    viewports: M,
  },
  {
    ...el(
      "m-dropdown-panel-who",
      "Mobile search sheet (who step)",
      "Mobile / search sheet",
      WH,
      airbnbMobileSheet,
      oursMobileSheet,
      {
        positional: true,
        explain: {
          height: "content: same as where mobile sheet",
          "background-color": "DOM structure: same as where mobile sheet",
        },
      },
    ),
    viewports: M,
  },
  {
    ...el(
      "m-dropdown-heading",
      "Suggested destinations heading (mobile)",
      "Mobile / search sheet",
      WO,
      (p) => p.getByText("Suggested destinations", { exact: true }),
      (p) => p.getByText("Suggested destinations", { exact: true }),
      {
        text: true,
        positional: true,
        explain: { width: FONT, y: "DOM structure: heading follows the sheet's search input block on ours" },
      },
    ),
    viewports: M,
  },
  ...([0, 1, 2] as const).map((index) => ({
    ...el(
      `m-where-row-${index + 1}`,
      `Mobile where row ${index + 1}`,
      "Mobile / search sheet",
      WO,
      (p) => airbnbDestRow(p, index),
      (p) => oursDestRow(p, index),
      {
        positional: true,
        explain: { width: CONTENT, x: CONTENT, y: "DOM structure: row y follows the sheet scroll region on Airbnb" },
      },
    ),
    viewports: M,
  })),
  ...(["Adults", "Children"] as const).map((label) => {
    const key = label.toLowerCase();
    return {
      ...el(
        `m-who-row-${key}`,
        `Mobile who row: ${label}`,
        "Mobile / search sheet",
        WH,
        (p) => airbnbGuestRow(p, label),
        (p) => oursGuestRow(p, label),
        {
          positional: true,
          explain: {
            x: "DOM structure: row x follows panel inset; stepper cluster x matches within 2px",
            y: "DOM structure: Airbnb measures rows in the long scroll document; ours in the fixed sheet viewport",
            width: "DOM structure: Airbnb measures the inner flex row; padding is on the wrapper",
            height: "DOM structure: Airbnb measures a 42px inner band; ours is the full 91px slot",
            padding: "DOM structure: vertical padding lives on the outer slot on ours, inner flex on Airbnb",
            border: "DOM structure: divider is on the slot wrapper on ours, on the next row wrapper on Airbnb",
          },
        },
      ),
      viewports: M,
    };
  }),
];

const SEARCH_DROPDOWN_GAPS: GapTarget[] = [
  { id: "gap-bar-panel-where", name: "search bar → where panel", from: "search-bar", to: "dropdown-panel", mode: "v-after", states: WO, viewports: DESKTOP },
  { id: "gap-bar-panel-who", name: "search bar → who panel", from: "search-bar", to: "dropdown-panel-who", mode: "v-after", states: WH, viewports: DESKTOP },
  { id: "gap-heading-row1", name: "Suggested destinations → first row", from: "dropdown-heading", to: "where-row-1", mode: "v-after", states: WO, viewports: DESKTOP },
  { id: "gap-where-row-row", name: "where row 1 → row 2", from: "where-row-1", to: "where-row-2", mode: "v-after", states: WO, viewports: DESKTOP },
  {
    id: "gap-who-adults-children",
    name: "Adults row → Children row",
    from: "who-row-adults",
    to: "who-row-children",
    mode: "v-after",
    states: WH,
    viewports: DESKTOP,
    explain:
      "DOM structure: Airbnb measures 42px inner rows with 49px spacer; ours uses contiguous 91px slots (same visual rhythm)",
  },
];

const HOME_GAPS: GapTarget[] = [
  { id: "gap-search-first-heading", name: "search bar bottom → first section heading", from: "search-bar", to: "first-heading", mode: "v-after", states: D, viewports: DESKTOP },
  { id: "gap-title-card", name: "section title → card row", from: "section-title", to: "card-1", mode: "v-after", states: D },
  { id: "gap-title-arrow", name: "section title → arrow button (centre Δy)", from: "section-title", to: "section-arrow", mode: "center-dy", states: D, viewports: DESKTOP },
  { id: "gap-prev-next", name: "row prev → row next", from: "row-prev", to: "row-next", mode: "h-after", states: D, viewports: DESKTOP },
  { id: "gap-card-card", name: "card 1 → card 2", from: "card-1", to: "card-2", mode: "h-after", states: D },
  { id: "gap-image-title", name: "card image → title", from: "card-image-box", to: "card-title", mode: "v-after", states: D },
  { id: "gap-title-meta", name: "card title → meta", from: "card-title", to: "card-meta", mode: "v-after", states: D },
  { id: "gap-pill-left", name: "image left → guest favourite pill left", from: "pill-card-image-box", to: "card-guest-favourite-pill", mode: "left-offset", states: D },
  { id: "gap-pill-top", name: "image top → guest favourite pill top", from: "pill-card-image-box", to: "card-guest-favourite-pill", mode: "top-offset", states: D },
  { id: "gap-heart-top", name: "image top → heart top", from: "card-image-box", to: "card-heart", mode: "top-offset", states: D },
  { id: "gap-tab-icon-label", name: 'tab "All" icon → label', from: "tab-all-icon", to: "tab-all-label", mode: "v-after", states: D, viewports: DESKTOP },
  { id: "gap-tab-label-underline", name: 'tab "All" label → underline', from: "tab-all-label", to: "tab-active-underline", mode: "v-after", states: D, viewports: DESKTOP },
  { id: "gap-tabs-search", name: "tab row → search bar", from: "tab-all", to: "search-bar", mode: "v-after", states: D, viewports: DESKTOP },
  { id: "gap-label-value-where", name: "Where label → value", from: "search-where-label", to: "search-where-value", mode: "v-after", states: D, viewports: DESKTOP },
  { id: "gap-label-value-when", name: "When label → value", from: "search-when-label", to: "search-when-value", mode: "v-after", states: D, viewports: DESKTOP },
  { id: "gap-label-value-who", name: "Who label → value", from: "search-who-label", to: "search-who-value", mode: "v-after", states: D, viewports: DESKTOP },
  { id: "gap-search-btn-edge", name: "search button → search bar right edge", from: "search-button", to: "search-bar", mode: "h-after", states: D, viewports: DESKTOP },
  { id: "gap-dest-image-name", name: "destination image → name", from: "destination-image", to: "destination-name", mode: "v-after", states: D },
  { id: "gap-dest-name-tagline", name: "destination name → tagline", from: "destination-name", to: "destination-tagline", mode: "v-after", states: D },
  { id: "gap-promo-image-title", name: "promo image → title", from: "promo-image", to: "promo-title", mode: "h-after", states: D, viewports: DESKTOP },
  { id: "gap-promo-title-button", name: "promo title → button", from: "promo-title", to: "promo-button", mode: "h-after", states: D, viewports: DESKTOP },
  { id: "gap-footer-heading-link", name: 'footer "Support" heading → first link', from: "footer-col-support-heading", to: "footer-col-support-link", mode: "v-after", states: D },
  { id: "gap-footer-cols", name: "footer column Support → Hosting", from: "footer-col-support", to: "footer-col-hosting", mode: "h-after", states: D, viewports: DESKTOP },
  { id: "gap-footer-cols-2", name: "footer column Hosting → Airbnb", from: "footer-col-hosting", to: "footer-col-airbnb", mode: "h-after", states: D, viewports: DESKTOP },
  { id: "gap-footer-cols-bottom", name: "footer columns → bottom row", from: "footer-col-support", to: "footer-bottom-row", mode: "v-after", states: D, viewports: DESKTOP },
  { id: "gap-compact-pill-height", name: "compact location → compact dates", from: "compact-location", to: "compact-dates", mode: "h-after", states: S, viewports: DESKTOP },
  { id: "gap-compact-search", name: "compact guests → search button", from: "compact-guests", to: "compact-search-button", mode: "h-after", states: S, viewports: DESKTOP },
  { id: "gap-m-pill-chips", name: "mobile search pill → chip row", from: "m-search-pill", to: "m-chip-all", mode: "v-after", states: D, viewports: M },
  { id: "gap-m-chips", name: "chip All → chip Homes", from: "m-chip-all", to: "m-chip-homes", mode: "h-after", states: D, viewports: M },
  { id: "gap-m-chips-heading", name: "chip row → first section heading", from: "m-chip-all", to: "first-heading", mode: "v-after", states: D, viewports: M },
  { id: "gap-m-footer-cols", name: "footer column Support → Hosting (stacked)", from: "footer-col-support", to: "footer-col-hosting", mode: "v-after", states: D, viewports: M },
  { id: "gap-m-footer-cols-2", name: "footer column Hosting → Airbnb (stacked)", from: "footer-col-hosting", to: "footer-col-airbnb", mode: "v-after", states: D, viewports: M },
  { id: "gap-m-footer-bottom", name: "footer language → copyright", from: "footer-language", to: "footer-copyright", mode: "v-after", states: D, viewports: M },
];

export const HOME: PageDef = {
  id: "home",
  airbnbUrl: "https://www.airbnb.co.in/",
  oursUrl: "http://localhost:3000/",
  states: ["default", "scrolled", "where-open", "who-open"],
  scrolledY: 300,
  elements: [
    ...headerElements.map((target): ElementTarget => ({ ...target, viewports: target.viewports ?? DESKTOP })),
    ...searchDropdownElements.map((t) => ({ ...t, viewports: t.viewports ?? DESKTOP })),
    ...mobileSearchDropdownElements,
    ...mobileElements,
    ...rowElements,
    ...destinationElements,
    ...promoElements,
    ...footerElements,
  ],
  gaps: [...HOME_GAPS, ...SEARCH_DROPDOWN_GAPS],
};

export const PAGES: Record<string, PageDef> = {
  [HOME.id]: HOME,
};
