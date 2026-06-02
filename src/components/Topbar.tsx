import { ThemeToggle } from './ThemeToggle'

type TopbarProps = { title: string }

export function Topbar({ title }: TopbarProps) {
  return (
    <header className="h-[60px] flex-shrink-0 flex items-center gap-4 px-6 border-b border-[#F0EBD8] dark:border-white/[0.07] bg-cream-page/90 dark:bg-base-900 backdrop-blur-sm shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors">
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Three decorative dots */}
        <div className="flex gap-1 dark:hidden">
          {(['#FFCA3A', '#FF8C42', '#56C271'] as const).map(c => (
            <span key={c} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
          ))}
        </div>
        <h1 className="font-display font-bold text-[22px] text-story-ink dark:text-[#f9fafb] tracking-tight">
          {title}
        </h1>
      </div>

      {/* Explorer trail — dashed route across the header (light only) */}
      <div className="relative flex-1 hidden md:flex items-center dark:hidden">
        <div className="flex-1" style={{ borderTop: '2px dashed #FFD4A6' }} />
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#FFB37A] -ml-0.5"
            style={{ marginLeft: i === 0 ? 0 : 6 }}
          />
        ))}
        <svg className="w-4 h-4 ml-1 text-dora-orange/70" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
        </svg>
      </div>

      <ThemeToggle />
    </header>
  )
}
