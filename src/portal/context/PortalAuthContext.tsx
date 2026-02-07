import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import type { PortalUser } from '../types'
import * as api from '../api'

interface PortalAuthValue {
  /** The portal user record (role, unit, title, etc.). Null if not loaded yet or no matching portal_users row. */
  user: PortalUser | null
  /** True while Clerk auth or portal user lookup is in progress. */
  loading: boolean
  /** True if Clerk is authenticated AND a portal_users record was found. */
  isAuthenticated: boolean
  /** Error message if portal user lookup failed. */
  error: string | null
}

const AuthContext = createContext<PortalAuthValue | null>(null)

/**
 * Bridges Clerk auth with the portal_users table (PHP/MySQL backend).
 * After Clerk sign-in, looks up the portal user so we can load role, unit, title.
 *
 * Lookup order (what we send to POST /api/portal/auth/me):
 * 1. Clerk username (user.username) → backend matches portal_users.username (case-insensitive)
 * 2. If not found: each Clerk phone number → backend matches portal_users.phone
 * So the same username/password used to sign in to Clerk must exist as a row in portal_users
 * with that username (or a matching phone if you signed in with phone in Clerk).
 */
export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded: authLoaded } = useAuth()
  const { user: clerkUser, isLoaded: userLoaded } = useUser()

  const [portalUser, setPortalUser] = useState<PortalUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Wait until Clerk has loaded
    if (!authLoaded || !userLoaded) return

    // Not signed in — clear state
    if (!isSignedIn || !clerkUser) {
      setPortalUser(null)
      setLoading(false)
      setError(null)
      return
    }

    // Signed in — look up portal_users by username (Clerk) or phone
    let cancelled = false
    setLoading(true)
    setError(null)

    async function lookupPortalUser() {
      try {
        let found: PortalUser | null = null
        // 1. Try Clerk username (Clerk User object has .username when username sign-in is enabled)
        const clerkUsername =
          (clerkUser as { username?: string | null }).username ??
          (clerkUser as { primaryUsername?: string | null }).primaryUsername
        if (clerkUsername && String(clerkUsername).trim()) {
          found = await api.lookupPortalUserByUsername(String(clerkUsername).trim())
        }
        if (!found) {
          const phones = clerkUser!.phoneNumbers.map(p =>
            p.phoneNumber.replace(/^\+91/, '').replace(/^\+/, ''),
          )
          for (const phone of phones) {
            found = await api.lookupPortalUserByPhone(phone)
            if (found) break
          }
        }

        if (!cancelled) {
          if (found) {
            setPortalUser(found)
            setError(null)
          } else {
            setPortalUser(null)
            setError('Your account is not registered in the portal. Contact your administrator.')
          }
        }
      } catch (err) {
        if (!cancelled) {
          setPortalUser(null)
          setError(err instanceof Error ? err.message : 'Failed to load portal user data.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    lookupPortalUser()
    return () => { cancelled = true }
  }, [authLoaded, userLoaded, isSignedIn, clerkUser])

  const isAuthenticated = !!portalUser && !!isSignedIn

  return (
    <AuthContext.Provider value={{ user: portalUser, loading, isAuthenticated, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function usePortalAuth(): PortalAuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('usePortalAuth must be used within PortalAuthProvider')
  return ctx
}
