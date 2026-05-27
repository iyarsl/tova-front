import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/PageTransition'
import { Topbar } from '@/components/Topbar'
import { ScanTable } from './ScanTable'
import { useScan } from './ScanContext'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchConfig } from '@/api/vortex'
import { runScan } from '@/api/scan'
import type { ApiScanRow } from '@/types/scan'
import { useToast } from '@/components/Toast'
import type { AppError } from '@/api/client'
import { ScheduleModal } from './ScheduleModal'
import { ScheduledRunsTable } from './ScheduledRunsTable'
import { ScanHistoryTable } from './ScanHistoryTable'
import { parseExcelToScanRows } from '@/utils/parseExcel'
import { downloadScanTemplate } from '@/utils/downloadTemplate'

function DeviceStatePanel() {
  const { data } = useQuery({
    queryKey: ['vortex-config'],
    queryFn: fetchConfig,
    refetchInterval: 5000,
  })

  if (!data) return null

  const items = [
    { label: 'RF In',   value: `${data.rfin_ghz.toFixed(4)} GHz` },
    { label: 'Output',  value: `${data.output_mhz.toFixed(1)} MHz` },
    { label: 'Gain',    value: `${data.gain_db} dB` },
    { label: 'IF BW',   value: `${data.ifbw_mhz} MHz` },
    { label: 'Version', value: data.version },
  ]

  return (
    <div className="mb-5 rounded-[10px] border dark:border-white/[0.12] border-black/[0.10] dark:bg-base-900 bg-white overflow-hidden transition-colors">
      <div className="px-4 py-2 border-b dark:border-white/[0.12] border-black/[0.10] dark:bg-base-950/70 bg-[#eaebec]">
        <span className="text-[10px] font-medium tracking-[0.08em] uppercase dark:text-[#6b7280] text-[#6b7280]">
          Live Device State
        </span>
      </div>
      <div className="flex divide-x dark:divide-white/[0.08] divide-black/[0.07]">
        {items.map(({ label, value }) => (
          <div key={label} className="flex-1 px-4 py-3">
            <div className="font-body text-[10px] dark:text-[#9ca3af] text-[#6b7280] uppercase tracking-wider mb-1">{label}</div>
            <div className="font-mono text-[15px] dark:text-cyan-400 text-[#0891b2]">{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RunModal({
  onClose,
  onRun,
  loading,
}: {
  onClose: () => void
  onRun: (dir: string, mock: boolean) => void
  loading: boolean
}) {
  const [dir, setDir]   = useState('./output')
  const [mock, setMock] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 dark:bg-base-950/80 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-[16px] border dark:border-white/[0.07] border-black/[0.08] dark:bg-base-900 bg-white p-6 shadow-2xl transition-colors"
      >
        <h3 className="font-display text-lg font-semibold tracking-widest uppercase dark:text-[#f9fafb] text-[#111827] mb-6">
          Run Scan
        </h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="font-body text-xs dark:text-[#6b7280] text-[#9ca3af] uppercase tracking-wider block mb-1.5">
              Output Directory
            </label>
            <input
              value={dir}
              onChange={e => setDir(e.target.value)}
              className="w-full dark:bg-base-950/60 bg-[#f9fafb] border dark:border-white/10 border-black/[0.08] rounded-[8px] px-3 py-2.5 font-mono text-[13px] dark:text-[#e5e7eb] text-[#111827] focus:outline-none dark:focus:border-cyan-400/40 focus:border-cyan-500/40 transition-colors"
              placeholder="./output"
            />
          </div>
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

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[8px] border dark:border-white/10 border-black/[0.08] dark:text-[#9ca3af] text-[#6b7280] font-body text-[13px] dark:hover:bg-white/5 hover:bg-[#f3f4f6] transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={loading || !dir}
            onClick={() => onRun(dir, mock)}
            className="flex-1 py-2.5 rounded-[8px] dark:bg-cyan-400 bg-[#0891b2] dark:text-[#030712] text-white font-display font-semibold text-[13px] tracking-wider uppercase disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {loading ? 'Running…' : 'Run'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export function ScanPage() {
  const { rows, errors, addRow, removeRow, updateCell, validateAll, clearErrors, loadRows,
          importedFileName, setImportedFileName, results, setResults } = useScan()
  const [showModal, setShowModal]                   = useState(false)
  const [showScheduleModal, setShowScheduleModal]   = useState(false)
  const { toast } = useToast()

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''        // reset so same file can re-trigger
    if (!file) return

    try {
      const parsedRows = await parseExcelToScanRows(file)
      const allValid   = loadRows(parsedRows)
      setImportedFileName(file.name)
      if (allValid) {
        toast(`Loaded ${parsedRows.length} row${parsedRows.length !== 1 ? 's' : ''} from "${file.name}"`, 'success')
      } else {
        toast(`Loaded ${parsedRows.length} row${parsedRows.length !== 1 ? 's' : ''} from "${file.name}" — validation errors found`, 'error')
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to import Excel file', 'error')
    }
  }

  const runMut = useMutation({
    mutationFn: ({ dir, mock }: { dir: string; mock: boolean }) => {
      const apiRows: ApiScanRow[] = rows.map(({ id: _id, duration, entrance_freq_ghz, out_freq_mhz, bandwidth, gain_db, sample_rate }) => ({
        duration:          duration!,
        entrance_freq_ghz: entrance_freq_ghz!,
        out_freq_mhz:      out_freq_mhz!,
        bandwidth:         bandwidth!,
        gain_db:           gain_db!,
        sample_rate:       sample_rate!,
      }))
      return runScan(apiRows, dir, mock)
    },
    onSuccess: (files) => {
      setResults(files)
      setShowModal(false)
      toast(`Scan complete — ${files.length} file(s) saved`, 'success')
    },
    onError: (err: AppError) => toast(err.message, 'error'),
  })

  function handleValidate() {
    const ok = validateAll()
    if (ok) toast('All rows valid ✓', 'success')
    else    toast('Validation errors found', 'error')
  }

  return (
    <PageTransition>
      <div className="h-full flex flex-col overflow-hidden dark:bg-base-950 bg-[#f9fafb] transition-colors">
        <Topbar title="Scan Table" />

        <div className="flex-1 overflow-y-auto p-5">
          <div className="max-w-6xl mx-auto space-y-5">
            <DeviceStatePanel />

            {/* Hidden file input — triggered by label below via htmlFor */}
            <input
              id="excel-file-import"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImport}
            />

            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.08em] dark:text-[#4b5563] text-[#9ca3af] uppercase font-medium">
                {rows.length} row{rows.length !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => { clearErrors(); handleValidate() }}
                  className="px-4 py-[7px] rounded-[8px] border dark:border-cyan-400/30 border-cyan-500/30 dark:text-cyan-400 text-[#0891b2] font-display text-xs tracking-widest uppercase dark:hover:bg-cyan-400/10 hover:bg-[#ecfeff] transition-colors"
                >
                  Validate
                </button>

                {/* Download Template */}
                <button
                  onClick={downloadScanTemplate}
                  title="Download Excel template"
                  className="px-4 py-[7px] rounded-[8px] border dark:border-cyan-400/30 border-cyan-500/30 dark:text-cyan-400 text-[#0891b2] font-display text-xs tracking-widest uppercase dark:hover:bg-cyan-400/10 hover:bg-[#ecfeff] transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                  </svg>
                  Template
                </button>

                {/* Import Excel — label triggers file input natively, no JS click() needed */}
                <label
                  htmlFor="excel-file-import"
                  title="Import rows from Excel file"
                  className="cursor-pointer px-4 py-[7px] rounded-[8px] border dark:border-cyan-400/30 border-cyan-500/30 dark:text-cyan-400 text-[#0891b2] font-display text-xs tracking-widest uppercase dark:hover:bg-cyan-400/10 hover:bg-[#ecfeff] transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                  </svg>
                  Import Excel
                </label>

                <span
                  title={rows.length === 0 ? 'Add scan rows to enable scheduling' : undefined}
                  className="inline-flex"
                >
                  <button
                    onClick={() => {
                      const ok = validateAll()
                      if (!ok) { toast('Fix validation errors before scheduling', 'error'); return }
                      setShowScheduleModal(true)
                    }}
                    disabled={rows.length === 0}
                    className="px-4 py-[7px] rounded-[8px] border dark:border-cyan-400/30 border-cyan-500/30 dark:text-cyan-400 text-[#0891b2] font-display text-xs tracking-widest uppercase dark:hover:bg-cyan-400/10 hover:bg-[#ecfeff] transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                  >
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Schedule
                  </button>
                </span>
                <button
                  onClick={() => {
                    const ok = validateAll()
                    if (!ok) { toast('Fix validation errors before running', 'error'); return }
                    setShowModal(true)
                  }}
                  className="px-4 py-[7px] rounded-[8px] dark:bg-cyan-400 bg-[#0891b2] dark:text-[#030712] text-white font-display text-xs font-semibold tracking-widest uppercase hover:opacity-90 transition-opacity"
                >
                  Run Scan
                </button>
              </div>
            </div>

            {/* Import success badge */}
            <AnimatePresence>
              {importedFileName && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-[8px] border dark:border-cyan-400/20 border-cyan-500/20 dark:bg-cyan-400/5 bg-[#ecfeff]"
                >
                  <svg className="w-3.5 h-3.5 dark:text-cyan-400 text-[#0891b2] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-mono text-[11px] dark:text-cyan-400 text-[#0891b2] flex-1">
                    Loaded from <span className="font-semibold">"{importedFileName}"</span>
                  </span>
                  <button
                    onClick={() => setImportedFileName(null)}
                    className="dark:text-cyan-400/50 text-[#0891b2]/50 dark:hover:text-cyan-400 hover:text-[#0891b2] transition-colors leading-none"
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <ScanTable
              rows={rows}
              errors={errors}
              onUpdate={updateCell}
              onAdd={addRow}
              onRemove={removeRow}
            />

            <AnimatePresence>
              {results && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-[10px] border border-emerald-500/20 dark:bg-emerald-500/5 bg-emerald-50 p-4"
                >
                  <div className="text-xs tracking-[0.08em] font-medium dark:text-emerald-400 text-emerald-600 uppercase mb-3">
                    Output Files
                  </div>
                  <div className="space-y-1">
                    {results.map(f => (
                      <div key={f} className="font-mono text-xs dark:text-[#9ca3af] text-[#6b7280]">{f}</div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upcoming Scheduled Runs */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="font-display text-xs font-semibold tracking-[0.12em] uppercase dark:text-white/40 text-[#9ca3af]">
                  Upcoming Scheduled Runs
                </span>
                <div className="flex-1 h-px dark:bg-white/[0.06] bg-black/[0.06]" />
              </div>
              <ScheduledRunsTable />
            </div>

            {/* Scan History */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="font-display text-xs font-semibold tracking-[0.12em] uppercase dark:text-white/40 text-[#9ca3af]">
                  Scan History
                </span>
                <div className="flex-1 h-px dark:bg-white/[0.06] bg-black/[0.06]" />
              </div>
              <ScanHistoryTable />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <RunModal
            onClose={() => setShowModal(false)}
            onRun={(dir, mock) => runMut.mutate({ dir, mock })}
            loading={runMut.isPending}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScheduleModal && (
          <ScheduleModal
            rows={rows}
            onClose={() => setShowScheduleModal(false)}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
