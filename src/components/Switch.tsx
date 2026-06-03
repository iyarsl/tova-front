type Props = {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Accessible label; also rendered beside the track unless `hideLabel` is set */
  label: string
  hideLabel?: boolean
}

/**
 * Small accessible toggle switch styled for the Dora theme.
 * Renders as a `role="switch"` button — keyboard-operable (Space/Enter) by default.
 */
export function Switch({ checked, onChange, label, hideLabel }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={hideLabel ? label : undefined}
      onClick={() => onChange(!checked)}
      className="group flex items-center gap-2 focus:outline-none"
    >
      {!hideLabel && (
        <span className="font-display font-bold text-[11px] uppercase tracking-wide text-tale-gray dark:text-[#9ca3af] transition-colors">
          {label}
        </span>
      )}
      <span
        className={`relative inline-flex h-[20px] w-[36px] shrink-0 items-center rounded-full border transition-colors duration-200 ${
          checked
            ? 'border-transparent'
            : 'bg-[#E3F4FF] dark:bg-base-800 border-[#C5DFF0] dark:border-white/[0.10]'
        }`}
        style={checked ? {
          background: 'linear-gradient(135deg, #5BC8F5, #3BA8D5)',
          boxShadow: '0 2px 8px rgba(91,200,245,0.45)',
        } : {}}
      >
        <span
          className={`absolute top-1/2 h-[14px] w-[14px] -translate-y-1/2 rounded-full bg-white shadow-sm transition-all duration-200 ${
            checked ? 'left-[19px]' : 'left-[3px]'
          }`}
        />
      </span>
    </button>
  )
}
