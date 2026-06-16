import { describe, expect, it } from 'vitest'
import { verifyCredentials } from './verifyCredentials'

describe('verifyCredentials', () => {
  it('returns true for a known user with the correct password', async () => {
    await expect(verifyCredentials('admin', 'admin123')).resolves.toBe(true)
  })

  it('returns false for a known user with the wrong password', async () => {
    await expect(verifyCredentials('admin', 'wrong-password')).resolves.toBe(false)
  })

  it('returns false for an unknown user', async () => {
    await expect(verifyCredentials('nobody', 'admin123')).resolves.toBe(false)
  })
})
