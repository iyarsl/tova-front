import { useEffect, useRef, useState } from 'react'

const SAMPLES      = 512
const FFT_BINS     = 256
const SPEC_ROWS    = 80
const TICK_MS      = 80

function gaussian() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export type SignalData = {
  time:        { x: number[]; y: number[] }
  fft:         { x: number[]; y: number[] }
  spectrogram: number[][]
}

export function useMockSignal(running: boolean) {
  const [data, setData]       = useState<SignalData | null>(null)
  const spectroRef            = useRef<number[][]>([])
  const phaseRef              = useRef(0)
  const centerFreq            = 2400  // MHz
  const sampleRate            = 1e6   // Hz

  useEffect(() => {
    if (!running) return

    const id = setInterval(() => {
      phaseRef.current += 0.15

      // Time domain
      const timeX: number[] = []
      const timeY: number[] = []
      for (let i = 0; i < SAMPLES; i++) {
        const t = i / sampleRate
        const sig =
          Math.sin(2 * Math.PI * 100e3 * t + phaseRef.current) * 0.7 +
          Math.sin(2 * Math.PI * 250e3 * t + phaseRef.current * 0.5) * 0.3 +
          gaussian() * 0.1
        timeX.push(i * (1000 / sampleRate))
        timeY.push(sig)
      }

      // FFT (simplified magnitude spectrum)
      const fftX: number[] = []
      const fftY: number[] = []
      const bw = sampleRate / 1e6
      for (let i = 0; i < FFT_BINS; i++) {
        const freq = centerFreq - bw / 2 + (i / FFT_BINS) * bw
        const noise = gaussian() * 3 - 85
        const peak1 = 30 * Math.exp(-Math.pow((freq - (centerFreq - 0.1)) * 50, 2))
        const peak2 = 20 * Math.exp(-Math.pow((freq - (centerFreq + 0.25)) * 80, 2))
        fftX.push(freq)
        fftY.push(noise + peak1 + peak2)
      }

      // Spectrogram row
      const newRow: number[] = []
      for (let i = 0; i < FFT_BINS; i++) {
        const noise = gaussian() * 2 - 80
        const peak  = 25 * Math.exp(-Math.pow((i - FFT_BINS * 0.4 + Math.sin(phaseRef.current) * 10) * 0.05, 2))
        newRow.push(noise + peak)
      }
      spectroRef.current = [...spectroRef.current.slice(-(SPEC_ROWS - 1)), newRow]

      setData({
        time:        { x: timeX, y: timeY },
        fft:         { x: fftX,  y: fftY  },
        spectrogram: spectroRef.current,
      })
    }, TICK_MS)

    return () => clearInterval(id)
  }, [running, sampleRate])

  return { data, centerFreq, sampleRate }
}
