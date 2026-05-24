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
  connecting: { dot: 'bg-yellow-400',  label: 'Connecting…'   },
  streaming:  { dot: 'bg-emerald-400', label: 'Live'          },
  silence:    { dot: 'bg-gray-400',    label: 'Silence'       },
  no_device:  { dot: 'bg-rose-500',    label: 'No Device'     },
  done:       { dot: 'bg-gray-400',    label: 'Done'          },
  error:      { dot: 'bg-rose-500',    label: 'Reconnecting…' },
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
  const bgColor    = isDark ? '#030712'  : '#f9fafb'
  const paperColor = isDark ? '#111827'  : '#ffffff'
  const gridColor  = isDark ? '#1f2937'  : '#e5e7eb'
  const textColor  = isDark ? '#6b7280'  : '#9ca3af'
  const lineColor  = '#22d3ee'

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
      <div className="h-full flex flex-col overflow-hidden dark:bg-base-950 bg-[#f9fafb] transition-colors">
        <Topbar title="RX Graphs" />

        {/* Tab bar */}
        <div className="flex items-center gap-1 px-5 pt-3 pb-0 border-b dark:border-white/[0.07] border-black/[0.08] dark:bg-base-900 bg-white transition-colors">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-xs font-medium tracking-widest uppercase transition-colors rounded-t-lg ${
                tab === t.id
                  ? 'dark:text-cyan-400 text-[#0891b2]'
                  : 'dark:text-[#6b7280] text-[#9ca3af] dark:hover:text-[#d1d5db] hover:text-[#6b7280]'
              }`}
            >
              <span className="text-base">{t.icon}</span>
              {t.label}
              {tab === t.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-violet-500"
                />
              )}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-3 pb-2">
            {/* Status chip */}
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${chip.dot} ${status === 'streaming' ? 'animate-pulse' : ''}`} />
              <span className="font-mono text-xs dark:text-[#4b5563] text-[#9ca3af]">{chip.label}</span>
            </div>

            {/* Center freq / sample rate */}
            <span className="font-mono text-xs dark:text-[#4b5563] text-[#9ca3af]">
              {centerFreq} MHz · {sampleRate > 0 ? (sampleRate / 1e6).toFixed(1) : '—'} Msps
            </span>

            {/* Freeze / Resume button */}
            <button
              onClick={handleToggle}
              className={`px-4 py-1.5 rounded-[8px] font-mono text-xs font-medium border transition-all ${
                !frozen
                  ? 'dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10 border-rose-400/40 text-rose-500 hover:bg-rose-50'
                  : 'dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/10 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              {!frozen ? '⏹ Freeze' : '▶ Resume'}
            </button>
          </div>
        </div>

        {/* Chart area */}
        <div className="flex-1 relative overflow-hidden p-4 dark:bg-base-950 bg-[#f9fafb]">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{    opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-4"
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
                    fillcolor: 'rgba(34,211,238,0.07)',
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
                  <span className="font-mono text-sm dark:text-[#4b5563] text-[#9ca3af]">
                    {NO_DATA_MSG[status]}
                  </span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  )
}
