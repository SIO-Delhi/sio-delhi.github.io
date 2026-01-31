import { useState, useCallback, useEffect } from 'react'

/**
 * useHistory - A hook to manage state history with undo/redo capabilities
 * Supporting keyboard shortcuts (Ctrl+Z, Ctrl+Y / Ctrl+Shift+Z)
 */
export function useHistory<T>(initialState: T, options = { maxHistory: 50 }) {
    const [past, setPast] = useState<T[]>([])
    const [present, setPresent] = useState<T>(initialState)
    const [future, setFuture] = useState<T[]>([])

    const canUndo = past.length > 0
    const canRedo = future.length > 0

    const undo = useCallback(() => {
        if (!canUndo) return

        const previous = past[past.length - 1]
        const newPast = past.slice(0, past.length - 1)

        setPast(newPast)
        setFuture([present, ...future])
        setPresent(previous)
    }, [canUndo, past, present, future])

    const redo = useCallback(() => {
        if (!canRedo) return

        const next = future[0]
        const newFuture = future.slice(1)

        setPast([...past, present])
        setFuture(newFuture)
        setPresent(next)
    }, [canRedo, past, present, future])

    const set = useCallback((newState: T | ((prev: T) => T), replace = false) => {
        const resolvedState = typeof newState === 'function'
            ? (newState as (prev: T) => T)(present)
            : newState

        if (resolvedState === present) return

        if (replace) {
            setPresent(resolvedState)
        } else {
            setPast(prevPast => {
                const nextPast = [...prevPast, present]
                return nextPast.slice(-options.maxHistory)
            })
            setPresent(resolvedState)
            setFuture([])
        }
    }, [present, options.maxHistory])

    const reset = useCallback((newInitialState: T) => {
        setPast([])
        setPresent(newInitialState)
        setFuture([])
    }, [])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isZ = e.key.toLowerCase() === 'z'
            const isY = e.key.toLowerCase() === 'y'
            const isCtrl = e.ctrlKey || e.metaKey
            const isShift = e.shiftKey

            if (isCtrl && isZ) {
                if (isShift) {
                    redo()
                } else {
                    undo()
                }
            } else if (isCtrl && isY) {
                redo()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [undo, redo])

    return {
        state: present,
        set,
        undo,
        redo,
        canUndo,
        canRedo,
        reset
    }
}
