type PortSwitchProps = {
  name: string
  pin: number
  on: boolean
  disabled?: boolean
  onToggle: () => void
}

export function PortSwitch({ name, pin, on, disabled, onToggle }: PortSwitchProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-4">
      {/* LED indicator */}
      <span
        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
          on
            ? 'bg-meadow-green shadow-[0_0_8px_2px_rgba(86,194,113,0.65)]'
            : 'bg-[#D8D0BC] dark:bg-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]'
        }`}
      />

      {/* Switch housing — vertical slot the lever travels in */}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={name}
        disabled={disabled}
        onClick={onToggle}
        className={`relative w-11 h-[72px] rounded-[10px] border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-dora-orange/40 dark:focus:ring-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-50 ${
          on
            ? 'bg-gradient-to-b from-[#FFD9B0] to-[#FFC183] border-dora-orange/40'
            : 'bg-gradient-to-b from-[#F3EFE3] to-[#E6E1D2] border-[#D8D0BC] dark:from-white/10 dark:to-white/5 dark:border-white/10'
        }`}
        style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.12)' }}
      >
        {/* Lever — flips between top (ON) and bottom (OFF) */}
        <span
          className={`absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-[8px] transition-all duration-200 ease-out ${
            on ? 'top-1' : 'top-[34px]'
          }`}
          style={{
            background: 'linear-gradient(180deg, #FFFDF8 0%, #FFE8D6 45%, #FFC183 100%)',
            boxShadow: '0 3px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          <span className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex flex-col gap-[3px]">
            <span className="h-[1.5px] bg-black/10 rounded-full" />
            <span className="h-[1.5px] bg-black/10 rounded-full" />
          </span>
        </span>
      </button>

      {/* Label plate */}
      <span className="font-display font-bold text-[11px] uppercase tracking-[0.08em] text-map-brown dark:text-[#9ca3af]">
        {name}
      </span>
      <span
        className={`font-mono text-[9px] uppercase tracking-wide ${
          on ? 'text-meadow-green-dk dark:text-emerald-400' : 'text-whisper-gray dark:text-[#4b5563]'
        }`}
      >
        {on ? 'ON' : 'OFF'}
      </span>
      <span className="font-mono text-[9px] text-whisper-gray dark:text-[#4b5563]">
        pin {pin}
      </span>
    </div>
  )
}
