import { useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.siodelhi.org'
const VISITOR_ID_KEY = 'sio_visitor_id'

function getVisitorId(): string {
    let id = localStorage.getItem(VISITOR_ID_KEY)
    if (!id) {
        id = crypto.randomUUID()
        localStorage.setItem(VISITOR_ID_KEY, id)
    }
    return id
}

export function usePageTracker() {
    const location = useLocation()
    const lastTracked = useRef('')
    const pageEnteredAt = useRef<number>(0)
    const currentPage = useRef('')

    const sendDuration = useCallback(() => {
        if (!currentPage.current || !pageEnteredAt.current) return
        const seconds = Math.round((Date.now() - pageEnteredAt.current) / 1000)
        if (seconds < 1 || seconds > 3600) return // ignore <1s or >1hr (likely stale tab)

        const payload = JSON.stringify({
            page: currentPage.current,
            visitor_id: getVisitorId(),
            duration: seconds
        })

        // Use sendBeacon for reliable delivery on page unload
        if (navigator.sendBeacon) {
            navigator.sendBeacon(`${API_BASE}/analytics/duration`, payload)
        } else {
            fetch(`${API_BASE}/analytics/duration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true
            }).catch(() => {})
        }
    }, [])

    useEffect(() => {
        const path = location.pathname
        // Skip admin pages and duplicate tracking
        if (path.startsWith('/admin') || path === lastTracked.current) return

        // Send duration for the previous page before tracking the new one
        sendDuration()

        lastTracked.current = path
        currentPage.current = path
        pageEnteredAt.current = Date.now()

        // Fire and forget
        fetch(`${API_BASE}/analytics/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: path, visitor_id: getVisitorId() })
        }).catch(() => {})
    }, [location.pathname, sendDuration])

    // Send duration when user leaves the site entirely
    useEffect(() => {
        const handleUnload = () => sendDuration()
        const handleVisibility = () => {
            if (document.visibilityState === 'hidden') sendDuration()
        }
        window.addEventListener('beforeunload', handleUnload)
        document.addEventListener('visibilitychange', handleVisibility)
        return () => {
            window.removeEventListener('beforeunload', handleUnload)
            document.removeEventListener('visibilitychange', handleVisibility)
        }
    }, [sendDuration])

    // Heartbeat: ping every 30s so the visitor stays "live" in the dashboard
    useEffect(() => {
        const sendHeartbeat = () => {
            if (!currentPage.current) return
            fetch(`${API_BASE}/analytics/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visitor_id: getVisitorId() })
            }).catch(() => {})
        }
        const interval = setInterval(sendHeartbeat, 30000)
        return () => clearInterval(interval)
    }, [])
}
