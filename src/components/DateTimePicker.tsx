import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DateTimeParts {
  year:   number
  month:  number // 1–12
  day:    number // 1–31
  hour:   number // 0–23
  minute: number // 0–59
  second: number // 0–59
}

interface PanelRect {
  top:   number
  left:  number
  width: number
}

export interface DateTimePickerProps {
  value:    string               // "YYYY-MM-DDTHH:MM:SS" or ""
  min:      string               // "YYYY-MM-DDTHH:MM:SS"
  onChange: (v: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function parseDateTimeString(s: string): DateTimeParts | null {
  if (!s || s.length < 19) return null
  const year   = parseInt(s.slice(0, 4),  10)
  const month  = parseInt(s.slice(5, 7),  10)
  const day    = parseInt(s.slice(8, 10), 10)
  const hour   = parseInt(s.slice(11, 13), 10)
  const minute = parseInt(s.slice(14, 16), 10)
  const second = parseInt(s.slice(17, 19), 10)
  if ([year, month, day, hour, minute, second].some(isNaN)) return null
  return { year, month, day, hour, minute, second }
}

function partsToString(p: DateTimeParts): string {
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}T${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)}`
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function firstWeekday(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}

/** Compare as local timestamps: negative = a < b */
function compareParts(a: DateTimeParts, b: DateTimeParts): number {
  const toNum = (p: DateTimeParts) =>
    p.year * 1e10 + p.month * 1e8 + p.day * 1e6 +
    p.hour * 1e4  + p.minute * 1e2 + p.second
  return toNum(a) - toNum(b)
}

function dateBefore(a: DateTimeParts, b: DateTimeParts): boolean {
  if (a.year  !== b.year)  return a.year  < b.year
  if (a.month !== b.month) return a.month < b.month
  return a.day < b.day
}

function dateEqual(a: DateTimeParts, b: DateTimeParts): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day
}

// ─── TimeSpinner ──────────────────────────────────────────────────────────────

interface TimeSpinnerProps {
  label:    string
  value:    number
  min:      number
  max:      number
  onChange: (v: number) => void
}

function TimeSpinner({ label, value, min, max, onChange }: TimeSpinnerProps) {
  function inc() { onChange(value < max ? value + 1 : min) }
  function dec() { onChange(value > min ? value - 1 : max) }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-display text-[9px] tracking-widest uppercase dark:text-[#6b7280] text-[#9ca3af] mb-0.5">
        {label}
      </span>
      <button
        type="button"
        onClick={inc}
        className="w-8 h-5 flex items-center justify-center rounded-[4px] dark:text-[#9ca3af] text-[#6b7280] dark:hover:text-cyan-400 hover:text-[#0891b2] dark:hover:bg-white/5 hover:bg-[#f3f4f6] transition-colors text-[10px] leading-none select-none"
        aria-label={`Increase ${label}`}
      >
        ▲
      </button>
      <div className="w-11 h-9 flex items-center justify-center dark:bg-base-950/80 bg-[#f0f1f3] rounded-[6px] border dark:border-white/[0.06] border-black/[0.06]">
        <span className="font-mono text-[16px] dark:text-cyan-400 text-[#0891b2] tabular-nums leading-none">
          {pad2(value)}
        </span>
      </div>
      <button
        type="button"
        onClick={dec}
        className="w-8 h-5 flex items-center justify-center rounded-[4px] dark:text-[#9ca3af] text-[#6b7280] dark:hover:text-cyan-400 hover:text-[#0891b2] dark:hover:bg-white/5 hover:bg-[#f3f4f6] transition-colors text-[10px] leading-none select-none"
        aria-label={`Decrease ${label}`}
      >
        ▼
      </button>
    </div>
  )
}

// ─── TimeView ─────────────────────────────────────────────────────────────────

interface TimeViewProps {
  hour:      number
  minute:    number
  second:    number
  minHour:   number
  minMinute: number
  minSecond: number
  onChangeTime: (h: number, m: number, s: number) => void
}

function TimeView({ hour, minute, second, minHour, minMinute, minSecond, onChangeTime }: TimeViewProps) {
  const effMinMinute = hour   === minHour   ? minMinute : 0
  const effMinSecond = (hour === minHour && minute === minMinute) ? minSecond : 0

  function setHour(h: number) {
    const clampedH = Math.max(minHour, h)
    const clampedM = clampedH === minHour ? Math.max(minMinute, minute) : minute
    const clampedS = (clampedH === minHour && clampedM === minMinute) ? Math.max(minSecond, second) : second
    onChangeTime(clampedH, clampedM, clampedS)
  }

  function setMinute(m: number) {
    const clampedM = Math.max(effMinMinute, m)
    const clampedS = (hour === minHour && clampedM === minMinute) ? Math.max(minSecond, second) : second
    onChangeTime(hour, clampedM, clampedS)
  }

  function setSecond(s: number) {
    onChangeTime(hour, minute, Math.max(effMinSecond, s))
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="font-display text-[10px] tracking-widest uppercase dark:text-[#6b7280] text-[#9ca3af]">
        Time (local)
      </span>

      <div className="flex items-center gap-1">
        <TimeSpinner label="HH" value={hour}   min={minHour}     max={23} onChange={setHour} />
        <span className="font-mono text-xl dark:text-[#374151] text-[#d1d5db] mt-3 select-none pb-0.5">:</span>
        <TimeSpinner label="MM" value={minute} min={effMinMinute} max={59} onChange={setMinute} />
        <span className="font-mono text-xl dark:text-[#374151] text-[#d1d5db] mt-3 select-none pb-0.5">:</span>
        <TimeSpinner label="SS" value={second} min={effMinSecond} max={59} onChange={setSecond} />
      </div>

      <div className="pt-1 border-t dark:border-white/[0.06] border-black/[0.06]">
        <div className="font-mono text-[10px] dark:text-[#4b5563] text-[#9ca3af] tabular-nums text-center tracking-widest">
          T+{pad2(hour)}:{pad2(minute)}:{pad2(second)}
        </div>
      </div>
    </div>
  )
}

// ─── CalendarView ─────────────────────────────────────────────────────────────

interface CalendarViewProps {
  viewYear:      number
  viewMonth:     number
  selected:      DateTimeParts | null
  minParts:      DateTimeParts
  onSelectDay:   (year: number, month: number, day: number) => void
  onChangeMonth: (year: number, month: number) => void
}

function CalendarView({ viewYear, viewMonth, selected, minParts, onSelectDay, onChangeMonth }: CalendarViewProps) {
  const today = useMemo(() => {
    const n = new Date()
    return { year: n.getFullYear(), month: n.getMonth() + 1, day: n.getDate(), hour: 0, minute: 0, second: 0 }
  }, [])

  const totalDays = daysInMonth(viewYear, viewMonth)
  const startDow  = firstWeekday(viewYear, viewMonth)

  // 42-cell grid: leading nulls + day numbers + trailing nulls
  const cells: (number | null)[] = [
    ...Array<null>(startDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() {
    viewMonth === 1 ? onChangeMonth(viewYear - 1, 12) : onChangeMonth(viewYear, viewMonth - 1)
  }
  function nextMonth() {
    viewMonth === 12 ? onChangeMonth(viewYear + 1, 1) : onChangeMonth(viewYear, viewMonth + 1)
  }

  return (
    <div className="w-[210px] flex-shrink-0">
      {/* Month / year nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-[6px] dark:text-[#9ca3af] text-[#6b7280] dark:hover:text-cyan-400 hover:text-[#0891b2] dark:hover:bg-white/5 hover:bg-[#f3f4f6] transition-colors text-base leading-none select-none"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="font-display text-sm font-semibold tracking-wider uppercase dark:text-[#f3f4f6] text-[#1f2937]">
          {MONTH_NAMES[viewMonth - 1]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded-[6px] dark:text-[#9ca3af] text-[#6b7280] dark:hover:text-cyan-400 hover:text-[#0891b2] dark:hover:bg-white/5 hover:bg-[#f3f4f6] transition-colors text-base leading-none select-none"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center font-display text-[9px] tracking-widest uppercase dark:text-[#6b7280] text-[#9ca3af] py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={`f-${i}`} />

          const thisParts: DateTimeParts = { year: viewYear, month: viewMonth, day, hour: 0, minute: 0, second: 0 }
          const minDay: DateTimeParts    = { ...minParts, hour: 0, minute: 0, second: 0 }

          const isPast     = dateBefore(thisParts, minDay)
          const isSelected = selected !== null && dateEqual(selected, thisParts)
          const isToday    = dateEqual(thisParts, today)

          return (
            <button
              key={day}
              type="button"
              disabled={isPast}
              onClick={() => !isPast && onSelectDay(viewYear, viewMonth, day)}
              className={[
                'h-7 w-full text-center font-mono text-[12px] rounded-[5px] transition-colors',
                isPast
                  ? 'dark:text-[#374151] text-[#d1d5db] cursor-not-allowed'
                  : isSelected
                    ? 'dark:bg-cyan-400 bg-[#0891b2] dark:text-[#030712] text-white font-semibold shadow-glow-sm'
                    : isToday
                      ? 'ring-1 dark:ring-cyan-400/40 ring-cyan-500/40 dark:text-cyan-400 text-[#0891b2] dark:hover:bg-cyan-400/10 hover:bg-[#ecfeff]'
                      : 'dark:text-[#d1d5db] text-[#374151] dark:hover:bg-white/[0.06] hover:bg-[#f3f4f6]',
              ].join(' ')}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── PickerPanel ──────────────────────────────────────────────────────────────

interface PickerPanelProps {
  rect:          PanelRect
  parts:         DateTimeParts
  minParts:      DateTimeParts
  onChangeParts: (p: DateTimeParts) => void
  onClose:       () => void
}

function PickerPanel({ rect, parts, minParts, onChangeParts, onClose }: PickerPanelProps) {
  const [viewYear,  setViewYear]  = useState(parts.year)
  const [viewMonth, setViewMonth] = useState(parts.month)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside mousedown
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handle), 50)
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handle) }
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  function handleSelectDay(year: number, month: number, day: number) {
    const candidate: DateTimeParts = { ...parts, year, month, day }
    onChangeParts(compareParts(candidate, minParts) < 0 ? { ...minParts } : candidate)
    setViewYear(year)
    setViewMonth(month)
  }

  function handleChangeTime(h: number, m: number, s: number) {
    const candidate: DateTimeParts = { ...parts, hour: h, minute: m, second: s }
    onChangeParts(compareParts(candidate, minParts) < 0 ? { ...minParts } : candidate)
  }

  const isMinDay    = dateEqual(parts, minParts)
  const minHour     = isMinDay ? minParts.hour   : 0
  const minMinute   = (isMinDay && parts.hour   === minParts.hour)   ? minParts.minute : 0
  const minSecond   = (isMinDay && parts.hour   === minParts.hour && parts.minute === minParts.minute) ? minParts.second : 0

  // Position: open below, flip above if near viewport bottom
  const panelH      = 300
  const spaceBelow  = window.innerHeight - rect.top
  const shouldFlip  = spaceBelow < panelH + 16

  const style: React.CSSProperties = {
    position: 'fixed',
    left:     rect.left,
    width:    Math.max(rect.width, 440),
    zIndex:   9999,
    ...(shouldFlip
      ? { bottom: window.innerHeight - rect.top + 4 }
      : { top:    rect.top + 4 }),
  }

  return createPortal(
    <motion.div
      ref={panelRef}
      style={style}
      initial={{ opacity: 0, y: shouldFlip ? 6 : -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{    opacity: 0, y: shouldFlip ? 6 : -6, scale: 0.97 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="
        rounded-[12px] border dark:border-white/[0.10] border-black/[0.08]
        dark:bg-base-900 bg-white
        shadow-2xl dark:shadow-black/60
        p-4 flex gap-5
      "
    >
      {/* Calendar */}
      <CalendarView
        viewYear={viewYear}
        viewMonth={viewMonth}
        selected={parts}
        minParts={minParts}
        onSelectDay={handleSelectDay}
        onChangeMonth={(y, m) => { setViewYear(y); setViewMonth(m) }}
      />

      {/* Divider */}
      <div className="w-px dark:bg-white/[0.07] bg-black/[0.07] self-stretch" />

      {/* Time */}
      <div className="flex flex-col justify-center min-w-[130px]">
        <TimeView
          hour={parts.hour}
          minute={parts.minute}
          second={parts.second}
          minHour={minHour}
          minMinute={minMinute}
          minSecond={minSecond}
          onChangeTime={handleChangeTime}
        />
      </div>
    </motion.div>,
    document.body,
  )
}

// ─── DateTimePicker (public) ──────────────────────────────────────────────────

export function DateTimePicker({ value, min, onChange }: DateTimePickerProps) {
  const [open, setOpen]           = useState(false)
  const [panelRect, setPanelRect] = useState<PanelRect | null>(null)
  const triggerRef                = useRef<HTMLButtonElement>(null)

  const minParts = useMemo((): DateTimeParts => {
    const p = parseDateTimeString(min)
    if (p) return p
    const n = new Date()
    return { year: n.getFullYear(), month: n.getMonth() + 1, day: n.getDate(), hour: 0, minute: 1, second: 0 }
  }, [min])

  const parts = useMemo((): DateTimeParts => {
    return parseDateTimeString(value) ?? { ...minParts }
  }, [value, minParts])

  function handleOpen() {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    setPanelRect({ top: r.bottom, left: r.left, width: r.width })
    setOpen(true)
  }

  const handleChangeParts = useCallback((p: DateTimeParts) => {
    const clamped = compareParts(p, minParts) < 0 ? { ...minParts } : p
    onChange(partsToString(clamped))
  }, [minParts, onChange])

  const hasValue   = Boolean(value && parseDateTimeString(value))
  const displayText = useMemo(() => {
    if (!hasValue) return 'Select date & time…'
    const p = parseDateTimeString(value)
    if (!p) return 'Select date & time…'
    // e.g. "Wed, May 28 2026, 14:30:00"
    return new Date(value).toLocaleString(undefined, {
      weekday: 'short', year: 'numeric', month: 'short',
      day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }, [value, hasValue])

  return (
    <>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={[
          'w-full flex items-center gap-2.5',
          'dark:bg-base-950/60 bg-[#f9fafb]',
          'border rounded-[8px] px-3 py-2.5',
          'focus:outline-none transition-all cursor-pointer text-left',
          open
            ? 'dark:border-cyan-400/40 border-cyan-500/40 dark:shadow-glow-sm'
            : 'dark:border-white/10 border-black/[0.08] dark:hover:border-cyan-400/20 hover:border-cyan-500/20',
        ].join(' ')}
        aria-label="Open date and time picker"
        aria-expanded={open}
      >
        {/* Calendar icon */}
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-colors ${hasValue || open ? 'dark:text-cyan-400 text-[#0891b2]' : 'dark:text-[#4b5563] text-[#9ca3af]'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>

        {/* Display text */}
        <span className={`font-mono text-[13px] flex-1 transition-colors ${hasValue ? 'dark:text-[#e5e7eb] text-[#111827]' : 'dark:text-[#4b5563] text-[#9ca3af]'}`}>
          {displayText}
        </span>

        {/* Chevron */}
        <svg
          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform dark:text-[#6b7280] text-[#9ca3af] ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Floating panel */}
      <AnimatePresence>
        {open && panelRect && (
          <PickerPanel
            rect={panelRect}
            parts={parts}
            minParts={minParts}
            onChangeParts={handleChangeParts}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
