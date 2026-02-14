import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'

export function ProtectedRoute() {
    const { isSignedIn, isLoaded: authLoaded } = useAuth()
    const { user, isLoaded: userLoaded } = useUser()

    if (!authLoaded || !userLoaded) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0a0a0a',
                color: '#666'
            }}>
                Loading...
            </div>
        )
    }

    if (!isSignedIn) {
        return <Navigate to="/admin/login" replace />
    }

    // Restrict admin access to specific username
    const username = user?.username || user?.primaryEmailAddress?.emailAddress?.split('@')[0]
    const adminUsernames = (import.meta.env.VITE_ADMIN_USERNAMES || '').split(',').map((u: string) => u.trim())
    if (!adminUsernames.includes(username)) {
        return <Navigate to="/portal" replace />
    }

    return <Outlet />
}
