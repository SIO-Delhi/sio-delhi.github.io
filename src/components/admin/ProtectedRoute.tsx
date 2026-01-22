import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'

export function ProtectedRoute() {
    const { isSignedIn, isLoaded } = useAuth()

    if (!isLoaded) {
        return null // Or a loading spinner
    }

    if (!isSignedIn) {
        return <Navigate to="/admin/login" replace />
    }

    return <Outlet />
}
