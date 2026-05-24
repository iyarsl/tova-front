import { useRef, useState } from 'react'
import type { ScanRow, ScanRowErrors } from '@/types/scan'

type Props = {
  rows: ScanRow[]
  errors: Record<string, ScanRowErrors>
  onUpdate: <K extends keyof Omit<ScanRow, 'id'>>(id: string, field: K, value: ScanRow[K]) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

type ColDef = {
  key:       keyof Omit<ScanRow, 'id'>
  header:    string
  subHeader: string
  width:     string
  type:      'number' | 'select'
  options?:  number[]
  min?:      number
  max?:      number
  step?:     number
}

const COLS: ColDef[] = [
  { key: 'duration',           header: 'Duration',       subHeader: 's',    width: 'w-24',  type: 'number', min: 0.01, step: 0.1 },
  { key: 'entrance_freq_ghz',  header: 'Entrance Freq',  subHeader: 'GHz',  width: 'w-36',  type: 'number', min: 0.01, max: 26, step: 0.001 },
  { key: 'out_freq_mhz',       header: 'Out Freq',       subHeader: 'MHz',  width: 'w-32',  type: 'number', min: 0, max: 3500, step: 0.1 },
  { key: 'bandwidth',          header: 'Bandwidth',      subHeader: 'MHz',  width: 'w-32',  type: 'select', options: [80, 160, 320] },
  { key: 'gain_db',            header: 'Gain',           subHeader: 'dB',   width: 'w-24',  type: 'number', min: 0, max: 90, step: 0.5 },
  { key: 'sample_rate',        header: 'Sample Rate',    subHeader: 'Hz',   width: 'w-36',  type: 'number', min: 1, step: 1000 },
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

  function commit(raw: string) {
    setEditing(false)
    if (col.type === 'number') {
      const n = parseFloat(raw)
      if (!isNaN(n)) onUpdate(row.id, col.key, n as never)
    }
  }

  const cellBase = `h-10 flex items-center px-3 font-mono text-[13px] border-r dark:border-white/[0.10] border-black/[0.08] cursor-pointer transition-colors ${
    error
      ? 'dark:bg-rose-500/10 bg-rose-50 dark:text-rose-300 text-rose-600 border-b dark:border-rose-500/30 border-rose-200'
      : 'dark:hover:bg-cyan-400/[0.06] hover:bg-cyan-500/[0.04] dark:text-[#d1d5db] text-[#374151]'
  }`

  if (col.type === 'select') {
    const numVal = Number(value)
    const isValidOption = col.options!.includes(numVal)
    return (
      <div className={`${cellBase} p-0`}>
        <select
          value={numVal}
          onChange={e => onUpdate(row.id, col.key, parseInt(e.target.value) as never)}
          className="w-full h-full bg-transparent px-3 text-[13px] font-mono dark:text-[#d1d5db] text-[#374151] focus:outline-none dark:focus:bg-cyan-400/10 focus:bg-[#ecfeff] cursor-pointer"
        >
          {!isValidOption && (
            <option value={numVal} className="dark:bg-base-900 bg-white text-rose-500">
              {numVal} (invalid)
            </option>
          )}
          {col.options!.map(o => (
            <option key={o} value={o} className="dark:bg-base-900 bg-white">{o}</option>
          ))}
        </select>
      </div>
    )
  }

  if (editing) {
    return (
      <div className="h-10 flex items-center px-0 border-r dark:border-white/[0.10] border-black/[0.08]">
        <input
          ref={inputRef}
          autoFocus
          type="number"
          defaultValue={String(value)}
          min={col.min}
          max={col.max}
          step={col.step}
          onBlur={e => commit(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commit((e.target as HTMLInputElement).value)
            if (e.key === 'Escape') setEditing(false)
          }}
          className="w-full h-full dark:bg-cyan-400/10 bg-[#ecfeff] border dark:border-cyan-400/40 border-cyan-500/40 px-3 text-[13px] font-mono dark:text-cyan-300 text-[#0891b2] focus:outline-none rounded-none"
        />
      </div>
    )
  }

  return (
    <div className={cellBase} onClick={() => setEditing(true)}>
      {typeof value === 'number' ? value.toLocaleString() : String(value)}
      {error && <span className="ml-2 text-rose-400 text-xs">⚠</span>}
    </div>
  )
}

export function ScanTable({ rows, errors, onUpdate, onAdd, onRemove }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="rounded-[10px] border border-t-2 dark:border-white/[0.12] border-black/[0.10] dark:border-t-cyan-400/60 border-t-cyan-500/50 overflow-hidden dark:bg-base-900/40 bg-white transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr className="dark:bg-base-950 bg-[#f0f1f3] border-b dark:border-white/[0.12] border-black/[0.10]">
              <th className="w-10 px-3 py-0 border-r dark:border-white/[0.10] border-black/[0.08] dark:bg-base-950/50 bg-[#f3f4f6]" />
              {COLS.map(col => (
                <th
                  key={col.key}
                  className={`${col.width} text-left border-r dark:border-white/[0.10] border-black/[0.08] last:border-r-0`}
                >
                  <div className="py-2 px-3">
                    <div className="font-display text-xs font-semibold tracking-[0.12em] dark:text-[#f3f4f6] text-[#1f2937] uppercase">
                      {col.header}
                    </div>
                    <div className="font-mono text-[10px] dark:text-[#6b7280] text-[#6b7280] mt-0.5">{col.subHeader}</div>
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
                  className={`border-b dark:border-white/[0.08] border-black/[0.06] last:border-b-0 transition-colors ${
                    idx % 2 === 0 ? 'dark:bg-white/[0.015]' : 'dark:bg-white/[0.035] bg-[#f9fafb]'
                  } ${hasError ? 'dark:bg-rose-500/5 bg-rose-50/60' : ''}`}
                >
                  <td className="w-10 border-r dark:border-white/[0.10] border-black/[0.08] dark:bg-base-950/50 bg-[#f3f4f6]">
                    <div className="h-10 flex items-center justify-center">
                      {hovered === row.id ? (
                        <button
                          onClick={() => onRemove(row.id)}
                          className="w-5 h-5 flex items-center justify-center dark:text-rose-400 text-rose-500 dark:hover:text-rose-300 hover:text-rose-600 dark:hover:bg-rose-500/20 hover:bg-rose-100 rounded text-xs transition-colors"
                          aria-label="Remove row"
                        >
                          ×
                        </button>
                      ) : (
                        <span className="font-mono text-[11px] dark:text-[#6b7280] text-[#9ca3af]">{idx + 1}</span>
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
                <button
                  onClick={onAdd}
                  className="w-full h-9 flex items-center justify-center gap-2 text-xs font-mono dark:text-[#4b5563] text-[#9ca3af] dark:hover:text-cyan-400 hover:text-[#0891b2] dark:hover:bg-cyan-400/5 hover:bg-[#ecfeff] transition-colors"
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
