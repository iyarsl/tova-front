import { useState, useRef, useEffect, useCallback } from 'react'
import { PageTransition } from '@/components/PageTransition'
import { Topbar } from '@/components/Topbar'
import { useVortexConfig } from './useVortexConfig'
import {
  availableBandwidths, isOutputLocked, isIfbwDisabled,
  IFBW_320_OUTPUT_MHZ,
} from './constraints'

function ConfigCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border dark:border-white/[0.07] border-black/[0.08] dark:bg-base-900 bg-white p-5 transition-colors">
      <h3 className="font-display text-[10px] font-semibold tracking-[0.2em] dark:text-[#4b5563] text-[#9ca3af] uppercase mb-5">
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

  // When the server value lands (after optimistic update or refetch), clear our draft
  useEffect(() => {
    setDraft(null)
    pendingRef.current = null
  }, [value])

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
      // intentionally do NOT reset draft here — value useEffect handles it
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
    <div className={`${disabled ? 'opacity-40 pointer-events-none' : ''}`} onWheel={handleWheel}>

      {/* Label + lock */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[11px] tracking-[0.12em] uppercase dark:text-[#4b5563] text-[#9ca3af]">{label}</span>
        {locked && <span className="text-[10px] font-mono text-amber-400/80 tracking-widest uppercase">locked</span>}
      </div>

      {/* Value display + stepper row */}
      <div className={`relative rounded-lg overflow-hidden transition-all ${
        error
          ? 'ring-1 ring-rose-500/60'
          : 'ring-1 dark:ring-white/[0.07] ring-black/[0.07] focus-within:ring-cyan-400/40'
      } dark:bg-[#0a0a12] bg-[#fafafa]`}>

        {/* Top: value input */}
        <div className="flex items-center px-4 pt-3 pb-2 gap-3">
          <input
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
              error ? 'dark:text-rose-400 text-rose-500' : 'dark:text-cyan-300 text-[#0e7490]'
            }`}
          />
          <span className={`font-mono text-sm flex-shrink-0 ${error ? 'dark:text-rose-400/60 text-rose-400/60' : 'dark:text-[#374151] text-[#9ca3af]'}`}>{unit}</span>
        </div>

        {/* Divider */}
        <div className="dark:bg-white/[0.05] bg-black/[0.05] h-px mx-0" />

        {/* Bottom: − bar + */}
        <div className="flex items-stretch h-9">
          <button
            onMouseDown={() => { stepBy(-1); startHold(-1) }}
            onMouseUp={commitOnRelease}
            onMouseLeave={commitOnRelease}
            onTouchStart={(e) => { e.preventDefault(); stepBy(-1); startHold(-1) }}
            onTouchEnd={commitOnRelease}
            onTouchCancel={commitOnRelease}
            disabled={isDisabled}
            className="flex-1 flex items-center justify-center font-mono text-base dark:text-[#4b5563] text-[#c0c4cc] dark:hover:text-cyan-300 hover:text-[#0e7490] dark:hover:bg-white/[0.04] hover:bg-black/[0.03] transition-colors select-none disabled:cursor-not-allowed"
          >
            −
          </button>

          {/* Range bar — fills center */}
          <div className="flex-[3] flex flex-col justify-center px-2 gap-1 border-x dark:border-white/[0.05] border-black/[0.05]">
            <div className="h-[3px] rounded-full dark:bg-white/[0.06] bg-black/[0.06] relative overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full rounded-full transition-all duration-100 ${
                  error ? 'bg-rose-500/60' : 'bg-gradient-to-r from-cyan-400/70 to-violet-500/60'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between font-mono text-[9px] dark:text-[#2a2a35] text-[#c5c8cd]">
              <span>{fmt(min)}</span>
              <span>{fmt(max)}</span>
            </div>
          </div>

          <button
            onMouseDown={() => { stepBy(1); startHold(1) }}
            onMouseUp={commitOnRelease}
            onMouseLeave={commitOnRelease}
            onTouchStart={(e) => { e.preventDefault(); stepBy(1); startHold(1) }}
            onTouchEnd={commitOnRelease}
            onTouchCancel={commitOnRelease}
            disabled={isDisabled}
            className="flex-1 flex items-center justify-center font-mono text-base dark:text-[#4b5563] text-[#c0c4cc] dark:hover:text-cyan-300 hover:text-[#0e7490] dark:hover:bg-white/[0.04] hover:bg-black/[0.03] transition-colors select-none disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 text-[11px] font-mono text-rose-500 dark:text-rose-400">⚠ {error}</p>
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

  // Local state for BW and Spectrum so clicks are immediately visible
  // regardless of how fast React batches the query-cache optimistic update.
  const [localBw, setLocalBw] = useState<number | null>(null)
  const [localInvert, setLocalInvert] = useState<boolean | null>(null)

  // Sync local state when the server data changes (e.g. after a refetch)
  useEffect(() => { setLocalBw(null) },     [config?.ifbw_mhz])
  useEffect(() => { setLocalInvert(null) }, [config?.gain_mode])

  if (isLoading) return (
    <PageTransition>
      <div className="flex-1 flex items-center justify-center dark:text-[#6b7280] text-[#9ca3af] font-mono text-sm">
        Loading device config…
      </div>
    </PageTransition>
  )

  if (isError || !config) return (
    <PageTransition>
      <div className="flex-1 flex items-center justify-center text-rose-500 font-mono text-sm">
        ✕ Cannot reach device at {import.meta.env.VITE_API_BASE_URL}
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
      <div className="h-full flex flex-col overflow-hidden dark:bg-base-950 bg-[#f9fafb] transition-colors">
        <Topbar title="Vortex Config" />

        {resumed && (
          <div className="mx-5 mt-4 px-4 py-3 rounded-[8px] border border-amber-500/30 bg-amber-500/10 text-amber-500 font-mono text-sm flex items-center gap-2">
            <span>⚠</span> Control released — reload to regain access
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-3">

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
                <div className={`flex rounded-[8px] border dark:border-white/10 border-black/[0.08] overflow-hidden ${bwDisabled || resumed ? 'opacity-40' : ''}`}>
                  {[80, 160, 320].map(bw => {
                    const available = bws.includes(bw)
                    const active    = displayBw === bw
                    return (
                      <button
                        key={bw}
                        disabled={!available || bwDisabled || resumed}
                        onClick={() => {
                          const prev = localBw ?? config.ifbw_mhz
                          setLocalBw(bw)
                          ifbwMut.mutate(bw, { onError: () => setLocalBw(prev) })
                        }}
                        className={`flex-1 py-2.5 text-sm font-mono font-medium transition-all duration-150 ${
                          active
                            ? 'dark:bg-cyan-400/20 dark:text-cyan-400 bg-[#ecfeff] text-[#0891b2]'
                            : available
                              ? 'dark:text-[#9ca3af] dark:hover:text-[#e5e7eb] dark:hover:bg-white/5 text-[#6b7280] hover:text-[#374151] hover:bg-[#f3f4f6]'
                              : 'dark:text-[#374151] text-[#d1d5db] cursor-not-allowed'
                        }`}
                      >
                        {bw} MHz
                      </button>
                    )
                  })}
                </div>
                {bwDisabled && (
                  <p className="text-xs dark:text-[#4b5563] text-[#9ca3af] font-mono">Disabled on v{config.version}</p>
                )}
              </div>
            </ConfigCard>

            {/* Invert */}
            <ConfigCard title="Spectrum">
              <div className="flex items-center justify-between">
                <span className="font-body text-sm dark:text-[#9ca3af] text-[#6b7280]">Invert Spectrum</span>
                <button
                  disabled={resumed}
                  onClick={() => {
                    const next = !displayInvert
                    setLocalInvert(next)
                    invertMut.mutate(next, { onError: () => setLocalInvert(!next) })
                  }}
                  className={`relative w-14 h-7 rounded-full border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
                    displayInvert
                      ? 'dark:bg-cyan-400/20 dark:border-cyan-400/40 bg-[#ecfeff] border-cyan-500/30'
                      : 'dark:bg-white/5 dark:border-white/10 bg-[#f3f4f6] border-black/[0.08]'
                  }`}
                >
                  <span className={`absolute top-1 left-1 w-5 h-5 rounded-full transition-transform duration-300 ${
                    displayInvert ? 'dark:bg-cyan-400 bg-[#0891b2] translate-x-7' : 'dark:bg-[#4b5563] bg-[#d1d5db] translate-x-0'
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
                  <div key={label} className="flex justify-between">
                    <span className="font-body text-xs dark:text-[#6b7280] text-[#9ca3af]">{label}</span>
                    <span className="font-mono text-xs dark:text-[#e5e7eb] text-[#374151]">{value}</span>
                  </div>
                ))}
              </div>
            </ConfigCard>

          </div>

          {/* Action buttons */}
          <div className="max-w-3xl mx-auto flex gap-3 mt-5">
            <button
              disabled={resumed || saveMut.isPending}
              onClick={() => saveMut.mutate()}
              className="flex-1 py-[7px] rounded-[8px] font-display font-semibold tracking-widest uppercase text-[13px] border dark:border-cyan-400/30 border-cyan-500/30 dark:text-cyan-400 text-[#0891b2] dark:hover:bg-cyan-400/10 hover:bg-[#ecfeff] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saveMut.isPending ? 'Saving…' : 'Save to Flash'}
            </button>
            <button
              disabled={resumed || resumeMut.isPending}
              onClick={() => { resumeMut.mutate(); setResumed(true) }}
              className="flex-1 py-[7px] rounded-[8px] font-display font-semibold tracking-widest uppercase text-[13px] border dark:border-violet-500/30 border-violet-500/30 dark:text-violet-400 text-violet-600 dark:hover:bg-violet-500/10 hover:bg-violet-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {resumeMut.isPending ? 'Releasing…' : 'Resume Control'}
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
