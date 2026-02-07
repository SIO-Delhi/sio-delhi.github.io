import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { usePortalAuth } from './PortalAuthContext'
import { fetchNotificationCounts, type NotificationCounts } from '../api'
import type { BadgeKey } from '../constants'

const POLL_INTERVAL = 60_000 // 60 seconds

const EMPTY: NotificationCounts = { unreadMessages: 0, pendingMigrations: 0, pendingForms: 0 }

interface NotificationContextValue {
  counts: NotificationCounts
  /** Immediately decrement a badge count by `amount` (default 1) without waiting for the next poll */
  decrement: (key: BadgeKey, amount?: number) => void
  /** Force a fresh fetch from the server */
  refresh: () => void
}

const NotificationCtx = createContext<NotificationContextValue>({
  counts: EMPTY,
  decrement: () => {},
  refresh: () => {},
})

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = usePortalAuth()
  const [counts, setCounts] = useState<NotificationCounts>(EMPTY)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchCounts = useCallback(async () => {
    if (!user) return
    try {
      const data = await fetchNotificationCounts({
        userId: user.id,
        role: user.role,
        unitId: user.unit_id ?? undefined,
      })
      setCounts(data)
    } catch {
      // Silently ignore — don't block the sidebar
    }
  }, [user])

  useEffect(() => {
    fetchCounts()
    intervalRef.current = setInterval(fetchCounts, POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchCounts])

  const decrement = useCallback((key: BadgeKey, amount = 1) => {
    setCounts(prev => ({
      ...prev,
      [key]: Math.max(0, prev[key] - amount),
    }))
  }, [])

  const refresh = useCallback(() => {
    fetchCounts()
  }, [fetchCounts])

  return (
    <NotificationCtx.Provider value={{ counts, decrement, refresh }}>
      {children}
    </NotificationCtx.Provider>
  )
}

/** Use notification counts and helper functions from anywhere inside the portal */
export function useNotifications() {
  return useContext(NotificationCtx)
}
