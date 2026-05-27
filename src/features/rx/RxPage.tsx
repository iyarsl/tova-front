import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/PageTransition'
import { Topbar } from '@/components/Topbar'
import { useRxStream } from './useRxStream'
import { useVortexConfig } from '@/features/vortex/useVortexConfig'
import { useTheme } from '@/hooks/useTheme'
import type { SignalData, RxStatus } from '@/types/rx'
import _Plot from 'react-plotly.js'
import type { PlotParams } from 'react-plotly.js'
// CJS/ESM interop: Vite may expose the module as { default: Component }
const Plot = (_Plot as unknown as { default: React.ComponentType<PlotParams> }).default
  ?? (_Plot as unknown as React.ComponentType<PlotParams>)

type Tab = 'time' | 'fft' | 'spectrogram'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'time',        label: 'Time Domain',  icon: '∿' },
  { id: 'fft',         label: 'FFT',          icon: '⌇' },
  { id: 'spectrogram', label: 'Spectrogram',  icon: '▦' },
]

const STATUS_CHIP: Record<RxStatus, { dot: string; label: string }> = {
  connecting: { dot: 'bg-sunshine',     label: 'Connecting…' },
  streaming:  { dot: 'bg-meadow-green', label: 'Live'        },
  silence:    { dot: 'bg-whisper-gray', label: 'Silence'     },
  no_device:  { dot: 'bg-sunset-red',   label: 'No Device'   },
  done:       { dot: 'bg-whisper-gray', label: 'Done'        },
  error:      { dot: 'bg-sunset-red',   label: 'Reconnecting…'},
}

const NO_DATA_MSG: Record<RxStatus, string> = {
  connecting: 'Connecting to stream…',
  streaming:  'Waiting for first frame…',
  silence:    'No signal — silence reported by device',
  no_device:  'No device connected',
  done:       'Stream ended',
  error:      'Connection lost — reconnecting…',
}

export function RxPage() {
  const [tab, setTab] = useState<Tab>('time')
  const [frozen, setFrozen]         = useState(false)
  const [frozenData, setFrozenData] = useState<SignalData | null>(null)

  const { data: liveData, status, sampleRate } = useRxStream()
  const { config: vortexConfig } = useVortexConfig()
  const { theme } = useTheme()

  const centerFreq = vortexConfig ? (vortexConfig.rfin_hz / 1e6).toFixed(0) : '—'
  const data: SignalData | null = frozen ? frozenData : liveData

  function handleToggle() {
    if (!frozen) setFrozenData(liveData)
    setFrozen(f => !f)
  }

  const isDark     = theme === 'dark'
  const bgColor    = isDark ? '#030712'  : '#0A1628'
  const paperColor = isDark ? '#111827'  : '#0F2040'
  const gridColor  = isDark ? '#1f2937'  : 'rgba(255,255,255,0.06)'
  const textColor  = isDark ? '#6b7280'  : 'rgba(255,255,255,0.45)'
  const lineColor  = '#5BC8F5'  // sky-blue-d for both modes in Dora

  const layoutBase: Partial<Plotly.Layout> = {
    paper_bgcolor: paperColor,
    plot_bgcolor:  bgColor,
    margin:        { t: 16, r: 24, b: 48, l: 56 },
    font:          { family: 'JetBrains Mono', size: 11, color: textColor },
    xaxis: { gridcolor: gridColor, zerolinecolor: gridColor, tickfont: { size: 10 } },
    yaxis: { gridcolor: gridColor, zerolinecolor: gridColor, tickfont: { size: 10 } },
  }

  const chip = STATUS_CHIP[status]

  return (
    <PageTransition>
      <div className="h-full flex flex-col overflow-hidden bg-sky-canvas dark:bg-base-950 transition-colors">
        <Topbar title="RX Graphs" />

        {/* Tab bar */}
        <div className="flex items-center gap-1 px-5 pt-3 pb-0 border-b border-[#F0EBD8] dark:border-white/[0.07] bg-cream-page dark:bg-base-900 transition-colors">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 px-5 py-2.5 text-[13px] font-display font-bold tracking-wide uppercase transition-colors rounded-t-[12px] ${
                tab === t.id
                  ? 'text-white'
                  : 'text-whisper-gray dark:text-[#6b7280] hover:text-tale-gray dark:hover:text-[#d1d5db] hover:bg-pastel-orange/30 dark:hover:bg-white/5'
              }`}
              style={tab === t.id ? {
                background: 'linear-gradient(135deg, #5BC8F5, #3BA8D5)',
                boxShadow: '0 4px 12px rgba(91,200,245,0.45)',
              } : {}}
            >
              <span className="text-base">{t.icon}</span>
              {t.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-3 pb-2">
            {/* Status chip */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${chip.dot} ${status === 'streaming' ? 'animate-pulse' : ''}`} />
              <span className="font-body text-xs font-semibold text-whisper-gray dark:text-[#4b5563]">{chip.label}</span>
            </div>

            {/* Center freq / sample rate */}
            <span className="font-mono text-xs text-whisper-gray dark:text-[#4b5563]">
              {centerFreq} MHz · {sampleRate > 0 ? (sampleRate / 1e6).toFixed(1) : '—'} Msps
            </span>

            {/* Freeze / Resume button */}
            <button
              onClick={handleToggle}
              className="px-4 py-1.5 rounded-full font-display font-bold text-xs border-2 transition-all hover:-translate-y-0.5"
              style={
                !frozen
                  ? {
                    border: '2px solid #9B5DE5',
                    color: '#9B5DE5',
                    background: 'transparent',
                  }
                  : {
                    background: 'linear-gradient(135deg, #FF8C42, #E06A1A)',
                    border: '2px solid transparent',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 14px rgba(255,140,66,0.40)',
                  }
              }
            >
              {!frozen ? '⏹ Freeze' : '▶ Resume'}
            </button>
          </div>
        </div>

        {/* Chart area */}
        <div className="flex-1 relative overflow-hidden p-4 bg-sky-canvas dark:bg-base-950">
          <div className="absolute inset-4 rounded-[20px] border border-sky-blue-d/40 dark:border-white/[0.07] bg-pastel-blue dark:bg-base-900/40 p-3 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{    opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-3 rounded-[12px] overflow-hidden"
              >
                {tab === 'time' && data && (
                  <Plot
                    data={[{
                      x: data.time.x,
                      y: data.time.y,
                      type: 'scatter',
                      mode: 'lines',
                      line: { color: lineColor, width: 1.5 },
                      name: 'Amplitude',
                    }]}
                    layout={{
                      ...layoutBase,
                      uirevision: 'time',
                      xaxis: { ...layoutBase.xaxis, title: { text: 'Time (ms)', font: { size: 10, color: textColor } } },
                      yaxis: { ...layoutBase.yaxis, title: { text: 'Amplitude', font: { size: 10, color: textColor } } },
                    }}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler
                  />
                )}

                {tab === 'fft' && data && (
                  <Plot
                    data={[{
                      x: data.fft.x,
                      y: data.fft.y,
                      type: 'scatter',
                      mode: 'lines',
                      fill: 'tozeroy',
                      fillcolor: 'rgba(91,200,245,0.10)',
                      line: { color: lineColor, width: 1.5 },
                      name: 'Power',
                    }]}
                    layout={{
                      ...layoutBase,
                      uirevision: 'fft',
                      xaxis: { ...layoutBase.xaxis, title: { text: 'Frequency offset (MHz)', font: { size: 10, color: textColor } } },
                      yaxis: { ...layoutBase.yaxis, title: { text: 'Power (dBm)',             font: { size: 10, color: textColor } } },
                    }}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler
                  />
                )}

                {tab === 'spectrogram' && data && (
                  <Plot
                    data={[{
                      z: data.spectrogram,
                      type: 'heatmap',
                      colorscale: 'Jet',
                      showscale: true,
                      colorbar: {
                        thickness: 12,
                        tickfont: { size: 10, color: textColor },
                        title: { text: 'dBm', font: { size: 10, color: textColor } },
                      },
                    }]}
                    layout={{
                      ...layoutBase,
                      uirevision: 'spectrogram',
                      xaxis: { ...layoutBase.xaxis, title: { text: 'Frequency bin', font: { size: 10, color: textColor } } },
                      yaxis: { ...layoutBase.yaxis, title: { text: 'Time →',         font: { size: 10, color: textColor } } },
                    }}
                    config={{ displayModeBar: false, responsive: true }}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler
                  />
                )}

                {!data && (
                  <div className="flex items-center justify-center h-full">
                    <span className="font-body text-sm text-white/40">
                      {NO_DATA_MSG[status]}
                    </span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
