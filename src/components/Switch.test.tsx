import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Switch } from './Switch'

describe('Switch', () => {
  it('reflects checked state via aria-checked', () => {
    const { rerender } = render(<Switch checked={false} onChange={() => {}} label="Link" />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    rerender(<Switch checked onChange={() => {}} label="Link" />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('calls onChange with the toggled value on click', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Switch checked={false} onChange={onChange} label="Link" />)
    await user.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('is operable by keyboard', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Switch checked onChange={onChange} label="Link" />)
    screen.getByRole('switch').focus()
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('exposes the label as accessible name when hidden', () => {
    render(<Switch checked={false} onChange={() => {}} label="Link FFT" hideLabel />)
    expect(screen.getByRole('switch', { name: 'Link FFT' })).toBeInTheDocument()
  })
})
