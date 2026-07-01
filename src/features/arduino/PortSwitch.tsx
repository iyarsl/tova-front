type PortSwitchProps = {
  name: string
  pin: number
  on: boolean
  disabled?: boolean
  onToggle: () => void
  freqMin?: number
  freqMax?: number
}

export function PortSwitch({ name, pin, on, disabled, onToggle, freqMin, freqMax }: PortSwitchProps) {
  return (
    <div
      className={`flex flex-col items-center gap-4 p-6 rounded-2xl border transition-all duration-300 h-full ${
        on
          ? 'bg-gradient-to-b from-[#FFF4E8] to-[#FFE8CC] dark:from-[#2a1f10] dark:to-[#1e1608] border-dora-orange/50 dark:border-dora-orange/30 shadow-[0_0_24px_4px_rgba(255,150,50,0.18)]'
          : 'bg-gradient-to-b from-[#F5F2EC] to-[#EDE9DF] dark:from-base-900 dark:to-base-950 border-[#D8D0BC]/70 dark:border-white/[0.07] shadow-sm'
      }`}
    >
      {/* Status row */}
      <div className="flex items-center justify-between w-full">
        <span className="font-display font-bold text-xs uppercase tracking-[0.1em] text-map-brown dark:text-[#9ca3af]">
          {name}
        </span>
        <span
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            on
              ? 'bg-meadow-green shadow-[0_0_10px_3px_rgba(86,194,113,0.7)]'
              : 'bg-[#C8C0AC] dark:bg-white/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]'
          }`}
        />
      </div>

      {/* Switch housing */}
      <div className="flex-1 flex items-center justify-center">
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={name}
          disabled={disabled}
          onClick={onToggle}
          className={`relative w-[76px] h-[180px] rounded-[18px] border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-dora-orange/50 dark:focus:ring-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-40 ${
            on
              ? 'bg-gradient-to-b from-[#FFDDB0] to-[#FFB870] border-dora-orange/60 shadow-[inset_0_3px_8px_rgba(0,0,0,0.15),0_4px_16px_rgba(255,150,50,0.35)]'
              : 'bg-gradient-to-b from-[#EDE9DF] to-[#D8D3C7] border-[#BEB8AC] dark:from-white/[0.08] dark:to-white/[0.03] dark:border-white/15 shadow-[inset_0_3px_8px_rgba(0,0,0,0.18)]'
          }`}
        >
          {/* Lever */}
          <span
            className={`absolute left-1/2 -translate-x-1/2 w-[60px] h-[72px] rounded-[12px] transition-all duration-300 ease-out ${
              on ? 'top-[8px]' : 'bottom-[8px] top-auto'
            }`}
            style={{
              background: on
                ? 'linear-gradient(180deg, #FFFCF5 0%, #FFE8C0 40%, #FFC070 100%)'
                : 'linear-gradient(180deg, #FAFAF7 0%, #F0EDE5 50%, #DDD9CF 100%)',
              boxShadow: '0 5px 10px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.85)',
            }}
          >
            <span className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex flex-col gap-[5px]">
              <span className="h-[2px] bg-black/10 rounded-full" />
              <span className="h-[2px] bg-black/10 rounded-full" />
              <span className="h-[2px] bg-black/10 rounded-full" />
            </span>
          </span>
        </button>
      </div>

      {/* State + pin */}
      <div className="flex flex-col items-center gap-2.5">
        <span
          className={`font-mono text-[11px] font-bold uppercase tracking-widest ${
            on ? 'text-dora-orange dark:text-amber-400' : 'text-whisper-gray dark:text-[#4b5563]'
          }`}
        >
          {on ? 'ON' : 'OFF'}
        </span>
        {freqMin != null && freqMax != null && (
          <span className={`font-mono text-[13px] font-semibold tracking-tight ${
            on ? 'text-dora-orange dark:text-amber-400' : 'text-map-brown/80 dark:text-[#9ca3af]'
          }`}>
            {freqMin}–{freqMax} <span className="text-[11px] font-medium">GHz</span>
          </span>
        )}
        <span className="font-mono text-[10px] text-map-brown/40 dark:text-[#4b5563]">
          pin {pin}
        </span>
      </div>
    </div>
  )
}
