import type { ScanRowResult } from '@/types/scan'

function AttemptsChip({ attempts }: { attempts: number }) {
  if (attempts <= 1) return null
  return (
    <span className="flex-shrink-0 font-mono text-[10px] px-1.5 py-0.5 rounded-[4px] bg-amber-400/15 text-amber-600 dark:text-amber-400 tracking-wider uppercase">
      {attempts} attempts
    </span>
  )
}

function ResultRow({ result }: { result: ScanRowResult }) {
  const failed = result.status === 'failed'
  return (
    <div className="flex items-center gap-2 py-1">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${failed ? 'bg-rose-400' : 'bg-emerald-400'}`} />
      <span className="font-mono text-[11px] flex-shrink-0 w-12 dark:text-[#6b7280] text-[#9ca3af]">
        Row {result.row_index + 1}
      </span>
      {failed ? (
        <span className="font-mono text-[11px] flex-1 break-all dark:text-rose-400/80 text-rose-500">
          {result.error ?? 'Failed'}
        </span>
      ) : result.output_file === null ? (
        <span className="font-mono text-[11px] flex-1 italic dark:text-cyan-400/80 text-[#0891b2]">
          Sent via RabbitMQ
        </span>
      ) : (
        <span className="font-mono text-[11px] flex-1 break-all dark:text-[#9ca3af] text-[#6b7280]">
          {result.output_file}
        </span>
      )}
      <AttemptsChip attempts={result.attempts} />
    </div>
  )
}

export function ScanResultRows({ results }: { results: ScanRowResult[] }) {
  const sorted = [...results].sort((a, b) => a.row_index - b.row_index)
  return (
    <div className="space-y-0.5">
      {sorted.map(r => (
        <ResultRow key={r.row_index} result={r} />
      ))}
    </div>
  )
}
