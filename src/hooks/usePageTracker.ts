import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.siodelhi.org'

export function usePageTracker() {
    const location = useLocation()
    const lastTracked = useRef('')

    useEffect(() => {
        const path = location.pathname
        // Skip admin pages and duplicate tracking
        if (path.startsWith('/admin') || path === lastTracked.current) return
        lastTracked.current = path

        // Fire and forget
        fetch(`${API_BASE}/analytics/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: path })
        }).catch(() => {})
    }, [location.pathname])
}
