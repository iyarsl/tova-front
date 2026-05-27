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
    <div className="mb-5 rounded-[16px] border border-[#C5A3F5] dark:border-white/[0.12] bg-pastel-purple dark:bg-base-900 overflow-hidden transition-colors">
      <div className="px-4 py-2 border-b border-[#C5A3F5]/50 dark:border-white/[0.12] bg-[#E6D8FF]/60 dark:bg-base-950/70">
        <span className="text-[10px] font-body font-bold tracking-[0.12em] uppercase text-adv-purple dark:text-[#6b7280]">
          Live Device State
        </span>
      </div>
      <div className="flex divide-x divide-[#C5A3F5]/40 dark:divide-white/[0.08]">
        {items.map(({ label, value }) => (
          <div key={label} className="flex-1 px-4 py-3">
            <div className="font-body text-[10px] font-bold text-whisper-gray dark:text-[#9ca3af] uppercase tracking-wider mb-1">{label}</div>
            <div className="font-mono text-[14px] text-dora-orange dark:text-cyan-400">{value}</div>
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
  onRun: (dir: string) => void
  loading: boolean
}) {
  const [dir, setDir] = useState('./output')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(45,42,62,0.45)] backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.92, y: 20  }}
        className="w-full max-w-md rounded-[24px] border-2 border-[#EDE3FF] bg-cream-page shadow-dora-modal dark:border-white/[0.07] dark:bg-base-900 overflow-hidden"
      >
        {/* Rainbow top strip */}
        <div
          className="h-[4px]"
          style={{ background: 'linear-gradient(90deg, #FF8C42, #FFCA3A, #56C271, #5BC8F5, #9B5DE5)' }}
        />
        <div className="p-7">
          <h3 className="font-display font-bold text-[20px] text-story-ink dark:text-[#f9fafb] mb-6">
            Run Scan
          </h3>

          <div className="space-y-4 mb-6">
            <div>
              <label className="font-body text-xs font-bold text-whisper-gray dark:text-[#6b7280] uppercase tracking-wider block mb-1.5">
                Output Directory
              </label>
              <input
                value={dir}
                onChange={e => setDir(e.target.value)}
                className="w-full bg-white dark:bg-base-950/60 border-2 border-[#D8D4EC] dark:border-white/10 rounded-[12px] px-3 py-2.5 font-mono text-[13px] text-story-ink dark:text-[#e5e7eb] focus:outline-none focus:border-adv-purple dark:focus:border-cyan-400/40 focus:ring-2 focus:ring-adv-purple/20 dark:focus:ring-cyan-400/20 transition-colors"
                placeholder="./output"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border-2 border-[#D8D4EC] dark:border-white/10 text-tale-gray dark:text-[#9ca3af] font-body text-[13px] font-semibold hover:bg-pastel-purple/30 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={loading || !dir}
              onClick={() => onRun(dir)}
              className="flex-1 py-2.5 rounded-full font-display font-bold text-[14px] text-white disabled:opacity-50 hover:-translate-y-0.5 transition-transform"
              style={{
                background: 'linear-gradient(135deg, #FF8C42, #E06A1A)',
                boxShadow: '0 4px 14px rgba(255,140,66,0.40)',
              }}
            >
              {loading ? 'Running…' : 'Run'}
            </button>
          </div>
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
      <div className="h-full flex flex-col overflow-hidden bg-sky-canvas dark:bg-base-950 transition-colors">
        <Topbar title="Scan Table" />

        <div className="flex-1 overflow-y-auto p-5">
          <div className="max-w-6xl mx-auto space-y-5">
            <DeviceStatePanel />

            <input
              id="excel-file-import"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImport}
            />

            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.08em] text-whisper-gray dark:text-[#4b5563] uppercase font-body font-bold">
                {rows.length} row{rows.length !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => { clearErrors(); handleValidate() }}
                  className="px-4 py-2 rounded-full border-2 border-[#C5A3F5] text-adv-purple dark:border-cyan-400/30 dark:text-cyan-400 font-display font-bold text-xs tracking-wide uppercase hover:bg-pastel-purple dark:hover:bg-cyan-400/10 transition-colors"
                >
                  Validate
                </button>
                <button
                  onClick={downloadScanTemplate}
                  title="Download Excel template"
                  className="px-4 py-2 rounded-full border-2 border-[#C5A3F5] text-adv-purple dark:border-cyan-400/30 dark:text-cyan-400 font-display font-bold text-xs tracking-wide uppercase hover:bg-pastel-purple dark:hover:bg-cyan-400/10 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                  </svg>
                  Template
                </button>
                <label
                  htmlFor="excel-file-import"
                  title="Import rows from Excel file"
                  className="cursor-pointer px-4 py-2 rounded-full border-2 border-[#C5A3F5] text-adv-purple dark:border-cyan-400/30 dark:text-cyan-400 font-display font-bold text-xs tracking-wide uppercase hover:bg-pastel-purple dark:hover:bg-cyan-400/10 transition-colors flex items-center gap-1.5"
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
                    className="px-4 py-2 rounded-full border-2 border-[#C5A3F5] dark:border-cyan-400/30 text-adv-purple dark:text-cyan-400 font-display font-bold text-xs tracking-wide uppercase hover:bg-pastel-purple dark:hover:bg-cyan-400/10 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
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
                  className="px-4 py-2 rounded-full font-display font-bold text-xs tracking-wide uppercase text-white hover:-translate-y-0.5 transition-transform"
                  style={{
                    background: 'linear-gradient(135deg, #FF8C42, #E06A1A)',
                    boxShadow: '0 4px 14px rgba(255,140,66,0.40)',
                  }}
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
                  className="flex items-center gap-2 px-3 py-2 rounded-[12px] border border-sky-blue-d/40 bg-pastel-blue dark:border-cyan-400/20 dark:bg-cyan-400/5"
                >
                  <svg className="w-3.5 h-3.5 text-sky-blue-d dark:text-cyan-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-mono text-[11px] text-[#1A6A8A] dark:text-cyan-400 flex-1">
                    Loaded from <span className="font-semibold">"{importedFileName}"</span>
                  </span>
                  <button
                    onClick={() => setImportedFileName(null)}
                    className="text-sky-blue-d/50 dark:text-cyan-400/50 hover:text-sky-blue-d dark:hover:text-cyan-400 transition-colors leading-none"
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <ScanTable rows={rows} errors={errors} onUpdate={updateCell} onAdd={addRow} onRemove={removeRow} />

            <AnimatePresence>
              {results && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-[16px] border border-meadow-green/30 bg-pastel-green dark:bg-emerald-500/5 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs tracking-[0.08em] font-body font-bold text-meadow-green-dk dark:text-emerald-400 uppercase">
                      Output Files
                    </div>
                    <button
                      onClick={() => setResults(null)}
                      aria-label="Close output files"
                      className="text-meadow-green-dk/50 dark:text-emerald-400/50 hover:text-meadow-green-dk dark:hover:text-emerald-400 transition-colors leading-none text-lg"
                    >
                      ×
                    </button>
                  </div>
                  <div className="space-y-1">
                    {results.map(f => (
                      <div key={f} className="font-mono text-xs text-tale-gray dark:text-[#9ca3af]">{f}</div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upcoming Scheduled Runs */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="font-display font-bold text-xs tracking-[0.12em] uppercase text-whisper-gray dark:text-white/40">
                  Upcoming Scheduled Runs
                </span>
                <div className="flex-1 h-px bg-[#FFD4A6]/60 dark:bg-white/[0.06]" />
              </div>
              <ScheduledRunsTable />
            </div>

            {/* Scan History */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="font-display font-bold text-xs tracking-[0.12em] uppercase text-whisper-gray dark:text-white/40">
                  Scan History
                </span>
                <div className="flex-1 h-px bg-[#FFD4A6]/60 dark:bg-white/[0.06]" />
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
            onRun={(dir) => runMut.mutate({ dir, mock: false })}
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
