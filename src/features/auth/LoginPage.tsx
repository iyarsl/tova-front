import { useState } from 'react'
import { Navigate, useNavigate, useLocation } from 'react-router-dom'
import { m } from 'framer-motion'
import { z } from 'zod'
import { AuthBackdrop } from '@/features/auth/AuthBackdrop'
import { useAuth } from '@/hooks/useAuth'

const loginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
})

type FieldErrors = Partial<Record<keyof z.infer<typeof loginSchema>, string>>

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
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

const EASE_OUT = [0.22, 1, 0.36, 1] as const

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
      <AuthBackdrop />

      <div className="absolute inset-0 flex items-center justify-center p-6">
        <m.div
          initial={{ opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="relative w-full max-w-[420px]"
        >
          <div className="relative rounded-[22px] bg-white shadow-dora-modal overflow-hidden">
            {/* accent top bar */}
            <div className="h-[4px] bg-[linear-gradient(90deg,#FF8C42,#E06A1A_60%,#9B5DE5)]" />

            <div className="px-10 pt-10 pb-9">
              {/* Logo mark */}
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-pastel-orange mb-6">
                <LockIcon className="w-5 h-5 text-dora-orange-dark" />
              </div>

              {/* Title */}
              <h1 className="font-display font-extrabold text-[1.9rem] leading-none text-story-ink">
                Dora
              </h1>
              <p className="mt-2 mb-8 font-body text-[14px] text-tale-gray">
                Sign in to access the RF control panel
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

                {/* Username */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="username"
                    className="font-body text-[12.5px] font-semibold text-story-ink"
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
                    className={`w-full bg-warm-fog/60 border rounded-xl px-4 py-3 font-body text-[14.5px] text-story-ink placeholder:text-whisper-gray focus:outline-none focus:bg-white transition-colors ${
                      fieldErrors.username
                        ? 'border-sunset-red focus:border-sunset-red'
                        : 'border-story-ink/10 focus:border-dora-orange'
                    }`}
                    placeholder="admin"
                  />
                  {fieldErrors.username && (
                    <span className="font-body text-xs text-sunset-red">{fieldErrors.username}</span>
                  )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="password"
                    className="font-body text-[12.5px] font-semibold text-story-ink"
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
                      className={`w-full bg-warm-fog/60 border rounded-xl px-4 py-3 pr-11 font-body text-[14.5px] text-story-ink placeholder:text-whisper-gray focus:outline-none focus:bg-white transition-colors ${
                        fieldErrors.password
                          ? 'border-sunset-red focus:border-sunset-red'
                          : 'border-story-ink/10 focus:border-dora-orange'
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-whisper-gray hover:text-dora-orange transition-colors p-1"
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
                  <div className="flex items-center gap-2 bg-sunset-red/10 border border-sunset-red/25 rounded-lg px-3.5 py-2">
                    <span className="text-sunset-red text-xs">✕</span>
                    <span className="font-body text-[12.5px] text-[#B03030]">{credError}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 w-full py-3 rounded-xl font-display font-bold text-[15px] text-white transition-opacity disabled:opacity-70 disabled:cursor-default"
                  style={{
                    background: 'linear-gradient(135deg, #FF8C42, #E06A1A)',
                    boxShadow: '0 4px 14px rgba(255,140,66,0.38)',
                  }}
                >
                  {submitting ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
            </div>
          </div>
        </m.div>
      </div>
    </div>
  )
}
