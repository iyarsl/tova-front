import { useState } from 'react'
import type { JSX } from 'react'
import { NavLink } from 'react-router-dom'
import { m } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { fetchConfig } from '@/api/vortex'
import { useAppSettings } from '@/hooks/useAppSettings'
import { useAuth } from '@/hooks/useAuth'
import { UsrpStatus } from '@/components/UsrpStatus'

type IconProps = { className?: string }
type NavItem = { to: string; label: string; icon: (props: IconProps) => JSX.Element }

const iconBase = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

// Vortex Control — signal attenuator (mixer sliders)
function SlidersIcon({ className }: IconProps) {
  return (
    <svg className={className} {...iconBase}>
      <line x1="5" y1="21" x2="5" y2="14" />
      <line x1="5" y1="10" x2="5" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="19" y1="21" x2="19" y2="16" />
      <line x1="19" y1="12" x2="19" y2="3" />
      <line x1="2.5" y1="14" x2="7.5" y2="14" />
      <line x1="9.5" y1="8" x2="14.5" y2="8" />
      <line x1="16.5" y1="16" x2="21.5" y2="16" />
    </svg>
  )
}

// SDR Receiver — radio reception
function RadioIcon({ className }: IconProps) {
  return (
    <svg className={className} {...iconBase}>
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
      <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19.1" />
    </svg>
  )
}

// RX Graphs — live signal activity
function ActivityIcon({ className }: IconProps) {
  return (
    <svg className={className} {...iconBase}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

// Signal Analyzer — waveform / spectrum
function WaveformIcon({ className }: IconProps) {
  return (
    <svg className={className} {...iconBase}>
      <line x1="2" y1="10" x2="2" y2="14" />
      <line x1="6.5" y1="6" x2="6.5" y2="18" />
      <line x1="11" y1="3" x2="11" y2="21" />
      <line x1="15.5" y1="8" x2="15.5" y2="16" />
      <line x1="20" y1="5" x2="20" y2="19" />
      <line x1="22.5" y1="10" x2="22.5" y2="14" />
    </svg>
  )
}

// Power Control — toggle on/off (relay switch, not app power)
function ToggleIcon({ className }: IconProps) {
  return (
    <svg className={className} {...iconBase}>
      <rect x="1.5" y="6" width="21" height="12" rx="6" />
      <circle cx="16.5" cy="12" r="3" />
    </svg>
  )
}

const navItems: NavItem[] = [
  { to: '/vortex',  label: 'Vortex Control',  icon: SlidersIcon },
  { to: '/config',  label: 'Signal Capture',  icon: RadioIcon },
  { to: '/rx',      label: 'Live Signal View', icon: ActivityIcon },
  { to: '/player',  label: 'Signal Analyzer',  icon: WaveformIcon },
  { to: '/arduino', label: 'Power Control',    icon: ToggleIcon },
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

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const { useVortex, isPending: settingsPending } = useAppSettings()
  const { data, isError } = useQuery({
    queryKey: ['vortex-config'],
    queryFn: fetchConfig,
    enabled: useVortex === true,
    refetchInterval: 5000,
    retry: false,
  })

  // Four-way status: checking settings / vortex disabled (flag off) / connected / disconnected
  const checking       = settingsPending
  const vortexDisabled = useVortex === false
  const connected      = useVortex === true && !isError && !!data

  return (
    <m.aside
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
        <button type="button"
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
        {navItems.map(item => {
          const itemDisabled = item.to === '/vortex' && vortexDisabled
          if (itemDisabled) {
            return (
              <div
                key={item.to}
                aria-disabled="true"
                title="VORTEX is disabled in device config"
                className="relative flex items-center gap-3 px-3 py-[9px] rounded-[12px] text-[14px] font-display font-semibold text-map-brown/35 dark:text-[#9ca3af]/35 cursor-not-allowed select-none"
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
                )}
              </div>
            )
          }
          return (
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
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? 'text-dora-orange dark:text-cyan-400' : ''
                  }`} />

                  {!collapsed && (
                    <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* USRP status */}
      <div className="px-3 pb-2">
        {collapsed ? (
          <div className="flex justify-center py-1">
            <UsrpStatus collapsed />
          </div>
        ) : (
          <UsrpStatus />
        )}
      </div>

      {/* User / logout */}
      <div className="px-3 pb-2 pt-3 border-t border-[#FFE4C4] dark:border-white/[0.07]">
        <div className="flex items-center gap-2">
          {!collapsed && (
            <span className="flex-1 font-body text-xs font-bold text-map-brown dark:text-[#9ca3af] truncate px-1">
              {user}
            </span>
          )}
          <button
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
            className="flex items-center justify-center w-7 h-7 rounded-full bg-white dark:bg-base-800 border border-[#FFD4A6] dark:border-white/10 text-map-brown dark:text-[#9ca3af] hover:border-sunset-red hover:text-sunset-red dark:hover:border-rose-500/50 dark:hover:text-rose-400 transition-colors shadow-sm flex-shrink-0"
          >
            <LogoutIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Status pill — VORTEX connection status, hidden when VORTEX is disabled */}
      {!vortexDisabled && (
      <div className="px-3 pb-4 border-[#FFE4C4] dark:border-white/[0.07]">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-[14px] text-xs font-body font-bold ${
            checking
              ? 'bg-[#EEF1F4] border border-tale-gray/25 text-tale-gray dark:bg-white/[0.04] dark:border-white/10 dark:text-[#9ca3af]'
              : connected
                ? 'bg-pastel-green border border-meadow-green/40 text-meadow-green-dk dark:bg-emerald-500/10 dark:border dark:border-emerald-500/20 dark:text-emerald-400'
                : 'bg-[#FFE0E0] border border-sunset-red/40 text-[#B03030] dark:bg-rose-500/10 dark:border dark:border-rose-500/20 dark:text-rose-400'
          }`}
        >
          {checking ? (
            <SearchIcon className="w-4 h-4 flex-shrink-0 animate-searching text-tale-gray dark:text-[#9ca3af]" />
          ) : connected ? (
            <SunIcon className="w-4 h-4 flex-shrink-0 animate-sun-pulse text-sunshine dark:text-emerald-400" />
          ) : (
            <SearchIcon className="w-4 h-4 flex-shrink-0 animate-searching text-sunset-red dark:text-rose-400" />
          )}
          {!collapsed && (
            <span className="whitespace-nowrap">
              {checking ? 'Checking…' : connected ? `v${data?.version}` : 'Disconnected'}
            </span>
          )}
        </div>
      </div>
      )}
    </m.aside>
  )
}

