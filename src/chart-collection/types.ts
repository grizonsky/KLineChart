export type MultiChartLayout = 'single' | 'horizontal' | 'vertical' | 'grid' | '2x2' | '2x3' | '3x2' | '3x3' | '2x1' | '1x2'

export interface MultiChartOptions {
  panes: MultiChartPane[]
  layout?: MultiChartLayout
  cols?: number
  rows?: number
  crosshairSync?: boolean
  timeScaleSync?: boolean
}

export interface MultiChartPane {
  id: string
  symbol?: string
  period?: { span: number; type: string }
  styles?: string | Record<string, unknown>
}
