import { m } from 'framer-motion'

const variants = {
  initial: { opacity: 0, x: 40 },
  enter:   { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -40 },
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <m.div
      variants={variants}
      initial="initial"
      animate="enter"
      exit="exit"
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="h-full w-full"
    >
      {children}
    </m.div>
  )
}
