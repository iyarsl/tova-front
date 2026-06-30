import { useHeartbeat } from '@/hooks/useHeartbeat'
import type { HeartbeatStatus } from '@/types/heartbeat'

const CHIP_CONFIG: Record<HeartbeatStatus, {
  dot: string
  pulse: boolean
  label: string
  labelColor: string
}> = {
  initializing: {
    dot:        'bg-gray-400 dark:bg-white/30',
    pulse:      false,
    label:      'Initializing…',
    labelColor: 'text-gray-400 dark:text-white/40',
  },
  ready: {
    dot:        'bg-emerald-500 dark:bg-emerald-400',
    pulse:      true,
    label:      'USRP Ready',
    labelColor: 'text-emerald-700 dark:text-emerald-400',
  },
  active: {
    dot:        'bg-cyan-500 dark:bg-cyan-400',
    pulse:      true,
    label:      'USRP Active',
    labelColor: 'text-cyan-700 dark:text-cyan-400',
  },
  no_device: {
    dot:        'bg-rose-500',
    pulse:      false,
    label:      'No Device',
    labelColor: 'text-rose-700 dark:text-rose-400',
  },
  stalled: {
    dot:        'bg-amber-500 dark:bg-amber-400',
    pulse:      false,
    label:      'Poller Stuck',
    labelColor: 'text-amber-700 dark:text-amber-400',
  },
  unreachable: {
    dot:        'bg-amber-500 dark:bg-amber-400',
    pulse:      false,
    label:      'Unreachable',
    labelColor: 'text-amber-700 dark:text-amber-400',
  },
}

type Props = { collapsed?: boolean }

export function UsrpStatus({ collapsed = false }: Props) {
  const { status, device } = useHeartbeat()
  const cfg = CHIP_CONFIG[status]

  const dot = (
    <span className="relative flex h-2 w-2 flex-shrink-0">
      {cfg.pulse && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${cfg.dot}`} />
      )}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`} />
    </span>
  )

  if (collapsed) {
    return (
      <span
        title={cfg.label}
        aria-label={`USRP device status: ${cfg.label}`}
        className="inline-flex"
      >
        {dot}
      </span>
    )
  }

  return (
    <div
      className="inline-flex flex-col gap-0.5 px-2 py-1"
      aria-label={`USRP device status: ${cfg.label}`}
    >
      <div className="flex items-center gap-1.5">
        {dot}
        <span className={`text-[11px] font-medium leading-none ${cfg.labelColor}`}>
          {cfg.label}
        </span>
      </div>

      {device && (
        <span className="pl-3.5 font-mono text-[9px] text-gray-400 dark:text-white/30 leading-none truncate max-w-[160px]">
          {device.name} · {device.serial}
        </span>
      )}
    </div>
  )
}
