/**
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

import type Nullable from '../common/Nullable'
import type Coordinate from '../common/Coordinate'
import type Point from '../common/Point'
import type { EventHandler, EventName, MouseTouchEvent, MouseTouchEventCallback } from '../common/EventHandler'
import { isFunction, isNumber, isValid } from '../common/utils/typeChecks'
import { createCoordinateArrayPool } from '../common/ObjectPool'

import type { Axis } from '../component/Axis'
import type { YAxis } from '../component/YAxis'
import type { OverlayFigure, Overlay } from '../component/Overlay'
import type OverlayImp from '../component/Overlay'
import { checkOverlayFigureEvent, OVERLAY_FIGURE_KEY_PREFIX } from '../component/Overlay'

import type { EventOverlayInfoFigureType } from '../Store'

import { PaneIdConstants } from '../pane/types'

import type DrawWidget from '../widget/DrawWidget'
import type DrawPane from '../pane/DrawPane'

import View from './View'

interface MagnetPreviewInfo {
  label: string
  x: number
  y: number
}

const coordinatePool = createCoordinateArrayPool()

export default class OverlayView<C extends Axis = YAxis> extends View<C> {
  private _magnetPreview: Nullable<MagnetPreviewInfo> = null

  constructor (widget: DrawWidget<DrawPane<C>>) {
    super(widget)
    this._initEvent()
  }

  private _initEvent (): void {
    const widget = this.getWidget()
    const pane = widget.getPane()
    const paneId = pane.getId()
    const chart = pane.getChart()
    const chartStore = chart.getChartStore()
    this.registerEvent('mouseMoveEvent', event => {
      const progressOverlayInfo = chartStore.getProgressOverlayInfo()
      if (progressOverlayInfo !== null) {
        const overlay = progressOverlayInfo.overlay
        let progressOverlayPaneId = progressOverlayInfo.paneId
        if (overlay.isStart()) {
          chartStore.updateProgressOverlayInfo(paneId)
          progressOverlayPaneId = paneId
        }
        const index = overlay.points.length - 1
        if (overlay.isDrawing() && progressOverlayPaneId === paneId) {
          overlay.stepDrawingModeEventMoveForDrawing(this._coordinateToPoint(overlay, event))
          overlay.onDrawing?.({ chart, overlay, ...event })
        }
        return this._figureMouseMoveEvent(
          overlay,
          'point',
          index,
          { key: `${OVERLAY_FIGURE_KEY_PREFIX}point_${index}`, type: 'circle', attrs: {} }
        )(event)
      }
      this._magnetPreview = null
      const completedOverlays = this.getCompleteOverlays()
      let hitOverlay: Nullable<OverlayImp> = null
      let hitIndex = -1
      let hitFigure: Nullable<OverlayFigure> = null
      for (const o of completedOverlays) {
        if (!o.visible) continue
        const yAxis = pane.getYAxisComponentById() as unknown as Nullable<YAxis>
        const points = o.points
        const isContinuous = o.isContinuousDrawingMode()
        for (let i = 0; i < points.length; i++) {
          const pt = points[i]
          let dataIndex: Nullable<number> = null
          if (isContinuous && isNumber(pt.timestamp)) {
            dataIndex = chartStore.timestampToFloatIndex(pt.timestamp)
          } else if (isNumber(pt.dataIndex)) {
            dataIndex = pt.dataIndex
          } else if (isNumber(pt.timestamp)) {
            dataIndex = chartStore.timestampToDataIndex(pt.timestamp)
          }
          let cx = 0
          let cy = 0
          if (isNumber(dataIndex)) {
            cx = chartStore.dataIndexToCoordinate(dataIndex)
          }
          if (isNumber(pt.value)) {
            cy = yAxis?.convertToPixel(pt.value) ?? 0
          }
          const dx = event.x - cx
          const dy = event.y - cy
          if (dx * dx + dy * dy < 400) {
            hitOverlay = o
            hitIndex = i
            hitFigure = { key: `${OVERLAY_FIGURE_KEY_PREFIX}point_${i}`, type: 'circle', attrs: {} }
            break
          }
        }
        if (hitOverlay !== null) break
      }
      if (hitOverlay !== null) {
        chartStore.setHoverOverlayInfo(
          { paneId, overlay: hitOverlay, figureType: 'point', figureIndex: hitIndex, figure: hitFigure },
          (o, f) => this._processOverlayMouseEnterEvent(o, f, event),
          (o, f) => this._processOverlayMouseLeaveEvent(o, f, event)
        )
        widget.setForceCursor('pointer')
      } else {
        chartStore.setHoverOverlayInfo(
          {
            paneId,
            overlay: null,
            figureType: 'none',
            figureIndex: -1,
            figure: null
          },
          (o, f) => this._processOverlayMouseEnterEvent(o, f, event),
          (o, f) => this._processOverlayMouseLeaveEvent(o, f, event)
        )
        widget.setForceCursor(null)
      }
      return false
    }).registerEvent('mouseClickEvent', event => {
      const progressOverlayInfo = chartStore.getProgressOverlayInfo()
      if (progressOverlayInfo !== null) {
        const overlay = progressOverlayInfo.overlay
        let progressOverlayPaneId = progressOverlayInfo.paneId
        if (overlay.isStart()) {
          chartStore.updateProgressOverlayInfo(paneId, true)
          progressOverlayPaneId = paneId
        }
        const index = overlay.points.length - 1
        if (overlay.isDrawing() && progressOverlayPaneId === paneId) {
          overlay.stepDrawingModeEventMoveForDrawing(this._coordinateToPoint(overlay, event))
          overlay.onDrawing?.({ chart, overlay, ...event })
          overlay.nextStep()
          if (!overlay.isDrawing()) {
            chartStore.progressOverlayComplete()
            overlay.onDrawEnd?.({ chart, overlay, ...event })
          }
        }
        return this._figureMouseClickEvent(
          overlay,
          'point',
          index,
          {
            key: `${OVERLAY_FIGURE_KEY_PREFIX}point_${index}`,
            type: 'circle',
            attrs: {}
          }
        )(event)
      }
      chartStore.setClickOverlayInfo(
        {
          paneId,
          overlay: null,
          figureType: 'none',
          figureIndex: -1,
          figure: null
        },
        (o, f) => this._processOverlaySelectedEvent(o, f, event),
        (o, f) => this._processOverlayDeselectedEvent(o, f, event)
      )
      return false
    }).registerEvent('mouseDoubleClickEvent', event => {
      const progressOverlayInfo = chartStore.getProgressOverlayInfo()
      if (progressOverlayInfo !== null) {
        const overlay = progressOverlayInfo.overlay
        const progressOverlayPaneId = progressOverlayInfo.paneId
        if (overlay.isDrawing() && progressOverlayPaneId === paneId) {
          overlay.forceComplete()
          if (!overlay.isDrawing()) {
            chartStore.progressOverlayComplete()
            overlay.onDrawEnd?.({ chart, overlay, ...event })
          }
        }
        const index = overlay.points.length - 1
        return this._figureMouseClickEvent(
          overlay,
          'point',
          index,
          {
            key: `${OVERLAY_FIGURE_KEY_PREFIX}point_${index}`,
            type: 'circle',
            attrs: {}
          }
        )(event)
      }
      return false
    }).registerEvent('mouseRightClickEvent', event => {
      const progressOverlayInfo = chartStore.getProgressOverlayInfo()
      if (progressOverlayInfo !== null) {
        const overlay = progressOverlayInfo.overlay
        if (overlay.isDrawing()) {
          const index = overlay.points.length - 1
          return this._figureMouseRightClickEvent(
            overlay,
            'point',
            index,
            {
              key: `${OVERLAY_FIGURE_KEY_PREFIX}point_${index}`,
              type: 'circle',
              attrs: {}
            }
          )(event)
        }
      }
      return false
    }).registerEvent('mouseDownEvent', event => {
      // Handle continuous drawing mode - start drawing on mouse down
      const progressOverlayInfo = chartStore.getProgressOverlayInfo()
      if (progressOverlayInfo !== null) {
        const overlay = progressOverlayInfo.overlay
        if (overlay.isContinuousDrawingMode() && overlay.isStart()) {
          chartStore.updateProgressOverlayInfo(paneId, true)
          const point = this._coordinateToPoint(overlay, event)
          overlay.startContinuousDrawing(point)
          overlay.onDrawStart?.({ chart, overlay, ...event })
          return true
        }
      }
      return false
    }).registerEvent('mouseUpEvent', event => {
      // Handle continuous drawing mode - complete on mouse up
      const progressOverlayInfo = chartStore.getProgressOverlayInfo()
      if (progressOverlayInfo !== null) {
        const overlay = progressOverlayInfo.overlay
        if (overlay.isContinuousDrawingMode() && overlay.isDrawing() && !overlay.isStart()) {
          overlay.forceComplete()
          chartStore.progressOverlayComplete()
          overlay.onDrawEnd?.({ chart, overlay, ...event })
          return true
        }
      }
      const { overlay, figure } = chartStore.getPressedOverlayInfo()
      if (overlay !== null) {
        if (checkOverlayFigureEvent('onPressedMoveEnd', figure)) {
          overlay.onPressedMoveEnd?.({ chart, overlay, figure: figure ?? undefined, ...event })
        }
      }
      chartStore.setPressedOverlayInfo({
        paneId,
        overlay: null,
        figureType: 'none',
        figureIndex: -1,
        figure: null
      })
      return false
    }).registerEvent('pressedMouseMoveEvent', event => {
      // Handle continuous drawing mode - accumulate points while mouse is pressed
      const progressOverlayInfo = chartStore.getProgressOverlayInfo()
      if (progressOverlayInfo !== null) {
        const overlay = progressOverlayInfo.overlay
        if (overlay.isContinuousDrawingMode() && overlay.isDrawing() && !overlay.isStart()) {
          const point = this._coordinateToPoint(overlay, event)
          overlay.continuousDrawingModeEventMoveForDrawing(point)
          overlay.onDrawing?.({ chart, overlay, ...event })
          this.getWidget().setForceCursor('pointer')
          return true
        }
      }
      const { overlay, figureType, figureIndex, figure } = chartStore.getPressedOverlayInfo()
      if (overlay !== null) {
        if (checkOverlayFigureEvent('onPressedMoving', figure)) {
          if (!overlay.lock) {
            const point = this._coordinateToPoint(overlay, event)
            if (figureType === 'point') {
              overlay.eventPressedPointMove(point, figureIndex)
            } else {
              overlay.eventPressedOtherMove(point, this.getWidget().getPane().getChart().getChartStore())
            }
            let prevented = false
            overlay.onPressedMoving?.({ chart, overlay, figure: figure ?? undefined, ...event, preventDefault: () => { prevented = true } })
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ignore
            if (prevented) {
              this.getWidget().setForceCursor(null)
            } else {
              this.getWidget().setForceCursor('pointer')
            }
            return true
          }
        }
      }
      this.getWidget().setForceCursor(null)
      return false
    })
  }

  private _createFigureEvents (
    overlay: OverlayImp,
    figureType: EventOverlayInfoFigureType,
    figureIndex: number,
    figure: OverlayFigure
  ): Nullable<EventHandler> {
    if (overlay.isDrawing()) {
      return null
    }
    return {
      mouseMoveEvent: this._figureMouseMoveEvent(overlay, figureType, figureIndex, figure),
      mouseDownEvent: this._figureMouseDownEvent(overlay, figureType, figureIndex, figure),
      mouseClickEvent: this._figureMouseClickEvent(overlay, figureType, figureIndex, figure),
      mouseRightClickEvent: this._figureMouseRightClickEvent(overlay, figureType, figureIndex, figure),
      mouseDoubleClickEvent: this._figureMouseDoubleClickEvent(overlay, figureType, figureIndex, figure)
    }
  }

  private _processOverlayMouseEnterEvent (overlay: OverlayImp, figure: Nullable<OverlayFigure>, event: MouseTouchEvent): boolean {
    if (isFunction(overlay.onMouseEnter) && checkOverlayFigureEvent('onMouseEnter', figure)) {
      overlay.onMouseEnter({ chart: this.getWidget().getPane().getChart(), overlay, figure: figure ?? undefined, ...event })
      return true
    }
    return false
  }

  private _processOverlayMouseLeaveEvent (overlay: OverlayImp, figure: Nullable<OverlayFigure>, event: MouseTouchEvent): boolean {
    if (isFunction(overlay.onMouseLeave) && checkOverlayFigureEvent('onMouseLeave', figure)) {
      overlay.onMouseLeave({ chart: this.getWidget().getPane().getChart(), overlay, figure: figure ?? undefined, ...event })
      return true
    }
    return false
  }

  private _processOverlaySelectedEvent (overlay: OverlayImp, figure: Nullable<OverlayFigure>, event: MouseTouchEvent): boolean {
    if (checkOverlayFigureEvent('onSelected', figure)) {
      overlay.onSelected?.({ chart: this.getWidget().getPane().getChart(), overlay, figure: figure ?? undefined, ...event })
      return true
    }
    return false
  }

  private _processOverlayDeselectedEvent (overlay: OverlayImp, figure: Nullable<OverlayFigure>, event: MouseTouchEvent): boolean {
    if (checkOverlayFigureEvent('onDeselected', figure)) {
      overlay.onDeselected?.({ chart: this.getWidget().getPane().getChart(), overlay, figure: figure ?? undefined, ...event })
      return true
    }
    return false
  }

  private _figureMouseMoveEvent (overlay: OverlayImp, figureType: EventOverlayInfoFigureType, figureIndex: number, figure: OverlayFigure): MouseTouchEventCallback {
    return (event: MouseTouchEvent) => {
      const pane = this.getWidget().getPane()
      const check = !overlay.isDrawing() && checkOverlayFigureEvent('onMouseMove', figure)
      if (check) {
        let prevented = false
        overlay.onMouseMove?.({ chart: pane.getChart(), overlay, figure, ...event, preventDefault: () => { prevented = true } })
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ignore
        if (prevented) {
          this.getWidget().setForceCursor(null)
        } else {
          this.getWidget().setForceCursor('pointer')
        }
      }

      pane.getChart().getChartStore().setHoverOverlayInfo(
        { paneId: pane.getId(), overlay, figureType, figure, figureIndex },
        (o, f) => this._processOverlayMouseEnterEvent(o, f, event),
        (o, f) => this._processOverlayMouseLeaveEvent(o, f, event)
      )
      return check
    }
  }

  private _figureMouseDownEvent (overlay: OverlayImp, figureType: EventOverlayInfoFigureType, figureIndex: number, figure: OverlayFigure): MouseTouchEventCallback {
    return (event: MouseTouchEvent) => {
      if (overlay.lock) {
        return false
      }
      const pane = this.getWidget().getPane()
      const paneId = pane.getId()
      overlay.startPressedMove(this._coordinateToPoint(overlay, event))
      if (checkOverlayFigureEvent('onPressedMoveStart', figure)) {
        overlay.onPressedMoveStart?.({ chart: pane.getChart(), overlay, figure, ...event })
        pane.getChart().getChartStore().setPressedOverlayInfo({ paneId, overlay, figureType, figureIndex, figure })
        return !overlay.isDrawing()
      }
      return false
    }
  }

  private _figureMouseClickEvent (overlay: OverlayImp, figureType: EventOverlayInfoFigureType, figureIndex: number, figure: OverlayFigure): MouseTouchEventCallback {
    return (event: MouseTouchEvent) => {
      const pane = this.getWidget().getPane()
      const paneId = pane.getId()
      const check = !overlay.isDrawing() && checkOverlayFigureEvent('onClick', figure)
      if (check) {
        overlay.onClick?.({ chart: this.getWidget().getPane().getChart(), overlay, figure, ...event })
      }
      pane.getChart().getChartStore().setClickOverlayInfo(
        { paneId, overlay, figureType, figureIndex, figure },
        (o, f) => this._processOverlaySelectedEvent(o, f, event),
        (o, f) => this._processOverlayDeselectedEvent(o, f, event)
      )
      return check
    }
  }

  private _figureMouseDoubleClickEvent (overlay: OverlayImp, _figureType: EventOverlayInfoFigureType, _figureIndex: number, figure: OverlayFigure): MouseTouchEventCallback {
    return (event: MouseTouchEvent) => {
      if (checkOverlayFigureEvent('onDoubleClick', figure)) {
        overlay.onDoubleClick?.({ ...event, chart: this.getWidget().getPane().getChart(), figure, overlay })
        return !overlay.isDrawing()
      }
      return false
    }
  }

  private _figureMouseRightClickEvent (overlay: OverlayImp, _figureType: EventOverlayInfoFigureType, _figureIndex: number, figure: OverlayFigure): MouseTouchEventCallback {
    return (event: MouseTouchEvent) => {
      if (checkOverlayFigureEvent('onRightClick', figure)) {
        let prevented = false
        overlay.onRightClick?.({ chart: this.getWidget().getPane().getChart(), overlay, figure, ...event, preventDefault: () => { prevented = true } })
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ignore
        if (!prevented) {
          this.getWidget().getPane().getChart().getChartStore().removeOverlay(overlay)
        }
        return !overlay.isDrawing()
      }
      return false
    }
  }

  private _coordinateToPoint (o: Overlay, coordinate: Coordinate): Partial<Point> {
    const point: Partial<Point> = {}
    const pane = this.getWidget().getPane()
    const chart = pane.getChart()
    const paneId = pane.getId()
    const chartStore = chart.getChartStore()
    if (this.coordinateToPointTimestampDataIndexFlag()) {
      const overlayImp = o as OverlayImp
      if (overlayImp.isContinuousDrawingMode()) {
        // For continuous drawing, store precise timestamp for sub-bar positioning
        const floatIndex = chartStore.coordinateToFloatIndex(coordinate.x)
        point.dataIndex = floatIndex
        point.timestamp = chartStore.floatIndexToTimestamp(floatIndex) ?? undefined
      } else {
        // For step-based drawing, snap to candle boundaries
        const xAxis = chart.getXAxisPane().getXAxisComponent()
        const dataIndex = xAxis.convertFromPixel(coordinate.x)
        point.dataIndex = dataIndex
        point.timestamp = chartStore.dataIndexToTimestamp(dataIndex) ?? undefined
      }
    }
    if (this.coordinateToPointValueFlag()) {
      const yAxis = pane.getYAxisComponentById()
      const rawValue = yAxis.convertFromPixel(coordinate.y)
      let value = rawValue
      this._magnetPreview = null
      if (o.mode !== 'normal' && paneId === PaneIdConstants.CANDLE && isNumber(point.dataIndex)) {
        const kLineData = chartStore.getDataByDataIndex(point.dataIndex)
        if (kLineData !== null) {
          const modeSensitivity = o.modeSensitivity
          if (value > kLineData.high) {
            if (o.mode === 'weak_magnet') {
              const highY = yAxis.convertToPixel(kLineData.high)
              const buffValueY = yAxis.reverse ? highY + modeSensitivity : highY - modeSensitivity
              const buffValue = yAxis.convertFromPixel(buffValueY)
              if (value < buffValue) {
                value = kLineData.high
              }
            } else {
              value = kLineData.high
            }
            if (value !== rawValue) {
              this._magnetPreview = {
                label: `High: ${kLineData.high}`,
                x: coordinate.x,
                y: yAxis.convertToPixel(kLineData.high)
              }
            }
          } else if (value < kLineData.low) {
            if (o.mode === 'weak_magnet') {
              const lowY = yAxis.convertToPixel(kLineData.low)
              const buffValueY = yAxis.reverse ? lowY - modeSensitivity : lowY + modeSensitivity
              const buffValue = yAxis.convertFromPixel(buffValueY)
              if (value > buffValue) {
                value = kLineData.low
              }
            } else {
              value = kLineData.low
            }
            if (value !== rawValue) {
              this._magnetPreview = {
                label: `Low: ${kLineData.low}`,
                x: coordinate.x,
                y: yAxis.convertToPixel(kLineData.low)
              }
            }
          } else {
            const max = Math.max(kLineData.open, kLineData.close)
            const min = Math.min(kLineData.open, kLineData.close)
            if (value > max) {
              if (value - max < kLineData.high - value) {
                value = max
              } else {
                value = kLineData.high
              }
            } else if (value < min) {
              if (value - kLineData.low < min - value) {
                value = kLineData.low
              } else {
                value = min
              }
            } else if (max - value < value - min) {
              value = max
            } else {
              value = min
            }
            if (value !== rawValue) {
              const snappedLabel = value === kLineData.open ? 'Open' : value === kLineData.close ? 'Close' : value === kLineData.high ? 'High' : 'Low'
              this._magnetPreview = {
                label: `${snappedLabel}: ${value}`,
                x: coordinate.x,
                y: yAxis.convertToPixel(value)
              }
            }
          }
        }
      }
      point.value = value
    }
    return point
  }

  protected coordinateToPointValueFlag (): boolean {
    return true
  }

  protected coordinateToPointTimestampDataIndexFlag (): boolean {
    return true
  }

  override dispatchEvent (name: EventName, event: MouseTouchEvent): boolean {
    const isDrawing = this.getWidget().getPane().getChart().getChartStore().isOverlayDrawing()
    if (isDrawing) {
      return this.onEvent(name, event)
    }
    return super.dispatchEvent(name, event)
  }

  override drawImp (ctx: CanvasRenderingContext2D): void {
    const overlays = this.getCompleteOverlays()
    overlays.forEach(overlay => {
      if (overlay.visible) {
        this._drawOverlay(ctx, overlay)
      }
    })
    const progressOverlay = this.getProgressOverlay()
    if (isValid(progressOverlay) && progressOverlay.visible) {
      this._drawOverlay(ctx, progressOverlay)
    }
    this._drawMagnetPreview(ctx)
  }

  private _drawMagnetPreview (ctx: CanvasRenderingContext2D): void {
    const info = this._magnetPreview
    if (info === null) { return }
    const { x, y, label } = info
    ctx.save()
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(22, 119, 255, 0.5)'
    ctx.fill()
    ctx.strokeStyle = '#1677FF'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.font = '11px Helvetica Neue, sans-serif'
    const textWidth = ctx.measureText(label).width
    const px = x + 10
    const py = y - 12
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
    ctx.fillRect(px - 4, py - 2, textWidth + 8, 18)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(label, px, py + 12)
    ctx.restore()
  }

  private _drawOverlay (
    ctx: CanvasRenderingContext2D,
    overlay: OverlayImp
  ): void {
    const { points } = overlay
    const pane = this.getWidget().getPane()
    const chart = pane.getChart()
    const chartStore = chart.getChartStore()
    const yAxis = pane.getYAxisComponentById() as unknown as Nullable<YAxis>
    // For continuous drawing overlays, use float indices for smooth rendering
    const isContinuous = overlay.isContinuousDrawingMode()
    const coordinates = coordinatePool.acquire()
    for (const point of points) {
      let dataIndex: Nullable<number> = null
      if (isContinuous && isNumber(point.timestamp)) {
        dataIndex = chartStore.timestampToFloatIndex(point.timestamp)
      } else if (isNumber(point.dataIndex)) {
        dataIndex = point.dataIndex
      } else if (isNumber(point.timestamp)) {
        dataIndex = chartStore.timestampToDataIndex(point.timestamp)
      }
      const coordinate: Coordinate = { x: 0, y: 0 }
      if (isNumber(dataIndex)) {
        coordinate.x = chartStore.dataIndexToCoordinate(dataIndex)
      }
      if (isNumber(point.value)) {
        coordinate.y = yAxis?.convertToPixel(point.value) ?? 0
      }
      coordinates.push(coordinate)
    }
    if (coordinates.length > 0) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- ignore
      // @ts-expect-error
      const figures = [].concat(this.getFigures(overlay, coordinates))
      this.drawFigures(
        ctx,
        overlay,
        figures
      )
    }
    this.drawDefaultFigures(
      ctx,
      overlay,
      coordinates
    )
    coordinatePool.release(coordinates)
  }

  protected drawFigures (ctx: CanvasRenderingContext2D, overlay: OverlayImp, figures: OverlayFigure[]): void {
    const defaultStyles = this.getWidget().getPane().getChart().getStyles().overlay
    figures.forEach((figure, figureIndex) => {
      const { type, styles, attrs } = figure
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- ignore
      // @ts-expect-error
      const attrsArray = [].concat(attrs)
      attrsArray.forEach((ats) => {
        const events = this._createFigureEvents(overlay, 'other', figureIndex, figure)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- ignore
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- ignore
        const ss = { ...defaultStyles[type], ...overlay.styles?.[type], ...styles }
        this.createFigure({
          name: type, attrs: ats, styles: ss
        }, events ?? undefined)?.draw(ctx)
      })
    })
  }

  protected getCompleteOverlays (): OverlayImp[] {
    const pane = this.getWidget().getPane()
    return pane.getChart().getChartStore().getOverlaysByPaneId(pane.getId())
  }

  protected getProgressOverlay (): Nullable<OverlayImp> {
    const pane = this.getWidget().getPane()
    const info = pane.getChart().getChartStore().getProgressOverlayInfo()
    if (isValid(info) && info.paneId === pane.getId()) {
      return info.overlay
    }
    return null
  }

  protected getFigures (
    o: Overlay,
    coordinates: Coordinate[]
  ): OverlayFigure | OverlayFigure[] {
    const widget = this.getWidget()
    const pane = widget.getPane()
    const chart = pane.getChart()
    const yAxis = pane.getYAxisComponentById() as unknown as Nullable<YAxis>
    const xAxis = chart.getXAxisPane().getXAxisComponent()
    const bounding = widget.getBounding()
    return o.createPointFigures?.({ chart, overlay: o, coordinates, bounding, xAxis, yAxis }) ?? []
  }

  protected drawDefaultFigures (
    ctx: CanvasRenderingContext2D,
    overlay: OverlayImp,
    coordinates: Coordinate[]
  ): void {
    if (overlay.needDefaultPointFigure) {
      const chartStore = this.getWidget().getPane().getChart().getChartStore()
      const hoverOverlayInfo = chartStore.getHoverOverlayInfo()
      const clickOverlayInfo = chartStore.getClickOverlayInfo()
      if (
        (hoverOverlayInfo.overlay?.id === overlay.id && hoverOverlayInfo.figureType !== 'none') ||
        (clickOverlayInfo.overlay?.id === overlay.id && clickOverlayInfo.figureType !== 'none')
      ) {
        const defaultStyles = chartStore.getStyles().overlay
        const styles = overlay.styles
        const pointStyles = { ...defaultStyles.point, ...styles?.point }
        coordinates.forEach(({ x, y }, index) => {
          let radius = pointStyles.radius
          let color = pointStyles.color
          let borderColor = pointStyles.borderColor
          let borderSize = pointStyles.borderSize
          if (
            hoverOverlayInfo.overlay?.id === overlay.id &&
            hoverOverlayInfo.figureType === 'point' &&
            hoverOverlayInfo.figure?.key === `${OVERLAY_FIGURE_KEY_PREFIX}point_${index}`
          ) {
            radius = pointStyles.activeRadius
            color = pointStyles.activeColor
            borderColor = pointStyles.activeBorderColor
            borderSize = pointStyles.activeBorderSize
          }

          this.createFigure(
            {
              name: 'circle',
              attrs: { x, y, r: radius + borderSize },
              styles: { color: borderColor }
            },
            this._createFigureEvents(
              overlay,
              'point',
              index,
              {
                key: `${OVERLAY_FIGURE_KEY_PREFIX}point_${index}`,
                type: 'circle',
                attrs: { x, y, r: radius + borderSize },
                styles: { color: borderColor }
              }
            ) ?? undefined
          )?.draw(ctx)
          this.createFigure({
            name: 'circle',
            attrs: { x, y, r: radius },
            styles: { color }
          })?.draw(ctx)
        })
      }
    }
  }
}
