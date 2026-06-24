import { USERS } from './users'

/** SHA-256 hex of a UTF-8 string via the Web Crypto API. */
async function sha256Hex(input: string): Promise<string> {
  const buffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input),
  )
  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Returns true if `username` + `password` match a record in USERS.
 *
 * Both the lookup and the comparison run after hashing, so the
 * plaintext password is never stored. Still obfuscation, not
 * cryptographic security — see users.ts for the full caveat.
 */
export async function verifyCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const user = USERS.find(u => u.username === username)
  if (!user) return false
  const hash = await sha256Hex(password)
  return hash === user.passwordHash
}
