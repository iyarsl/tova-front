import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="relative flex items-center rounded-full border transition-all duration-200 hover:opacity-80 focus:outline-none bg-[#E3F4FF] dark:bg-base-800 border-[#C5DFF0] dark:border-white/[0.10] w-[80px] h-[32px] px-1"
    >
      {/* Sliding selector */}
      <div
        className={`absolute top-1 w-[24px] h-[24px] rounded-full bg-white dark:bg-base-700 shadow-sm transition-all duration-200 ${
          isDark ? 'left-[50px]' : 'left-[2px]'
        }`}
      />
      {/* Sun */}
      <span className={`relative z-10 text-base ml-0.5 transition-colors ${!isDark ? 'text-sunshine' : 'text-[#6b7280]'}`}>
        ☀️
      </span>
      {/* Moon */}
      <span className={`relative z-10 text-base ml-auto mr-0.5 transition-colors ${isDark ? 'text-cyan-400' : 'text-[#9ca3af]'}`}>
        🌙
      </span>
    </button>
  )
}
