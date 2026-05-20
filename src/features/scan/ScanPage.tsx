import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/PageTransition'
import { Topbar } from '@/components/Topbar'
import { ScanTable } from './ScanTable'
import { useScanRows } from './useScanRows'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchConfig } from '@/api/vortex'
import { runScan } from '@/api/scan'
import { useToast } from '@/components/Toast'
import type { AppError } from '@/api/client'

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
  const { rows, errors, addRow, removeRow, updateCell, validateAll, clearErrors } = useScanRows()
  const [showModal, setShowModal] = useState(false)
  const [results, setResults]     = useState<string[] | null>(null)
  const { toast } = useToast()

  const runMut = useMutation({
    mutationFn: ({ dir, mock }: { dir: string; mock: boolean }) =>
      runScan('', dir, mock),
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
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-[7px] rounded-[8px] dark:bg-cyan-400 bg-[#0891b2] dark:text-[#030712] text-white font-display text-xs font-semibold tracking-widest uppercase hover:opacity-90 transition-opacity"
                >
                  Run Scan
                </button>
              </div>
            </div>

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
    </PageTransition>
  )
}
