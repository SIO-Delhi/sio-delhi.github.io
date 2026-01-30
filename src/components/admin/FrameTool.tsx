import React, { useState, useRef, useEffect, useCallback } from 'react'

import { saveAs } from 'file-saver'
import {
    Upload, X, Loader2, Download,
    Image as ImageIcon,
    Plus, RotateCcw,
    Copy, Settings
} from 'lucide-react'

import './frame.css'

// --- Types ---

type FitMode = 'cover' | 'contain' | 'fill'
type CanvasMode = 'square' | 'original' | 'portrait' | 'landscape' | 'story'

interface FrameConfig {
    scale: number
    x: number // Percentage -50 to 50
    y: number // Percentage -50 to 50
    fitMode: FitMode
    canvasMode: CanvasMode
}

interface PhotoAsset {
    id: string
    url: string
    file?: File
    name: string
    config: FrameConfig // Moved config here
}

// --- Main Component ---

export function FrameTool() {
    // --- State ---

    // Assets
    const [frameURL, setFrameURL] = useState<string | null>(null)
    const [photos, setPhotos] = useState<PhotoAsset[]>([])
    const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0)

    // UI State
    const [isProcessing, setIsProcessing] = useState(false)
    const [processProgress, setProcessProgress] = useState({ current: 0, total: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [dragStartConfig, setDragStartConfig] = useState<FrameConfig>({ scale: 1, x: 0, y: 0, fitMode: 'cover', canvasMode: 'square' })
    const [previewAspectRatio, setPreviewAspectRatio] = useState(1)
    const [activeTab, setActiveTab] = useState<'assets' | 'settings'>('assets')


    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)


    // --- Helpers ---

    const currentPhoto = photos[activePhotoIndex]

    // Helper to get default config
    const getDefaultConfig = (): FrameConfig => ({
        scale: 1,
        x: 0,
        y: 0,
        fitMode: 'cover',
        canvasMode: 'square'
    })

    // Helper to update current photo config
    const updateCurrentConfig = (updater: (prev: FrameConfig) => FrameConfig) => {
        setPhotos(prevPhotos => prevPhotos.map((p, i) => {
            if (i === activePhotoIndex) {
                return { ...p, config: updater(p.config) }
            }
            return p
        }))
    }

    // Helper to set current photo config directly
    const setCurrentConfig = (newConfig: Partial<FrameConfig>) => {
        setPhotos(prevPhotos => prevPhotos.map((p, i) => {
            if (i === activePhotoIndex) {
                return { ...p, config: { ...p.config, ...newConfig } }
            }
            return p
        }))
    }

    // --- Event Handlers ---

    // Frame Upload
    const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.includes('png')) return alert('Please upload a PNG file')

        const url = URL.createObjectURL(file)
        if (frameURL) URL.revokeObjectURL(frameURL)
        setFrameURL(url)
        e.target.value = ''
    }

    // Photo Upload
    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const newPhotos: PhotoAsset[] = Array.from(files).map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            url: URL.createObjectURL(file),
            file,
            name: file.name,
            config: getDefaultConfig()
        }))

        setPhotos(prev => [...prev, ...newPhotos])
        // If it was empty, select the first new one
        if (photos.length === 0 && newPhotos.length > 0) {
            setActivePhotoIndex(0)
        }
        e.target.value = ''
    }

    // Canvas Interaction
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!frameURL || !currentPhoto) return
        setIsDragging(true)
        setDragStart({ x: e.clientX, y: e.clientY })
        setDragStartConfig(currentPhoto.config) // Save snapshot of start
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !currentPhoto) return

        // Calculate delta
        const dx = e.clientX - dragStart.x
        const dy = e.clientY - dragStart.y

        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return

        const percentX = (dx / rect.width) * 100
        const percentY = (dy / rect.height) * 100

        updateCurrentConfig(prev => ({
            ...prev,
            x: Math.max(-100, Math.min(100, dragStartConfig.x + percentX)),
            y: Math.max(-100, Math.min(100, dragStartConfig.y + percentY))
        }))
    }

    const handleMouseUp = () => setIsDragging(false)

    // Zoom on wheel
    const handleWheel = (e: React.WheelEvent) => {
        if (!frameURL || !currentPhoto) return

        const delta = e.deltaY * -0.001
        updateCurrentConfig(prev => ({
            ...prev,
            scale: Math.max(0.1, Math.min(3, prev.scale + delta))
        }))
    }



    // --- Drawing Logic ---

    // Now accepts config as argument!
    const drawToCanvas = useCallback((
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        photoImg: HTMLImageElement | null,
        frameImg: HTMLImageElement | null,
        drawConfig: FrameConfig // Explicit config passed in
    ) => {
        ctx.clearRect(0, 0, width, height)

        // Background
        ctx.fillStyle = '#111'
        ctx.fillRect(0, 0, width, height)

        if (!photoImg && !frameImg) {
            ctx.fillStyle = '#222'
            ctx.font = '20px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillStyle = '#555'
            ctx.fillText('No content', width / 2, height / 2)
            return
        }

        // 1. Draw Photo
        if (photoImg) {
            // Calculate fit logic
            const pRatio = photoImg.naturalWidth / photoImg.naturalHeight
            const cRatio = width / height

            let dw = width
            let dh = height
            let dx = 0
            let dy = 0

            if (drawConfig.fitMode === 'cover') {
                if (pRatio > cRatio) {
                    dw = height * pRatio
                    dx = (width - dw) / 2
                } else {
                    dh = width / pRatio
                    dy = (height - dh) / 2
                }
            } else if (drawConfig.fitMode === 'contain') {
                if (pRatio > cRatio) {
                    dh = width / pRatio
                    dy = (height - dh) / 2
                } else {
                    dw = height * pRatio
                    dx = (width - dw) / 2
                }
            }
            // fill is default (0,0,width,height)

            ctx.drawImage(photoImg, dx, dy, dw, dh)
        }

        // 2. Draw Frame
        if (frameImg) {
            const frameAspect = frameImg.width / frameImg.height
            const canvasAspect = width / height

            let baseW = width
            let baseH = height

            // Calculate base dimensions that effectively "contain" the frame in the canvas
            if (frameAspect > canvasAspect) {
                // Frame is wider relative to canvas: constrain by width
                baseW = width
                baseH = width / frameAspect
            } else {
                // Frame is taller relative to canvas: constrain by height
                baseH = height
                baseW = height * frameAspect
            }

            const fw = baseW * drawConfig.scale
            const fh = baseH * drawConfig.scale

            // Center + Offset
            const fx = (width - fw) / 2 + (drawConfig.x / 100) * width
            const fy = (height - fh) / 2 + (drawConfig.y / 100) * height

            ctx.drawImage(frameImg, fx, fy, fw, fh)
        }
    }, [])

    // Preview Effect
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let photoImg: HTMLImageElement | null = null
        let frameImg: HTMLImageElement | null = null

        const activeAsset = photos[activePhotoIndex]
        const activeConfig = activeAsset ? activeAsset.config : null

        const render = () => {
            // Determine dimensions
            let w = 1080
            let h = 1080

            if (activeConfig) {
                switch (activeConfig.canvasMode) {
                    case 'portrait': // 4:5
                        w = 1080
                        h = 1350
                        break
                    case 'landscape': // 16:9
                        w = 1920
                        h = 1080
                        break
                    case 'story': // 9:16
                        w = 1080
                        h = 1920
                        break
                    case 'original':
                        if (photoImg && photoImg.naturalWidth > 0) {
                            // Use photo dimensions, but cap for performance in preview
                            const maxDim = 1920
                            const ratio = photoImg.naturalWidth / photoImg.naturalHeight
                            if (ratio > 1) {
                                w = maxDim
                                h = Math.round(maxDim / ratio)
                            } else {
                                h = maxDim
                                w = Math.round(maxDim * ratio)
                            }
                        }
                        break
                    case 'square':
                    default:
                        w = 1080
                        h = 1080
                        break
                }
            }

            // Update aspect ratio for container
            setPreviewAspectRatio(w / h)

            canvas.width = w
            canvas.height = h

            if (activeConfig) {
                drawToCanvas(ctx, w, h, photoImg, frameImg, activeConfig)
            } else {
                // Should clear if no photo
                ctx.clearRect(0, 0, canvas.width, canvas.height)
            }
        }

        const loadImages = async () => {
            // Reset Img vars
            photoImg = null

            if (activeAsset) {
                const img = new Image()
                img.crossOrigin = 'anonymous'
                img.src = activeAsset.url
                await new Promise(r => {
                    img.onload = r
                    img.onerror = r // proceed anyway
                })
                photoImg = img
            }

            if (frameURL) {
                const img = new Image()
                img.src = frameURL
                await new Promise(r => {
                    img.onload = r
                    img.onerror = r
                })
                frameImg = img
            }
            render()
        }

        loadImages()

        return () => { }
    }, [activePhotoIndex, photos, frameURL, drawToCanvas])
    // ^ Dependency 'photos' tracks config changes inside the array


    // --- processing ---

    const handleProcess = async () => {
        if (!frameURL || photos.length === 0) return alert('Nothing to process')

        setIsProcessing(true)
        setProcessProgress({ current: 0, total: photos.length })

        // Create Worker
        const worker = new Worker(new URL('./frame-processor.worker.ts', import.meta.url), { type: 'module' })

        worker.onmessage = (e) => {
            const { type, payload } = e.data

            if (type === 'PROGRESS') {
                setProcessProgress(payload)
            } else if (type === 'COMPLETE') {
                saveAs(payload, "siodelhi_frames.zip")
                setIsProcessing(false)
                worker.terminate()
            } else if (type === 'ERROR') {
                console.error(payload)
                alert('Error processing images')
                setIsProcessing(false)
                worker.terminate()
            }
        }

        // Start processing
        worker.postMessage({
            type: 'START',
            payload: {
                frameURL,
                photos: photos.map(p => ({
                    url: p.url,
                    name: p.name,
                    config: p.config
                }))
            }
        })
    }

    const handleApplyToAll = () => {
        if (!currentPhoto) return
        const configToCopy = currentPhoto.config

        if (window.confirm('Apply these settings to all photos? This will overwrite their individual adjustments.')) {
            setPhotos(prev => prev.map(p => ({
                ...p,
                config: { ...configToCopy }
            })))
        }
    }



    return (
        <div className="frame-tool-container">

            {/* --- CENTER (Canvas) --- */}
            <div
                ref={containerRef}
                className="ft-center-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
                {/* Canvas Container that maintains aspect ratio */}
                <div
                    className="ft-canvas-wrapper"
                    style={{
                        aspectRatio: previewAspectRatio,
                        // If aspect ratio is > 1 (Landscape), constrain width
                        // If aspect ratio is <= 1 (Portrait/Square), constrain height
                        // This prevents overflow on mobile screens which are typically portrait
                        width: previewAspectRatio > 1 ? '100%' : 'auto',
                        height: previewAspectRatio > 1 ? 'auto' : '100%',
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        className="ft-canvas-element"
                    />

                </div>




            </div>

            {/* --- LEFT SIDEBAR (Assets) --- */}
            <div className={`ft-sidebar-left ${activeTab === 'assets' ? 'ft-active' : ''} `}>


                <div className="ft-sidebar-content">
                    {/* Frame Upload */}
                    <div>
                        <h2 className="ft-section-title">
                            1. Frame Overlay
                        </h2>
                        {frameURL ? (
                            <div className="ft-frame-preview">
                                <div className="ft-frame-preview-bg">
                                    <img src={frameURL} className="ft-img-contain" alt="Frame" />
                                </div>
                                <button
                                    onClick={() => { URL.revokeObjectURL(frameURL); setFrameURL(null) }}
                                    className="ft-remove-btn"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <label className="ft-upload-label">
                                <Upload size={24} />
                                <span className="ft-upload-text">Upload PNG Frame</span>
                                <input type="file" accept="image/png" hidden onChange={handleFrameUpload} />
                            </label>
                        )}
                    </div>

                    {/* Photo List */}
                    <div className="ft-photo-list-container">
                        <div className="ft-photo-header">
                            <h2 className="ft-section-title">
                                2. Photos ({photos.length})
                            </h2>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <label className="ft-add-btn-small">
                                    <Plus size={14} color="white" />
                                    <span>Add Photos</span>
                                    <input type="file" accept="image/*" multiple hidden onChange={handlePhotoUpload} />
                                </label>
                            </div>
                        </div>

                        {photos.length === 0 ? (
                            <div className="ft-empty-state">
                                <ImageIcon size={32} />
                                <p className="ft-empty-text">
                                    Drag photos here or click below to add
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                    <label className="ft-upload-btn-large">
                                        <Plus size={16} />
                                        Upload Photos
                                        <input type="file" accept="image/*" multiple hidden onChange={handlePhotoUpload} />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div className="ft-photo-grid">
                                {photos.map((photo, i) => (
                                    <div
                                        key={photo.id}
                                        onClick={() => setActivePhotoIndex(i)}
                                        className="ft-photo-item"
                                        style={{
                                            border: activePhotoIndex === i ? '2px solid #ff3b3b' : '1px solid #3f3f46',
                                        }}
                                    >
                                        <div className="ft-photo-number">
                                            #{i + 1}
                                        </div>

                                        <img
                                            src={photo.url}
                                            className="ft-photo-img"
                                            alt=""
                                        />

                                        <button
                                            onClick={(e) => { e.stopPropagation(); setPhotos(p => p.filter((_, idx) => idx !== i)) }}
                                            className="ft-photo-delete"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- RIGHT SIDEBAR (Controls) --- */}
            <div className={`ft-sidebar-right ${activeTab === 'settings' ? 'ft-active' : ''}`}>
                <div className="ft-sidebar-header">
                    <h2 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Adjustments</h2>
                </div>

                <div className="ft-adjustments-container">
                    {/* Controls only show if we have a photo */}
                    {currentPhoto ? (
                        <>
                            {/* Canvas Mode */}
                            <div className="ft-control-group">
                                <label className="ft-control-label">
                                    Canvas Size
                                </label>
                                <div className="ft-button-group" style={{ flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => setCurrentConfig({ canvasMode: 'square' })}
                                        className="ft-group-btn"
                                        style={{
                                            background: currentPhoto.config.canvasMode === 'square' ? '#3f3f46' : 'transparent',
                                            color: currentPhoto.config.canvasMode === 'square' ? 'white' : '#a1a1aa',
                                        }}
                                    >
                                        1:1
                                    </button>
                                    <button
                                        onClick={() => setCurrentConfig({ canvasMode: 'portrait' })}
                                        className="ft-group-btn"
                                        style={{
                                            background: currentPhoto.config.canvasMode === 'portrait' ? '#3f3f46' : 'transparent',
                                            color: currentPhoto.config.canvasMode === 'portrait' ? 'white' : '#a1a1aa',
                                        }}
                                    >
                                        4:5
                                    </button>
                                    <button
                                        onClick={() => setCurrentConfig({ canvasMode: 'landscape' })}
                                        className="ft-group-btn"
                                        style={{
                                            background: currentPhoto.config.canvasMode === 'landscape' ? '#3f3f46' : 'transparent',
                                            color: currentPhoto.config.canvasMode === 'landscape' ? 'white' : '#a1a1aa',
                                        }}
                                    >
                                        16:9
                                    </button>
                                    <button
                                        onClick={() => setCurrentConfig({ canvasMode: 'story' })}
                                        className="ft-group-btn"
                                        style={{
                                            background: currentPhoto.config.canvasMode === 'story' ? '#3f3f46' : 'transparent',
                                            color: currentPhoto.config.canvasMode === 'story' ? 'white' : '#a1a1aa',
                                        }}
                                    >
                                        9:16
                                    </button>
                                    <button
                                        onClick={() => setCurrentConfig({ canvasMode: 'original' })}
                                        className="ft-group-btn"
                                        style={{
                                            background: currentPhoto.config.canvasMode === 'original' ? '#3f3f46' : 'transparent',
                                            color: currentPhoto.config.canvasMode === 'original' ? 'white' : '#a1a1aa',
                                        }}
                                    >
                                        Original
                                    </button>
                                </div>
                            </div>

                            {/* Fit Mode */}
                            <div className="ft-control-group" style={{ marginBottom: '32px' }}>
                                <label className="ft-control-label">
                                    Photo Fit
                                </label>
                                <div className="ft-button-group">
                                    {(['cover', 'contain', 'fill'] as const).map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => setCurrentConfig({ fitMode: mode })}
                                            className="ft-group-btn"
                                            style={{
                                                background: currentPhoto.config.fitMode === mode ? '#3f3f46' : 'transparent',
                                                color: currentPhoto.config.fitMode === mode ? 'white' : '#a1a1aa',
                                            }}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Frame Controls */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <label className="ft-control-label">
                                    Frame Geometry
                                </label>

                                <div className="ft-slider-group">
                                    <div className="ft-slider-header">
                                        <span className="ft-slider-label">Size</span>
                                        <span className="ft-slider-value">{Math.round(currentPhoto.config.scale * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.1" max="2" step="0.05"
                                        value={currentPhoto.config.scale}
                                        onChange={e => setCurrentConfig({ scale: parseFloat(e.target.value) })}
                                        className="ft-range-input"
                                    />
                                </div>

                                <div className="ft-slider-group">
                                    <div className="ft-slider-header">
                                        <span className="ft-slider-label">Pos X</span>
                                        <span className="ft-slider-value">{Math.round(currentPhoto.config.x)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-100" max="100" step="1"
                                        value={currentPhoto.config.x}
                                        onChange={e => setCurrentConfig({ x: parseInt(e.target.value) })}
                                        className="ft-range-input"
                                    />
                                </div>

                                <div className="ft-slider-group">
                                    <div className="ft-slider-header">
                                        <span className="ft-slider-label">Pos Y</span>
                                        <span className="ft-slider-value">{Math.round(currentPhoto.config.y)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-100" max="100" step="1"
                                        value={currentPhoto.config.y}
                                        onChange={e => setCurrentConfig({ y: parseInt(e.target.value) })}
                                        className="ft-range-input"
                                    />
                                </div>

                                <button
                                    onClick={() => setCurrentConfig({ scale: 1, x: 0, y: 0, fitMode: 'cover' })}
                                    className="ft-action-btn"
                                >
                                    <RotateCcw size={14} /> Reset Frame
                                </button>

                                <button
                                    onClick={handleApplyToAll}
                                    className="ft-apply-all-btn"
                                >
                                    <Copy size={16} /> Apply Settings to All Photos
                                </button>

                                {/* Download Button Moved Here */}
                                <button
                                    onClick={handleProcess}
                                    disabled={isProcessing || !frameURL || photos.length === 0}
                                    className="ft-download-btn"
                                    style={{
                                        marginTop: '8px',
                                        background: isProcessing ? '#27272a' : 'linear-gradient(135deg, #ff3b3b 0%, #ff6b6b 100%)',
                                        cursor: isProcessing ? 'wait' : 'pointer',
                                        opacity: (!frameURL || photos.length === 0) ? 0.5 : 1
                                    }}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            <span>{processProgress.current} / {processProgress.total}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download size={20} />
                                            <span>Download ZIP</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="ft-empty-state" style={{
                            height: '100%',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            background: 'transparent'
                        }}>
                            <Settings size={48} color="#27272a" />
                            <p className="ft-empty-text" style={{ color: '#71717a', textAlign: 'center', maxWidth: '280px' }}>
                                Upload and select a photo to access adjustment controls
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MOBILE TAB BAR (LG Hidden) --- */}
            <div className="ft-mobile-tabs">
                <button
                    onClick={() => setActiveTab('assets')}
                    className="ft-tab-btn"
                    style={{ color: activeTab === 'assets' ? 'white' : '#52525b' }}
                >
                    <ImageIcon size={20} />
                    Photos
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className="ft-tab-btn"
                    style={{ color: activeTab === 'settings' ? 'white' : '#52525b' }}
                >
                    <Settings size={20} />
                    Adjustments
                </button>
            </div>
        </div>
    )
}
