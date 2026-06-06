# Design System

KLineChart is a lightweight k-line chart library built with HTML5 Canvas. There is no DOM/CSS component framework — everything is rendered programmatically on `<canvas>`.

---

## Stack

- **Runtime:** Plain TypeScript → ES5 (no framework, zero dependencies)
- **Build:** Rollup → ESM, CJS, UMD bundles
- **Rendering:** Canvas 2D API
- **Types:** `src/common/Styles.ts` — all style interfaces and defaults
- **Font:** `Helvetica Neue` (default for all text elements)

---

## Visual palette

Default colors defined in `src/common/Styles.ts`:

| Token | Hex | Usage |
|-------|-----|-------|
| Up / bullish | `#2DC08E` | Candle body, indicators |
| Down / bearish | `#F92855` | Candle body, indicators |
| No change | `#76808F` | Flat candle |
| Accent | `#1677FF` | Area line, overlay draw, active state |
| Grid | `#EDEDED` | Dashed grid lines |
| Axis | `#DDDDDD` | Axis border lines |

Color comparison rule for candles: `current_open` (default) — compares current close to current open to determine up/down.

---

## Candle types

| Type | Description |
|------|-------------|
| `candle_solid` | Standard filled candlestick |
| `candle_stroke` | Hollow candlestick |
| `candle_up_stroke` | Only up candles are hollow |
| `candle_down_stroke` | Only down candles are hollow |
| `ohlc` | OHLC bar style |
| `area` | Line/area chart |

---

## Style hierarchy

```
Styles
├── grid          — background grid (horizontal/vertical dashed lines)
├── candle        — candle type, bar colors, area style, price marks, tooltip
├── indicator     — OHLC mini-bars, poly lines, circles, last-value mark, tooltip
├── xAxis         — show/hide, tick text, tick line, axis line
├── yAxis         — same as xAxis (auto-sized or fixed width)
├── separator     — separator bar between panes
├── crosshair     — horizontal/vertical crosshair lines + text labels
└── overlay       — point, line, rect, polygon, circle, arc, text styles for drawing tools
```

All fields accept user overrides via `chart.setStyles()`. Partial deep merge is applied — unspecified fields fall back to defaults.

---

## Extension system

All extensions are registered via `register*` functions from `src/index.ts`:

| Function | Purpose |
|----------|---------|
| `registerFigure` | Custom drawing figure (arc, circle, line, polygon, rect, text checkers) |
| `registerIndicator` | Technical indicator (MA, MACD, RSI, etc.) |
| `registerOverlay` | Drawing tool overlay (segment, ray, horizontal line, etc.) |
| `registerLocale` | i18n locale |
| `registerStyles` | Theme preset (dark mode variant, etc.) |
| `registerXAxis` | Custom X-axis |
| `registerYAxis` | Custom Y-axis |
| `registerHotkey` | Keyboard shortcut binding |

---

## Layout & Panes

The chart uses a multi-pane layout:
- Each pane holds one or more indicators/renderers
- Panes are stacked vertically, separated by a draggable separator bar
- The main candle pane is always present
- Y-axes auto-size based on label width or accept fixed pixel values

---

## Canvas rendering pipeline

1. **Layout** — calculate pane sizes, margins, padding
2. **Coordinate mapping** — convert data points → canvas coordinates
3. **Draw grid** → **Draw candle/indicator** → **Draw overlays** → **Draw crosshair**
4. All drawing respects `devicePixelRatio` for sharp rendering on hi-DPI displays

---

## Key design decisions

- **Zero runtime dependencies** — the library must not import any npm package at runtime. All utility functions are in `src/common/utils/`.
- **ES5 target** — maximizes browser compatibility. No arrow functions, no `const`/`let` in output, no `class` syntax in output.
- **Canvas over DOM** — enables real-time financial chart rendering with thousands of data points without DOM overhead.
- **No test framework** — the project currently ships without automated tests. Discuss testing strategy per task.
