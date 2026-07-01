import React, { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { useScheduledScans, useCancelSchedule } from './useScheduledScans'
import type { Recurrence, ScheduledScan } from '@/types/schedule'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function formatCustom(mins: number) {
  if (mins < 1)           return `Every ${Math.round(mins * 60)}s`
  if (mins % 10080 === 0) return `Every ${mins / 10080}w`
  if (mins % 1440  === 0) return `Every ${mins / 1440}d`
  if (mins % 60    === 0) return `Every ${mins / 60}h`
  return `Every ${mins}m`
}

function RecurrenceLabel({ recurrence, customIntervalMinutes }: { recurrence: Recurrence; customIntervalMinutes?: number }) {
  const labels: Record<Recurrence, string> = {
    none: 'One-time', hourly: 'Hourly', daily: 'Daily', weekly: 'Weekly',
    custom: customIntervalMinutes ? formatCustom(customIntervalMinutes) : 'Custom',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-mono tracking-wider uppercase ${
      recurrence === 'none'
        ? 'dark:bg-white/[0.06] bg-[#f3f4f6] dark:text-[#9ca3af] text-[#6b7280]'
        : 'dark:bg-cyan-400/10 bg-[#ecfeff] dark:text-cyan-400 text-[#0891b2]'
    }`}>
      {labels[recurrence]}
    </span>
  )
}

function StatusBadge({ status }: { status: ScheduledScan['status'] }) {
  const cfg = {
    pending:   { cls: 'dark:bg-white/[0.06] bg-[#f3f4f6] dark:text-[#9ca3af] text-[#6b7280]', dot: '' },
    running:   { cls: 'dark:bg-amber-400/10 bg-amber-50 dark:text-amber-400 text-amber-600',   dot: 'bg-amber-400 animate-pulse' },
    cancelled: { cls: 'dark:bg-rose-500/10 bg-rose-50 dark:text-rose-400 text-rose-500',       dot: '' },
  }[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-mono tracking-wider uppercase ${cfg.cls}`}>
      {cfg.dot && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
      {status}
    </span>
  )
}

const HEADERS = ['#', 'Scheduled At', 'Recurrence', 'Next Run', 'Status', 'Rows', '']

export function ScheduledRunsTable() {
  const { data: schedules, isLoading, error } = useScheduledScans()
  const cancelMut = useCancelSchedule()
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)
  const [expanded, setExpanded]           = useState<string | null>(null)

  return (
    <div className="rounded-[10px] border border-t-2 dark:border-white/[0.12] border-black/[0.10] dark:border-t-cyan-400/30 border-t-cyan-500/30 overflow-hidden dark:bg-base-900/40 bg-white transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr className="dark:bg-base-950 bg-[#f0f1f3] border-b dark:border-white/[0.12] border-black/[0.10]">
              {HEADERS.map(h => (
                <th key={h} className="text-left border-r dark:border-white/[0.10] border-black/[0.08] last:border-r-0">
                  <div className="py-2 px-3">
                    <div className="font-display text-xs font-semibold tracking-[0.12em] dark:text-[#f3f4f6] text-[#1f2937] uppercase">
                      {h}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={HEADERS.length}>
                  <div className="h-16 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 dark:border-cyan-400/40 border-cyan-500/40 border-t-transparent rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : error !== null ? (
              <tr>
                <td colSpan={HEADERS.length}>
                  <div className="h-16 flex items-center justify-center gap-2 font-mono text-xs dark:text-rose-400/70 text-rose-500">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    Failed to load scheduled runs
                  </div>
                </td>
              </tr>
            ) : !schedules || schedules.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length}>
                  <div className="h-16 flex items-center justify-center font-mono text-xs dark:text-[#4b5563] text-[#9ca3af]">
                    No scheduled runs
                  </div>
                </td>
              </tr>
            ) : schedules.map((s, idx) => (
              <React.Fragment key={s.id}>
                <tr
                  className={`border-b dark:border-white/[0.08] border-black/[0.06] transition-colors ${
                    idx % 2 === 0 ? 'dark:bg-white/[0.015]' : 'dark:bg-white/[0.035] bg-[#f9fafb]'
                  } ${expanded === s.id ? 'dark:border-b-white/[0.04] border-b-black/[0.04]' : ''}`}
                >
                  <td className="px-3 py-2.5 border-r dark:border-white/[0.10] border-black/[0.08] w-10">
                    <span className="font-mono text-[11px] dark:text-[#6b7280] text-[#9ca3af]">{idx + 1}</span>
                  </td>
                  <td className="px-3 py-2.5 border-r dark:border-white/[0.10] border-black/[0.08]">
                    <span className="font-mono text-[13px] dark:text-[#d1d5db] text-[#374151]">
                      {formatDateTime(s.scheduled_at)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 border-r dark:border-white/[0.10] border-black/[0.08]">
                    <RecurrenceLabel recurrence={s.recurrence} customIntervalMinutes={s.custom_interval_minutes} />
                  </td>
                  <td className="px-3 py-2.5 border-r dark:border-white/[0.10] border-black/[0.08]">
                    <span className="font-mono text-[13px] dark:text-[#9ca3af] text-[#6b7280]">
                      {s.next_run_at ? formatDateTime(s.next_run_at) : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 border-r dark:border-white/[0.10] border-black/[0.08]">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-3 py-2.5 border-r dark:border-white/[0.10] border-black/[0.08]">
                    <span className="font-mono text-[11px] dark:text-[#9ca3af] text-[#6b7280]">
                      {s.rows.length} row{s.rows.length !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 w-32">
                    <div className="flex items-center gap-1">
                      <button type="button"
                        onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                        className="text-[11px] font-mono dark:text-[#6b7280] text-[#9ca3af] dark:hover:text-cyan-400 hover:text-[#0891b2] px-1.5 py-0.5 rounded dark:hover:bg-cyan-400/10 hover:bg-[#ecfeff] transition-colors"
                      >
                        {expanded === s.id ? 'Hide' : 'View'}
                      </button>
                      <span className="dark:text-white/[0.10] text-black/[0.08] text-[10px]">|</span>
                      <AnimatePresence mode="wait">
                        {confirmCancel === s.id ? (
                          <m.div
                            key="confirm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-1"
                          >
                            <button type="button"
                              onClick={() => { cancelMut.mutate(s.id); setConfirmCancel(null) }}
                              className="text-[11px] font-mono dark:text-rose-400 text-rose-500 dark:hover:text-rose-300 hover:text-rose-600 px-1.5 py-0.5 rounded dark:hover:bg-rose-500/10 hover:bg-rose-50 transition-colors"
                            >
                              Confirm
                            </button>
                            <button type="button"
                              onClick={() => setConfirmCancel(null)}
                              className="text-[11px] font-mono dark:text-[#6b7280] text-[#9ca3af] px-1.5 py-0.5 rounded transition-colors"
                            >
                              Keep
                            </button>
                          </m.div>
                        ) : (
                          <m.button
                            key="cancel-btn"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConfirmCancel(s.id)}
                            disabled={s.status === 'cancelled'}
                            className="text-[11px] font-mono dark:text-[#6b7280] text-[#9ca3af] dark:hover:text-rose-400 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed px-1.5 py-0.5 rounded dark:hover:bg-rose-500/10 hover:bg-rose-50 transition-colors"
                          >
                            Cancel
                          </m.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </td>
                </tr>

                {expanded === s.id && (
                  <tr className="border-b dark:border-white/[0.08] border-black/[0.06] last:border-b-0">
                    <td colSpan={HEADERS.length} className="p-0">
                      <m.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 py-3 dark:bg-white/[0.02] bg-[#f9fafb] border-t dark:border-white/[0.06] border-black/[0.04]">
                          <div className="text-[10px] tracking-[0.08em] font-medium dark:text-[#6b7280] text-[#9ca3af] uppercase mb-2">
                            Scan Parameters
                          </div>
                          <div className="overflow-x-auto">
                            <table className="border-collapse text-[11px] font-mono">
                              <thead>
                                <tr className="dark:text-[#6b7280] text-[#9ca3af]">
                                  {['#', 'Duration (s)', 'Frequency (GHz)', 'Out (MHz)', 'BW (MHz)', 'Gain (dB)', 'Sample Rate (Hz)'].map(h => (
                                    <th key={h} className="px-3 py-1 text-left font-normal border-r dark:border-white/[0.06] border-black/[0.04] last:border-r-0 whitespace-nowrap">
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {s.rows.map((row, i) => (
                                  <tr key={i} className="dark:text-[#d1d5db] text-[#374151]">
                                    <td className="px-3 py-1 border-r dark:border-white/[0.06] border-black/[0.04] dark:text-[#6b7280] text-[#9ca3af]">{i + 1}</td>
                                    <td className="px-3 py-1 border-r dark:border-white/[0.06] border-black/[0.04]">{row.duration}</td>
                                    <td className="px-3 py-1 border-r dark:border-white/[0.06] border-black/[0.04]">{row.entrance_freq_ghz}</td>
                                    <td className="px-3 py-1 border-r dark:border-white/[0.06] border-black/[0.04]">{row.out_freq_mhz}</td>
                                    <td className="px-3 py-1 border-r dark:border-white/[0.06] border-black/[0.04]">{row.bandwidth}</td>
                                    <td className="px-3 py-1 border-r dark:border-white/[0.06] border-black/[0.04]">{row.gain_db}</td>
                                    <td className="px-3 py-1">{row.sample_rate}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </m.div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

