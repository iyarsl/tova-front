import { motion, AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/PageTransition'
import { Topbar } from '@/components/Topbar'
import { useRxStreamContext } from './RxStreamContext'
import type { Tab } from './RxStreamContext'
import { useVortexConfig } from '@/features/vortex/useVortexConfig'
import { useTheme } from '@/hooks/useTheme'
import type { RxStatus } from '@/types/rx'
import { SpectrogramChart } from '@/components/signal/SpectrogramChart'
import { RxAnalyzeView } from './RxAnalyzeView'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'analyze',     label: 'FFT + Time Domain', icon: '⌇' },
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

function GraphPlaceholder({ type }: { type: 'analyze' | 'spectrogram' }) {
  return (
    <svg
      viewBox="0 0 200 80"
      className="w-48 h-20 opacity-[0.18] dark:opacity-[0.10]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      {/* axes */}
      <line x1="20" y1="10" x2="20" y2="70" />
      <line x1="20" y1="70" x2="190" y2="70" />

      {type === 'analyze' && (
        <>
          <line x1="40"  y1="70" x2="40"  y2="55" />
          <line x1="60"  y1="70" x2="60"  y2="35" />
          <line x1="80"  y1="70" x2="80"  y2="20" />
          <line x1="100" y1="70" x2="100" y2="45" />
          <line x1="120" y1="70" x2="120" y2="58" />
          <line x1="140" y1="70" x2="140" y2="62" />
          <line x1="160" y1="70" x2="160" y2="66" />
        </>
      )}

      {type === 'spectrogram' && (
        <>
          {([25, 45, 65, 85, 105, 125, 145, 165, 185] as number[]).map(x =>
            ([18, 32, 46, 60] as number[]).map(y => (
              <rect key={`${x}-${y}`} x={x} y={y} width={14} height={10} rx="1"
                opacity={((x + y) % 3 === 0) ? 0.6 : 0.2} fill="currentColor" stroke="none" />
            ))
          )}
        </>
      )}
    </svg>
  )
}

export function RxPage() {
  const {
    status,
    sampleRate,
    tab,
    setTab,
    frozen,
    handleToggle,
    displayData,
    zoomLayouts,
    handleRelayout,
    linked,
    setLinked,
    bottomMode,
    setBottomMode,
  } = useRxStreamContext()

  const { config: vortexConfig } = useVortexConfig()
  const { theme } = useTheme()

  const centerFreq = vortexConfig ? (vortexConfig.rfin_hz / 1e6).toFixed(0) : '—'
  const data = displayData

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
                {tab === 'analyze' && data && (
                  <RxAnalyzeView
                    data={data}
                    theme={theme}
                    zoomLayouts={zoomLayouts}
                    onRelayout={handleRelayout}
                    linked={linked}
                    setLinked={setLinked}
                    bottomMode={bottomMode}
                    setBottomMode={setBottomMode}
                  />
                )}

                {tab === 'spectrogram' && data && (
                  <SpectrogramChart
                    history={data.spectrogram}
                    theme={theme}
                    zoomLayout={zoomLayouts.spectrogram}
                    onRelayout={(e) => handleRelayout('spectrogram', e)}
                  />
                )}

                {!data && (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <GraphPlaceholder type={tab} />
                    <span className="font-body text-sm text-whisper-gray dark:text-white/30">
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
