import React, { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { useScanHistory, useDeleteHistory } from './useScanHistory'
import type { ScanHistoryEntry } from '@/types/schedule'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function StatusBadge({ status }: { status: ScanHistoryEntry['status'] }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-mono tracking-wider uppercase ${
      status === 'success'
        ? 'dark:bg-emerald-500/10 bg-emerald-50 dark:text-emerald-400 text-emerald-600'
        : 'dark:bg-rose-500/10 bg-rose-50 dark:text-rose-400 text-rose-500'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
      {status}
    </span>
  )
}

const HEADERS = ['#', 'Run Time', 'Status', 'Output Files', 'Parameters', '']

export function ScanHistoryTable() {
  const { data: history, isLoading, error } = useScanHistory()
  const deleteMut = useDeleteHistory()
  const [expanded, setExpanded]         = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  return (
    <div className="rounded-[10px] border border-t-2 dark:border-white/[0.12] border-black/[0.10] dark:border-t-violet-400/30 border-t-violet-500/30 overflow-hidden dark:bg-base-900/40 bg-white transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-fixed">
          <colgroup>
            <col className="w-10" />
            <col className="w-[14%]" />
            <col className="w-[38%]" />
            <col className="w-[18%]" />
            <col className="w-[12%]" />
            <col className="w-28" />
          </colgroup>
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
                    Failed to load history
                  </div>
                </td>
              </tr>
            ) : !history || history.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length}>
                  <div className="h-16 flex items-center justify-center font-mono text-xs dark:text-[#4b5563] text-[#9ca3af]">
                    No history yet
                  </div>
                </td>
              </tr>
            ) : history.map((entry, idx) => (
              <React.Fragment key={entry.id}>
                <tr
                  className={`border-b dark:border-white/[0.08] border-black/[0.06] transition-colors ${
                    entry.status === 'failed'
                      ? 'dark:bg-rose-500/[0.05] bg-rose-50/60'
                      : idx % 2 === 0 ? 'dark:bg-white/[0.015]' : 'dark:bg-white/[0.035] bg-[#f9fafb]'
                  } ${expanded === entry.id ? 'dark:border-b-white/[0.04] border-b-black/[0.04]' : ''}`}
                >
                  <td className="px-3 py-2.5 border-r dark:border-white/[0.10] border-black/[0.08] w-10">
                    <span className="font-mono text-[11px] dark:text-[#6b7280] text-[#9ca3af]">{idx + 1}</span>
                  </td>
                  <td className="px-3 py-2.5 border-r dark:border-white/[0.10] border-black/[0.08]">
                    <span className="font-mono text-[13px] dark:text-[#d1d5db] text-[#374151]">
                      {formatDateTime(entry.ran_at)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 border-r dark:border-white/[0.10] border-black/[0.08]">
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={entry.status} />
                      {entry.error_message && (
                        <span className="font-mono text-[10px] dark:text-rose-400/70 text-rose-400 break-all">
                          {entry.error_message}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 border-r dark:border-white/[0.10] border-black/[0.08]">
                    {entry.output_files.length === 0 ? (
                      <span className="font-mono text-[11px] dark:text-[#4b5563] text-[#9ca3af]">—</span>
                    ) : (
                      <div className="space-y-0.5">
                        {entry.output_files.slice(0, 2).map(f => (
                          <div key={f} className="font-mono text-[11px] dark:text-[#9ca3af] text-[#6b7280] break-all">
                            {f}
                          </div>
                        ))}
                        {entry.output_files.length > 2 && (
                          <div className="font-mono text-[10px] dark:text-[#6b7280] text-[#9ca3af]">
                            +{entry.output_files.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 border-r dark:border-white/[0.10] border-black/[0.08]">
                    <span className="font-mono text-[11px] dark:text-[#9ca3af] text-[#6b7280]">
                      {entry.rows.length} row{entry.rows.length !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 w-28">
                    <div className="flex items-center gap-1">
                      <button type="button"
                        onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                        className="text-[11px] font-mono dark:text-[#6b7280] text-[#9ca3af] dark:hover:text-cyan-400 hover:text-[#0891b2] px-1.5 py-0.5 rounded dark:hover:bg-cyan-400/10 hover:bg-[#ecfeff] transition-colors"
                      >
                        {expanded === entry.id ? 'Hide' : 'View'}
                      </button>
                      <span className="dark:text-white/[0.10] text-black/[0.08] text-[10px]">|</span>
                      <AnimatePresence mode="wait">
                        {confirmDelete === entry.id ? (
                          <m.div
                            key="confirm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-1"
                          >
                            <button type="button"
                              onClick={() => {
                                deleteMut.mutate(entry.id)
                                setConfirmDelete(null)
                              }}
                              className="text-[11px] font-mono dark:text-rose-400 text-rose-500 dark:hover:text-rose-300 hover:text-rose-600 px-1.5 py-0.5 rounded dark:hover:bg-rose-500/10 hover:bg-rose-50 transition-colors"
                            >
                              Confirm
                            </button>
                            <button type="button"
                              onClick={() => setConfirmDelete(null)}
                              className="text-[11px] font-mono dark:text-[#6b7280] text-[#9ca3af] px-1.5 py-0.5 rounded transition-colors"
                            >
                              Keep
                            </button>
                          </m.div>
                        ) : (
                          <m.button
                            key="delete-btn"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConfirmDelete(entry.id)}
                            className="text-[11px] font-mono dark:text-[#6b7280] text-[#9ca3af] dark:hover:text-rose-400 hover:text-rose-500 px-1.5 py-0.5 rounded dark:hover:bg-rose-500/10 hover:bg-rose-50 transition-colors"
                          >
                            Delete
                          </m.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </td>
                </tr>

                {expanded === entry.id && (
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
                                  {['#', 'Duration (s)', 'Entrance (GHz)', 'Out (MHz)', 'BW (MHz)', 'Gain (dB)', 'Sample Rate (Hz)'].map(h => (
                                    <th key={h} className="px-3 py-1 text-left font-normal border-r dark:border-white/[0.06] border-black/[0.04] last:border-r-0 whitespace-nowrap">
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {entry.rows.map((row, i) => (
                                  <tr key={row.id} className="dark:text-[#d1d5db] text-[#374151]">
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

