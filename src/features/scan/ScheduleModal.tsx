import { useState } from 'react'
import { motion } from 'framer-motion'
import { useCreateSchedule } from './useScheduledScans'
import { DateTimePicker } from '@/components/DateTimePicker'
import type { ScanRow } from '@/types/scan'
import type { Recurrence } from '@/types/schedule'

interface Props {
  rows: ScanRow[]
  onClose: () => void
}

function isAbsolutePath(p: string): boolean {
  return /^([a-zA-Z]:[\\/]|\/|\\\\)/.test(p)
}

export function ScheduleModal({ rows, onClose }: Props) {
  const [dir, setDir]               = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [recurrence, setRecurrence] = useState<Recurrence>('none')
  const [customValue, setCustomValue] = useState(2)
  const [customUnit, setCustomUnit]   = useState<'seconds' | 'minutes' | 'hours' | 'days' | 'weeks'>('hours')

  const createMut = useCreateSchedule()

  const [minDateTime] = useState(() => {
    const d  = new Date(Date.now() + 60_000)
    const p2 = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}` +
           `T${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`
  })

  const unitToMinutes = { seconds: 1 / 60, minutes: 1, hours: 60, days: 1440, weeks: 10080 } as const

  function handleSubmit() {
    if (!scheduledAt || !dir) return
    createMut.mutate(
      {
        rows: rows.map(({ id: _, ...rest }) => rest as import('@/types/scan').ApiScanRow),
        output_dir: dir,
        mock: false,
        scheduled_at: new Date(scheduledAt).toISOString(),
        recurrence,
        ...(recurrence === 'custom'
          ? { custom_interval_minutes: customValue * unitToMinutes[customUnit] }
          : {}),
      },
      { onSuccess: () => onClose() },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 dark:bg-base-950/80 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-[16px] border dark:border-white/[0.07] border-black/[0.08] dark:bg-base-900 bg-white p-6 shadow-2xl transition-colors"
      >
        <h3 className="font-display text-lg font-semibold tracking-widest uppercase dark:text-[#f9fafb] text-[#111827] mb-6">
          Schedule Scan
        </h3>

        <div className="space-y-4 mb-5">
          {/* Output directory */}
          <div>
            <label className="font-body text-xs dark:text-[#6b7280] text-[#9ca3af] uppercase tracking-wider block mb-1.5">
              Output Directory
            </label>
            <input
              value={dir}
              onChange={e => setDir(e.target.value)}
              placeholder="/path/to/output"
              className={`w-full dark:bg-base-950/60 bg-[#f9fafb] border rounded-[8px] px-3 py-2.5 font-mono text-[13px] dark:text-[#e5e7eb] text-[#111827] focus:outline-none transition-colors ${
                dir && !isAbsolutePath(dir)
                  ? 'dark:border-rose-500/40 border-rose-400/40 dark:focus:border-rose-500/60 focus:border-rose-400/60'
                  : 'dark:border-white/10 border-black/[0.08] dark:focus:border-cyan-400/40 focus:border-cyan-500/40'
              }`}
            />
            {dir && !isAbsolutePath(dir) && (
              <p className="mt-1 font-mono text-[11px] dark:text-rose-400/80 text-rose-500">
                Must be absolute (e.g. /data/output or C:\scans\output)
              </p>
            )}
          </div>

          {/* Date / time */}
          <div>
            <label className="font-body text-xs dark:text-[#6b7280] text-[#9ca3af] uppercase tracking-wider block mb-1.5">
              Scheduled Time
            </label>
            <DateTimePicker
              value={scheduledAt}
              min={minDateTime}
              onChange={setScheduledAt}
            />
          </div>

          {/* Recurrence */}
          <div>
            <label className="font-body text-xs dark:text-[#6b7280] text-[#9ca3af] uppercase tracking-wider block mb-1.5">
              Recurrence
            </label>
            <select
              value={recurrence}
              onChange={e => setRecurrence(e.target.value as Recurrence)}
              className="w-full dark:bg-base-950/60 bg-[#f9fafb] border dark:border-white/10 border-black/[0.08] rounded-[8px] px-3 py-2.5 font-mono text-[13px] dark:text-[#e5e7eb] text-[#111827] focus:outline-none dark:focus:border-cyan-400/40 focus:border-cyan-500/40 transition-colors"
            >
              <option value="none"   className="dark:bg-base-900 bg-white">None (one-time)</option>
              <option value="hourly" className="dark:bg-base-900 bg-white">Hourly</option>
              <option value="daily"  className="dark:bg-base-900 bg-white">Daily</option>
              <option value="weekly" className="dark:bg-base-900 bg-white">Weekly</option>
              <option value="custom" className="dark:bg-base-900 bg-white">Custom interval…</option>
            </select>
          </div>

          {recurrence === 'custom' && (
            <div>
              <label className="font-body text-xs dark:text-[#6b7280] text-[#9ca3af] uppercase tracking-wider block mb-1.5">
                Repeat every
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={customUnit === 'seconds' ? 5 : 1}
                  value={customValue}
                  onChange={e => setCustomValue(Math.max(customUnit === 'seconds' ? 5 : 1, parseInt(e.target.value) || 1))}
                  className="w-24 dark:bg-base-950/60 bg-[#f9fafb] border dark:border-white/10 border-black/[0.08] rounded-[8px] px-3 py-2.5 font-mono text-[13px] dark:text-[#e5e7eb] text-[#111827] focus:outline-none dark:focus:border-cyan-400/40 focus:border-cyan-500/40 transition-colors"
                />
                <select
                  value={customUnit}
                  onChange={e => {
                    const unit = e.target.value as typeof customUnit
                    setCustomUnit(unit)
                    if (unit === 'seconds') setCustomValue(v => Math.max(5, v))
                  }}
                  className="flex-1 dark:bg-base-950/60 bg-[#f9fafb] border dark:border-white/10 border-black/[0.08] rounded-[8px] px-3 py-2.5 font-mono text-[13px] dark:text-[#e5e7eb] text-[#111827] focus:outline-none dark:focus:border-cyan-400/40 focus:border-cyan-500/40 transition-colors"
                >
                  <option value="seconds" className="dark:bg-base-900 bg-white">Second{customValue !== 1 ? 's' : ''}</option>
                  <option value="minutes" className="dark:bg-base-900 bg-white">Minute{customValue !== 1 ? 's' : ''}</option>
                  <option value="hours"   className="dark:bg-base-900 bg-white">Hour{customValue !== 1 ? 's' : ''}</option>
                  <option value="days"    className="dark:bg-base-900 bg-white">Day{customValue !== 1 ? 's' : ''}</option>
                  <option value="weeks"   className="dark:bg-base-900 bg-white">Week{customValue !== 1 ? 's' : ''}</option>
                </select>
              </div>
            </div>
          )}

        </div>

        {/* Row count info */}
        <div className="mb-5 px-3 py-2 rounded-[6px] dark:bg-white/[0.03] bg-[#f3f4f6] border dark:border-white/[0.06] border-black/[0.05]">
          <span className="font-mono text-xs dark:text-[#6b7280] text-[#9ca3af]">
            {rows.length} scan row{rows.length !== 1 ? 's' : ''} will be scheduled
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[8px] border dark:border-white/10 border-black/[0.08] dark:text-[#9ca3af] text-[#6b7280] font-body text-[13px] dark:hover:bg-white/5 hover:bg-[#f3f4f6] transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={createMut.isPending || !scheduledAt || !dir || !isAbsolutePath(dir)}
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-[8px] dark:bg-cyan-400 bg-[#0891b2] dark:text-[#030712] text-white font-display font-semibold text-[13px] tracking-wider uppercase disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {createMut.isPending ? 'Scheduling…' : 'Schedule'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
