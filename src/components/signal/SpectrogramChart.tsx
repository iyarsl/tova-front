import type { ZoomLayout } from '@/types/rx'
import { getChartColors, Plot } from '@/utils/chartTheme'

const DEFAULT_ZOOM: ZoomLayout = {}

type Props = {
  history: number[][]
  theme: 'dark' | 'light'
  zoomLayout?: ZoomLayout
  onRelayout?: (event: Plotly.PlotRelayoutEvent) => void
}

export function SpectrogramChart({ history, theme, zoomLayout = DEFAULT_ZOOM, onRelayout }: Props) {
  const { bgColor, paperColor, gridColor, textColor } = getChartColors(theme)

  return (
    <Plot
      data={[{
        z:          history,
        type:       'heatmap',
        colorscale: 'Jet',
        showscale:  true,
        colorbar: {
          thickness: 12,
          tickfont:  { size: 10, color: textColor },
          title:     { text: 'dBm', font: { size: 10, color: textColor } },
        },
      }]}
      layout={{
        paper_bgcolor: paperColor,
        plot_bgcolor:  bgColor,
        margin:        { t: 16, r: 24, b: 48, l: 56 },
        font:          { family: 'JetBrains Mono', size: 11, color: textColor },
        uirevision:    'spectrogram',
        xaxis: {
          gridcolor:     gridColor,
          zerolinecolor: gridColor,
          tickfont:      { size: 10 },
          title:         { text: 'Frequency offset (MHz)', font: { size: 10, color: textColor } },
          ...(zoomLayout.xRange && { range: zoomLayout.xRange as [number, number], autorange: false }),
        },
        yaxis: {
          gridcolor:     gridColor,
          zerolinecolor: gridColor,
          tickfont:      { size: 10 },
          title:         { text: 'Time →', font: { size: 10, color: textColor } },
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
