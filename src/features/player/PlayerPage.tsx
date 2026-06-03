import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/PageTransition'
import { Topbar } from '@/components/Topbar'
import { useToast } from '@/components/Toast'
import { useTheme } from '@/hooks/useTheme'
import { TimeDomainChart } from '@/components/signal/TimeDomainChart'
import { FftChart } from '@/components/signal/FftChart'
import { SpectrogramChart } from '@/components/signal/SpectrogramChart'
import { FileDropzone } from './FileDropzone'
import { usePlayer } from './PlayerContext'
import type { PlayerTab } from './useFilePlayer'

const TABS: { id: PlayerTab; label: string; icon: string }[] = [
  { id: 'time',        label: 'Time Domain', icon: '∿' },
  { id: 'fft',         label: 'FFT',         icon: '⌇' },
  { id: 'spectrogram', label: 'Spectrogram', icon: '▦' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0.000s'
  const s = Math.floor(seconds)
  const ms = Math.floor((seconds - s) * 1000)
  return `${s}.${ms.toString().padStart(3, '0')}s`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PlayerPage() {
  const { toast } = useToast()
  const { theme } = useTheme()

  const player = usePlayer()

  // --- local sample-rate input state ----------------------------------------
  // Initialise from the persisted player state so the value survives navigation
  const [srInput, setSrInput]   = useState(() =>
    player.sampleRate > 0 ? String(player.sampleRate) : '2000000'
  )
  const [srError, setSrError]   = useState('')
  const srInputRef = useRef<HTMLInputElement>(null)

  // --- file loading ----------------------------------------------------------
  // Validate sample rate at play-time, not load-time — user should be able to
  // drop a file first and then set sample rate before hitting play.
  const pendingFileRef = useRef<File | null>(null)
  // Track the currently loaded file so SR changes can trigger a reload
  const loadedFileRef  = useRef<File | null>(null)

  // Drag state for the chart area (issue 7)
  const [chartAreaDragging, setChartAreaDragging] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.fc32')) {
      toast('Only .fc32 files accepted', 'error')
      return
    }

    if (file.size > 500 * 1024 * 1024) {
      toast(`Large file (${(file.size / 1e6).toFixed(0)} MB) — loading…`, 'warning')
    }

    const sr = parseInt(srInput, 10)
    if (!sr || sr <= 0) {
      // Store file and show inline error — user can fix SR then click play
      pendingFileRef.current = file
      setSrError('Set sample rate then press ▶')
      srInputRef.current?.focus()
      return
    }
    setSrError('')
    pendingFileRef.current = null
    loadedFileRef.current  = file   // remember for SR-change reloads

    await player.loadFile(file, sr)
  }, [player, srInput, toast])

  // When sample rate is corrected or changed, load/reload the file
  const handleSrCommit = useCallback(async (sr: number) => {
    if (sr <= 0) return
    const pending = pendingFileRef.current
    if (pending) {
      // File was waiting for a valid SR — load it now
      pendingFileRef.current = null
      setSrError('')
      loadedFileRef.current = pending
      await player.loadFile(pending, sr)
    } else if (loadedFileRef.current) {
      // File already loaded — reload with the updated SR
      setSrError('')
      await player.loadFile(loadedFileRef.current, sr)
    }
  }, [player])

  // Chart-area drag handlers (issue 7)
  const handleChartDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setChartAreaDragging(true)
  }, [])

  const handleChartDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setChartAreaDragging(false)
    }
  }, [])

  const handleChartDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setChartAreaDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void handleFile(file)
  }, [handleFile])

  // --- derived -----------------------------------------------------------------
  const sr            = player.sampleRate
  const totalDuration = sr > 0 ? (player.totalChunks * 4096) / sr : 0
  const currentTime   = sr > 0 ? (player.currentChunk * 4096) / sr : 0
  const controlsDisabled = !player.isLoaded || sr <= 0

  const handleSrChange = (v: string) => {
    setSrInput(v)
    if (srError) setSrError('')
  }

  const handleSrBlur = () => {
    const sr = parseInt(srInput, 10)
    void handleSrCommit(sr)
  }

  const handleSrKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const sr = parseInt(srInput, 10)
      void handleSrCommit(sr)
    }
  }

  // --- render ------------------------------------------------------------------
  return (
    <PageTransition>
      <div className="h-full flex flex-col overflow-hidden dark:bg-base-950 bg-transparent transition-colors">
        <Topbar title="Signal Player" />

        {/* ── Top panel: file + controls ─────────────────────────────────── */}
        <div className="flex-shrink-0 px-5 pt-4 pb-3 space-y-3 dark:bg-base-900 bg-cream-page/85 backdrop-blur-sm border-b dark:border-white/[0.06] border-[#F0EBD8]">

          {/* Row 1: dropzone + sample rate */}
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <FileDropzone
                onFile={handleFile}
                onRemove={() => {
                  loadedFileRef.current = null
                  pendingFileRef.current = null
                  player.clearFile()
                }}
                fileName={player.fileName}
                fileSizeBytes={player.fileSizeBytes}
              />
            </div>

            {/* Sample rate input */}
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] tracking-widest uppercase dark:text-[#4b5563] text-whisper-gray">
                Sample Rate
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  ref={srInputRef}
                  type="number"
                  value={srInput}
                  onChange={(e) => handleSrChange(e.target.value)}
                  onBlur={handleSrBlur}
                  onKeyDown={handleSrKeyDown}
                  min={1}
                  step={1000000}
                  className={`
                    w-36 px-3 py-2 rounded-[12px] font-mono text-sm border-2 bg-white dark:bg-transparent
                    dark:text-amber-300 text-dora-orange-dark
                    dark:placeholder-[#374151] placeholder-[#FFD4A6]
                    transition-colors outline-none
                    focus:dark:border-amber-400/50 focus:border-dora-orange/60
                    ${srError
                      ? 'dark:border-rose-500/50 border-sunset-red/60'
                      : 'dark:border-white/10 border-[#FFD4A6]'
                    }
                  `}
                  placeholder="2000000"
                />
                <span className="font-mono text-xs dark:text-[#4b5563] text-[#9ca3af]">Hz</span>
              </div>
              {srError && (
                <span className="font-mono text-[11px] text-rose-400">{srError}</span>
              )}
              {!srError && sr > 0 && (
                <span className="font-mono text-[10px] dark:text-[#4b5563] text-[#9ca3af]">
                  {(sr / 1e6).toFixed(2)} Msps
                </span>
              )}
            </div>
          </div>

          {/* Row 2: transport controls + scrubber */}
          <div className="flex items-center gap-3">

            {/* Transport buttons */}
            <div className="flex items-center gap-1.5">
              {/* Step back */}
              <button
                onClick={player.stepBack}
                disabled={controlsDisabled}
                title="Skip back 10 frames"
                className="
                  w-9 h-9 flex items-center justify-center rounded-lg text-sm
                  font-mono transition-all
                  dark:border dark:border-white/10 border border-black/[0.1]
                  dark:text-[#9ca3af] text-[#6b7280]
                  dark:hover:border-amber-400/40 dark:hover:text-amber-300 dark:hover:bg-amber-400/[0.06]
                  hover:border-dora-orange/50 hover:text-dora-orange hover:bg-pastel-orange
                  disabled:opacity-30 disabled:cursor-not-allowed
                  active:scale-95
                "
              >
                ◀◀
              </button>

              {/* Play / Pause */}
              <button
                onClick={player.isPlaying ? player.pause : player.play}
                disabled={controlsDisabled}
                className={`
                  w-11 h-9 flex items-center justify-center rounded-lg text-sm
                  font-mono font-bold transition-all border
                  ${player.isPlaying
                    ? `dark:border-amber-400/50 dark:bg-amber-400/10 dark:text-amber-300
                       border-dora-orange/60 bg-pastel-orange text-dora-orange
                       dark:hover:bg-amber-400/20 hover:bg-[#FFD9BF]`
                    : `dark:border-amber-400/30 dark:text-amber-400 dark:hover:bg-amber-400/10
                       border-dora-orange/40 text-dora-orange hover:bg-pastel-orange`
                  }
                  disabled:opacity-30 disabled:cursor-not-allowed
                  active:scale-95
                `}
              >
                {player.isPlaying ? '⏸' : '▶'}
              </button>

              {/* Step forward */}
              <button
                onClick={player.stepForward}
                disabled={controlsDisabled}
                title="Skip forward 10 frames"
                className="
                  w-9 h-9 flex items-center justify-center rounded-lg text-sm
                  font-mono transition-all
                  dark:border dark:border-white/10 border border-black/[0.1]
                  dark:text-[#9ca3af] text-[#6b7280]
                  dark:hover:border-amber-400/40 dark:hover:text-amber-300 dark:hover:bg-amber-400/[0.06]
                  hover:border-dora-orange/50 hover:text-dora-orange hover:bg-pastel-orange
                  disabled:opacity-30 disabled:cursor-not-allowed
                  active:scale-95
                "
              >
                ▶▶
              </button>
            </div>

            {/* Time readout */}
            <div className="flex items-center gap-1 font-mono text-xs flex-shrink-0">
              <span className={`tabular-nums ${player.isPlaying ? 'dark:text-amber-300 text-dora-orange' : 'dark:text-[#9ca3af] text-tale-gray'}`}>
                {formatTime(currentTime)}
              </span>
              <span className="dark:text-[#374151] text-[#d1d5db]">/</span>
              <span className="dark:text-[#4b5563] text-[#9ca3af] tabular-nums">
                {formatTime(totalDuration)}
              </span>
            </div>

            {/* Scrubber */}
            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min={0}
                max={Math.max(0, player.totalChunks - 1)}
                value={player.currentChunk}
                onChange={(e) => player.seek(parseInt(e.target.value, 10))}
                disabled={controlsDisabled}
                className="
                  w-full h-3.5 rounded-full appearance-none cursor-pointer
                  disabled:opacity-30 disabled:cursor-not-allowed
                  [&::-webkit-slider-runnable-track]:rounded-full
                  [&::-webkit-slider-runnable-track]:h-1.5
                  dark:[&::-webkit-slider-runnable-track]:bg-white/10
                  [&::-webkit-slider-runnable-track]:bg-black/10
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-3.5
                  [&::-webkit-slider-thumb]:h-3.5
                  [&::-webkit-slider-thumb]:rounded-full
                  dark:[&::-webkit-slider-thumb]:bg-amber-400
                  [&::-webkit-slider-thumb]:bg-dora-orange
                  dark:[&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(251,191,36,0.5)]
                "
              />
              {/* Progress overlay — amber fill */}
              {player.totalChunks > 0 && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full pointer-events-none dark:bg-amber-400/50 bg-dora-orange/70 transition-all"
                  style={{ width: `${(player.currentChunk / Math.max(1, player.totalChunks - 1)) * 100}%` }}
                />
              )}
            </div>

            {/* Frame readout */}
            <span className="font-mono text-[10px] dark:text-[#374151] text-[#d1d5db] tabular-nums flex-shrink-0">
              {player.currentChunk + 1}/{player.totalChunks || 1}
            </span>
          </div>
        </div>

        {/* ── Error banner ───────────────────────────────────────────────── */}
        {player.error && (
          <div className="flex-shrink-0 px-5 py-2 flex items-center gap-2 dark:bg-rose-900/20 bg-rose-50 border-b dark:border-rose-500/20 border-rose-200/60">
            <span className="text-rose-400 text-sm flex-shrink-0">⚠</span>
            <span className="font-mono text-xs dark:text-rose-400 text-rose-600 flex-1 min-w-0 truncate">
              {player.error}
            </span>
            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() => player.clearFile()}
              className="font-mono text-[10px] dark:text-rose-400/60 text-rose-400/60 hover:dark:text-rose-400 hover:text-rose-500 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Tab bar ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 px-5 pt-3 pb-0 border-b dark:border-white/[0.07] border-[#F0EBD8] dark:bg-base-900 bg-cream-page/85 backdrop-blur-sm transition-colors flex-shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => player.setTab(t.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-[13px] font-display font-bold tracking-wide uppercase transition-colors rounded-t-lg ${
                player.tab === t.id
                  ? 'dark:text-amber-400 text-dora-orange'
                  : 'dark:text-[#6b7280] text-whisper-gray dark:hover:text-[#d1d5db] hover:text-tale-gray'
              }`}
            >
              <span className="text-base">{t.icon}</span>
              {t.label}
              {player.tab === t.id && (
                <motion.div
                  layoutId="player-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-dora-orange to-dora-orange-dark"
                />
              )}
            </button>
          ))}

          {/* Status readout on the right */}
          <div className="ml-auto flex items-center gap-3 self-center pb-[3px]">
            {player.isPlaying && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-dora-orange animate-pulse" />
                <span className="font-mono text-xs dark:text-amber-400/70 text-dora-orange/70">Playing</span>
              </div>
            )}
            {sr > 0 && (
              <span className="font-mono text-xs dark:text-[#4b5563] text-[#9ca3af]">
                {(sr / 1e6).toFixed(2)} Msps
              </span>
            )}
          </div>
        </div>

        {/* ── Chart area ─────────────────────────────────────────────────── */}
        <div
          className={`flex-1 relative overflow-hidden p-4 dark:bg-base-950 bg-transparent transition-colors ${
            chartAreaDragging ? 'dark:bg-amber-400/[0.04] bg-pastel-orange/50' : ''
          }`}
          onDragOver={handleChartDragOver}
          onDragLeave={handleChartDragLeave}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation() }}
          onDrop={handleChartDrop}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={player.tab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{    opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-4"
            >
              {player.tab === 'time' && player.signalData && (
                <TimeDomainChart
                  x={player.signalData.time.x}
                  y={player.signalData.time.y}
                  theme={theme}
                  zoomLayout={player.zoomLayouts.time}
                  onRelayout={(e) => player.handleRelayout('time', e)}
                />
              )}

              {player.tab === 'fft' && player.signalData && (
                <FftChart
                  x={player.signalData.fft.x}
                  y={player.signalData.fft.y}
                  theme={theme}
                  zoomLayout={player.zoomLayouts.fft}
                  onRelayout={(e) => player.handleRelayout('fft', e)}
                />
              )}

              {player.tab === 'spectrogram' && player.signalData && (
                <SpectrogramChart
                  history={player.signalData.spectrogram}
                  theme={theme}
                  zoomLayout={player.zoomLayouts.spectrogram}
                  onRelayout={(e) => player.handleRelayout('spectrogram', e)}
                />
              )}

              {!player.signalData && (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <span className="text-3xl text-dora-orange/30 dark:text-[#1f2937]">◈</span>
                  <span className="font-display font-bold text-[15px] text-tale-gray dark:text-[#4b5563]">
                    {player.isLoaded
                      ? 'Loading first frame…'
                      : 'Drop a .fc32 file to begin'
                    }
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
