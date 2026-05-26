import { useState } from 'react'
import { motion } from 'framer-motion'
import { useCreateSchedule } from './useScheduledScans'
import type { ScanRow, ApiScanRow } from '@/types/scan'
import type { Recurrence } from '@/types/schedule'

interface Props {
  rows: ScanRow[]
  onClose: () => void
}

export function ScheduleModal({ rows, onClose }: Props) {
  const [dir, setDir]               = useState('./output')
  const [mock, setMock]             = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [recurrence, setRecurrence] = useState<Recurrence>('none')
  const [customValue, setCustomValue] = useState(2)
  const [customUnit, setCustomUnit]   = useState<'minutes' | 'hours' | 'days' | 'weeks'>('hours')

  const createMut = useCreateSchedule()

  const minDateTime = new Date(Date.now() + 60_000).toISOString().slice(0, 16)

  const unitToMinutes = { minutes: 1, hours: 60, days: 1440, weeks: 10080 } as const

  function handleSubmit() {
    if (!scheduledAt || !dir) return
    const apiRows: ApiScanRow[] = rows.map(({ id: _id, duration, entrance_freq_ghz, out_freq_mhz, bandwidth, gain_db, sample_rate }) => ({
      duration:          duration!,
      entrance_freq_ghz: entrance_freq_ghz!,
      out_freq_mhz:      out_freq_mhz!,
      bandwidth:         bandwidth!,
      gain_db:           gain_db!,
      sample_rate:       sample_rate!,
    }))
    createMut.mutate(
      {
        rows: apiRows,
        output_dir: dir,
        mock,
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
              placeholder="./output"
              className="w-full dark:bg-base-950/60 bg-[#f9fafb] border dark:border-white/10 border-black/[0.08] rounded-[8px] px-3 py-2.5 font-mono text-[13px] dark:text-[#e5e7eb] text-[#111827] focus:outline-none dark:focus:border-cyan-400/40 focus:border-cyan-500/40 transition-colors"
            />
          </div>

          {/* Date / time */}
          <div>
            <label className="font-body text-xs dark:text-[#6b7280] text-[#9ca3af] uppercase tracking-wider block mb-1.5">
              Scheduled Time
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              min={minDateTime}
              onChange={e => setScheduledAt(e.target.value)}
              className="w-full dark:bg-base-950/60 bg-[#f9fafb] border dark:border-white/10 border-black/[0.08] rounded-[8px] px-3 py-2.5 font-mono text-[13px] dark:text-[#e5e7eb] text-[#111827] focus:outline-none dark:focus:border-cyan-400/40 focus:border-cyan-500/40 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
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
                  min={1}
                  value={customValue}
                  onChange={e => setCustomValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 dark:bg-base-950/60 bg-[#f9fafb] border dark:border-white/10 border-black/[0.08] rounded-[8px] px-3 py-2.5 font-mono text-[13px] dark:text-[#e5e7eb] text-[#111827] focus:outline-none dark:focus:border-cyan-400/40 focus:border-cyan-500/40 transition-colors"
                />
                <select
                  value={customUnit}
                  onChange={e => setCustomUnit(e.target.value as typeof customUnit)}
                  className="flex-1 dark:bg-base-950/60 bg-[#f9fafb] border dark:border-white/10 border-black/[0.08] rounded-[8px] px-3 py-2.5 font-mono text-[13px] dark:text-[#e5e7eb] text-[#111827] focus:outline-none dark:focus:border-cyan-400/40 focus:border-cyan-500/40 transition-colors"
                >
                  <option value="minutes" className="dark:bg-base-900 bg-white">Minute{customValue !== 1 ? 's' : ''}</option>
                  <option value="hours"   className="dark:bg-base-900 bg-white">Hour{customValue !== 1 ? 's' : ''}</option>
                  <option value="days"    className="dark:bg-base-900 bg-white">Day{customValue !== 1 ? 's' : ''}</option>
                  <option value="weeks"   className="dark:bg-base-900 bg-white">Week{customValue !== 1 ? 's' : ''}</option>
                </select>
              </div>
            </div>
          )}

          {/* Mock toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setMock(m => !m)}
              className={`relative w-10 h-5 rounded-full border transition-all ${
                mock
                  ? 'dark:bg-cyan-400/20 dark:border-cyan-400/40 bg-[#ecfeff] border-cyan-500/30'
                  : 'dark:bg-white/5 dark:border-white/10 bg-[#f3f4f6] border-black/[0.08]'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${
                mock ? 'dark:bg-cyan-400 bg-[#0891b2] translate-x-5' : 'dark:bg-[#4b5563] bg-[#d1d5db]'
              }`} />
            </div>
            <span className="font-body text-[13px] dark:text-[#9ca3af] text-[#6b7280]">Mock mode (no hardware)</span>
          </label>
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
            disabled={createMut.isPending || !scheduledAt || !dir}
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
