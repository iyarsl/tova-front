import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RxAnalyzeView } from './RxAnalyzeView'
import type { SignalData, ChartId, ZoomLayout } from '@/types/rx'

// Stub the Plotly-backed charts so we can assert on the props they receive
// without running Plotly inside jsdom.
vi.mock('@/components/signal/FftChart', () => ({
  FftChart: ({ y }: { y: number[] }) => <div data-testid="fft" data-y={JSON.stringify(y)} />,
}))
vi.mock('@/components/signal/TimeDomainChart', () => ({
  TimeDomainChart: ({ y, yTitle }: { y: number[]; yTitle?: string }) => (
    <div data-testid="time" data-y={JSON.stringify(y)} data-ytitle={yTitle} />
  ),
}))

const DATA: SignalData = {
  time: { x: [0, 1], y: [10, 20], envDb: [-5, -6] },
  fft:  { x: [0, 1], y: [1, 2] },
  spectrogram: [],
}

const ZOOM: Record<ChartId, ZoomLayout> = {
  fft: { xRange: [0.1, 0.5] },
  time: {},
  spectrogram: {},
}

function setup(overrides: Partial<Parameters<typeof RxAnalyzeView>[0]> = {}) {
  const props = {
    data: DATA,
    theme: 'light' as const,
    zoomLayouts: ZOOM,
    onRelayout: vi.fn(),
    linked: true,
    setLinked: vi.fn(),
    bottomMode: 'envelope' as const,
    setBottomMode: vi.fn(),
    ...overrides,
  }
  render(<RxAnalyzeView {...props} />)
  return props
}

describe('RxAnalyzeView', () => {
  it('feeds the dB envelope to the time chart in envelope mode', () => {
    setup({ bottomMode: 'envelope' })
    const time = screen.getByTestId('time')
    expect(time.getAttribute('data-y')).toBe(JSON.stringify(DATA.time.envDb))
    expect(time.getAttribute('data-ytitle')).toBe('Power (dB)')
  })

  it('feeds the raw waveform to the time chart in waveform mode', () => {
    setup({ bottomMode: 'waveform' })
    const time = screen.getByTestId('time')
    expect(time.getAttribute('data-y')).toBe(JSON.stringify(DATA.time.y))
    expect(time.getAttribute('data-ytitle')).toBe('Amplitude')
  })

  it('shows the filtered band readout when linked with a zoom', () => {
    setup({ linked: true })
    expect(screen.getByText('Filtered: 0.10 – 0.50 MHz')).toBeInTheDocument()
  })

  it('shows "Full band" when unlinked', () => {
    setup({ linked: false })
    expect(screen.getByText('Full band')).toBeInTheDocument()
  })

  it('toggles the display mode and the link switch', async () => {
    const user = userEvent.setup()
    const props = setup({ bottomMode: 'envelope', linked: true })

    await user.click(screen.getByRole('button', { name: /waveform/i }))
    expect(props.setBottomMode).toHaveBeenCalledWith('waveform')

    await user.click(screen.getByRole('switch'))
    expect(props.setLinked).toHaveBeenCalledWith(false)
  })
})
