import { createContext, use, useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type ToastType = 'success' | 'error' | 'warning' | 'info'

type Toast = {
  id: string
  type: ToastType
  message: string
}

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void
}

export const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return use(ToastContext)
}

const icons: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
}

// Toasts always use dark bg for contrast in both light and dark modes
const colors: Record<ToastType, string> = {
  success: 'border-emerald-500/60 bg-[#0f1f18] text-emerald-400',
  error:   'border-rose-500/60    bg-[#1f0f12] text-rose-400',
  warning: 'border-amber-500/60  bg-[#1f1808] text-amber-400',
  info:    'border-cyan-500/60   bg-[#071820] text-cyan-400',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0,  scale: 1 }}
              exit={{    opacity: 0, x: 60, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm font-mono text-sm min-w-64 pointer-events-auto ${colors[t.type]}`}
            >
              <span className="text-base font-bold">{icons[t.type]}</span>
              <span className="text-white/90 font-body">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext>
  )
}
