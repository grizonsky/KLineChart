/**
 *       ___           ___                   ___           ___           ___           ___           ___           ___           ___
 *      /\__\         /\__\      ___        /\__\         /\  \         /\  \         /\__\         /\  \         /\  \         /\  \
 *     /:/  /        /:/  /     /\  \      /::|  |       /::\  \       /::\  \       /:/  /        /::\  \       /::\  \        \:\  \
 *    /:/__/        /:/  /      \:\  \    /:|:|  |      /:/\:\  \     /:/\:\  \     /:/__/        /:/\:\  \     /:/\:\  \        \:\  \
 *   /::\__\____   /:/  /       /::\__\  /:/|:|  |__   /::\~\:\  \   /:/  \:\  \   /::\  \ ___   /::\~\:\  \   /::\~\:\  \       /::\  \
 *  /:/\:::::\__\ /:/__/     __/:/\/__/ /:/ |:| /\__\ /:/\:\ \:\__\ /:/__/ \:\__\ /:/\:\  /\__\ /:/\:\ \:\__\ /:/\:\ \:\__\     /:/\:\__\
 *  \/_|:|~~|~    \:\  \    /\/:/  /    \/__|:|/:/  / \:\~\:\ \/__/ \:\  \  \/__/ \/__\:\/:/  / \/__\:\/:/  / \/_|::\/:/  /    /:/  \/__/
 *     |:|  |      \:\  \   \::/__/         |:/:/  /   \:\ \:\__\    \:\  \            \::/  /       \::/  /     |:|::/  /    /:/  /
 *     |:|  |       \:\  \   \:\__\         |::/  /     \:\ \/__/     \:\  \           /:/  /        /:/  /      |:|\/__/     \/__/
 *     |:|  |        \:\__\   \/__/         /:/  /       \:\__\        \:\__\         /:/  /        /:/  /       |:|  |
 *      \|__|         \/__/                 \/__/         \/__/         \/__/         \/__/         \/__/         \|__|
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type {
  LineType, PolygonType, TooltipShowRule, TooltipShowType, FeatureType, TooltipFeaturePosition,
  CandleType, CandleTooltipRectPosition
} from './common/Styles'
import type Nullable from './common/Nullable'

import { logError, logTag, logWarn } from './common/utils/logger'

import {
  clone, merge, isString, isNumber, isValid, isObject, isArray, isFunction, isBoolean
} from './common/utils/typeChecks'
import {
  formatValue,
  formatPrecision,
  formatBigNumber,
  formatThousands,
  formatFoldDecimal,
  formatTimestampByTemplate
} from './common/utils/format'
import { calcTextWidth } from './common/utils/canvas'
import type { ActionType } from './common/Action'
import type { IndicatorSeries } from './component/Indicator'
import type { OverlayMode, OverlayDrawingMode } from './component/Overlay'

import type { FormatDateType, Options, ZoomAnchor } from './Options'
import ChartImp, { type Chart, type DomPosition } from './Chart'

import { ChartCollection } from './chart-collection'
import type { MultiChartOptions } from './chart-collection'
import { LayoutShell, ResponsiveManager, WatchlistWidget, DrawingToolsWidget, FloatingToolbar } from './ui'

import { checkCoordinateOnArc } from './extension/figure/arc'
import { checkCoordinateOnCircle } from './extension/figure/circle'
import {
  checkCoordinateOnLine,
  getLinearYFromSlopeIntercept,
  getLinearSlopeIntercept,
  getLinearYFromCoordinates
} from './extension/figure/line'
import { checkCoordinateOnPolygon } from './extension/figure/polygon'
import { checkCoordinateOnRect } from './extension/figure/rect'
import { checkCoordinateOnText } from './extension/figure/text'

import { registerFigure, getSupportedFigures, getFigureClass } from './extension/figure/index'
import { registerIndicator, getSupportedIndicators } from './extension/indicator/index'
import { registerLocale, getSupportedLocales } from './extension/i18n/index'
import { registerOverlay, getOverlayClass, getSupportedOverlays } from './extension/overlay/index'
import { registerStyles } from './extension/styles/index'
import { registerXAxis } from './extension/x-axis'
import { registerYAxis } from './extension/y-axis'
import { registerHotkey, getHotkey, getSupportedHotkeys } from './extension/hotkey/index'

const charts = new Map<string, ChartImp>()
let chartBaseId = 1

/**
 * Chart version
 * @return {string}
 */
function version (): string {
  return '__VERSION__'
}

/**
 * Init chart instance
 * @param ds
 * @param options
 * @returns {Chart}
 */
function init (ds: HTMLElement | string, options?: Options | Record<string, unknown>): Nullable<Chart | object> {
  logTag()
  let dom: Nullable<HTMLElement> = null
  if (isString(ds)) {
    dom = document.getElementById(ds)
  } else {
    dom = ds
  }
  if (dom === null) {
    logError('', '', 'The chart cannot be initialized correctly. Please check the parameters. The chart container cannot be null and child elements need to be added!!!')
    return null
  }

  // Multi-chart mode
  if (isObject(options)) {
    const mco = (options as Record<string, unknown>).multiChart
    if (mco !== undefined && typeof mco === 'object' && mco !== null) {
      const panes = (mco as Record<string, unknown>).panes
      if (Array.isArray(panes) && panes.length > 0) {
        const chartOpts = options as Options | undefined
        const enableUI = chartOpts?.features?.ui === true
        if (enableUI) {
          const shell = new LayoutShell(dom)
          const rm = new ResponsiveManager()
          rm.subscribe(bp => { shell.element.setAttribute('data-breakpoint', bp) })

          // Watchlist
          const wl = new WatchlistWidget(shell, function () { void 0 })
          wl.mount()
          const iconsContainer = shell.element.querySelector('.klc-right-icons')
          if (iconsContainer !== null) wl.mountToggle(iconsContainer as HTMLElement)

          // Drawing tools (no overlay wiring for now)
          const ft = new FloatingToolbar(shell, function () { void 0 })
          ft.mount()
          const dt = new DrawingToolsWidget(shell, function () { void 0 }, ft)
          dt.mount()

          const chartSlot = shell.getSlot('chart')
          const collection = new ChartCollection(chartSlot, mco as MultiChartOptions, () => {
            rm.dispose()
            wl.dispose()
            ft.dispose()
            shell.destroy()
          })
          return collection
        }
        const collection = new ChartCollection(dom, mco as MultiChartOptions)
        return collection
      }
    }
  }

  // Single chart (existing behavior)
  const chartOpts = options as Options | undefined
  let chart = charts.get(dom.id)
  if (isValid(chart)) {
    logWarn('', '', 'The chart has been initialized on the dom！！！')
    return chart
  }
  const id = `k_line_chart_${chartBaseId++}`
  chart = new ChartImp(dom, chartOpts)
  chart.id = id
  dom.setAttribute('k-line-chart-id', id)
  charts.set(id, chart)
  return chart
}

/**
 * Destroy chart instance
 * @param dcs
 */
function dispose (dcs: HTMLElement | Chart | string): void {
  let id: Nullable<string> = null
  if (dcs instanceof ChartImp) {
    id = dcs.id
  } else {
    let dom: Nullable<HTMLElement> = null
    if (isString(dcs)) {
      dom = document.getElementById(dcs)
    } else {
      dom = dcs as HTMLElement
    }
    id = dom?.getAttribute('k-line-chart-id') ?? null
  }
  if (id !== null) {
    charts.get(id)?.destroy()
    charts.delete(id)
  }
}

const utils = {
  clone,
  merge,
  isString,
  isNumber,
  isValid,
  isObject,
  isArray,
  isFunction,
  isBoolean,
  formatValue,
  formatPrecision,
  formatBigNumber,
  formatDate: formatTimestampByTemplate,
  formatThousands,
  formatFoldDecimal,
  calcTextWidth,
  getLinearSlopeIntercept,
  getLinearYFromSlopeIntercept,
  getLinearYFromCoordinates,
  checkCoordinateOnArc,
  checkCoordinateOnCircle,
  checkCoordinateOnLine,
  checkCoordinateOnPolygon,
  checkCoordinateOnRect,
  checkCoordinateOnText
}

export {
  version, init, dispose,
  registerFigure, getSupportedFigures, getFigureClass,
  registerIndicator, getSupportedIndicators,
  registerHotkey, getHotkey, getSupportedHotkeys,
  registerOverlay, getSupportedOverlays, getOverlayClass,
  registerLocale, getSupportedLocales,
  registerStyles,
  registerXAxis, registerYAxis,
  utils,
  type LineType, type PolygonType, type TooltipShowRule, type TooltipShowType, type FeatureType, type TooltipFeaturePosition, type CandleTooltipRectPosition,
  type CandleType, type FormatDateType, type ZoomAnchor,
  type DomPosition, type ActionType, type IndicatorSeries, type OverlayMode, type OverlayDrawingMode
}
