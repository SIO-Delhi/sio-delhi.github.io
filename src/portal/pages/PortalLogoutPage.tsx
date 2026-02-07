import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClerk, useAuth } from '@clerk/clerk-react'

/**
 * Signs out of Clerk and redirects to portal login so the user can sign in again.
 */
export function PortalLogoutPage() {
  const { signOut, loaded } = useClerk()
  const { isSignedIn } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loaded) return
    if (!isSignedIn) {
      navigate('/portal/login', { replace: true })
      return
    }
    signOut({ redirectUrl: `${window.location.origin}/portal/login` })
      .then(() => navigate('/portal/login', { replace: true }))
      .catch(() => navigate('/portal/login', { replace: true }))
  }, [loaded, isSignedIn, signOut, navigate])

  return (
    <div className="portal-app portal-fullscreen portal-fullscreen-col">
      <div className="portal-spinner" />
      <p className="portal-spinner-text">Signing out…</p>
    </div>
  )
}
