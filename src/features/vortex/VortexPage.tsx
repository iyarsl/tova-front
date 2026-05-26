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
        <label className="font-body text-[13px] font-semibold text-tale-gray dark:text-[#9ca3af]">{label}</label>
        <div className="flex items-center gap-1.5">
          {locked && <span className="text-[#7A5C3A] text-xs">🔒</span>}
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
            className="font-mono text-sm w-20 text-right text-dora-orange dark:text-cyan-400 bg-white dark:bg-base-950/60 px-2 py-0.5 rounded-lg border border-[#FFD4A6] dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-dora-orange/30 dark:focus:ring-cyan-400/50 disabled:cursor-not-allowed"
          />
          <span className="font-mono text-xs text-whisper-gray dark:text-[#4b5563] w-8">{unit}</span>
        </div>
      </div>
      {/* Slider track */}
      <div className="relative">
        <div className="h-2 rounded-full bg-[#E8E4F7] dark:bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-dora-orange dark:bg-gradient-to-r dark:from-cyan-400 dark:to-violet-500 transition-all"
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
          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed h-2"
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
  const [localBw, setLocalBw] = useState<number | null>(null)
  const [localInvert, setLocalInvert] = useState<boolean | null>(null)

  useEffect(() => { setLocalBw(null) },     [config?.ifbw_mhz])
  useEffect(() => { setLocalInvert(null) }, [config?.gain_mode])

  if (isLoading) return (
    <PageTransition>
      <div className="flex-1 flex items-center justify-center text-tale-gray dark:text-[#6b7280] font-body text-sm">
        Loading device config…
      </div>
    </PageTransition>
  )

  if (isError || !config) return (
    <PageTransition>
      <div className="flex-1 flex items-center justify-center text-sunset-red dark:text-rose-500 font-body text-sm">
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
      <div className="h-full flex flex-col overflow-hidden bg-sky-canvas dark:bg-base-950 transition-colors">
        <Topbar title="Vortex Config" />

        {resumed && (
          <div className="mx-5 mt-4 px-4 py-3 rounded-[16px] border border-sunshine/50 bg-[#FFF6CC] dark:bg-amber-500/10 dark:border-amber-500/30 text-[#7A5C3A] dark:text-amber-500 font-body text-sm flex items-center gap-2">
            <span>⚠</span> Control released — reload to regain access
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">

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
                <div className={`flex rounded-[14px] border border-[#FFD4A6] dark:border-white/10 overflow-hidden bg-white dark:bg-transparent ${bwDisabled || resumed ? 'opacity-40' : ''}`}>
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
                <button
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
            <button
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
            <button
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
