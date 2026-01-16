
import { Navigate, Outlet } from 'react-router-dom'

export function ProtectedRoute() {
    const isAuthenticated = sessionStorage.getItem('sio_admin_auth') === 'true'

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />
    }

    return <Outlet />
}
