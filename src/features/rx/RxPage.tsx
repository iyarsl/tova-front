import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { m, AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/PageTransition'
import { Topbar } from '@/components/Topbar'
import { useToast } from '@/components/Toast'
import { useRxStreamContext } from './RxStreamContext'
import type { Tab, ChartKey } from './RxStreamContext'
import { useVortexConfig } from '@/features/vortex/useVortexConfig'
import { useTheme } from '@/hooks/useTheme'
import type { RxStatus } from '@/types/rx'
import { TimeDomainChart } from '@/components/signal/TimeDomainChart'
import { FftChart } from '@/components/signal/FftChart'
import { SpectrogramChart } from '@/components/signal/SpectrogramChart'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'combined',    label: 'FFT + Time',   icon: '⌇∿' },
  { id: 'spectrogram', label: 'Spectrogram',  icon: '▦'  },
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

function GraphPlaceholder({ type }: { type: ChartKey }) {
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

      {type === 'time' && (
        <path d="M20 40 Q50 10 80 40 Q110 70 140 40 Q160 20 190 40" strokeLinecap="round" />
      )}

      {type === 'fft' && (
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
    buildCapture,
    isStreamStarted,
    startStream,
    stopStream,
  } = useRxStreamContext()

  const { config: vortexConfig } = useVortexConfig()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSaveToPlayer = useCallback(() => {
    const capture = buildCapture(3)
    if (!capture) {
      toast('Not enough data — stream a signal first', 'error')
      return
    }
    navigate('/player', { state: { capture } })
  }, [buildCapture, navigate, toast])

  const handleDownload = useCallback(() => {
    const capture = buildCapture(3)
    if (!capture) {
      toast('Not enough data — stream a signal first', 'error')
      return
    }
    const blob = new Blob([capture.samples.buffer as ArrayBuffer], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = capture.fileName
    a.click()
    URL.revokeObjectURL(url)
  }, [buildCapture, toast])

  const [freqGhz, setFreqGhz]   = useState<number | ''>(vortexConfig ? vortexConfig.rfin_hz / 1e9 : '')
  const [srMsps, setSrMsps]     = useState<number | ''>(1)
  const [gainDb, setGainDb]     = useState<number | ''>(20)
  const [duration, setDuration] = useState<number | ''>('')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [streamPending, setStreamPending] = useState(false)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fieldErrors = {
    freq:     freqGhz === '' || (typeof freqGhz === 'number' && freqGhz <= 0),
    sr:       srMsps  === '' || (typeof srMsps  === 'number' && srMsps  <= 0),
    gain:     gainDb  === '' || (typeof gainDb  === 'number' && (gainDb < 0 || gainDb > 90)),
    duration: typeof duration === 'number' && duration <= 0,
  }
  const hasErrors = Object.values(fieldErrors).some(Boolean)

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null }
    setCountdown(null)
  }, [])

  useEffect(() => {
    if (!isStreamStarted) clearCountdown()
  }, [isStreamStarted, clearCountdown])

  useEffect(() => {
    if (vortexConfig && freqGhz === '') setFreqGhz(vortexConfig.rfin_hz / 1e9)
  }, [vortexConfig]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = useCallback(async () => {
    const freq = typeof freqGhz === 'number' ? freqGhz * 1e9 : 100e6
    const sr   = typeof srMsps  === 'number' ? srMsps  * 1e6 : 1e6
    const gain = typeof gainDb  === 'number' ? gainDb        : 20
    setStreamPending(true)
    const dur = typeof duration === 'number' && duration > 0 && isFinite(duration) ? duration : undefined
    await startStream({ frequency: freq, sample_rate: sr, gain, bandwidth: sr }, dur)
    setStreamPending(false)
    if (dur) {
      setCountdown(dur)
      countdownRef.current = setInterval(() => {
        setCountdown(c => {
          if (c === null || c <= 1) { clearCountdown(); return null }
          return c - 1
        })
      }, 1000)
    }
  }, [duration, startStream, clearCountdown])

  const handleStop = useCallback(async () => {
    setStreamPending(true)
    clearCountdown()
    await stopStream()
    setStreamPending(false)
  }, [stopStream, clearCountdown])

  const centerFreq = vortexConfig ? (vortexConfig.rfin_hz / 1e6).toFixed(0) : '—'
  const data = displayData

  const inputCls = (err: boolean) =>
    `px-2 py-1 rounded-[8px] font-mono text-xs text-center bg-white dark:bg-base-800 border focus:outline-none disabled:opacity-50 text-map-brown dark:text-[#d1d5db] placeholder:text-whisper-gray dark:placeholder:text-[#4b5563] transition-colors ${
      err
        ? 'border-rose-400 dark:border-rose-500 focus:border-rose-500'
        : 'border-tale-gray/25 dark:border-white/10 focus:border-sky-blue-d/60'
    }`

  const chip = STATUS_CHIP[status]

  return (
    <PageTransition>
      <div className="h-full flex flex-col overflow-hidden bg-transparent dark:bg-base-950 transition-colors">
        <Topbar title="Live Signal View" />

        {/* Tab bar */}
        <div className="flex items-center gap-1 px-5 pt-3 pb-0 border-b border-[#F0EBD8] dark:border-white/[0.07] bg-cream-page dark:bg-base-900 transition-colors">
          {TABS.map(t => (
            <button type="button"
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

            {/* Stream controls */}
            <div className="flex items-center gap-2 pr-3 border-r border-tale-gray/20 dark:border-white/10">
              {/* RX config inputs — always visible, disabled while streaming */}
              <>
                <input
                  type="number" min={0.001} step={0.001} value={freqGhz}
                  onChange={e => setFreqGhz(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="freq"
                  disabled={streamPending || isStreamStarted}
                  title="Center frequency in GHz (must be > 0)"
                  className={`w-20 ${inputCls(fieldErrors.freq)}`}
                />
                <span className="font-mono text-[10px] text-whisper-gray dark:text-[#4b5563] select-none">GHz</span>
                <input
                  type="number" min={0.1} step={0.1} value={srMsps}
                  onChange={e => setSrMsps(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="SR"
                  disabled={streamPending || isStreamStarted}
                  title="Sample rate in MSps (must be > 0)"
                  className={`w-16 ${inputCls(fieldErrors.sr)}`}
                />
                <span className="font-mono text-[10px] text-whisper-gray dark:text-[#4b5563] select-none">MSps</span>
                <input
                  type="number" min={0} max={90} step={1} value={gainDb}
                  onChange={e => setGainDb(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="gain"
                  disabled={streamPending || isStreamStarted}
                  title="Gain in dB (0–90)"
                  className={`w-14 ${inputCls(fieldErrors.gain)}`}
                />
                <span className="font-mono text-[10px] text-whisper-gray dark:text-[#4b5563] select-none">dB</span>
                <div className="w-px h-4 bg-tale-gray/20 dark:bg-white/10 mx-1" />
                <input
                  type="number" min={0.1} step={0.1} value={duration}
                  onChange={e => setDuration(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="∞"
                  disabled={streamPending || isStreamStarted}
                  title="Duration in seconds — leave blank for continuous"
                  className={`w-16 ${inputCls(fieldErrors.duration)}`}
                />
                <span className="font-mono text-[10px] text-whisper-gray dark:text-[#4b5563] select-none">s</span>
              </>
              {countdown !== null && isStreamStarted && (
                <span className="font-mono text-[11px] font-bold text-sky-blue-d dark:text-cyan-400 tabular-nums min-w-[28px] text-center">
                  {countdown}s
                </span>
              )}
              <button
                type="button"
                disabled={streamPending || (!isStreamStarted && hasErrors)}
                onClick={isStreamStarted ? handleStop : handleStart}
                className="px-3 py-1.5 rounded-full font-display font-bold text-xs border-2 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                style={isStreamStarted
                  ? { border: '2px solid #f43f5e', color: '#f43f5e', background: 'transparent' }
                  : { background: 'linear-gradient(135deg, #34d399, #059669)', border: '2px solid transparent', color: '#fff', boxShadow: '0 3px 10px rgba(52,211,153,0.35)' }
                }
              >
                {streamPending ? '…' : isStreamStarted ? '■ Stop' : '▶ Stream'}
              </button>
            </div>

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
            <button type="button"
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

            {/* Capture controls — visible only when frozen */}
            {frozen && (
                <div
                  className="flex items-center gap-2 pl-3 border-l border-tale-gray/20 dark:border-white/10"
                >
                  {/* Save to Player */}
                  <button type="button"
                    onClick={handleSaveToPlayer}
                    title="Load last 3 seconds into Signal Player"
                    className="px-3 py-1.5 rounded-full font-display font-bold text-xs text-white border-2 border-transparent bg-[linear-gradient(135deg,#5BC8F5,#3BA8D5)] shadow-[0_3px_10px_rgba(91,200,245,0.40)] transition-all hover:-translate-y-0.5 active:scale-95"
                  >
                    → Player
                  </button>

                  {/* Download */}
                  <button type="button"
                    onClick={handleDownload}
                    title="Download as .fc32 file"
                    className="px-3 py-1.5 rounded-full font-display font-bold text-xs text-sky-blue-d border-2 border-sky-blue-d/45 bg-transparent transition-all hover:-translate-y-0.5 active:scale-95"
                  >
                    ↓ .fc32
                  </button>
                </div>
            )}
          </div>
        </div>

        {/* Chart area */}
        <div className="flex-1 relative overflow-hidden p-4 bg-transparent dark:bg-base-950">
          <div className="absolute inset-4 rounded-[20px] border border-sky-blue-d/40 dark:border-white/[0.07] bg-pastel-blue dark:bg-base-900/40 p-3 overflow-hidden">
            <AnimatePresence mode="wait">
              <m.div
                key={tab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{    opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-3 rounded-[12px] overflow-hidden"
              >
                {tab === 'combined' && data && (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-hidden">
                      <FftChart
                        x={data.fft.x}
                        y={data.fft.y}
                        theme={theme}
                        zoomLayout={zoomLayouts.fft}
                        onRelayout={(e) => handleRelayout('fft', e)}
                      />
                    </div>
                    <div className="flex items-center gap-3 px-3 py-1 shrink-0">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#5BC8F5]/40 to-transparent" />
                      <span className="font-mono text-[10px] tracking-[0.18em] uppercase select-none text-[#5BC8F5]/50 dark:text-[#5BC8F5]/35 px-1">
                        ⌇ fft · time ∿
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#5BC8F5]/40 to-transparent" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <TimeDomainChart
                        x={data.time.x}
                        y={data.time.y}
                        theme={theme}
                        zoomLayout={zoomLayouts.time}
                        onRelayout={(e) => handleRelayout('time', e)}
                      />
                    </div>
                  </div>
                )}

                {tab === 'spectrogram' && data && (
                  <SpectrogramChart
                    history={data.spectrogram}
                    theme={theme}
                    zoomLayout={zoomLayouts.spectrogram}
                    onRelayout={(e) => handleRelayout('spectrogram', e)}
                  />
                )}

                {!data && tab === 'combined' && (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 flex flex-col items-center justify-center gap-3">
                      <div className="text-sky-blue-d dark:text-white">
                        <GraphPlaceholder type="fft" />
                      </div>
                      <span className="font-body text-sm text-whisper-gray dark:text-white/30">
                        {NO_DATA_MSG[status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-1 shrink-0">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#5BC8F5]/40 to-transparent" />
                      <span className="font-mono text-[10px] tracking-[0.18em] uppercase select-none text-[#5BC8F5]/50 dark:text-[#5BC8F5]/35 px-1">
                        ⌇ fft · time ∿
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#5BC8F5]/40 to-transparent" />
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center gap-3">
                      <div className="text-sky-blue-d dark:text-white">
                        <GraphPlaceholder type="time" />
                      </div>
                    </div>
                  </div>
                )}

                {!data && tab === 'spectrogram' && (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <div className="text-sky-blue-d dark:text-white">
                      <GraphPlaceholder type="spectrogram" />
                    </div>
                    <span className="font-body text-sm text-whisper-gray dark:text-white/30">
                      {NO_DATA_MSG[status]}
                    </span>
                  </div>
                )}
              </m.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

