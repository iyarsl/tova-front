import { ThemeToggle } from './ThemeToggle'

type TopbarProps = { title: string }

export function Topbar({ title }: TopbarProps) {
  return (
    <header className="h-[60px] flex-shrink-0 flex items-center justify-between px-6 border-b border-[#F0EBD8] dark:border-white/[0.07] bg-cream-page/90 dark:bg-base-900 backdrop-blur-sm shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors">
      <h1 className="relative font-display font-bold text-[22px] text-story-ink dark:text-[#f9fafb] tracking-tight">
        {title}
        {/* Thin purple→orange hairline accent */}
        <span
          className="absolute -bottom-1 left-0 h-[2px] w-9 rounded-full"
          style={{ background: 'linear-gradient(90deg, #9B5DE5, #FF8C42)' }}
        />
      </h1>

      <ThemeToggle />
    </header>
  )
}
