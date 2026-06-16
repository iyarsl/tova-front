import { useState } from 'react'
import { Navigate, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { z } from 'zod'
import { DoraSkyCanvas } from '@/features/hero/DoraSkyCanvas'
import { useAuth } from '@/hooks/useAuth'

const loginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
})

type FieldErrors = Partial<Record<keyof z.infer<typeof loginSchema>, string>>

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

function EyeIcon({ open, className }: { open: boolean; className?: string }) {
  return open ? (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const [username, setUsername]     = useState('')
  const [password, setPassword]     = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [credError, setCredError]   = useState('')

  if (user) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCredError('')

    const result = loginSchema.safeParse({ username, password })
    if (!result.success) {
      const errs: FieldErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FieldErrors
        if (!errs[key]) errs[key] = issue.message
      }
      setFieldErrors(errs)
      return
    }
    setFieldErrors({})
    setSubmitting(true)

    const ok = await login(username, password)
    setSubmitting(false)

    if (!ok) {
      setCredError('Incorrect username or password')
      return
    }

    navigate(from, { replace: true })
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-sky-canvas">
      <DoraSkyCanvas />

      <div className="absolute inset-0 flex items-center justify-center p-6" style={{ paddingBottom: '10%' }}>
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 }}
          className="relative w-full max-w-[420px]"
        >
          {/* Rainbow banner */}
          <div
            className="absolute top-0 left-0 right-0 h-[5px] rounded-t-[28px]"
            style={{ background: 'linear-gradient(90deg, #FF8C42, #FFCA3A, #56C271, #5BC8F5, #9B5DE5)' }}
          />

          {/* Card */}
          <div className="rounded-[28px] border-2 border-[#FFD4A6] bg-cream-page shadow-dora-hero pt-8 pb-8 px-10">

            {/* Logo */}
            <div className="flex justify-center mb-5">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center bg-pastel-orange border-2 border-[#FFD4A6]"
                style={{ boxShadow: '0 0 20px rgba(255,140,66,0.3)' }}
              >
                <SearchIcon className="w-8 h-8 text-dora-orange" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-1">
              <h1 className="font-display font-extrabold text-[2.6rem] leading-tight text-dora-orange">
                Dora
              </h1>
            </div>
            <p className="text-center font-body text-[13px] text-tale-gray mb-7">
              Sign in to continue
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

              {/* Username */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="username"
                  className="font-body text-[11px] font-bold uppercase tracking-widest text-map-brown"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={e => { setUsername(e.target.value); setFieldErrors(p => ({ ...p, username: undefined })); setCredError('') }}
                  className={`w-full bg-warm-fog border-2 rounded-xl px-4 py-[11px] font-body text-[15px] text-story-ink placeholder:text-whisper-gray focus:outline-none transition-colors ${
                    fieldErrors.username
                      ? 'border-sunset-red focus:border-sunset-red'
                      : 'border-[#FFD4A6] focus:border-dora-orange'
                  }`}
                  placeholder="admin"
                />
                {fieldErrors.username && (
                  <span className="font-body text-xs text-sunset-red">{fieldErrors.username}</span>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="password"
                  className="font-body text-[11px] font-bold uppercase tracking-widest text-map-brown"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: undefined })); setCredError('') }}
                    className={`w-full bg-warm-fog border-2 rounded-xl px-4 py-[11px] pr-11 font-body text-[15px] text-story-ink placeholder:text-whisper-gray focus:outline-none transition-colors ${
                      fieldErrors.password
                        ? 'border-sunset-red focus:border-sunset-red'
                        : 'border-[#FFD4A6] focus:border-dora-orange'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-whisper-gray hover:text-dora-orange transition-colors p-1"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showPw} className="w-4 h-4" />
                  </button>
                </div>
                {fieldErrors.password && (
                  <span className="font-body text-xs text-sunset-red">{fieldErrors.password}</span>
                )}
              </div>

              {/* Credential error */}
              {credError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-[#FFE0E0] border border-sunset-red/30 rounded-xl px-4 py-2.5"
                >
                  <span className="text-sunset-red text-sm">✕</span>
                  <span className="font-body text-[13px] text-[#B03030]">{credError}</span>
                </motion.div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="mt-1 w-full relative group py-[14px] px-6 rounded-full font-display font-bold text-[16px] text-white overflow-hidden transition-all duration-200 disabled:opacity-70 disabled:cursor-default"
                style={{
                  background: 'linear-gradient(135deg, #FF8C42, #E06A1A)',
                  boxShadow: '0 4px 14px rgba(255,140,66,0.40)',
                }}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <SearchIcon className="w-4 h-4 animate-searching" />
                    Signing in…
                  </span>
                ) : (
                  <>
                    <span className="relative z-10">Sign in</span>
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200 rounded-full" />
                  </>
                )}
              </button>
            </form>

            {/* Decorative dots */}
            <div className="flex justify-center gap-2 mt-6">
              {(['#FF8C42', '#FFCA3A', '#56C271', '#5BC8F5', '#9B5DE5'] as const).map(c => (
                <span key={c} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
