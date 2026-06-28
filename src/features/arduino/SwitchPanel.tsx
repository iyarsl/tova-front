import { PageTransition } from '@/components/PageTransition'
import { Topbar } from '@/components/Topbar'
import { useArduinoPorts } from './useArduinoPorts'
import { PortSwitch } from './PortSwitch'

export function SwitchPanel() {
  const { ports, isLoading, isRestarting, isExclusivePending, exclusiveToggle, pendingPortName, restartMut } = useArduinoPorts()

  if (isLoading) return (
    <PageTransition>
      <div className="flex-1 flex items-center justify-center text-tale-gray dark:text-[#6b7280] font-body text-sm">
        Loading port state…
      </div>
    </PageTransition>
  )

  return (
    <PageTransition>
      <div className="h-full flex flex-col overflow-hidden bg-transparent dark:bg-base-950 transition-colors">
        <Topbar title="Power Control" />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto h-full flex flex-col gap-6">

            <div className="relative flex-1 rounded-[24px] border border-[#FFD4A6] dark:border-white/[0.07] bg-pastel-orange dark:bg-base-900 p-8 shadow-dora-card dark:shadow-none transition-all">
              {isRestarting && (
                <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-[24px] bg-pastel-orange/85 dark:bg-base-900/85 backdrop-blur-[2px] font-display font-bold text-[13px] text-map-brown dark:text-[#9ca3af]">
                  <span className="w-3 h-3 rounded-full border-2 border-dora-orange border-t-transparent animate-spin" />
                  Rebooting…
                </div>
              )}

              {ports.length === 0 ? (
                <p className="text-center font-body text-sm text-whisper-gray dark:text-[#6b7280]">No ports configured</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 h-full">
                  {ports.map(p => (
                    <PortSwitch
                      key={p.name}
                      name={p.name}
                      pin={p.pin}
                      on={p.on}
                      disabled={isRestarting || isExclusivePending || pendingPortName === p.name}
                      onToggle={() => void exclusiveToggle(p.name)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-center pb-2">
              <button
                disabled={isRestarting || restartMut.isPending}
                onClick={() => restartMut.mutate()}
                className="flex items-center gap-2 px-4 py-2 rounded-full font-body text-xs font-semibold text-tale-gray dark:text-[#9ca3af] border border-[#FFD4A6] dark:border-white/10 hover:text-sunset-red hover:border-sunset-red/40 dark:hover:text-rose-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ⟲ {restartMut.isPending ? 'Restarting…' : 'Restart device'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </PageTransition>
  )
}
