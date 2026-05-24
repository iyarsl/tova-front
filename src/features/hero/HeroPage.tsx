import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { WaveCanvas } from './WaveCanvas'
import { fetchConfig } from '@/api/vortex'
import { useQuery } from '@tanstack/react-query'

type ConnectState = 'idle' | 'connecting' | 'success'

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
    <div className="relative w-full h-full overflow-hidden bg-base-950 dark:bg-base-950">
      <WaveCanvas />

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-base-950/40 to-base-950/80 pointer-events-none" />

      {/* Center card */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative w-full max-w-md"
        >
          {/* Card glass */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-10 shadow-2xl">
            {/* Subtle corner accent */}
            <div className="absolute -top-px -left-px w-20 h-20 rounded-tl-2xl border-t border-l border-cyan-400/40 pointer-events-none" />
            <div className="absolute -bottom-px -right-px w-20 h-20 rounded-br-2xl border-b border-r border-violet-500/40 pointer-events-none" />

            {/* Logo mark */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-16 h-16 rounded-xl border border-cyan-400/30 bg-cyan-400/5 flex items-center justify-center text-3xl shadow-glow-cyan">
                  ◈
                </div>
                <div className="absolute -inset-2 rounded-xl bg-cyan-400/5 blur-md -z-10" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-2">
              <h1 className="font-display text-5xl font-bold tracking-[0.15em] uppercase bg-gradient-to-r from-cyan-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">
                USRP Control
              </h1>
            </div>

            {/* Tagline */}
            <p className="text-center text-gray-400 font-body text-sm tracking-wide mb-10">
              Real-time RF control & signal visualization
            </p>

            {/* Status */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-400 animate-pulse-slow' : 'bg-rose-400'}`} />
              <span className={`font-mono text-xs ${online ? 'text-emerald-400' : 'text-rose-400'}`}>
                {online ? `Device online · v${data?.version}` : 'Backend unreachable'}
              </span>
            </div>

            {/* Connect button */}
            <button
              onClick={handleConnect}
              disabled={connectState !== 'idle'}
              className="w-full relative group py-3.5 px-6 rounded-xl font-display font-semibold text-lg tracking-widest uppercase text-base-950 overflow-hidden transition-all duration-300 disabled:cursor-default"
              style={{
                background: connectState === 'idle'
                  ? 'linear-gradient(135deg, #22d3ee, #8b5cf6)'
                  : undefined,
              }}
            >
              {connectState === 'idle' && (
                <>
                  <span className="relative z-10">Connect</span>
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-glow-cyan" />
                </>
              )}
              {connectState === 'connecting' && (
                <span className="flex items-center justify-center gap-3 text-cyan-400">
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connecting…
                </span>
              )}
              {connectState === 'success' && (
                <span className="flex items-center justify-center gap-2 text-emerald-400 font-mono">
                  <span>✓</span> Connected
                </span>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Scan line effect */}
      <AnimatePresence>
        {connectState === 'success' && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0.8 }}
            animate={{ scaleX: 1, opacity: 0 }}
            exit={{}}
            transition={{ duration: 0.5, ease: 'easeIn' }}
            className="absolute inset-0 bg-cyan-400/20 origin-left pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  )
}
