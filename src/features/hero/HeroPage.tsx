import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { DoraSkyCanvas } from './DoraSkyCanvas'
import { fetchConfig } from '@/api/vortex'
import { useQuery } from '@tanstack/react-query'

type ConnectState = 'idle' | 'connecting' | 'success'

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

export function HeroPage() {
  const navigate = useNavigate()
  const [connectState, setConnectState] = useState<ConnectState>('idle')

  const { data, isError } = useQuery({
    queryKey: ['vortex-config'],
    queryFn: fetchConfig,
    retry: 1,
    refetchInterval: false,
  })

  const online = !isError && !!data

  async function handleConnect() {
    setConnectState('connecting')
    await new Promise(r => setTimeout(r, 900))
    setConnectState('success')
    await new Promise(r => setTimeout(r, 500))
    navigate('/vortex')
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-sky-canvas">
      <DoraSkyCanvas />

      {/* Center card */}
      <div className="absolute inset-0 flex items-center justify-center p-6" style={{ paddingBottom: '10%' }}>
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
          className="relative w-full max-w-[440px]"
        >
          {/* Rainbow banner top */}
          <div
            className="absolute top-0 left-0 right-0 h-[5px] rounded-t-[28px]"
            style={{ background: 'linear-gradient(90deg, #FF8C42, #FFCA3A, #56C271, #5BC8F5, #9B5DE5)' }}
          />

          {/* Card body */}
          <div className="rounded-[28px] border-2 border-[#FFD4A6] bg-cream-page shadow-dora-hero pt-8 pb-8 px-10">

            {/* Logo mark — magnifying glass */}
            <div className="flex justify-center mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center bg-pastel-orange border-2 border-[#FFD4A6]"
                style={{ boxShadow: '0 0 20px rgba(255,140,66,0.3)' }}
              >
                <SearchIcon className="w-9 h-9 text-dora-orange" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-2">
              <h1 className="font-display font-extrabold text-[2.8rem] leading-tight text-dora-orange">
                USRP Control
              </h1>
            </div>

            {/* Tagline */}
            <p className="text-center text-tale-gray font-body text-[15px] mb-8">
              Real-time RF control & signal visualization
            </p>

            {/* Status */}
            <div className="flex items-center justify-center gap-2 mb-7">
              {online ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-meadow-green animate-pulse-slow" />
                  <span className="font-mono text-xs text-meadow-green-dk">
                    Device online · v{data?.version}
                  </span>
                </>
              ) : (
                <>
                  <SearchIcon className="w-3.5 h-3.5 text-sunset-red animate-searching" />
                  <span className="font-mono text-xs text-sunset-red">
                    Backend unreachable
                  </span>
                </>
              )}
            </div>

            {/* Connect button */}
            <button
              onClick={handleConnect}
              disabled={connectState !== 'idle'}
              className="w-full relative group py-4 px-6 rounded-full font-display font-bold text-lg text-white overflow-hidden transition-all duration-200 disabled:cursor-default disabled:opacity-80"
              style={{
                background: connectState === 'idle'
                  ? 'linear-gradient(135deg, #FF8C42, #E06A1A)'
                  : undefined,
                boxShadow: connectState === 'idle'
                  ? '0 4px 14px rgba(255,140,66,0.40)'
                  : undefined,
              }}
            >
              {connectState === 'idle' && (
                <>
                  <span className="relative z-10">Connect</span>
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200 rounded-full" />
                </>
              )}
              {connectState === 'connecting' && (
                <span className="flex items-center justify-center gap-3 bg-[#E06A1A] text-white rounded-full px-6 -mx-6 py-4 -my-4">
                  <SearchIcon className="w-5 h-5 animate-searching" />
                  Connecting…
                </span>
              )}
              {connectState === 'success' && (
                <span className="flex items-center justify-center gap-2 bg-meadow-green text-white rounded-full px-6 -mx-6 py-4 -my-4 font-body">
                  <span className="text-lg">✓</span> Connected
                </span>
              )}
            </button>

            {/* Decorative dots row */}
            <div className="flex justify-center gap-2 mt-5">
              {(['#FF8C42', '#FFCA3A', '#56C271', '#5BC8F5', '#9B5DE5'] as const).map(c => (
                <span key={c} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Success flash */}
      <AnimatePresence>
        {connectState === 'success' && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0.6 }}
            animate={{ scaleX: 1, opacity: 0 }}
            exit={{}}
            transition={{ duration: 0.5, ease: 'easeIn' }}
            className="absolute inset-0 bg-meadow-green/20 origin-left pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  )
}
