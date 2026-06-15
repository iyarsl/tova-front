import { useState, useRef, useEffect, useCallback } from 'react'
import { PageTransition } from '@/components/PageTransition'
import { Topbar } from '@/components/Topbar'
import { useVortexConfig } from './useVortexConfig'
import {
  availableBandwidths, isOutputLocked, isIfbwDisabled,
  IFBW_320_OUTPUT_MHZ,
} from './constraints'
import { config as appConfig } from '@/config'

function ConfigCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-[20px] border border-[#FFD4A6] dark:border-white/[0.07] bg-pastel-orange dark:bg-base-900 p-6 shadow-dora-card dark:shadow-none transition-all hover:shadow-dora-card-hover hover:-translate-y-0.5">
      {/* Dot-row decoration */}
      <div
        className="absolute top-0 left-6 right-6 h-[4px] rounded-b-full dark:hidden"
        style={{
          background: 'repeating-linear-gradient(90deg, #FFB37A 0px, #FFB37A 5px, transparent 5px, transparent 13px)',
          borderRadius: '0 0 4px 4px',
        }}
      />
      <h3 className="font-display font-bold text-[15px] text-story-ink dark:text-[#4b5563] uppercase tracking-[0.12em] mb-5 mt-1">
        {title}
      </h3>
      {children}
    </div>
  )
}

type NumericFieldProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  disabled?: boolean
  locked?: boolean
  onCommit: (v: number) => void
}

function NumericField({ label, value, min, max, step, unit, disabled, locked, onCommit }: NumericFieldProps) {
  const fieldId = `vortex-${label.toLowerCase().replace(/\s+/g, '-')}`
  const [draft, setDraft] = useState<number | null>(null)
  const [text, setText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const current  = draft ?? value
  const decimals = step >= 1 ? 0 : (String(step).split('.')[1]?.length ?? 0)
  const pct      = Math.min(100, Math.max(0, ((current - min) / (max - min)) * 100))

  const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max])
  const snap  = useCallback(
    (v: number) => parseFloat((Math.round(v / step) * step).toFixed(decimals)),
    [step, decimals],
  )
  const fmt   = useCallback((v: number) => v.toFixed(decimals), [decimals])

  const isDisabled = disabled || locked

  // Ref tracks latest draft so commit-on-release always has the freshest value
  const pendingRef = useRef<number | null>(null)

  // Inline reset: when server value changes, clear draft without an extra render cycle
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    setDraft(null)
    pendingRef.current = null
  }

  const scheduleCommit = useCallback((v: number) => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
    commitTimerRef.current = setTimeout(() => { onCommit(v) }, 400)
  }, [onCommit])

  // stepBy: update draft only — no API call (used by buttons + hold)
  const stepBy = useCallback((dir: 1 | -1, multiplier = 1) => {
    if (isDisabled) return
    const base = pendingRef.current ?? value
    const next = clamp(snap(base + dir * step * multiplier))
    pendingRef.current = next
    setDraft(next)
    setError(null)
  }, [isDisabled, value, step, clamp, snap])

  // stepByScroll: update draft + debounced commit (scroll has no "release")
  const stepByScroll = useCallback((dir: 1 | -1, multiplier = 1) => {
    if (isDisabled) return
    const base = pendingRef.current ?? value
    const next = clamp(snap(base + dir * step * multiplier))
    pendingRef.current = next
    setDraft(next)
    setError(null)
    scheduleCommit(next)
  }, [isDisabled, value, step, clamp, snap, scheduleCommit])

  // Commit once on button release — draft stays set until value prop updates (optimistic/refetch)
  const commitOnRelease = useCallback(() => {
    if (holdTimerRef.current)    { clearTimeout(holdTimerRef.current);   holdTimerRef.current = null }
    if (holdIntervalRef.current) { clearInterval(holdIntervalRef.current); holdIntervalRef.current = null }
    if (pendingRef.current !== null) {
      onCommit(pendingRef.current)
      // intentionally do NOT reset draft here — inline prev-value check handles it during render
    }
  }, [onCommit])

  const clearHold = useCallback(() => {
    if (holdTimerRef.current)   { clearTimeout(holdTimerRef.current);   holdTimerRef.current = null }
    if (holdIntervalRef.current){ clearInterval(holdIntervalRef.current); holdIntervalRef.current = null }
  }, [])

  const startHold = useCallback((dir: 1 | -1) => {
    if (isDisabled) return
    holdTimerRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => stepBy(dir), 80)
    }, 500)
  }, [isDisabled, stepBy])

  useEffect(() => () => {
    clearHold()
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
  }, [clearHold])

  const handleWheel = (e: React.WheelEvent) => {
    if (isDisabled) return
    e.preventDefault()
    stepByScroll(e.deltaY < 0 ? 1 : -1, e.shiftKey ? 10 : 1)
  }

  const commitText = () => {
    if (text === null) return
    const p = parseFloat(text)
    if (isNaN(p)) {
      setError('Invalid number')
      return
    }
    if (p < min || p > max) {
      setError(`Must be ${fmt(min)}–${fmt(max)} ${unit}`)
      return
    }
    setError(null)
    const v = snap(p)
    setDraft(v)
    onCommit(v)
    setText(null)
  }

  return (
    <div className={`${isDisabled ? 'opacity-40 pointer-events-none' : ''}`} onWheel={handleWheel}>

      {/* Label + lock */}
      <div className="flex items-center justify-between mb-3">
        <label htmlFor={fieldId} className="font-body text-[13px] font-semibold text-tale-gray dark:text-[#9ca3af]">{label}</label>
        {locked && <span className="text-[#7A5C3A] dark:text-amber-400/80 text-xs">🔒</span>}
      </div>

      {/* Input card */}
      <div className={`relative rounded-[12px] overflow-hidden transition-all border ${
        error
          ? 'border-sunset-red/60 ring-1 ring-sunset-red/40'
          : 'border-[#FFD4A6] dark:border-white/[0.10] focus-within:border-dora-orange/50 dark:focus-within:ring-cyan-400/40 dark:focus-within:ring-1'
      } bg-white dark:bg-base-950/60`}>

        {/* Top: value input */}
        <div className="flex items-center px-4 pt-3 pb-2 gap-3">
          <input
            id={fieldId}
            type="text"
            inputMode="decimal"
            value={text ?? fmt(current)}
            onChange={e => { setText(e.target.value); setError(null) }}
            onBlur={commitText}
            onKeyDown={e => {
              if (e.key === 'Enter')       { commitText(); (e.target as HTMLInputElement).blur() }
              else if (e.key === 'Escape') { setText(null); setError(null) }
              else if (e.key === 'ArrowUp')   { e.preventDefault(); stepByScroll(1,  e.shiftKey ? 10 : 1) }
              else if (e.key === 'ArrowDown') { e.preventDefault(); stepByScroll(-1, e.shiftKey ? 10 : 1) }
            }}
            disabled={isDisabled}
            className={`flex-1 min-w-0 bg-transparent border-none outline-none font-mono text-[28px] leading-none tracking-tight disabled:cursor-not-allowed transition-colors ${
              error ? 'text-sunset-red dark:text-rose-400' : 'text-dora-orange dark:text-cyan-300'
            }`}
          />
          <span className={`font-mono text-sm flex-shrink-0 ${error ? 'text-sunset-red/60' : 'text-whisper-gray dark:text-[#374151]'}`}>{unit}</span>
        </div>

        {/* Divider */}
        <div className="bg-[#FFD4A6]/40 dark:bg-white/[0.05] h-px" />

        {/* Bottom: − bar + */}
        <div className="flex items-stretch h-9">
          <button type="button"
            onMouseDown={() => { stepBy(-1); startHold(-1) }}
            onMouseUp={commitOnRelease}
            onMouseLeave={commitOnRelease}
            onTouchStart={(e) => { e.preventDefault(); stepBy(-1); startHold(-1) }}
            onTouchEnd={commitOnRelease}
            onTouchCancel={commitOnRelease}
            disabled={isDisabled}
            className="flex-1 flex items-center justify-center font-mono text-base text-tale-gray dark:text-[#4b5563] hover:text-dora-orange dark:hover:text-cyan-300 hover:bg-pastel-orange/40 dark:hover:bg-white/[0.04] transition-colors select-none disabled:cursor-not-allowed"
          >
            −
          </button>

          {/* Range bar */}
          <div className="flex-[3] flex flex-col justify-center px-2 gap-1 border-x border-[#FFD4A6]/60 dark:border-white/[0.05]">
            <div className="h-[3px] rounded-full bg-[#E8E4F7] dark:bg-white/[0.06] relative overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full rounded-full transition-all duration-100 ${
                  error ? 'bg-sunset-red/60' : 'bg-dora-orange dark:bg-gradient-to-r dark:from-cyan-400/70 dark:to-violet-500/60'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between font-mono text-[9px] text-whisper-gray dark:text-[#2a2a35]">
              <span>{fmt(min)}</span>
              <span>{fmt(max)}</span>
            </div>
          </div>

          <button type="button"
            onMouseDown={() => { stepBy(1); startHold(1) }}
            onMouseUp={commitOnRelease}
            onMouseLeave={commitOnRelease}
            onTouchStart={(e) => { e.preventDefault(); stepBy(1); startHold(1) }}
            onTouchEnd={commitOnRelease}
            onTouchCancel={commitOnRelease}
            disabled={isDisabled}
            className="flex-1 flex items-center justify-center font-mono text-base text-tale-gray dark:text-[#4b5563] hover:text-dora-orange dark:hover:text-cyan-300 hover:bg-pastel-orange/40 dark:hover:bg-white/[0.04] transition-colors select-none disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 text-[11px] font-mono text-sunset-red dark:text-rose-400">⚠ {error}</p>
      )}


    </div>
  )
}

export function VortexPage() {
  const {
    config, isLoading, isError,
    rfinMut, outputMut, gainMut, ifbwMut, invertMut, saveMut, resumeMut,
  } = useVortexConfig()

  const [resumed, setResumed] = useState(false)
  const [localBw, setLocalBw] = useState<number | null>(null)
  const [localInvert, setLocalInvert] = useState<boolean | null>(null)

  useEffect(() => { setLocalBw(null) },     [config?.ifbw_mhz])
  useEffect(() => { setLocalInvert(null) }, [config?.gain_mode])

  if (isLoading && appConfig.useVortex) return (
    <PageTransition>
      <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-transparent dark:bg-base-950 transition-colors">
        <div className="relative flex items-center justify-center w-44 h-44">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="absolute rounded-full border-2 border-dora-orange/40 dark:border-cyan-400/30 animate-radar"
              style={{ width: 150, height: 150, animationDelay: `${i}s` }}
            />
          ))}
          {/* Pulsing core at the centre of the radar */}
          <span className="relative z-10 w-3.5 h-3.5 rounded-full bg-dora-orange animate-pulse-slow shadow-[0_0_12px_rgba(255,140,66,0.5)]" />
        </div>
        <div className="flex items-center gap-1.5 font-display font-bold text-[15px] text-tale-gray dark:text-[#9ca3af]">
          Searching for device
          <span className="flex gap-1">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-dora-orange animate-pulse-slow" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </span>
        </div>
      </div>
    </PageTransition>
  )

  if (!appConfig.useVortex) return (
    <PageTransition>
      <div className="h-full flex flex-col overflow-hidden bg-sky-canvas dark:bg-base-950 transition-colors">
        <Topbar title="Vortex Config" />
        <div className="mx-5 mt-4 px-4 py-2.5 rounded-[16px] border border-sunshine/50 bg-[#FFF6CC] dark:bg-amber-500/10 dark:border-amber-500/30 text-[#7A5C3A] dark:text-amber-500 font-body text-xs flex items-center gap-2">
          <span>⊘</span>
          <span>VORTEX <strong>disabled</strong> (VITE_USE_VORTEX=false) — scans receive directly on the USRP</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-whisper-gray dark:text-[#4b5563] font-body text-sm">
          Device not connected — VORTEX control unavailable
        </div>
      </div>
    </PageTransition>
  )

  if (isError || !config) return (
    <PageTransition>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center bg-transparent dark:bg-base-950 transition-colors">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#FFE0E0]/70 dark:bg-rose-500/10 border-2 border-sunset-red/30"
        >
          <svg className="w-8 h-8 text-sunset-red dark:text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="22" y2="22" />
            <line x1="11" y1="8" x2="11" y2="12" />
            <line x1="11" y1="14.5" x2="11" y2="14.5" />
          </svg>
        </div>
        <h2 className="font-display font-extrabold text-[22px] text-story-ink dark:text-[#f9fafb]">
          Device not found
        </h2>
        <p className="font-body text-sm text-tale-gray dark:text-[#9ca3af] max-w-sm">
          Couldn&apos;t reach the backend. Start it and we&apos;ll keep looking.
        </p>
        <code className="font-mono text-xs text-sunset-red dark:text-rose-400 bg-[#FFE0E0]/70 dark:bg-rose-500/10 px-3 py-1.5 rounded-full border border-sunset-red/30">
          {import.meta.env.VITE_API_BASE_URL}
        </code>
      </div>
    </PageTransition>
  )

  const bws        = availableBandwidths(config.version)
  const outLocked  = isOutputLocked(config.ifbw_mhz)
  const bwDisabled = isIfbwDisabled(config.version)

  const displayBw     = localBw     ?? config.ifbw_mhz
  const displayInvert = localInvert ?? Boolean(config.gain_mode)

  return (
    <PageTransition>
      <div className="h-full flex flex-col overflow-hidden bg-transparent dark:bg-base-950 transition-colors">
        <Topbar title="Vortex Config" />

        {/* VORTEX flag status banner */}
        {appConfig.useVortex ? (
          <div className="mx-5 mt-4 px-4 py-2.5 rounded-[16px] border border-meadow-green/40 bg-pastel-green dark:bg-emerald-500/5 dark:border-emerald-500/20 text-meadow-green-dk dark:text-emerald-400 font-body text-xs flex items-center gap-2">
            <span className="text-sm">⚡</span>
            <span>VORTEX <strong>enabled</strong> — hardware used in scans</span>
          </div>
        ) : (
          <div className="mx-5 mt-4 px-4 py-2.5 rounded-[16px] border border-sunshine/50 bg-[#FFF6CC] dark:bg-amber-500/10 dark:border-amber-500/30 text-[#7A5C3A] dark:text-amber-500 font-body text-xs flex items-center gap-2">
            <span>⊘</span>
            <span>VORTEX <strong>disabled</strong> (VITE_USE_VORTEX=false) — scans receive directly on the USRP</span>
          </div>
        )}

        {resumed && (
          <div className="mx-5 mt-3 px-4 py-3 rounded-[16px] border border-sunshine/50 bg-[#FFF6CC] dark:bg-amber-500/10 dark:border-amber-500/30 text-[#7A5C3A] dark:text-amber-500 font-body text-sm flex items-center gap-2">
            <span>⚠</span> Control released — reload to regain access
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* RF Frequency */}
            <ConfigCard title="RF Input">
              <NumericField
                label="Frequency"
                value={config.rfin_ghz}
                min={0.01} max={26} step={0.001}
                unit="GHz"
                disabled={resumed}
                onCommit={v => rfinMut.mutate(v)}
              />
            </ConfigCard>

            {/* Output */}
            <ConfigCard title="IF Output">
              <NumericField
                label="Frequency"
                value={outLocked ? IFBW_320_OUTPUT_MHZ : config.output_mhz}
                min={0} max={3500} step={0.1}
                unit="MHz"
                disabled={resumed}
                locked={outLocked}
                onCommit={v => outputMut.mutate(v)}
              />
            </ConfigCard>

            {/* Gain */}
            <ConfigCard title="Gain">
              <NumericField
                label="Gain"
                value={config.gain_db}
                min={0} max={90} step={0.5}
                unit="dB"
                disabled={resumed}
                onCommit={v => gainMut.mutate(v)}
              />
            </ConfigCard>

            {/* IF Bandwidth */}
            <ConfigCard title="IF Bandwidth">
              <div className="space-y-3">
                <div className={`flex rounded-[14px] border border-[#FFD4A6] dark:border-white/10 overflow-hidden bg-white dark:bg-transparent ${bwDisabled || resumed ? 'opacity-40' : ''}`}>
                  {[80, 160, 320].map(bw => {
                    const available = bws.includes(bw)
                    const active    = displayBw === bw
                    return (
                      <button type="button"
                        key={bw}
                        disabled={!available || bwDisabled || resumed}
                        onClick={() => {
                          const prev = localBw ?? config.ifbw_mhz
                          setLocalBw(bw)
                          ifbwMut.mutate(bw, { onError: () => setLocalBw(prev) })
                        }}
                        className={`flex-1 py-2.5 text-sm font-display font-bold transition-all duration-150 ${
                          active
                            ? 'bg-dora-orange text-white shadow-dora-btn dark:bg-cyan-400/20 dark:text-cyan-400'
                            : available
                              ? 'text-tale-gray dark:text-[#9ca3af] hover:text-story-ink hover:bg-pastel-orange dark:hover:text-[#e5e7eb] dark:hover:bg-white/5'
                              : 'text-whisper-gray dark:text-[#374151] cursor-not-allowed'
                        }`}
                      >
                        {bw} MHz
                      </button>
                    )
                  })}
                </div>
                {bwDisabled && (
                  <p className="text-xs text-whisper-gray dark:text-[#4b5563] font-mono">Disabled on v{config.version}</p>
                )}
              </div>
            </ConfigCard>

            {/* Invert */}
            <ConfigCard title="Spectrum">
              <div className="flex items-center justify-between">
                <span className="font-body text-[13px] font-semibold text-tale-gray dark:text-[#9ca3af]">Invert Spectrum</span>
                <button type="button"
                  role="switch"
                  aria-checked={displayInvert}
                  aria-label="Invert spectrum"
                  disabled={resumed}
                  onClick={() => {
                    const next = !displayInvert
                    setLocalInvert(next)
                    invertMut.mutate(next, { onError: () => setLocalInvert(!next) })
                  }}
                  className={`relative w-14 h-7 rounded-full border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-dora-orange/40 dark:focus:ring-cyan-400/50 ${
                    displayInvert
                      ? 'bg-gradient-to-r from-meadow-green to-meadow-green-dk border-meadow-green/40 dark:from-cyan-400/20 dark:to-cyan-400/20 dark:border-cyan-400/40'
                      : 'bg-[#E8E4F7] border-[#D8D4EC] dark:bg-white/5 dark:border-white/10'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                    displayInvert ? 'translate-x-7' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </ConfigCard>

            {/* Device Info */}
            <ConfigCard title="Device Info">
              <div className="space-y-3">
                {[
                  { label: 'Firmware', value: config.version },
                  { label: 'Gain Mode', value: String(config.gain_mode) },
                  { label: 'RF In Hz', value: config.rfin_hz.toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between border-b border-[#FFD4A6]/50 dark:border-white/[0.06] pb-2 last:border-0 last:pb-0">
                    <span className="font-body text-xs text-whisper-gray dark:text-[#6b7280]">{label}</span>
                    <span className="font-mono text-xs text-story-ink dark:text-[#e5e7eb]">{value}</span>
                  </div>
                ))}
              </div>
            </ConfigCard>

          </div>

          {/* Action buttons */}
          <div className="max-w-3xl mx-auto flex gap-3 mt-5">
            <button type="button"
              disabled={resumed || saveMut.isPending}
              onClick={() => saveMut.mutate()}
              className="flex-1 py-3 rounded-full font-display font-bold tracking-wide text-[14px] text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #FF8C42, #E06A1A)',
                boxShadow: '0 4px 14px rgba(255,140,66,0.40)',
              }}
            >
              {saveMut.isPending ? 'Saving…' : 'Save to Flash'}
            </button>
            <button type="button"
              disabled={resumed || resumeMut.isPending}
              onClick={() => { resumeMut.mutate(); setResumed(true) }}
              className="flex-1 py-3 rounded-full font-display font-bold tracking-wide text-[14px] text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #9B5DE5, #7B3FC8)',
                boxShadow: '0 4px 14px rgba(155,93,229,0.40)',
              }}
            >
              {resumeMut.isPending ? 'Releasing…' : 'Resume Control'}
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

