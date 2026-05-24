import { useState, useRef, useEffect } from 'react'
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

type SliderFieldProps = {
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

function SliderField({ label, value, min, max, step, unit, disabled, locked, onCommit }: SliderFieldProps) {
  const [draft, setDraft] = useState<number | null>(null)
  const [text, setText] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const current = draft ?? value
  const pct = ((current - min) / (max - min)) * 100
  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  const snap = (v: number) => Math.round(v / step) * step
  const fmt = (v: number) => v.toFixed(v < 10 ? 3 : 1)

  const scheduleCommit = (v: number) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { onCommit(v); setDraft(null) }, 400)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (disabled || locked) return
    e.preventDefault()
    const next = clamp(snap(current + (e.deltaY < 0 ? step : -step)))
    setDraft(next)
    scheduleCommit(next)
  }

  const commitText = () => {
    if (text === null) return
    const p = parseFloat(text)
    if (!isNaN(p)) { const v = clamp(snap(p)); setDraft(v); onCommit(v) }
    setText(null)
  }

  return (
    <div className={`space-y-2 ${disabled ? 'opacity-40' : ''}`} onWheel={handleWheel}>
      <div className="flex justify-between items-center">
        <label className="font-body text-sm dark:text-[#9ca3af] text-[#6b7280]">{label}</label>
        <div className="flex items-center gap-1.5">
          {locked && <span className="text-amber-400 text-xs">🔒</span>}
          <input
            type="text"
            inputMode="decimal"
            value={text ?? fmt(current)}
            onChange={e => setText(e.target.value)}
            onBlur={commitText}
            onKeyDown={e => {
              if (e.key === 'Enter') { commitText(); (e.target as HTMLInputElement).blur() }
              else if (e.key === 'Escape') setText(null)
              else if (e.key === 'ArrowUp') { e.preventDefault(); const n = clamp(snap(current + step)); setDraft(n); scheduleCommit(n) }
              else if (e.key === 'ArrowDown') { e.preventDefault(); const n = clamp(snap(current - step)); setDraft(n); scheduleCommit(n) }
            }}
            disabled={disabled || locked}
            className="font-mono text-sm w-20 text-right dark:text-cyan-400 text-[#0891b2] dark:bg-base-950/60 bg-[#f3f4f6] px-2 py-0.5 rounded border dark:border-white/10 border-black/[0.06] focus:outline-none focus:ring-1 focus:ring-cyan-400/50 disabled:cursor-not-allowed"
          />
          <span className="font-mono text-xs dark:text-[#4b5563] text-[#9ca3af] w-8">{unit}</span>
        </div>
      </div>
      <div className="relative">
        <div className="h-1.5 rounded-full dark:bg-white/10 bg-[#e5e7eb]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={min} max={max} step={step}
          value={current}
          disabled={disabled || locked}
          onChange={e => { setText(null); setDraft(parseFloat(e.target.value)) }}
          onMouseUp={() => { if (draft !== null) { onCommit(draft); setDraft(null) } }}
          onTouchEnd={() => { if (draft !== null) { onCommit(draft); setDraft(null) } }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed h-1.5"
          style={{ WebkitAppearance: 'none' }}
        />
      </div>
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
              <SliderField
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
              <SliderField
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
              <SliderField
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
