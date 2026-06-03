import type { ZoomLayout } from '@/types/rx'
import { getChartColors, Plot } from '@/utils/chartTheme'

type Props = {
  x: number[]
  y: number[]
  theme: 'dark' | 'light'
  zoomLayout?: ZoomLayout
  onRelayout?: (event: Plotly.PlotRelayoutEvent) => void
  /** Y-axis title — defaults to 'Amplitude'; the RX analyze view passes 'Power (dB)'. */
  yTitle?: string
}

export function TimeDomainChart({ x, y, theme, zoomLayout = {}, onRelayout, yTitle = 'Amplitude' }: Props) {
  const { bgColor, paperColor, gridColor, textColor } = getChartColors(theme)
  const lineColor = '#22d3ee'

  return (
    <Plot
      data={[{
        x,
        y,
        type:  'scatter',
        mode:  'lines',
        line:  { color: lineColor, width: 1.5 },
        name:  'Amplitude',
      }]}
      layout={{
        paper_bgcolor: paperColor,
        plot_bgcolor:  bgColor,
        margin:        { t: 16, r: 24, b: 48, l: 56 },
        font:          { family: 'JetBrains Mono', size: 11, color: textColor },
        uirevision:    'time',
        xaxis: {
          gridcolor:     gridColor,
          zerolinecolor: gridColor,
          tickfont:      { size: 10 },
          title:         { text: 'Time (ms)', font: { size: 10, color: textColor } },
          ...(zoomLayout.xRange && { range: zoomLayout.xRange as [number, number], autorange: false }),
        },
        yaxis: {
          gridcolor:     gridColor,
          zerolinecolor: gridColor,
          tickfont:      { size: 10 },
          title:         { text: yTitle, font: { size: 10, color: textColor } },
          ...(zoomLayout.yRange && { range: zoomLayout.yRange as [number, number], autorange: false }),
        },
      }}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler
      onRelayout={onRelayout}
    />
  )
}
