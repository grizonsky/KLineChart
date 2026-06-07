# 📋 План архітектурних покращень Drawing Tools для Klinecharts

> **Статус:**
> - ✅ Phase 1 (Property System) — завершено, включаючи Dynamic FloatingToolbar
> - ✅ Phase 2 (Serialization) — завершено
> - ✅ Phase 3 (Performance & Feel) — 3.1-3.4 готово, 3.5 defer
> - ⏳ Phase 4 (Architecture) — не почато
> - ⏳ Phase 5 (Testing) — частково (юніт-тести для існуючих компонентів)
> - ⏳ Phase 6 (Missing TV Tools) — не почато
>
> Останнє оновлення: 2026-06-07

## 🎯 Мета

Досягти "TradingView feel" — плавного, відгукового, зручного малювання інструментів на графіку.

## 📦 Фаза 1: Property System (Фундамент) ✅

### Створити `src/component/OverlayProperty.ts`
- Базовий клас `OverlayProperty<T>` з реактивністю
- `subscribe(callback)` для UI біндингу
- `validate(value)`, `toJSON()`, `static fromJSON()`

### Спеціалізовані властивості
- `LineWidthProperty` (1-10px) → Slider
- `LineColorProperty` → ColorPicker
- `LineStyleProperty` (solid/dashed/custom) → Select
- `PointStyleProperty` (radius, border, active) → Panel
- `FillProperty` (fill/stroke/stroke_fill) → Radio
- `FontProperty` (font, size, weight) → Typography

### Property Registry
- В `OverlayTemplate` додати `properties: { line, point, fill, ... }`
- Кожен інструмент визначає свій набір властивостей

### Інтеграція з FloatingToolbar ✅
- Toolbar читає `overlay.properties`, будує UI динамічно
- `bindProperties(group: Record<string, PropertyGroup>, callback)` — Color, Number, Enum, Boolean
- Property→Style bridge через callback в ChartImp

## 📦 Фаза 2: Serialization System ✅

### DTO структури в `src/component/OverlayDTO.ts`
- `OverlayDTO { version, id, name, groupId, paneId, points, properties, styles, metadata }`
- `DrawingStateDTO { version, overlays, groups }`

### Методи в OverlayImp
- `toDTO(): OverlayDTO`
- `static fromDTO(dto, chart): OverlayImp`

### Chart API
- `exportOverlays(): string` (JSON)
- `importOverlays(json): boolean`
- `exportDrawingState()`, `importDrawingState()`

### Версіонування
- `migrateDTO(oldDTO)` для апгрейду

## 📦 Фаза 3: Performance & Feel ✅

### 3.1 Object Pooling ✅
- `src/common/ObjectPool.ts`
- Pool для `Coordinate[]`, `OverlayFigure[]`, `Path2D`
- ✅ Інтегровано в `OverlayView._drawOverlay` — заміна `points.map()` на `pool.acquire()`

### 3.2 Smooth Continuous Drawing ✅
- Catmull-Rom сплайни для `brush` (tension 0.3-0.5)
- Накопичення точок, ререндер тільки при новій точці
- ✅ `brush.ts` — `smooth: true` активує вбудований Catmull-Rom рендеринг

### 3.3 Magnet Preview (Visual Feedback) ✅
- `_magnetPreview: { label, x, y }` — півпрозора крапка + "High: 123.45"
- Рендериться в `drawImp()` після progress overlay
- Очищується при виході з режиму малювання

### 3.4 Throttled Render ✅
- Вбудований `Canvas._executeListener()` з `requestAnimationFrame` + guard
- Не запускає новий rAF поки попередній не виконався → природний 60fps cap

### 3.5 Separate Layer для "being drawn" ⏳ DEFER
- Окремий canvas layer або Path2D cache
- Уникає повного перемальовування при mousemove
- Defer: Canvas rAF + ObjectPool вже дають достатню продуктивність

## 📦 Фаза 4: Architecture (Опціонально)

### Спеціалізовані класи
```
OverlayImp (base)
├── StraightLineOverlay
├── HorizontalOverlay
├── FibonacciOverlay
├── PatternOverlay
├── BrushOverlay
├── PitchforkOverlay
└── TextOverlay
```

### Overlay Group System
- `OverlayGroup` для наборів (Fibonacci set)
- Sync властивостей по групі

### Event System
- `overlay.on('draw:start', handler)` замість 16 колбеків

## 📦 Фаза 5: Testing Strategy

### Unit Tests (Vitest)
- `OverlayProperty` — validate, JSON round-trip, subscription
- `OverlayDTO` — серіалізація, міграція
- `ObjectPool` — memory leak prevention
- `smoothPath` — математика, edge cases
- `magnetLogic` — OHLC snapping

### Integration Tests
- `createTrendLine`, `brush smooth path`, `magnet snap`, `serialize/restore`, `property→render`

### Visual Regression (Playwright)
- Скриншоти до/після кожного інструменту

### Performance Benchmarks
- 100 overlays render < 16ms
- Brush 1000 points
- Property change → render

## 📦 Фаза 6: Missing TV Tools

1. Pitchfork (Andrews, Schiff, Modified)
2. Fibonacci Extensions/Time Zones
3. Gann Fan/Box
4. Elliott Wave
5. Pattern Tools (XABCD, Cypher, Butterfly)
6. Callout/Annotation (покращити)

## 🗓️ Timeline

```
Phase 1 (Property System)  →  Phase 2 (Serialization)  →  Phase 3 (Performance/Feel)
Phase 4 (Architecture)     →  Phase 5 (Tests)          →  Phase 6 (New Tools)
```

## 🎯 Acceptance Criteria

| Статус | Критерій | Примітка |
|--------|----------|----------|
| ✅ | Property system з UI біндингом | `FloatingToolbar.bindProperties()` з Color/Number/Enum/Boolean |
| ✅ | DTO round-trip без втрат | Phase 2 — toDTO/fromDTO + JSON round-trip |
| ❌ | 60fps при 50+ оверлеях | Немає бенчмарків, але ObjectPool + rAF вже працюють |
| ✅ | Brush з плавними сплайнами | `smooth: true` в brush.ts, Catmull-Rom через `lineTo()` |
| ✅ | Magnet preview з OHLC підказками | крапка + "High: 123.45" при малюванні |
| ✅ | Tests pass (unit) | 116 тестів проходять |
| ✅ | Zero runtime dependencies | Дотримано |
| ✅ | Build/lint чисто | type-check + lint + build-core проходять |

## 📋 Що залишилось

### Phase 3 (Performance & Feel):
- 🔲 3.5 Окремий canvas layer для "being drawn" — defer (поточна продуктивність достатня)

### Phase 4 (Architecture):
- 🔲 Спеціалізовані класи оверлеїв (TrendLine, Fib, Channel, Brush)
- 🔲 `OverlayGroup` система синхронізації
- 🔲 Event System замість 16 колбеків

### Phase 5 (Testing):
- 🔲 Integration tests (serialize/restore, magnet snap)
- 🔲 Visual regression (Playwright)
- 🔲 Performance benchmarks

### Phase 6 (Missing TV Tools):
- 🔲 Pitchfork (Andrews, Schiff, Modified)
- 🔲 Fibonacci Extensions / Time Zones
- 🔲 Gann Fan / Gann Box
- 🔲 Elliott Wave
- 🔲 Pattern Tools (XABCD, Cypher, Butterfly)
- 🔲 Callout/Annotation improvements
