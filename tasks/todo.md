# Drawing Tools TV-feel — Active TODO

> Branch: `feat/core-enhancements`  
> Plan: `DRAWING_TOOLS_PLAN.md`  
> Last update: 2026-06-07

## Phase 1 — Property System ✅ DONE

- [x] Design property system architecture (delegated to `ecc/planner`)
- [x] `src/component/OverlayProperty.ts` — `OverlayProperty<T>` base + 4 property types
- [x] `PropertyGroup<T>` + 3 concrete groups (Line/Point/Fill)
- [x] Factory functions `createLine/Point/FillPropertyGroup`
- [x] Lint clean (`pnpm code-lint`)
- [x] Type-check clean (`pnpm type-check`)
- [x] 18 unit tests (`tests/unit/common/OverlayProperty.test.ts`)
- [x] Dev-docs: `changelog.md` (Step 3 entry)
- [x] Dev-docs: `architecture.md` (Section 3 — Property System)
- [x] Decision: keep modules internal (defer public API to Phase 2)

## Phase 2 — Serialization ✅ DONE

- [x] `src/component/OverlayDTO.ts` — `OverlayDTO`, `DrawingStateDTO`, `migrateOverlayDTO`, validators
- [x] `src/component/Overlay.ts` — `properties` field on interface + Imp, `toDTO()`, `static fromDTO()`, `getPropertyGroup()`
- [x] `src/Chart.ts` — `exportOverlays()`, `importOverlays()`, `exportDrawingState()`, `importDrawingState()`
- [x] `src/extension/overlay/straightLine.ts` — demo `properties` integration
- [x] `tests/unit/component/OverlayDTO.test.ts` — 14 tests (validation, migration, round-trip)
- [x] `tests/unit/chart-collection/Chart.serialization.test.ts` — 6 tests (export/import API)
- [x] `pnpm code-lint` — clean
- [x] `pnpm type-check` — clean
- [x] `pnpm build-core` — ESM + CJS pass
- [x] All 116 tests pass

## Phase 3 — Performance & Feel ✅ DONE (3.1 + 3.2)

- [x] `src/common/ObjectPool.ts` — generic pool + 3 factories
- [x] `src/common/smoothPath.ts` — Catmull-Rom: 3 variants
- [x] `tests/setup/Path2D.polyfill.ts` — happy-dom shim
- [x] `vitest.config.ts` — wired setupFiles
- [x] 9 + 14 = 23 unit tests
- [x] `pnpm build-core` — ESM/CJS/UMD all pass
- [x] All 91 tests pass (3 new files + 3 pre-existing)

## Phase 2-3 (remaining) ⏳ PENDING

- [ ] Dynamic FloatingToolbar with PropertyGroup binding
- [ ] 3.3: Render loop throttling — `requestAnimationFrame` batching in `_drawOverlay`
- [ ] 3.4: Throttle property changes during drag (debounce 16ms)
- [ ] Object pool integration in `OverlayView._drawOverlay` (replace `new Array<...>()` with `pool.acquire()`)
- [ ] Smooth path integration in `brush.ts` overlay (`smooth: true` property → use `drawSmoothPathAdaptive`)

## Phase 4 — Specialized Tool Classes ⏳ PENDING

- [ ] `TrendLineOverlay` — extends `OverlayImp`, has `LinePropertyGroup` + `PointPropertyGroup`
- [ ] `FibonacciOverlay` — adds `level{N}.price`/`color` properties
- [ ] `ChannelOverlay` — adds `parallel` line group
- [ ] `BrushOverlay` — uses `smoothPath` integration
- [ ] Update `registerOverlay` to support new `properties` field

## Phase 5 — Testing ⏳ PENDING

- [ ] Integration tests (serialize/restore, magnet snap)
- [ ] Visual regression (Playwright)
- [ ] Performance benchmarks

## Phase 6 — Missing TV Tools ⏳ PENDING

- [ ] Pitchfork (Andrews, Schiff, Modified)
- [ ] Fibonacci Extensions / Time Zones
- [ ] Gann Fan / Gann Box
- [ ] Elliott Wave
- [ ] Pattern Tools (XABCD, Cypher, Butterfly)
- [ ] Callout/Annotation improvements

## Visual Verification 🔍 BLOCKED (waiting for Alex)

- [ ] `pnpm debug` + verify drawing tools still work
- [ ] `pnpm debug` + verify color picker for selected tool works (after Phase 2)
- [ ] `pnpm debug` + verify smooth brush feels like TV (after Phase 4)

## Commit ⏸️ DEFERRED (waiting for Alex approval)

- [ ] Stage: all changed/added files
- [ ] Conventional commit `feat(overlay): complete Phase 2 serialization system`
- [ ] Push to `feat/core-enhancements` (NOT main)
