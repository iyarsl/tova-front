import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { DoraSkyCanvas } from './DoraSkyCanvas'
import { fetchConfig } from '@/api/vortex'
import { useQuery } from '@tanstack/react-query'
import doraHero from '@/assets/dora/dora-d.png'
import bootsBuddy from '@/assets/dora/boots2.png'

type ConnectState = 'idle' | 'connecting' | 'success'

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="22" y2="22" />
    </svg>
  )
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  )
}

// Live RF radar rings that radiate behind Dora — orange core fading to purple.
function RadarRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[0, 1, 2].map(i => (
        <span key={i}
          className={`absolute rounded-full border-2 motion-reduce:hidden animate-radar ${
            i === 2 ? 'border-adv-purple/35' : 'border-dora-orange/45'
          }`}
          style={{ width: 320, height: 320, animationDelay: `${i}s` }} />
      ))}
      <span className="absolute w-[160px] h-[2px] origin-left animate-sweep motion-reduce:animate-none"
        style={{ background: 'linear-gradient(90deg, rgba(255,140,66,0.6), rgba(155,93,229,0.28), transparent)' }} />
      <span className="absolute w-3 h-3 rounded-full bg-dora-orange animate-pulse-slow shadow-[0_0_14px_rgba(255,140,66,0.7)]" />
    </div>
  )
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const

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
    await new Promise(r => setTimeout(r, 550))
    navigate('/vortex')
  }

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: EASE_OUT, delay },
  })

  return (
    <div className="relative w-full h-full overflow-hidden bg-sky-canvas">
      <DoraSkyCanvas />

      {/* FUI corner brackets — command-center frame */}
      {([
        'top-6 left-6 border-t-2 border-l-2 rounded-tl-lg',
        'top-6 right-6 border-t-2 border-r-2 rounded-tr-lg',
        'bottom-6 left-6 border-b-2 border-l-2 rounded-bl-lg',
        'bottom-6 right-6 border-b-2 border-r-2 rounded-br-lg',
      ] as const).map(pos => (
        <span key={pos} className={`absolute w-10 h-10 border-dora-orange/35 ${pos}`} />
      ))}

      {/* Content grid — text left, Dora right */}
      <div className="relative z-10 h-full w-full mx-auto max-w-[1200px] px-8 md:px-14
        grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] items-center gap-8">

        {/* Text column */}
        <div className="max-w-xl text-center xl:text-left">

          {/* Eyebrow status */}
          <motion.div {...reveal(0.15)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/55 backdrop-blur-sm border border-white/70 mb-6">
            {online ? (
              <>
                <span className="w-2 h-2 rounded-full bg-meadow-green animate-pulse-slow" />
                <span className="font-mono text-[11px] tracking-[0.16em] text-meadow-green-dk uppercase">
                  System online · v{data?.version}
                </span>
              </>
            ) : (
              <>
                <SearchIcon className="w-3.5 h-3.5 text-sunset-red animate-searching" />
                <span className="font-mono text-[11px] tracking-[0.16em] text-sunset-red uppercase">
                  Scanning for device…
                </span>
              </>
            )}
          </motion.div>

          {/* Huge display headline */}
          <motion.h1 {...reveal(0.28)}
            className="font-display font-extrabold leading-[0.9] tracking-tight
              text-[clamp(4rem,11vw,8rem)] text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(120deg, #FF8C42 0%, #E06A1A 38%, #9B5DE5 72%, #5BC8F5 100%)' }}>
            Dora
          </motion.h1>

          <motion.p {...reveal(0.4)}
            className="mt-2 font-display font-bold text-[clamp(1.1rem,2.4vw,1.6rem)] text-story-ink">
            RF Signal Explorer
          </motion.p>

          <motion.p {...reveal(0.5)}
            className="mt-3 font-body text-tale-gray text-[15px] leading-relaxed max-w-md mx-auto xl:mx-0">
            Sweep the spectrum, lock the Vortex, and chart every signal — your command center for live RF.
          </motion.p>

          {/* CTA */}
          <motion.div {...reveal(0.62)} className="mt-8 flex justify-center xl:justify-start">
            <div className="relative">
              {/* glow ring */}
              {connectState === 'idle' && (
                <span aria-hidden className="absolute -inset-1.5 rounded-full motion-reduce:hidden animate-glow-pulse"
                  style={{ background: 'radial-gradient(circle, rgba(255,140,66,0.45), transparent 70%)' }} />
              )}
              <button
                onClick={handleConnect}
                disabled={connectState !== 'idle'}
                className="relative group flex items-center gap-3 py-4 pl-7 pr-6 rounded-full
                  font-display font-bold text-lg text-white overflow-hidden
                  transition-transform duration-200 hover:-translate-y-0.5
                  disabled:cursor-default disabled:hover:translate-y-0"
                style={{
                  background: connectState === 'success'
                    ? 'linear-gradient(135deg, #56C271, #3DAD5A)'
                    : connectState === 'connecting'
                      ? 'linear-gradient(135deg, #E06A1A, #C25A12)'
                      : 'linear-gradient(135deg, #FF8C42, #E06A1A)',
                  boxShadow: '0 8px 26px rgba(255,140,66,0.45)',
                }}>
                {connectState === 'idle' && (
                  <>
                    <span className="relative z-10">Connect</span>
                    <ArrowIcon className="relative z-10 w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
                    {/* hover shimmer */}
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }} />
                  </>
                )}
                {connectState === 'connecting' && (
                  <>
                    <SearchIcon className="w-5 h-5 animate-searching" />
                    <span>Connecting…</span>
                  </>
                )}
                {connectState === 'success' && (
                  <>
                    <span className="text-lg">✓</span>
                    <span>Connected</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Dora — large hero focal */}
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.55 }}
          className="relative hidden xl:flex items-center justify-center h-full pointer-events-none">

          <div className="relative w-[460px] h-[460px] flex items-end justify-center">
            <RadarRings />
            <div className="relative z-10 animate-float">
              <img src={doraHero} alt="Dora the explorer"
                className="w-[clamp(300px,32vw,420px)] drop-shadow-[0_24px_40px_rgba(45,42,62,0.28)]" />
            </div>
            {/* ground glow */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-56 h-7 rounded-full"
              style={{ background: 'radial-gradient(ellipse, rgba(255,140,66,0.28), transparent 70%)' }} />
            {/* Boots */}
            <img src={bootsBuddy} alt="" aria-hidden
              className="absolute bottom-3 left-2 w-28 z-20 animate-float-slow drop-shadow-[0_12px_22px_rgba(45,42,62,0.22)]" />
          </div>
        </motion.div>
      </div>

      {/* Connect success flash */}
      <AnimatePresence>
        {connectState === 'success' && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0.6 }}
            animate={{ scaleX: 1, opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeIn' }}
            className="absolute inset-0 bg-meadow-green/20 origin-left pointer-events-none z-20" />
        )}
      </AnimatePresence>
    </div>
  )
}
