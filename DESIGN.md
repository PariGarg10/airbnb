# DESIGN.md

Measured design values for `localhost:3000`, taken from airbnb.co.in by **measurement only** (rects, computed styles,
pixel diffs). No Airbnb CSS, markup, images, icons, logo or font files are used. Our font is Plus Jakarta Sans; our logo,
Fluent 3D icons and listing photos stay.

Every value below lives in a token in `frontend/app/globals.css` (`:root`), `frontend/tailwind.config.ts`, or a shared
component. Nothing is hard-coded in page components except the per-tab geometry in `TAB_BOX` (Header.tsx, explained below).

Verify with `npm run audit -- --page home --state default --width 1440` (reports in `design-refs/audit/`).
A row is **match** (within 2px, colours exact), **explained** (content, font, or non-visual DOM structure, with a reason
printed in the report) or **diff** (must be fixed).

## 1. Colour tokens

| token | value | use |
| --- | --- | --- |
| `--bg` | `#ffffff` | page |
| `--bg-secondary` / `--bg-hover` | `#f7f7f7` | footer, hover wash, host button hover |
| `--bg-quaternary` | `#f2f2f2` | grey discs (menu, row arrows, title arrow) |
| `--bg-quaternary-hover` / `--divider` / `--bg-tertiary` | `#ebebeb` | hover of grey discs, hairlines, active search bar |
| `--border` | `#dddddd` | search bar outline, search dividers |
| `--text` / `--text-muted` / `--text-disabled` | `#222` / `#6c6c6c` / `#c1c1c1` | text |
| `--brand` | `#ff385c` | logo |
| `--brand-tertiary` (`--brand-solid`) | `#da1249` | header search button at rest |
| `--brand-gradient` | `linear-gradient(to right, #e61e4d, #e31c5f 50%, #d70466)` | header search button hover, primary buttons |
| `--header-gradient` | `linear-gradient(180deg, #fff 39.9%, #f8f8f8 100%)` | expanded header band |
| `--image-placeholder` | `#ddd` | behind photos while they load |

## 2. Radius, shadow, easing

- Radii: 4 / 8 / 12 (`--r-ctrl`, footer buttons) / 14 (`--r-badge`, pill) / 20 (`--card-radius`, host button) / 32 (`--r-search-segment`) / 50 (`--r-btn-round`) / 100 (`--r-search-bar`).
- `--shadow-search`: `0 0 0 1px rgba(0,0,0,.02), 0 8px 24px rgba(0,0,0,.1)` (search bar outline layer).
- `--shadow-badge`: `0 0 0 1px rgba(0,0,0,.02), 0 2px 6px rgba(0,0,0,.04), 0 4px 8px rgba(0,0,0,.1)` (Guest favourite pill).
- Easing: `--ease-standard: cubic-bezier(.2,0,0,1)`; springs `--spring-fast` (450ms) and `--spring-standard` (584ms) are the `linear()` curves Airbnb uses for header collapse and pop-ins.

## 3. Typography (size / line-height / weight)

| class | value | where |
| --- | --- | --- |
| `.t-tab`, `.t-tab-active` | 14 / 18 / 500 (muted vs `#222`) | header tabs |
| `.t-hosting` | 14 / 18 / 500 | host button |
| `.t-search-label` | 12 / 16 / 500 | Where / When / Who |
| `.t-search-value` | 14 / 18 / 400 muted | Add dates, Add guests |
| `.t-section-title` | 20 / 24 / 600, -0.01em | row titles |
| `.t-rail-title` / `.t-rail-meta` | 13 / 16 / 500 and 12 / 16 / 400 | card text |
| `.t-guest-pill` | 11 / 13 / 600 | Guest favourite pill |
| `.t-footer-heading`, `.t-footer-ctrl` | 14 / 18 / 500 | footer |
| `.t-footer-link` | 14 / 18 / 400 | footer links, copyright |

## 4. Page gutters

`--home-px` (`.container-home`): 24px (<950), 32px (>=950), 48px (>=1440). Content max width 1440 including padding.
Header row `--header-h`: 80px, 96px at >=1440. Expanded header `--header-expanded-h`: 200px at every desktop width.

## 5. Header (>=744)

- Sticky, gradient `--header-gradient`, 1px `#ebebeb` bottom hairline. Collapse/expand animates `height` over 450ms with `--spring-fast` (Airbnb scales a separate gradient layer over 451.754ms with the same curve).
- Logo link: 80px tall hit area (y = row/2 - 40), colour transition `color .25s --ease-standard`.
- Right cluster (gap 12): host button (padding 11px 12px, radius 20, 40px tall, hover `#f7f7f7`; transition `box-shadow .2s, transform .25s, background/border/colour .3s`), avatar 40px (Airbnb shows a grey globe disc when logged out), menu button 40px disc `#f2f2f2`, icon 16px, hover `#ebebeb`, `transform .25s`. Right edge sits at `100% - --home-px`.

### Tabs
- Tab boxes are 36px tall, 35px apart (`--tab-gap`), icon 36px, label 14/18/500. Per-tab geometry (`TAB_BOX`): All pad-right 5, label gap 8; Homes pad-left 5, gap 16; Experiences gap 8; Services pad-left 2, gap 12.
- Active underline: 3px, radius 1.5px, `#222`, top 44px inside the tab, inset 3px each side (`--tab-underline-top`, `--tab-underline-inset`); fades with `opacity .3s --ease-standard`.
- Hover: icon scales to 1.0268 (`.tab-icon`, 250ms); label colour does not change.

### Expanded search bar
- 850 x 66 (`--search-bar-w/h`), centred, top = row/2 + 54 from the page top (y = 102 at 1440). Below 950px width = container width.
- Fill white, outline layer (`.search-bar-outline`): 1px `--border`, `--shadow-search`, radius 100. Active (a segment open): fill `#ebebeb`, no outline, active segment white with popover shadow.
- Grid `278.33fr | 5px divider | 283.33fr | 5px divider | 278.33fr`. Divider: 1px `--border`, 32px tall, 2px margin either side. Segments are 66px tall, radius 32, padding Where `0 32`, When `0 24`, Who `0 130.9 0 24` (`--search-who-pr` reserves the button).
- Label 12/16/500 plus 2px bottom padding; value 14/18/400 `#6c6c6c` (filled: `#222`).
- Search button: 48px disc `#da1249` (`.search-submit`, hover `--brand-gradient`, instant), right inset 10px (`--search-bar-inset`), vertical offset 9px, icon 16px. Opening a segment widens it to 118px with a "Search" label (spring-fast).
- No CSS transitions on the bar itself (measured): hover and active switch instantly.

### Search dropdown panels (Where / Who, measured @1440)
- Panel: 425px wide, 12px below the bar (`top: calc(100% + 12px)`), inset `8px` horizontal / `24px` vertical on the inner wrapper. **Where** aligns to the bar’s **left**; **Who** to the **right**.
- Panel surface: white, radius 32px, `.search-panel` pop-in (`opacity` + 8px `translateY`, `--spring-fast` 450ms). Elevation is `--shadow-primary` on ours; Airbnb splits it across material layers (accepted in audit when `box-shadow` differs).
- Where list: heading `.t-dropdown-heading` 12/16/400, `margin-bottom: 4px`, horizontal padding 24px from the panel edge; rows 72px tall, `8px` padding, 16px icon gap, `.hover:bg-row-hover` (`#f4f4f4`); icon tile 56×56, radius 12 (our tinted Fluent tiles); title `.t-dropdown-dest-title` 14/18/500; subtitle `.t-dropdown-dest-subtitle` 14/18/400 muted, `2px` top margin.
- Who list: rows 91px tall, 24px vertical padding; label `.t-guest-row-title` 16/20/500; hint `.t-dropdown-subtitle` 14/18/400 muted; row divider 1px `--divider`.
- Guest steppers (`.Counter` `variant="stepper"`): 32×32 circles, fill `--bg-quaternary` (`#f2f2f2`), no border; enabled icon `#222`, hover fill `#ebebeb`; disabled icon `--text-disabled` (`#c1c1c1`), same fill.
- Bar while open: track fill `#ebebeb`, outline hidden; active segment white with `shadow-pill` (`0 3px 12px rgba(0,0,0,.10)`).

### When panel (desktop ≥1128, `--when-panel-w` 850)
- Centered under the bar (`left-1/2 -translate-x-1/2`, 12px gap), same `.search-panel` surface (radius 32, `--shadow-primary`, pop-in animation).
- **Dates / Flexible toggle** (`.when-mode-toggle`): `#ebebeb` track, 4px padding; active tab white with `shadow-pill`; tabs 14/18/500, 8×20 padding.
- **Calendar** (`.airbnb-calendar`, shared with listing desktop): two months; caption 16/20/600; weekdays 12/16/600 muted; day cells 48×48, 14/18 (600 on range ends); today = 1px `#222` ring; hover = same ring; past/disabled `#b0b0b0`; range middle `#f7f7f7` band; start/end solid `#222` discs with white label; nav chevrons 32px circles, disabled 25% opacity.
- **Flex chips** (`.when-flex-chip`): Exact dates + ±1…±14; white fill, 1px `--border`, active 2px `#222` (7×15 padding); row 24px below calendar.
- **Flexible**: section titles `.t-when-section-title` 16/20/600; stay chips `.when-stay-chip` (same chip pattern as flex); month tiles 120×132, radius 16, 1px border, calendar icon 28px, month 14/500, year 12/16 muted; selected 2px `#222` (no fill tint); carousel nav 32px bordered circles.
- **Search active**: bar `#ebebeb`, segment pills white + `shadow-pill`, Search control expands to `--search-btn-expanded` (118px) with label fade (`transition` `--spring-fast`).

## 6. Listing rows

- Row heading band 28px: title (`.t-section-title`) + 28px `#f2f2f2` disc arrow (radius 14, hover `#ebebeb`, transition `bg .25s, transform .25s`); prev/next 28px `#f2f2f2` discs 4px apart (disabled `#c1c1c1`, opacity .5), `transform .25s`.
- Scroller `.home-row`: margin-top 12, padding 4/4/0, gap 12px; cards per row 2 (<744), 4, 5, 6, 7 at 744 / 950 / 1128 / 1440. Rows 40px apart; first heading 88px below the search bar.
- Card: image 20/19, radius 20, placeholder `#ddd`, title 8px under image (13/16/500), meta 2px under title (12/16/400 muted).
- Guest favourite pill: 12px from image top/left, blur 32px, `rgba(255,255,255,.8)` with 1px `rgba(255,255,255,.5)` border, radius 14, padding 5.5 / 9.5, `--shadow-badge`.
- Heart: 32px, 8px from the image top/right, icon 5px below the button top, `transform .25s`.
- Home rows have no subtitle line.

## 7. Footer

`#f7f7f7`, `.container-home`. Three columns (grid), top padding 48. Heading 14/18/500, 16px to the link list, links 16px apart on a 20px line. Bottom row: 48px below the columns, 1px `#ebebeb` top rule, 24px padding, copyright 14/18/400, right group: language button (padding 6/8, radius 12, 16px globe, gap 8), currency button (4px apart), social icons 24px apart with 12px margin. Button hover `#ebebeb` (`bg .3s`); text links underline on hover (1.3px, thickness animates .3s).

## 8. Search results (`/s`, desktop ≥1128)

- Split: list `--search-list-w` 58.333%, map `--search-map-w` 41.667%; gutters 48px (`min-[1128px]:px-12`) on the list, map `pr-6`.
- Map: sticky from `--search-map-sticky-top` (`var(--header-h) + 1px`), height `calc(100vh - sticky - 24px)`; panel radius `--r-map-panel` (24px). CARTO tiles unchanged.
- Filter row: chips 40px tall, 14/18/400 (`.t-chip`), 8px gap on desktop; selected chip fill `#222` / white label (`.t-chip-selected`); Filters button stays white with 1px `#222` border when active filters + 18px count badge.
- Filters modal (≥1128): recommended tiles = square icon box (max ~148px, `rounded-xl`, 1px `--border`, 40px icon) + 12/16 label; type-of-place 3-col segmented control; price histogram active `--histogram-bar-active` (`--brand`), inactive `--histogram-bar-inactive` (`#ffdfe8`), 32px white slider thumbs (`.filter-range-thumb`); min/max inputs pill (`rounded-full`, centered 16/20).
- Heading band: `.t-results-heading` 20/24/600; fee line `.t-results-fees` 14/18/400 muted + 16px brand tag icon; totals ≥1000 → “Over 1,000 homes…”.
- Grid: two columns, gap `--search-results-grid-gap-x` 24 / `--search-results-grid-gap-y` 40; card image 20/19, radius 20, Guest favourite pill same as home rows (§6); Superhost pill when no Guest favourite.
- Card text: title 15/19/500 + rating 14/18/400 `★ 4.95 (22)`; subtitles 15/19 muted; stay dates line when `check_in`/`check_out`; price line underlined (`.t-results-price-line`, strong amount + regular “for N nights”).
- Compact header pill on `/s`: “Homes in {place}”, dates or **Any week**, “Add guests” / guest count (§5 scrolled state).
- Map pins: white chip + 1px `#222` border, hover scale 1.08; active/hover fill `#222` / white text; wishlist heart inline. Expand/zoom chrome: 32px squares, radius `--r-ctrl`, `--shadow-tertiary`.
- Pin popup: 327px card, image 20/19, carousel dots + chevrons, heart + close, same text stack as grid card.
- Loading: filter pill skeletons + 2-col card skeletons (title + rating bar) + map panel skeleton.

## 9. Checkout (`/book`, desktop ≥1128)

- Minimal header: logo only, 1px `--divider` bottom border, height 80px (96px at ≥1440).
- Main grid: max width 1200px, columns 656px + 464px, gap 80px; sidebar `sticky` top 96px.
- Surfaces: cards `rounded-3xl`, 1px `--border`, message card padding 32px; summary card padding 24px.
- Back control: 48px circle `--bg-secondary`; primary CTA 56px height, `--r-8`, `--brand-gradient`.
- Rare-find pill: `--bg-rare-find`, `rounded-2xl`; discount lines `--text-discount`.
- Change pills: `--bg-quaternary`, `rounded-lg`; modals `--r-32`, overlay fade + panel pop (`--spring-standard`).

## 10. Guest trips (desktop ≥1128)

- `/trips`: two-pane layout — list ~58% width, map ~42% with `rounded-2xl` CARTO panel, sticky below header; empty state uses `text-page` (32/36/600) title and `text-section` (22/600) subhead, rausch gradient CTA.
- `/trips/[id]?confirmed=1|requested=1`: two columns ~1fr + 400px, sticky summary card (`rounded-2xl`, 1px hairline).
- `/trips/[id]`: left panel max 560px scroll; hero `rounded-2xl`; detail map sticky ~480px height.
- `/trips/[id]/cancel`: max content 720px, step titles `text-page`; primary cancel CTA uses `--brand-gradient` / `search-fill`.
- Map markers: empty-state city chips 28×28 white squares + 12px label; trip markers 12×12 white squares (active fill `--text`).
- Receipt print: only `#trip-receipt-print` visible (`globals.css` `@media print`).

## 11. Explained (accepted) differences

- Content: Destinations / promo sections exist only on ours; city names, prices and ratings differ; our DB has 5 listings per city so a row never scrolls at 1440.
- Font: label widths differ (Plus Jakarta Sans), so tab x positions accumulate a few px.
- DOM structure: Airbnb splits the header over layers (row 96px + gradient layer), pads inner wrappers instead of buttons, uses an `<input>` for Where; computed `display`, `gap`, `cursor`, `aspect-ratio`, `object-fit` are not compared (positions/sizes of the children are).

## 12. Responsive and scrolled state

Breakpoint: Airbnb switches layouts at **744px**, so Tailwind `md` starts at 744 (`tailwind.config.ts`). Audited widths: 1440, 1128, 950, 375 (all rows match or are explained).

### Tablet / small desktop (744-1439)
`--home-px` gutter 24 (<1128) / 32 / 48 (>=1440); `--header-h` 80 below 1440, 96 above. Cards per row follow the container width (cards stay 164.83px at 1128). Footer vertical paddings follow `--home-px`; the copyright keeps a 4px bottom margin below `lg` (1024).

### Mobile (<744, measured at 375 = 360px content)
- Search pill: 312x56, padding 10/19, radius `--r-mobile-search` 40, 1px `--border`, `--shadow-mobile-search`; "Start your search" 14/18/500 with a 16px icon, 4px gap.
- Chip row: starts 16px under the pill, padding `16 24 22`, gap 8, chips 40px high (padding 10/14, 1px border, radius 40, 28px icon in a 20px slot, label 14/18/400). Chip shadows are two stacked 38px surface layers (`--shadow-chip` raised, `--shadow-chip-active` pressed) cross-fading in 220ms `--ease-chip`; the active chip is also pushed down 2px.
- Rows: 24px between rows, 16px under the cards, card 150px wide, heading 18/24/600 with a 28px arrow, no prev/next. Rail images get `--shadow-rail-image-mobile`. Card meta is one nowrap line (12/16).
- Bottom bar (`MobileNav`): fixed, 1px `--divider` top rule, 64px content, three slots of 20% width 2px apart, 44px high, 24px icon, 5px gap, label 10/12 (active `--brand-solid` weight 500, others `--text-muted` 400, colour transition 300ms). Opens the account menu upward.
- Footer: single column, sections `py-6` with a `--border` rule between them, controls first, then socials (16px below), then the copyright (22px line + 20px links line).

### Scrolled state (>=744, scroll > 0)
- Compact pill: 375.8x46 (`--compact-pill-h`), radius 40, surface layer with 1px `--border` and `--shadow-compact-pill`; segments are 48px high (overlapping the border by 1px), radii 40/4/4/40, label 14/22/500, dividers 1x24; search circle 32px solid `--brand-solid` in a 39px wrapper with 7px padding. Text fade transition 150ms linear with 150ms delay.
- Collapse/expand choreography (one `--spring-fast` curve, 450ms; fades 175ms linear via `--fade-dur`): tab row and big bar travel 87px (`--stack-shift`); tabs fade out; big bar also scales to 0.55 and fades; the pill rises from behind the bar with the surface scaled 2.127 to 1, the row 1.242 to 1 while fading in, and the search circle sliding in from +202px (scaleX 1.446 to 1). The header height animates 200 to 97 (expanding animates back; the collapsed height is explicit so it can transition).
- Pill click: the header re-expands with the segment active and a full-width overlay `rgba(0,0,0,.25)` that fades in over 150ms linear (`.search-overlay`).

Tools: `scripts/visual-audit/anim.cjs` (frame-by-frame collapse/expand) and `pillclick.cjs` (re-expanded state + overlay) record these values.