<div align="center">
  <a href="https://klinecharts.com">
    <img src="https://klinecharts.com/images/logo.svg?hash=89987fs7789" height="100"/>
  </a>
</div>
<h1 align="center">KLineChart</h1>

<div align="center">
English | <a href="https://github.com/liihuu/KLineChart/blob/main/README.zh-CN.md">简体中文</a>
</div>
<br/>

<p align="center">💹📈 Lightweight k-line chart built with html5 canvas — extended with TradingView-inspired UI and multi-chart workspace.</p>
<div align="center">

[![GitHub Workflow Status (with branch)](https://img.shields.io/github/actions/workflow/status/grizonsky/KLineChart/build.yml?logo=github)](https://github.com/grizonsky/KLineChart/actions/workflows/build.yml)
[![Version](https://badgen.net/npm/v/klinecharts)](https://www.npmjs.com/package/klinecharts)
[![Size](https://badgen.net/bundlephobia/minzip/klinecharts@latest)](https://bundlephobia.com/result?p=klinecharts@latest)
[![Typescript](https://badgen.net/npm/types/klinecharts)](types/index.d.ts)
[![LICENSE](https://badgen.net/github/license/liihuu/KLineChart)](LICENSE)
</div>

<img style="margin-bottom:6px" src="https://github.com/grizonsky/KLineChart/blob/feat/core-enhancements/docs/MainScreenshot.png" />

## ✨ Features

### Core (upstream)
- 📦 **Out of the box:** Simple and fast integration, basically zero cost to get started.
- 🚀 **Lightweight and smooth:** Zero dependencies, only 40k under gzip compression.
- 💪 **Powerful functions:** Built-in multiple indicators and line drawing models.
- 🎨 **Highly scalable:** With rich style configuration and API, the function can be extended as you like.
- 📱 **Mobile:** Support mobile, one chart, handle multiple terminals.
- 🛡 **Typescript development:** Provide complete type definition files.

### Extensions (`feat/core-enhancements`)
- 🖼️ **Multi-chart workspace** — `ChartCollection` + `LayoutManager` for split-pane layouts with configurable grid and focus management.
- 🔗 **Crosshair sync** — synchronized crosshair cursor across all charts in a workspace.
- ⏱ **Time scale sync** — unified time-axis zoom/scroll across charts.
- 🧩 **UI widgets** — `LayoutShell`, `FloatingToolbar`, `DrawingToolsWidget`, `WatchlistWidget` with `ResponsiveManager` and `WidgetManager`.
- 🖌 **Icon library** — built-in `Icons` for toolbar and drawing tool glyphs.
- 🛠 **Zero additional dependencies** — all extensions are pure Canvas/TypeScript, bundled into the same library.

## 📦 Install
### Using npm
```bash
npm install klinecharts --save
```

### Using yarn
```bash
yarn add klinecharts
```

### CDNs
#### [unpkg](https://unpkg.com)
```html
<script type="text/javascript" src="https://unpkg.com/klinecharts/dist/klinecharts.min.js"></script>
```

#### [jsDelivr](https://cdn.jsdelivr.net)
```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/klinecharts/dist/klinecharts.min.js"></script>
```

## 📄 Docs
### Online
[https://www.klinecharts.com](https://www.klinecharts.com)

### Locale
Execute command in root directory. [Node.js](https://nodejs.org) is required.
```bash
pnpm install
pnpm docs:dev
```
After successful startup, open in the browser http://localhost:8888 .

## 🛠️ Build
Execute command in root directory. [Node.js](https://nodejs.org) is required.
```bash
pnpm install
pnpm build
```
The generated files are in the dist folder.

## 🔗 Links
+ [KLineChart Preview](https://preview.klinecharts.com): A more complete example.
+ [KLineChart Pro](https://pro.klinecharts.com): Financial chart built out of the box based on KLineChart.
+ [openctp](https://github.com/openctp/openctp): Trading simulation environment for the Chinese market.
+ [grizonsky/KLineChart](https://github.com/grizonsky/KLineChart) — fork with multi-chart and UI extensions.

## ©️ License
KLineChart is available under the Apache License V2.
