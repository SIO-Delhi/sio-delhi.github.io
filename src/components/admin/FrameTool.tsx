import React, { useState, useRef, useEffect, useCallback } from 'react'

import { saveAs } from 'file-saver'
import {
    Upload, X, Loader2, Download,
    Image as ImageIcon,
    ZoomIn, Move, RotateCcw, Plus,
    MousePointer2, Copy
} from 'lucide-react'

// --- Types ---

type FitMode = 'cover' | 'contain' | 'fill'
type CanvasMode = 'square' | 'original'

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

            if (activeConfig?.canvasMode === 'original' && photoImg && photoImg.naturalWidth > 0) {
                // Use photo dimensions, but cap for performance in preview
                // Max 1080 on long side for preview
                const maxDim = 1080
                const ratio = photoImg.naturalWidth / photoImg.naturalHeight
                if (ratio > 1) {
                    w = maxDim
                    h = Math.round(maxDim / ratio)
                } else {
                    h = maxDim
                    w = Math.round(maxDim * ratio)
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
        <div style={{
            height: '100vh',
            background: '#09090b',
            color: 'white',
            display: 'flex',
            overflow: 'hidden'
        }}>

            {/* --- LEFT SIDEBAR (Assets) --- */}
            <div style={{
                width: '320px',
                borderRight: '1px solid #27272a',
                display: 'flex',
                flexDirection: 'column',
                background: '#121215'
            }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #27272a' }}>
                    <h1 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Move className="text-red-500" size={20} />
                        Frame Tool
                    </h1>
                </div>

                <div style={{ flex: 1, overflow: 'hidden', padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Frame Upload */}
                    <div>
                        <h2 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#71717a', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            1. Frame Overlay
                        </h2>
                        {frameURL ? (
                            <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #27272a' }}>
                                <div style={{ height: '160px', background: 'repeating-conic-gradient(#18181b 0 25%, #09090b 0 50%) 50% / 10px 10px' }}>
                                    <img src={frameURL} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Frame" />
                                </div>
                                <button
                                    onClick={() => { URL.revokeObjectURL(frameURL); setFrameURL(null) }}
                                    style={{
                                        position: 'absolute', top: 8, right: 8,
                                        background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%',
                                        width: 24, height: 24, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <label style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                height: '120px', border: '2px dashed #27272a', borderRadius: '12px',
                                cursor: 'pointer', background: 'rgba(255,255,255,0.02)', color: '#71717a', gap: '8px'
                            }}>
                                <Upload size={24} />
                                <span style={{ fontSize: '0.85rem' }}>Upload PNG Frame</span>
                                <input type="file" accept="image/png" hidden onChange={handleFrameUpload} />
                            </label>
                        )}
                    </div>

                    {/* Photo List */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h2 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                2. Photos ({photos.length})
                            </h2>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <label style={{
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: '#ff3b3b', padding: '6px 12px', borderRadius: '6px',
                                    fontSize: '0.8rem', fontWeight: 600
                                }}>
                                    <Plus size={14} color="white" />
                                    <span>Add Photos</span>
                                    <input type="file" accept="image/*" multiple hidden onChange={handlePhotoUpload} />
                                </label>
                            </div>
                        </div>

                        {photos.length === 0 ? (
                            <div style={{
                                flex: 1, border: '2px dashed #27272a', borderRadius: '12px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                color: '#52525b', gap: '12px', minHeight: '200px'
                            }}>
                                <ImageIcon size={32} />
                                <p style={{ fontSize: '0.9rem', textAlign: 'center', padding: '0 20px' }}>
                                    Drag photos here or click below to add
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                    <label style={{
                                        padding: '10px 20px', background: '#27272a', border: '1px solid #3f3f46',
                                        borderRadius: '8px', color: 'white', fontSize: '0.9rem',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                        fontWeight: 500
                                    }}>
                                        <Plus size={16} />
                                        Upload Photos
                                        <input type="file" accept="image/*" multiple hidden onChange={handlePhotoUpload} />
                                    </label>

                                    {/* Gallery Link Removed */}
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px',
                                overflowY: 'auto', paddingRight: '4px',
                                flex: 1, minHeight: 0, alignContent: 'start'
                            }}>
                                {photos.map((photo, i) => (
                                    <div
                                        key={photo.id}
                                        onClick={() => setActivePhotoIndex(i)}
                                        style={{
                                            width: '100%',
                                            paddingBottom: '100%', // Force square aspect ratio
                                            height: 0,
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            border: activePhotoIndex === i ? '2px solid #ff3b3b' : '1px solid #3f3f46',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            background: '#18181b',
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0, left: 0, right: 0,
                                            padding: '4px 8px',
                                            background: 'rgba(0,0,0,0.7)',
                                            color: '#a1a1aa',
                                            fontSize: '0.7rem',
                                            pointerEvents: 'none',
                                            zIndex: 10
                                        }}>
                                            #{i + 1}
                                        </div>

                                        <img
                                            src={photo.url}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain'
                                            }}
                                            alt=""
                                        />

                                        <button
                                            onClick={(e) => { e.stopPropagation(); setPhotos(p => p.filter((_, idx) => idx !== i)) }}
                                            style={{
                                                position: 'absolute', top: 2, right: 2,
                                                background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '4px',
                                                width: 18, height: 18, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                zIndex: 11
                                            }}
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

            {/* --- CENTER (Canvas) --- */}
            <div
                ref={containerRef}
                style={{
                    flex: 1,
                    background: '#09090b',
                    backgroundImage: 'radial-gradient(#27272a 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                {/* Canvas Container that maintains aspect ratio */}
                <div style={{
                    width: 'min(90%, 80vh)',
                    aspectRatio: previewAspectRatio,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    background: '#111',
                    position: 'relative'
                }}>
                    <canvas
                        ref={canvasRef}
                        style={{ width: '100%', height: '100%', display: 'block' }}
                    />

                </div>

                {/* Overlay Controls Hint */}
                {frameURL && currentPhoto && (
                    <div style={{
                        marginTop: '20px',
                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                        padding: '8px 16px', borderRadius: '20px',
                        fontSize: '0.75rem', color: '#a1a1aa', display: 'flex', gap: '12px',
                        pointerEvents: 'none'
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MousePointer2 size={12} /> Drag to Move</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ZoomIn size={12} /> Scroll to Zoom</span>
                    </div>
                )}
            </div>

            {/* --- RIGHT SIDEBAR (Controls) --- */}
            <div style={{
                width: '300px',
                borderLeft: '1px solid #27272a',
                background: '#121215',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #27272a' }}>
                    <h2 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Adjustments</h2>
                </div>

                <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                    {/* Controls only show if we have a photo */}
                    {currentPhoto ? (
                        <>
                            {/* Canvas Mode */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>
                                    Canvas Size
                                </label>
                                <div style={{ display: 'flex', background: '#27272a', borderRadius: '8px', padding: '2px' }}>
                                    <button
                                        onClick={() => setCurrentConfig({ canvasMode: 'square' })}
                                        style={{
                                            flex: 1, padding: '8px', fontSize: '0.8rem',
                                            background: currentPhoto.config.canvasMode === 'square' ? '#3f3f46' : 'transparent',
                                            color: currentPhoto.config.canvasMode === 'square' ? 'white' : '#a1a1aa',
                                            border: 'none', borderRadius: '6px', cursor: 'pointer'
                                        }}
                                    >
                                        Square (1:1)
                                    </button>
                                    <button
                                        onClick={() => setCurrentConfig({ canvasMode: 'original' })}
                                        style={{
                                            flex: 1, padding: '8px', fontSize: '0.8rem',
                                            background: currentPhoto.config.canvasMode === 'original' ? '#3f3f46' : 'transparent',
                                            color: currentPhoto.config.canvasMode === 'original' ? 'white' : '#a1a1aa',
                                            border: 'none', borderRadius: '6px', cursor: 'pointer'
                                        }}
                                    >
                                        Original
                                    </button>
                                </div>
                            </div>

                            {/* Fit Mode */}
                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>
                                    Photo Fit
                                </label>
                                <div style={{ display: 'flex', background: '#27272a', borderRadius: '8px', padding: '2px' }}>
                                    {(['cover', 'contain', 'fill'] as const).map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => setCurrentConfig({ fitMode: mode })}
                                            style={{
                                                flex: 1, padding: '8px', fontSize: '0.8rem',
                                                background: currentPhoto.config.fitMode === mode ? '#3f3f46' : 'transparent',
                                                color: currentPhoto.config.fitMode === mode ? 'white' : '#a1a1aa',
                                                border: 'none', borderRadius: '6px', cursor: 'pointer',
                                                textTransform: 'capitalize'
                                            }}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Frame Controls */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <label style={{ fontSize: '0.75rem', color: '#71717a', textTransform: 'uppercase' }}>
                                    Frame Geometry
                                </label>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.85rem' }}>Size</span>
                                        <span style={{ fontSize: '0.8rem', color: '#71717a' }}>{Math.round(currentPhoto.config.scale * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.1" max="2" step="0.05"
                                        value={currentPhoto.config.scale}
                                        onChange={e => setCurrentConfig({ scale: parseFloat(e.target.value) })}
                                        style={{
                                            width: '100%', height: '4px', background: '#27272a', appearance: 'none', borderRadius: '2px'
                                        }}
                                    />
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.85rem' }}>Pos X</span>
                                        <span style={{ fontSize: '0.8rem', color: '#71717a' }}>{Math.round(currentPhoto.config.x)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-100" max="100" step="1"
                                        value={currentPhoto.config.x}
                                        onChange={e => setCurrentConfig({ x: parseInt(e.target.value) })}
                                        style={{
                                            width: '100%', height: '4px', background: '#27272a', appearance: 'none', borderRadius: '2px'
                                        }}
                                    />
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '0.85rem' }}>Pos Y</span>
                                        <span style={{ fontSize: '0.8rem', color: '#71717a' }}>{Math.round(currentPhoto.config.y)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-100" max="100" step="1"
                                        value={currentPhoto.config.y}
                                        onChange={e => setCurrentConfig({ y: parseInt(e.target.value) })}
                                        style={{
                                            width: '100%', height: '4px', background: '#27272a', appearance: 'none', borderRadius: '2px'
                                        }}
                                    />
                                </div>

                                <button
                                    onClick={() => setCurrentConfig({ scale: 1, x: 0, y: 0, fitMode: 'cover' })}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        padding: '8px', background: 'transparent', border: '1px solid #27272a',
                                        borderRadius: '8px', color: '#a1a1aa', cursor: 'pointer', fontSize: '0.8rem'
                                    }}
                                >
                                    <RotateCcw size={14} /> Reset Frame
                                </button>

                                <button
                                    onClick={handleApplyToAll}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        padding: '12px', background: '#27272a', border: '1px solid #3f3f46',
                                        borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.85rem',
                                        marginTop: '8px', fontWeight: 500
                                    }}
                                >
                                    <Copy size={16} /> Apply Settings to All Photos
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#52525b', fontSize: '0.9rem', marginTop: '40px' }}>
                            Select a photo to adjust
                        </div>
                    )}
                </div>

                <div style={{ padding: '24px', borderTop: '1px solid #27272a' }}>
                    <button
                        onClick={handleProcess}
                        disabled={isProcessing || !frameURL || photos.length === 0}
                        style={{
                            width: '100%', padding: '16px', borderRadius: '12px',
                            background: isProcessing ? '#27272a' : 'linear-gradient(135deg, #ff3b3b 0%, #ff6b6b 100%)',
                            border: 'none', color: 'white', fontWeight: 600, fontSize: '1rem',
                            cursor: isProcessing ? 'wait' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
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
            </div>

            <style>{`
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 12px; height: 12px; background: #ff3b3b; borderRadius: 50%; cursor: pointer;
                }
            `}</style>
        </div>
    )
}
