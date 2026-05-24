import { ThemeToggle } from './ThemeToggle'

type TopbarProps = { title: string }

export function Topbar({ title }: TopbarProps) {
  return (
    <header className="h-[60px] flex-shrink-0 flex items-center justify-between px-5 border-b dark:border-white/[0.07] border-black/[0.08] dark:bg-base-900 bg-white transition-colors">
      <h1 className="font-display text-[15px] font-medium tracking-wide dark:text-[#f9fafb] text-[#111827]">
        {title}
      </h1>
      <ThemeToggle />
    </header>
  )
}
