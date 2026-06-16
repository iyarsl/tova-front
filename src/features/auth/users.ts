/**
 * Fixed user list for the frontend soft-gate.
 *
 * ⚠️  SECURITY NOTE — this is a UI-only barrier, NOT real security.
 * Hashes ship in the compiled JS bundle and are bypassable by anyone
 * with dev-tools access. The backend at :8000 remains fully open.
 * This was a deliberate, recorded trade-off: real LAN protection would
 * require a reverse proxy or backend auth, both out of scope here.
 *
 * To add or change a user, generate a SHA-256 hex hash of the new
 * password and add it below. Quick way (browser console):
 *
 *   const buf = await crypto.subtle.digest('SHA-256',
 *     new TextEncoder().encode('your-password'))
 *   console.log([...new Uint8Array(buf)].map(b =>
 *     b.toString(16).padStart(2, '0')).join(''))
 *
 * Current users:
 *   admin    / admin123
 *   operator / dora2024
 */

export type AppUser = {
  username: string
  passwordHash: string // SHA-256 hex, lowercase
}

export const USERS: AppUser[] = [
  {
    username: 'admin',
    passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  },
  {
    username: 'operator',
    passwordHash: 'fa0364302fd4179ccdc61954ae5547bddaeddb70a7fa410c0b19ba74da23d533',
  },
]
