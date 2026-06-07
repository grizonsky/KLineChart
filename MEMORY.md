# Session Memory

## Active Branch
- `feat/core-enhancements` — pushed to `origin` (grizonsky/KLineChart)

## Completed
- Phase 1 UI system: LayoutShell, Watchlist, DrawingTools, FloatingToolbar, ResponsiveManager, WidgetManager
- Multi-chart: ChartCollection, LayoutManager, CrosshairSync, TimeScaleSync
- All config files, docs, design spec
- Branch created, committed, pushed

## Drawing Tools (Fixes Applied)

### Bug: `timestampToDataIndex()` returns wrong index when data timestamps are not in ascending order

**Симптом:** Overlay малюється за межами canvas (dataIndex від'ємний).

**Корінь:** `timestampToDataIndex()` в `Store.ts` використовує `binarySearchNearest` або period-based формулу, яка припускає що дані відсортовані за зростанням `timestamp`. Коли дані в іншому порядку (напр. через `unshift`), функція повертає неправильний (від'ємний) dataIndex.

**Де знайдено і виправлено:**

| Файл | Метод | Що було | Що стало |
|------|-------|---------|----------|
| `src/view/OverlayView.ts:499-510` | `_drawOverlay` | `timestampToDataIndex(timestamp)` першим | `point.dataIndex` першим |
| `src/component/Overlay.ts:455-467` | `eventPressedOtherMove` | `timestampToDataIndex(timestamp)` для кожної точки | `p.dataIndex` першим |

**Правило:** Завжди використовуй `point.dataIndex` напряму, а `timestampToDataIndex` — тільки як fallback коли `dataIndex` недоступний. `dataIndex` встановлюється прямо з `_coordinateToPoint` і завжди коректний.

## Next
- Ready for Phase 2 (chart interactions) or creating a PR
