/**
 * FilterTool - Main orchestrator for the batch image editor
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Image as ImageIcon, Settings } from 'lucide-react'
import { useTheme } from '../../../context/ThemeContext'
import type { FilterConfig } from './FilterEngine'
import { FilterEngine, DEFAULT_FILTER_CONFIG } from './FilterEngine'
import type { PhotoAsset } from './components/AssetSidebar'
import { AssetSidebar } from './components/AssetSidebar'
import { DevelopPanel } from './components/DevelopPanel'
import type { LUTData } from './utils/lutParser'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import './filter.css'

interface PhotoWithConfig extends PhotoAsset {
    config: FilterConfig
    lut: LUTData | null
}

export function FilterTool() {
    const { isDark } = useTheme()
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const engineRef = useRef<FilterEngine | null>(null)
    const previewImageRef = useRef<HTMLImageElement | null>(null)

    const [photos, setPhotos] = useState<PhotoWithConfig[]>([])
    const [activePhotoId, setActivePhotoId] = useState<string | null>(null)
    const [currentConfig, setCurrentConfig] = useState<FilterConfig>(DEFAULT_FILTER_CONFIG)
    const [lut, setLut] = useState<LUTData | null>(null)
    const [isExporting, setIsExporting] = useState(false)
    const [exportProgress, setExportProgress] = useState(0)
    const [activeTab, setActiveTab] = useState<'assets' | 'settings'>('assets')
    const [previewAspectRatio, setPreviewAspectRatio] = useState(1)

    const activePhoto = photos.find(p => p.id === activePhotoId)

    // Initialize WebGL engine when canvas becomes available
    const lastCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const initEngine = useCallback(() => {
        if (!canvasRef.current) return

        // Re-init if canvas element changed (conditional rendering)
        if (engineRef.current && lastCanvasRef.current === canvasRef.current) return

        engineRef.current?.dispose()
        try {
            engineRef.current = new FilterEngine(canvasRef.current)
            lastCanvasRef.current = canvasRef.current
        } catch (err) {
            console.error('Failed to initialize FilterEngine:', err)
        }
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            engineRef.current?.dispose()
        }
    }, [])

    // Load active photo into engine
    useEffect(() => {
        if (!activePhoto) return

        // Wait for canvas to be in DOM, then init engine
        const timer = requestAnimationFrame(() => {
            initEngine()
            if (!engineRef.current) return

            const img = new Image()
            img.onload = () => {
                previewImageRef.current = img
                setPreviewAspectRatio(img.naturalWidth / img.naturalHeight)
                engineRef.current?.loadImage(img)

                // Load the photo's LUT
                if (activePhoto.lut) {
                    engineRef.current?.loadLUT(activePhoto.lut)
                } else {
                    engineRef.current?.clearLUT()
                }

                engineRef.current?.render(activePhoto.config)
            }
            img.src = activePhoto.url
        })

        setCurrentConfig(activePhoto.config)
        setLut(activePhoto.lut)

        return () => cancelAnimationFrame(timer)
    }, [activePhoto?.id, initEngine])

    // Re-render when config changes
    useEffect(() => {
        if (!engineRef.current || !previewImageRef.current) return
        engineRef.current.render(currentConfig)
    }, [currentConfig])

    // Apply LUT when changed and save to current photo
    useEffect(() => {
        if (!engineRef.current) return

        if (lut) {
            engineRef.current.loadLUT(lut)
        } else {
            engineRef.current.clearLUT()
        }

        // Save LUT to current photo
        if (activePhotoId) {
            setPhotos(prev => prev.map(p =>
                p.id === activePhotoId ? { ...p, lut } : p
            ))
        }

        if (previewImageRef.current) {
            engineRef.current.render(currentConfig)
        }
    }, [lut, activePhotoId])

    // Handle config change from slider
    const handleConfigChange = useCallback((newConfig: FilterConfig) => {
        setCurrentConfig(newConfig)

        // Update the photo's config
        if (activePhotoId) {
            setPhotos(prev => prev.map(p =>
                p.id === activePhotoId ? { ...p, config: newConfig } : p
            ))
        }
    }, [activePhotoId])

    // Add photos
    const handlePhotosAdd = useCallback((newPhotos: PhotoAsset[]) => {
        const photosWithConfig: PhotoWithConfig[] = newPhotos.map(p => ({
            ...p,
            config: { ...DEFAULT_FILTER_CONFIG },
            lut: null
        }))

        setPhotos(prev => [...prev, ...photosWithConfig])

        // Auto-select first photo
        if (!activePhotoId && photosWithConfig.length > 0) {
            setActivePhotoId(photosWithConfig[0].id)
        }
    }, [activePhotoId])

    // Remove photo
    const handlePhotoRemove = useCallback((id: string) => {
        setPhotos(prev => prev.filter(p => p.id !== id))

        if (activePhotoId === id) {
            setActivePhotoId(photos.find(p => p.id !== id)?.id || null)
        }
    }, [activePhotoId, photos])

    // Select photo
    const handlePhotoSelect = useCallback((id: string) => {
        setActivePhotoId(id)
    }, [])

    // Reset config
    const handleReset = useCallback(() => {
        const resetConfig = { ...DEFAULT_FILTER_CONFIG }
        setCurrentConfig(resetConfig)

        if (activePhotoId) {
            setPhotos(prev => prev.map(p =>
                p.id === activePhotoId ? { ...p, config: resetConfig } : p
            ))
        }
    }, [activePhotoId])

    // Apply to all photos
    const handleApplyToAll = useCallback(() => {
        setPhotos(prev => prev.map(p => ({
            ...p,
            config: { ...currentConfig },
            lut: lut
        })))
    }, [currentConfig, lut])

    // Export all photos
    const handleExport = useCallback(async () => {
        if (!engineRef.current || photos.length === 0) return

        setIsExporting(true)
        setExportProgress(0)

        try {
            const zip = new JSZip()
            const engine = engineRef.current

            for (let i = 0; i < photos.length; i++) {
                const photo = photos[i]

                // Load image
                const img = await loadImage(photo.url)
                engine.loadImage(img)

                // Apply photo's individual LUT
                if (photo.lut) {
                    engine.loadLUT(photo.lut)
                } else {
                    engine.clearLUT()
                }

                // Render with photo's config
                engine.render(photo.config)

                // Get blob
                const blob = await engine.toBlob('image/jpeg', 0.92)

                // Add to zip
                const filename = photo.file.name.replace(/\.[^/.]+$/, '') + '_edited.jpg'
                zip.file(filename, blob)

                setExportProgress(((i + 1) / photos.length) * 100)
            }

            // Generate and download zip
            const zipBlob = await zip.generateAsync({ type: 'blob' })
            saveAs(zipBlob, `filtered_photos_${Date.now()}.zip`)

        } catch (err) {
            console.error('Export failed:', err)
            alert('Failed to export photos. Please try again.')
        } finally {
            setIsExporting(false)
            setExportProgress(0)

            // Reload active photo
            if (activePhoto && previewImageRef.current) {
                engineRef.current?.loadImage(previewImageRef.current)
                if (lut) engineRef.current?.loadLUT(lut)
                engineRef.current?.render(currentConfig)
            }
        }
    }, [photos, lut, activePhoto, currentConfig])

    return (
        <div className="filter-tool-container">
            {/* Left Sidebar - Assets */}
            <div className={`ft-filter-sidebar-left ${activeTab === 'assets' ? 'ft-active' : ''}`}>
                <AssetSidebar
                    photos={photos}
                    activePhotoId={activePhotoId}
                    onPhotosAdd={handlePhotosAdd}
                    onPhotoRemove={handlePhotoRemove}
                    onPhotoSelect={handlePhotoSelect}
                />
            </div>

            {/* Center - Preview */}
            <div className="ft-filter-center">
                {/* Toolbar */}
                <div style={{
                    padding: '12px 16px',
                    borderBottom: `1px solid ${isDark ? '#222' : '#e0e0e0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isDark ? '#0a0a0a' : '#f8f8f8'
                }}>
                    <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: isDark ? '#fff' : '#111'
                    }}>
                        {activePhoto ? activePhoto.file.name : 'No photo selected'}
                    </span>
                </div>

                {/* Canvas Area */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    minHeight: 0,
                    padding: '24px'
                }}>
                    {activePhoto ? (
                        <div style={{
                            aspectRatio: previewAspectRatio,
                            width: previewAspectRatio >= 1 ? '100%' : 'auto',
                            height: previewAspectRatio >= 1 ? 'auto' : '100%',
                            maxWidth: '90%',
                            maxHeight: '90%',
                            position: 'relative',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                        }}>
                            <canvas
                                ref={canvasRef}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    height: '100%'
                                }}
                            />
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            color: isDark ? '#444' : '#999'
                        }}>
                            <p style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
                                No photo selected
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Sidebar - Develop Panel */}
            <div className={`ft-filter-sidebar-right ${activeTab === 'settings' ? 'ft-active' : ''}`}>
                <DevelopPanel
                    config={currentConfig}
                    onChange={handleConfigChange}
                    lut={lut}
                    onLutChange={setLut}
                    onReset={handleReset}
                    onApplyToAll={handleApplyToAll}
                    hasMultiplePhotos={photos.length > 1}
                    onExport={handleExport}
                    isExporting={isExporting}
                    exportProgress={exportProgress}
                    photoCount={photos.length}
                />
            </div>

            {/* Mobile Tab Bar */}
            <div className="ft-filter-mobile-tabs">
                <button
                    onClick={() => setActiveTab('assets')}
                    className={`ft-filter-tab-btn ${activeTab === 'assets' ? 'active' : ''}`}
                >
                    <ImageIcon size={20} />
                    Photos
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`ft-filter-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                >
                    <Settings size={20} />
                    Develop
                </button>
            </div>
        </div>
    )
}

// Helper: Load image as promise
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
    })
}
