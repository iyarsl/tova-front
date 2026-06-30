import { useState, useEffect, useRef } from 'react'
import { m } from 'framer-motion'
import { useScanDefaults } from '@/hooks/useScanDefaults'
import { useRabbitMq } from '@/hooks/useRabbitMq'
import { useToast } from '@/components/Toast'
import { isAbsolutePath } from '@/utils/path'
import type { AppError } from '@/api/client'

interface Props {
  onClose: () => void
}

function FieldError({ msg }: { msg: string }) {
  return <p className="mt-1 font-mono text-[11px] text-sunset-red dark:text-rose-400/80">{msg}</p>
}

const inputClass = (hasError: boolean) =>
  `w-full bg-white dark:bg-base-950/60 border-2 rounded-[12px] px-3 py-2.5 font-mono text-[13px] text-story-ink dark:text-[#e5e7eb] focus:outline-none focus:ring-2 transition-colors ${
    hasError
      ? 'border-sunset-red/50 dark:border-rose-500/40 focus:border-sunset-red dark:focus:border-rose-500/60 focus:ring-sunset-red/20 dark:focus:ring-rose-500/20'
      : 'border-[#D8D4EC] dark:border-white/10 focus:border-adv-purple dark:focus:border-cyan-400/40 focus:ring-adv-purple/20 dark:focus:ring-cyan-400/20'
  }`

export function ScanDefaultsModal({ onClose }: Props) {
  const { defaults, mutation } = useScanDefaults()
  const { enabled: rabbitEnabled, mutation: rabbitMutation } = useRabbitMq()
  const { toast } = useToast()

  const [localRabbit, setLocalRabbit] = useState(false)
  useEffect(() => {
    if (rabbitEnabled !== undefined) setLocalRabbit(rabbitEnabled)
  }, [rabbitEnabled])

  type FormState = { gainStr: string; outFreqStr: string; outputDir: string }
  const [form, setForm] = useState<FormState>({ gainStr: '', outFreqStr: '', outputDir: '' })
  const { gainStr, outFreqStr, outputDir } = form

  const [errors, setErrors] = useState<{ gain?: string; outFreq?: string; outputDir?: string }>({})

  const formInitialized = useRef(false)
  useEffect(() => {
    if (!defaults || formInitialized.current) return
    setForm({ gainStr: String(defaults.gain_db), outFreqStr: String(defaults.out_freq_mhz), outputDir: defaults.output_dir })
    formInitialized.current = true
  }, [defaults])

  function validate() {
    const errs: typeof errors = {}
    const gain = Number(gainStr)
    const outFreq = Number(outFreqStr)

    if (gainStr === '' || isNaN(gain))          errs.gain = 'Required'
    else if (gain < 0 || gain > 90)             errs.gain = '0–90 dB'

    if (outFreqStr === '' || isNaN(outFreq))    errs.outFreq = 'Required'
    else if (outFreq < 0 || outFreq > 3500)     errs.outFreq = '0–3500 MHz'

    if (!outputDir)                              errs.outputDir = 'Required'
    else if (!isAbsolutePath(outputDir))         errs.outputDir = 'Must be absolute (e.g. C:\\scans\\output or /data/scans)'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSave() {
    if (!validate()) return
    mutation.mutate(
      { gain_db: Number(gainStr), out_freq_mhz: Number(outFreqStr), output_dir: outputDir },
      {
        onSuccess: onClose,
        onError: (err: AppError) => toast(err.message ?? 'Failed to save defaults', 'error'),
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(45,42,62,0.45)] backdrop-blur-sm">
      <m.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.92, y: 20  }}
        className="w-full max-w-md rounded-[24px] border-2 border-[#EDE3FF] bg-cream-page shadow-dora-modal dark:border-white/[0.07] dark:bg-base-900 overflow-hidden"
      >
        <div
          className="h-[4px] bg-[linear-gradient(90deg,#FF8C42,#FFCA3A,#56C271,#5BC8F5,#9B5DE5)]"
        />
        <div className="p-7">
          <h3 className="font-display font-bold text-[20px] text-story-ink dark:text-[#f9fafb] mb-1">
            Scan Defaults
          </h3>
          <p className="font-body text-[12px] text-whisper-gray dark:text-[#6b7280] mb-6">
            Pre-filled values for every new scan row
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="defaults-gain" className="font-body text-xs font-bold text-whisper-gray dark:text-[#6b7280] uppercase tracking-wider block mb-1.5">
                Gain (dB)
              </label>
              <input
                id="defaults-gain"
                type="number"
                min={0}
                max={90}
                step={0.5}
                value={gainStr}
                onChange={e => { setForm(f => ({ ...f, gainStr: e.target.value })); setErrors(prev => ({ ...prev, gain: undefined })) }}
                placeholder="20"
                className={inputClass(!!errors.gain)}
              />
              {errors.gain && <FieldError msg={errors.gain} />}
            </div>

            <div>
              <label htmlFor="defaults-out-freq" className="font-body text-xs font-bold text-whisper-gray dark:text-[#6b7280] uppercase tracking-wider block mb-1.5">
                Output Frequency (MHz)
              </label>
              <input
                id="defaults-out-freq"
                type="number"
                min={0}
                max={3500}
                step={0.1}
                value={outFreqStr}
                onChange={e => { setForm(f => ({ ...f, outFreqStr: e.target.value })); setErrors(prev => ({ ...prev, outFreq: undefined })) }}
                placeholder="1250"
                className={inputClass(!!errors.outFreq)}
              />
              {errors.outFreq && <FieldError msg={errors.outFreq} />}
            </div>

            <div>
              <label htmlFor="defaults-output-dir" className="font-body text-xs font-bold text-whisper-gray dark:text-[#6b7280] uppercase tracking-wider block mb-1.5">
                Output Directory
              </label>
              <input
                id="defaults-output-dir"
                type="text"
                value={outputDir}
                onChange={e => { setForm(f => ({ ...f, outputDir: e.target.value })); setErrors(prev => ({ ...prev, outputDir: undefined })) }}
                placeholder="C:\scans\output"
                className={inputClass(!!errors.outputDir)}
              />
              {errors.outputDir && <FieldError msg={errors.outputDir} />}
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="font-body text-[13px] font-semibold text-story-ink dark:text-[#e5e7eb] block">
                  Save captures to RabbitMQ
                </span>
                <span className="font-body text-[11px] text-whisper-gray dark:text-[#6b7280]">
                  When on, scan rows publish to the queue instead of writing local files
                </span>
              </div>
              <button type="button"
                role="switch"
                aria-checked={localRabbit}
                aria-label="Save captures to RabbitMQ"
                onClick={() => {
                  const next = !localRabbit
                  setLocalRabbit(next)
                  rabbitMutation.mutate(next, {
                    onSuccess: () => toast(next ? 'Captures will publish to RabbitMQ' : 'Captures will save locally', 'success'),
                    onError: (err: AppError) => {
                      setLocalRabbit(!next)
                      toast(err.message ?? 'Failed to update RabbitMQ setting', 'error')
                    },
                  })
                }}
                className={`relative w-14 h-7 shrink-0 rounded-full border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-adv-purple/40 dark:focus:ring-cyan-400/50 ${
                  localRabbit
                    ? 'bg-gradient-to-r from-meadow-green to-meadow-green-dk border-meadow-green/40 dark:from-cyan-400/20 dark:to-cyan-400/20 dark:border-cyan-400/40'
                    : 'bg-[#E8E4F7] border-[#D8D4EC] dark:bg-white/5 dark:border-white/10'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                  localRabbit ? 'translate-x-7' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border-2 border-[#D8D4EC] dark:border-white/10 text-tale-gray dark:text-[#9ca3af] font-body text-[13px] font-semibold hover:bg-pastel-purple/30 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button type="button"
              disabled={mutation.isPending}
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-full font-display font-bold text-[14px] text-white disabled:opacity-50 hover:-translate-y-0.5 transition-transform bg-[linear-gradient(135deg,#9B5DE5,#7B3DC5)] shadow-dora-purple-btn"
            >
              {mutation.isPending ? 'Saving…' : 'Save Defaults'}
            </button>
          </div>
        </div>
      </m.div>
    </div>
  )
}

