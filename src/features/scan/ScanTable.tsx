import { useRef, useState } from 'react'
import type { ScanRow, ScanRowErrors } from '@/types/scan'

type Props = {
  rows: ScanRow[]
  errors: Record<string, ScanRowErrors>
  onUpdate: <K extends keyof Omit<ScanRow, 'id'>>(id: string, field: K, value: ScanRow[K]) => void
  onAdd: () => void
  onRemove: (id: string) => void
  onValidate: () => void
}

type ColDef = {
  key:          keyof Omit<ScanRow, 'id'>
  header:       string
  subHeader:    string
  width:        string
  type:         'number' | 'select'
  options?:     number[]
  min?:         number
  max?:         number
  step?:        number
  displayScale?: number
}

const COLS: ColDef[] = [
  { key: 'duration',           header: 'Duration',       subHeader: 's',    width: 'w-24',  type: 'number', min: 0.01, step: 0.1 },
  { key: 'entrance_freq_ghz',  header: 'Frequency',     subHeader: 'GHz',  width: 'w-36',  type: 'number', min: 0.01, max: 26, step: 0.001 },
  { key: 'bandwidth',          header: 'Bandwidth',      subHeader: 'MHz',  width: 'w-32',  type: 'number', min: 0.001, max: 320, step: 1 },
  { key: 'gain_db',            header: 'Gain',           subHeader: 'dB',   width: 'w-24',  type: 'number', min: 0, max: 90, step: 0.5 },
  { key: 'sample_rate',        header: 'Sample Rate',    subHeader: 'MHz',  width: 'w-36',  type: 'number', min: 0.001, step: 0.1, displayScale: 1_000_000 },
]

type CellProps = {
  row:     ScanRow
  col:     ColDef
  error?:  string
  onUpdate: Props['onUpdate']
}

function Cell({ row, col, error, onUpdate }: CellProps) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const value = row[col.key]

  function updateValue(raw: string) {
    if (col.type === 'number') {
      if (raw.trim() === '') {
        onUpdate(row.id, col.key, null as never)
      } else {
        const n = parseFloat(raw)
        if (!isNaN(n)) onUpdate(row.id, col.key, (col.displayScale ? n * col.displayScale : n) as never)
      }
    }
  }

  function commit() {
    setEditing(false)
  }

  const cellBase = `h-10 flex items-center px-3 font-mono text-[13px] border-r border-[#FFD4A6]/50 dark:border-white/[0.10] cursor-pointer transition-colors ${
    error
      ? 'bg-[#FFE0E0] dark:bg-rose-500/10 text-sunset-red dark:text-rose-300 border-b border-sunset-red/30 dark:border-rose-500/30'
      : 'hover:bg-pastel-orange/60 dark:hover:bg-cyan-400/[0.06] text-story-ink dark:text-[#d1d5db]'
  }`

  if (col.type === 'select') {
    const numVal = value === null ? '' : String(Number(value))
    const isValidOption = value !== null && col.options!.includes(Number(value))
    return (
      <div className={`${cellBase} p-0`}>
        <select
          value={numVal}
          onChange={e => {
            const v = e.target.value
            onUpdate(row.id, col.key, v === '' ? null as never : parseInt(v) as never)
          }}
          className="w-full h-full bg-transparent px-3 text-[13px] font-mono text-story-ink dark:text-[#d1d5db] focus:outline-none focus:bg-pastel-orange/50 dark:focus:bg-cyan-400/10 cursor-pointer"
        >
          <option value="" className="bg-white dark:bg-base-900 text-whisper-gray dark:text-[#6b7280]">—</option>
          {!isValidOption && value !== null && (
            <option value={numVal} className="bg-white dark:bg-base-900 text-sunset-red">
              {numVal} (invalid)
            </option>
          )}
          {col.options!.map(o => (
            <option key={o} value={o} className="bg-white dark:bg-base-900">{o}</option>
          ))}
        </select>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="h-10 flex items-center px-0 border-r border-[#FFD4A6]/50 dark:border-white/[0.10]">
        <input
          ref={inputRef}
          aria-label={col.header}
          autoFocus
          type="number"
          defaultValue={value === null ? '' : String(col.displayScale ? (value as number) / col.displayScale : value)}
          min={col.min}
          max={col.max}
          step={col.step}
          onChange={e => updateValue(e.target.value)}
          onBlur={() => commit()}
          onKeyDown={e => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setEditing(false)
          }}
          className="w-full h-full bg-pastel-orange dark:bg-cyan-400/10 border border-dora-orange/40 dark:border-cyan-400/40 px-3 text-[13px] font-mono text-dora-orange-dark dark:text-cyan-300 focus:outline-none rounded-none"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      aria-label={col.header}
      className={`${cellBase} w-full text-left bg-transparent`}
      onClick={() => setEditing(true)}
    >
      {value === null
        ? <span className="text-whisper-gray dark:text-[#4b5563]">—</span>
        : typeof value === 'number'
          ? (col.displayScale ? (value / col.displayScale).toLocaleString() : value.toLocaleString())
          : String(value)
      }
      {error && <span className="ml-2 text-sunset-red text-xs">⚠</span>}
    </button>
  )
}

export function ScanTable({ rows, errors, onUpdate, onAdd, onRemove, onValidate }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="relative rounded-[20px] border-2 border-[#FFD4A6] dark:border-white/[0.12] overflow-hidden bg-cream-page dark:bg-base-900/40 transition-colors shadow-dora-card">
      <button type="button"
        onClick={onValidate}
        aria-label="Validate rows"
        title="Validate rows"
        className="absolute top-2 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full border-2 border-[#C5A3F5] text-adv-purple dark:border-cyan-400/30 dark:text-cyan-400 hover:bg-pastel-purple dark:hover:bg-cyan-400/10 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </button>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr className="bg-gradient-to-r from-pastel-orange to-[#FFD4A6] dark:bg-base-950 border-b-2 border-[#FFD4A6] dark:border-white/[0.12]">
              <th scope="col" aria-label="Row number" className="w-10 px-3 py-0 border-r border-[#FFD4A6]/50 dark:border-white/[0.10]" />
              {COLS.map(col => (
                <th
                  key={col.key}
                  className={`${col.width} text-left border-r border-[#FFD4A6]/50 dark:border-white/[0.10] last:border-r-0`}
                >
                  <div className="py-2.5 px-3">
                    <div className="font-display text-xs font-bold tracking-[0.12em] text-story-ink dark:text-[#f3f4f6] uppercase">
                      {col.header}
                    </div>
                    <div className="font-mono text-[10px] text-whisper-gray dark:text-[#6b7280] mt-0.5">{col.subHeader}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const rowErr = errors[row.id] ?? {}
              const hasError = Object.keys(rowErr).length > 0
              return (
                <tr
                  key={row.id}
                  onMouseEnter={() => setHovered(row.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`border-b border-[#FFD4A6]/30 dark:border-white/[0.08] last:border-b-0 transition-colors ${
                    idx % 2 === 0 ? 'bg-cream-page dark:bg-white/[0.015]' : 'bg-[#FFFAF0] dark:bg-white/[0.035]'
                  } ${hasError ? 'bg-[#FFE8E8] dark:bg-rose-500/5' : ''}`}
                >
                  <td className="w-10 border-r border-[#FFD4A6]/40 dark:border-white/[0.10] bg-[#FFF8EE] dark:bg-base-950/50">
                    <div className="h-10 flex items-center justify-center">
                      {hovered === row.id ? (
                        <button type="button"
                          onClick={() => onRemove(row.id)}
                          className="w-5 h-5 flex items-center justify-center text-sunset-red hover:text-[#B03030] hover:bg-[#FFE0E0] rounded text-xs transition-colors dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/20"
                          aria-label="Remove row"
                        >
                          ×
                        </button>
                      ) : (
                        <span className="font-mono text-[11px] text-whisper-gray dark:text-[#6b7280]">{idx + 1}</span>
                      )}
                    </div>
                  </td>
                  {COLS.map(col => (
                    <td key={col.key} className={col.width}>
                      <Cell
                        row={row}
                        col={col}
                        error={rowErr[col.key]}
                        onUpdate={onUpdate}
                      />
                    </td>
                  ))}
                </tr>
              )
            })}

            <tr>
              <td colSpan={COLS.length + 1}>
                <button type="button"
                  onClick={onAdd}
                  className="w-full h-10 flex items-center justify-center gap-2 text-xs font-body font-semibold text-whisper-gray hover:text-dora-orange hover:bg-pastel-orange/40 dark:text-[#4b5563] dark:hover:text-cyan-400 dark:hover:bg-cyan-400/5 transition-colors"
                >
                  <span className="text-base leading-none">+</span>
                  <span>Add row</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

