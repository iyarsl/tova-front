import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { fetchConfig } from '@/api/vortex'

type NavItem = { to: string; label: string; icon: string }

const navItems: NavItem[] = [
  { to: '/vortex', label: 'Vortex Config', icon: '⚡' },
  { to: '/config', label: 'Scan Table',    icon: '⊞' },
  { to: '/rx',     label: 'RX Graphs',     icon: '◈' },
  { to: '/player', label: 'File Player',   icon: '▶' },
]

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="22" y2="22" />
    </svg>
  )
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2"  x2="12" y2="5"  />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2"  y1="12" x2="5"  y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.22"  y1="4.22"  x2="6.34"  y2="6.34"  />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      <line x1="4.22"  y1="19.78" x2="6.34"  y2="17.66" />
      <line x1="17.66" y1="6.34"  x2="19.78" y2="4.22"  />
    </svg>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { data, isError } = useQuery({
    queryKey: ['vortex-config'],
    queryFn: fetchConfig,
    refetchInterval: 5000,
    retry: false,
  })

  const connected = !isError && !!data

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="flex-shrink-0 h-full flex flex-col bg-warm-fog dark:bg-base-900 border-r border-[#FFE4C4] dark:border-white/[0.07] shadow-dora-sidebar dark:shadow-none overflow-hidden transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#FFE4C4] dark:border-white/[0.07] min-h-[60px]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <SearchIcon className="w-5 h-5 text-dora-orange flex-shrink-0" />
            <span className="font-display font-extrabold text-xl text-dora-orange dark:text-cyan-400 whitespace-nowrap">
              Dora
            </span>
            {/* Subtle Dora-purple accent dot */}
            <span className="w-1.5 h-1.5 rounded-full bg-adv-purple/70 dark:bg-adv-purple/50 flex-shrink-0" />
          </div>
        )}
        {collapsed && (
          <SearchIcon className="w-6 h-6 text-dora-orange dark:text-cyan-400 mx-auto" />
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-base-800 border border-[#FFD4A6] dark:border-white/10 text-dora-orange dark:text-[#9ca3af] hover:border-dora-orange dark:hover:text-cyan-400 shadow-sm transition-colors ml-auto flex-shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="text-sm">{collapsed ? '›' : '‹'}</span>
        </button>
      </div>

      {/* Section label */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-1">
          <span className="text-[10px] font-body font-bold tracking-[0.12em] uppercase text-whisper-gray dark:text-[#4b5563]">
            Workspace
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-2 flex flex-col gap-0.5 px-2">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-[9px] rounded-[12px] text-[14px] font-display font-semibold transition-colors duration-150 ${
                isActive
                  ? 'bg-pastel-orange text-dora-orange border-l-[3px] border-dora-orange dark:bg-cyan-400/10 dark:text-cyan-400 dark:border dark:border-cyan-400/20'
                  : 'text-map-brown dark:text-[#9ca3af] hover:bg-[rgba(255,140,66,0.08)] dark:hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-base flex-shrink-0 w-5 text-center ${
                  isActive ? 'text-dora-orange dark:text-cyan-400' : ''
                }`}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Status pill */}
      <div className="px-3 py-4 border-t border-[#FFE4C4] dark:border-white/[0.07]">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-[14px] text-xs font-body font-bold ${
            connected
              ? 'bg-pastel-green border border-meadow-green/40 text-meadow-green-dk dark:bg-emerald-500/10 dark:border dark:border-emerald-500/20 dark:text-emerald-400'
              : 'bg-[#FFE0E0] border border-sunset-red/40 text-[#B03030] dark:bg-rose-500/10 dark:border dark:border-rose-500/20 dark:text-rose-400'
          }`}
        >
          {connected ? (
            <SunIcon className="w-4 h-4 flex-shrink-0 animate-sun-pulse text-sunshine dark:text-emerald-400" />
          ) : (
            <SearchIcon className="w-4 h-4 flex-shrink-0 animate-searching text-sunset-red dark:text-rose-400" />
          )}
          {!collapsed && (
            <span className="whitespace-nowrap">
              {connected ? `v${data?.version}` : 'Disconnected'}
            </span>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
