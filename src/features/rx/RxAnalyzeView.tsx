import { Switch } from '@/components/Switch'
import { FftChart } from '@/components/signal/FftChart'
import { TimeDomainChart } from '@/components/signal/TimeDomainChart'
import type { BottomMode, ChartId, SignalData, ZoomLayout } from '@/types/rx'

type Props = {
  data: SignalData
  theme: 'dark' | 'light'
  zoomLayouts: Record<ChartId, ZoomLayout>
  onRelayout: (chart: ChartId, event: Plotly.PlotRelayoutEvent) => void
  linked: boolean
  setLinked: (v: boolean) => void
  bottomMode: BottomMode
  setBottomMode: (m: BottomMode) => void
}

const MODES: { id: BottomMode; label: string }[] = [
  { id: 'envelope', label: 'dB Envelope' },
  { id: 'waveform', label: 'Waveform' },
]

/** Band readout text from the FFT x-zoom. */
function bandLabel(linked: boolean, fftZoom: ZoomLayout): string {
  if (!linked || !fftZoom.xRange) return 'Full band'
  const [a, b] = fftZoom.xRange
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  return `Filtered: ${lo.toFixed(2)} – ${hi.toFixed(2)} MHz`
}

export function RxAnalyzeView({
  data,
  theme,
  zoomLayouts,
  onRelayout,
  linked,
  setLinked,
  bottomMode,
  setBottomMode,
}: Props) {
  const isEnvelope = bottomMode === 'envelope'
  const bottomY = isEnvelope ? (data.time.envDb ?? data.time.y) : data.time.y
  const bottomTitle = isEnvelope ? 'Power (dB)' : 'Amplitude'

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Controls */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 px-1">
        <Switch checked={linked} onChange={setLinked} label="Link FFT → Time" />

        {/* Band readout */}
        <span
          className={`rounded-full px-2.5 py-1 font-mono text-[11px] transition-colors ${
            linked && zoomLayouts.fft.xRange
              ? 'bg-pastel-orange text-[#C2410C] dark:bg-[#FF8C42]/15 dark:text-[#FFB07A]'
              : 'bg-sky-canvas text-tale-gray dark:bg-base-800 dark:text-[#9ca3af]'
          }`}
        >
          {bandLabel(linked, zoomLayouts.fft)}
        </span>

        {/* Display-mode segmented toggle */}
        <div className="ml-auto flex items-center gap-0.5 rounded-full bg-[#E3F4FF] p-0.5 dark:bg-base-800">
          {MODES.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setBottomMode(m.id)}
              aria-pressed={bottomMode === m.id}
              className={`rounded-full px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wide transition-all ${
                bottomMode === m.id
                  ? 'text-white'
                  : 'text-whisper-gray hover:text-tale-gray dark:text-[#6b7280] dark:hover:text-[#d1d5db]'
              }`}
              style={bottomMode === m.id ? {
                background: 'linear-gradient(135deg, #5BC8F5, #3BA8D5)',
                boxShadow: '0 2px 8px rgba(91,200,245,0.40)',
              } : {}}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* FFT (top) */}
      <div className="min-h-0 flex-[5]">
        <FftChart
          x={data.fft.x}
          y={data.fft.y}
          theme={theme}
          zoomLayout={zoomLayouts.fft}
          onRelayout={(e) => onRelayout('fft', e)}
        />
      </div>

      {/* Filtered time domain (bottom) */}
      <div className="min-h-0 flex-[4]">
        <TimeDomainChart
          x={data.time.x}
          y={bottomY}
          yTitle={bottomTitle}
          theme={theme}
          zoomLayout={zoomLayouts.time}
          onRelayout={(e) => onRelayout('time', e)}
        />
      </div>
    </div>
  )
}
