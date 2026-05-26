import { ThemeToggle } from './ThemeToggle'

type TopbarProps = { title: string }

export function Topbar({ title }: TopbarProps) {
  return (
    <header className="h-[60px] flex-shrink-0 flex items-center justify-between px-6 border-b border-[#F0EBD8] dark:border-white/[0.07] bg-cream-page dark:bg-base-900 shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors">
      <div className="flex items-center gap-3">
        {/* Three decorative dots — light mode only */}
        <div className="flex gap-1 dark:hidden">
          {(['#FFCA3A', '#FF8C42', '#56C271'] as const).map(c => (
            <span key={c} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
          ))}
        </div>
        <h1 className="font-display font-bold text-[22px] text-story-ink dark:text-[#f9fafb] tracking-tight">
          {title}
        </h1>
      </div>
      <ThemeToggle />
    </header>
  )
}
