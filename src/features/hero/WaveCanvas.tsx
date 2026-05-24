import { useEffect, useRef } from 'react'
import { useTheme } from '@/hooks/useTheme'

export function WaveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const rafRef    = useRef<number>(0)
  const offsetRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const isDark = theme === 'dark'
    const bgColor    = isDark ? '#030712'                : '#f0f4f8'
    const glowColor  = isDark ? 'rgba(34,211,238,'       : 'rgba(8,145,178,'
    const lineColor  = isDark ? '#22d3ee'                : '#0891b2'
    const gridColor  = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)'

    function draw() {
      const W = canvas!.width
      const H = canvas!.height
      ctx!.clearRect(0, 0, W, H)

      ctx!.fillStyle = bgColor
      ctx!.fillRect(0, 0, W, H)

      ctx!.strokeStyle = gridColor
      ctx!.lineWidth = 1
      for (let x = 0; x < W; x += 60) {
        ctx!.beginPath(); ctx!.moveTo(x, 0); ctx!.lineTo(x, H); ctx!.stroke()
      }
      for (let y = 0; y < H; y += 60) {
        ctx!.beginPath(); ctx!.moveTo(0, y); ctx!.lineTo(W, y); ctx!.stroke()
      }

      offsetRef.current += 0.8
      const off = offsetRef.current
      const mid = H / 2

      const layers = [
        { amp: H * 0.12, freq: 0.012, speed: 1.0,  alpha: 0.15, width: 2 },
        { amp: H * 0.08, freq: 0.025, speed: 1.7,  alpha: 0.10, width: 1 },
        { amp: H * 0.18, freq: 0.008, speed: 0.6,  alpha: 0.08, width: 3 },
      ]

      layers.forEach(({ amp, freq, speed, alpha, width }) => {
        ctx!.beginPath()
        ctx!.strokeStyle = `${glowColor}${alpha})`
        ctx!.lineWidth = width
        for (let x = 0; x <= W; x += 2) {
          const t = x * freq - off * 0.01 * speed
          const noise = (Math.sin(t * 7.3) * 0.2 + Math.sin(t * 13.1) * 0.1)
          const y = mid + Math.sin(t) * amp + noise * amp
          x === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y)
        }
        ctx!.stroke()
      })

      ctx!.save()
      ctx!.shadowColor = lineColor
      ctx!.shadowBlur  = 18
      ctx!.beginPath()
      ctx!.strokeStyle = lineColor
      ctx!.lineWidth   = 2.5
      for (let x = 0; x <= W; x += 2) {
        const t     = x * 0.015 - off * 0.015
        const noise = Math.sin(x * 0.08 + off * 0.03) * 0.15
        const pulse = Math.sin(x * 0.003 - off * 0.005) * 0.4 + 0.6
        const y     = mid + (Math.sin(t) + noise) * H * 0.14 * pulse
        x === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y)
      }
      ctx!.stroke()
      ctx!.restore()

      const grad = ctx!.createLinearGradient(0, mid - H * 0.2, 0, mid + H * 0.2)
      grad.addColorStop(0, `${glowColor}0.06)`)
      grad.addColorStop(0.5, `${glowColor}0.02)`)
      grad.addColorStop(1, `${glowColor}0)`)
      ctx!.beginPath()
      ctx!.fillStyle = grad
      for (let x = 0; x <= W; x += 2) {
        const t     = x * 0.015 - off * 0.015
        const noise = Math.sin(x * 0.08 + off * 0.03) * 0.15
        const pulse = Math.sin(x * 0.003 - off * 0.005) * 0.4 + 0.6
        const y     = mid + (Math.sin(t) + noise) * H * 0.14 * pulse
        x === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y)
      }
      ctx!.lineTo(W, H); ctx!.lineTo(0, H)
      ctx!.closePath(); ctx!.fill()

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [theme])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}
