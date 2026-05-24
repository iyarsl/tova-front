import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-200 hover:opacity-80 focus:outline-none ${
        isDark
          ? 'border-white/[0.15] text-[#d1d5db]'
          : 'border-black/[0.12] text-[#374151]'
      }`}
    >
      <div className={`relative w-7 h-4 rounded-full transition-colors duration-200 ${
        isDark ? 'bg-cyan-400' : 'bg-[#e5e7eb]'
      }`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200 ${
          isDark ? 'left-[14px] bg-white' : 'left-0.5 bg-[#9ca3af]'
        }`} />
      </div>
      <span>{isDark ? 'Dark' : 'Light'}</span>
    </button>
  )
}
