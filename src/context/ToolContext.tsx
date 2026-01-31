import React, { createContext, useContext, useState, useCallback } from 'react'

export interface SharedPhoto {
    id: string
    file: File
    url: string
    name: string
    thumbnail?: string
    frameConfig?: any
    filterConfig?: any
    lut?: any
    origin?: 'frame' | 'filter'
}

interface ToolContextType {
    sharedPhotos: SharedPhoto[]
    setSharedPhotos: (photos: SharedPhoto[]) => void
    clearSharedPhotos: () => void
}

const ToolContext = createContext<ToolContextType | undefined>(undefined)

export function ToolProvider({ children }: { children: React.ReactNode }) {
    const [sharedPhotos, setSharedPhotosState] = useState<SharedPhoto[]>([])

    const setSharedPhotos = useCallback((photos: SharedPhoto[]) => {
        setSharedPhotosState(photos)
    }, [])

    const clearSharedPhotos = useCallback(() => {
        setSharedPhotosState([])
    }, [])

    return (
        <ToolContext.Provider value={{ sharedPhotos, setSharedPhotos, clearSharedPhotos }}>
            {children}
        </ToolContext.Provider>
    )
}

export function useToolContext() {
    const context = useContext(ToolContext)
    if (context === undefined) {
        throw new Error('useToolContext must be used within a ToolProvider')
    }
    return context
}
