import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { fetchConfig } from '@/api/vortex'

type NavItem = { to: string; label: string; icon: string }

const navItems: NavItem[] = [
  { to: '/vortex', label: 'Vortex Config', icon: '⚡' },
  { to: '/config', label: 'Scan Table',    icon: '⊞' },
  { to: '/rx',     label: 'RX Graphs',     icon: '◈' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const { data, isError } = useQuery({
    queryKey: ['vortex-config'],
    queryFn: fetchConfig,
    refetchInterval: 5000,
    retry: false,
  })

  const connected = !isError && !!data

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="flex-shrink-0 h-full flex flex-col dark:bg-base-900 bg-white border-r dark:border-white/[0.07] border-black/[0.08] overflow-hidden transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b dark:border-white/[0.07] border-black/[0.08] min-h-[60px]">
        {!collapsed && (
          <span className="font-display font-bold text-lg tracking-widest dark:text-cyan-400 text-[#0891b2] uppercase whitespace-nowrap">
            USRP
          </span>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-8 h-8 flex items-center justify-center rounded-md dark:text-[#9ca3af] text-[#6b7280] dark:hover:text-cyan-400 hover:text-[#0891b2] dark:hover:bg-white/5 hover:bg-[#f3f4f6] transition-colors ml-auto"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Section label */}
      <div className={`px-3 pt-4 pb-1 ${collapsed ? 'hidden' : ''}`}>
        <span className="text-[10px] font-medium tracking-[0.08em] uppercase dark:text-[#4b5563] text-[#9ca3af]">
          Workspace
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-1 flex flex-col gap-0.5 px-2">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] font-body transition-all duration-150 ${
                isActive
                  ? 'dark:bg-cyan-400/10 dark:text-cyan-400 dark:border dark:border-cyan-400/20 bg-[#ecfeff] text-[#0891b2] font-medium'
                  : 'dark:text-[#9ca3af] text-[#6b7280] dark:hover:bg-white/5 hover:bg-[#f3f4f6]'
              } ${location.pathname === item.to ? 'dark:shadow-glow-sm' : ''}`
            }
          >
            <span className="text-base flex-shrink-0 w-5 text-center">{item.icon}</span>
            {!collapsed && (
              <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Status pill */}
      <div className="px-3 py-4 border-t dark:border-white/[0.07] border-black/[0.08]">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono ${
            connected
              ? 'dark:bg-emerald-500/10 dark:border dark:border-emerald-500/20 dark:text-emerald-400 bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'dark:bg-rose-500/10 dark:border dark:border-rose-500/20 dark:text-rose-400 bg-rose-50 border border-rose-200 text-rose-600'
          }`}
        >
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-emerald-400 animate-pulse-slow' : 'bg-rose-400'}`} />
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
