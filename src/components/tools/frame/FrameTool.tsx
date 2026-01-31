import React, { useState, useRef, useEffect, useCallback } from 'react'

import { useNavigate } from 'react-router-dom'
import { saveAs } from 'file-saver'
import { useToolContext } from '../../../context/ToolContext'
import {
    Upload, X, Loader2, Download,
    Image as ImageIcon,
    Plus, RotateCcw,
    Copy, Settings, Check, Sliders, CheckCircle2
} from 'lucide-react'

import './frame.css'
import { CustomDialog } from '../../ui/CustomDialog'
import { UndoRedoGroup } from '../../ui/UndoRedoGroup'
import { useHistory } from '../../../hooks/useHistory'

// --- Types ---

type FitMode = 'cover' | 'contain' | 'fill'
type CanvasMode = 'square' | 'original' | 'portrait' | 'landscape' | 'story'
type EditMode = 'crop' | 'frame'

interface FrameConfig {
    // Crop region as percentage of source image (0-100)
    cropX: number      // Left position of crop (0-100%)
    cropY: number      // Top position of crop (0-100%)
    cropSize: number   // Crop box size as percentage (zoomed in = smaller %)
    // Frame positioning (on top of cropped result)
    frameScale: number // Frame scale (0.5 to 2)
    frameX: number     // Frame X offset (-50 to 50%)
    frameY: number     // Frame Y offset (-50 to 50%)
    fitMode: FitMode
    canvasMode: CanvasMode
}

interface PhotoAsset {
    id: string
    url: string
    file?: File
    name: string
    config: FrameConfig
    filterConfig?: any // Deep state preservation
    lut?: any
}

// --- Main Component ---

export function FrameTool() {
    // --- State ---

    // Assets
    const [frameURL, setFrameURL] = useState<string | null>(null)
    const { state: photos, set: setPhotos, undo, redo, canUndo, canRedo } = useHistory<PhotoAsset[]>([])
    const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0)

    const navigate = useNavigate()
    const { setSharedPhotos, sharedPhotos, clearSharedPhotos } = useToolContext()

    // UI State
    const [isProcessing, setIsProcessing] = useState(false)
    const [processProgress, setProcessProgress] = useState({ current: 0, total: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [dragStartConfig, setDragStartConfig] = useState<FrameConfig>({
        cropX: 0, cropY: 0, cropSize: 100,
        frameScale: 1, frameX: 0, frameY: 0,
        fitMode: 'cover', canvasMode: 'square'
    })
    const [previewAspectRatio, setPreviewAspectRatio] = useState(1)

    // Touch State
    const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null)
    const [isPinching, setIsPinching] = useState(false)
    const [activeTab, setActiveTab] = useState<'assets' | 'settings'>('assets')
    const [editMode, setEditMode] = useState<EditMode>('crop') // 'crop' or 'frame'
    const [isApplying, setIsApplying] = useState(false)
    const [applySuccess, setApplySuccess] = useState(false)
    const [dialog, setDialog] = useState<{
        isOpen: boolean
        title: string
        message: string
        type: 'info' | 'confirm' | 'warning' | 'success'
        onConfirm?: () => void
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    })


    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const hasCapturedStartRef = useRef(false)
    const isWheelingRef = useRef(false)
    const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // --- Helpers ---

    const currentPhoto = photos[activePhotoIndex]

    // Helper to get default config
    const getDefaultConfig = (): FrameConfig => ({
        cropX: 0,         // Start at left edge
        cropY: 0,         // Start at top edge
        cropSize: 100,    // Full image (100% = no zoom)
        frameScale: 1,    // Frame at 100% scale
        frameX: 0,        // Frame centered horizontally
        frameY: 0,        // Frame centered vertically
        fitMode: 'cover',
        canvasMode: 'square'
    })

    // Helper to update current photo config
    const updateCurrentConfig = (updater: (prev: FrameConfig) => FrameConfig, shouldReplace = false) => {
        setPhotos(prevPhotos => prevPhotos.map((p, i) => {
            if (i === activePhotoIndex) {
                return { ...p, config: updater(p.config) }
            }
            return p
        }), shouldReplace)
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

    const [isTransferring, setIsTransferring] = useState(false)

    // Transfer to Filter Tool
    const handleTransferToFilter = () => {
        if (photos.length === 0) return alert('No photos to transfer')

        // Use an empty string if no frame is selected, worker handles null frameImg
        const finalFrameURL = frameURL || ''

        setIsTransferring(true)
        setProcessProgress({ current: 0, total: photos.length })

        const worker = new Worker(new URL('./frame-processor.worker.ts', import.meta.url), { type: 'module' })

        worker.onmessage = (e) => {
            const { type, payload } = e.data

            if (type === 'PROGRESS') {
                setProcessProgress(payload)
            } else if (type === 'TRANSFER_COMPLETE') {
                const renderedPhotos = payload as { id: string, blob: Blob, name: string }[]

                const shared = renderedPhotos.map(p => {
                    const originalPhoto = photos.find(op => op.id === p.id)
                    return {
                        id: p.id,
                        file: new File([p.blob], p.name.endsWith('.jpg') ? p.name : `${p.name}.jpg`, { type: 'image/jpeg' }),
                        url: URL.createObjectURL(p.blob),
                        name: p.name,
                        // When transferring from Frame to Filter, we bake the frame.
                        // So we send frameConfig: null to avoid double-framing if it returns.
                        frameConfig: null,
                        filterConfig: originalPhoto?.filterConfig,
                        lut: originalPhoto?.lut,
                        origin: 'frame' as const
                    }
                })

                setSharedPhotos(shared)
                setIsTransferring(false)
                worker.terminate()
                navigate('/utilities/filter-tool')
            } else if (type === 'ERROR') {
                console.error(payload)
                alert('Error rendering images for transfer')
                setIsTransferring(false)
                worker.terminate()
            }
        }

        worker.postMessage({
            type: 'TRANSFER_START',
            payload: {
                frameURL: finalFrameURL,
                photos: photos.map(p => ({
                    id: p.id,
                    url: p.url,
                    name: p.name,
                    config: p.config
                }))
            }
        })
    }

    // Auto-import from ToolContext
    useEffect(() => {
        if (sharedPhotos.length > 0 && sharedPhotos[0].origin === 'filter') {
            const imported = sharedPhotos.map(p => ({
                id: p.id,
                url: p.url,
                file: p.file,
                name: p.name,
                config: p.frameConfig || getDefaultConfig(),
                filterConfig: p.filterConfig, // Stash it
                lut: p.lut
            }))
            setPhotos(imported)
            setActivePhotoIndex(0)
            clearSharedPhotos()
        }
    }, [sharedPhotos, clearSharedPhotos])

    // Canvas Interaction
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!currentPhoto) return // Only need a photo to drag
        setIsDragging(true)
        setDragStart({ x: e.clientX, y: e.clientY })
        setDragStartConfig(currentPhoto.config) // Save snapshot of start
        hasCapturedStartRef.current = false
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !currentPhoto) return

        // Calculate delta as percentage of canvas
        const dx = e.clientX - dragStart.x
        const dy = e.clientY - dragStart.y

        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return

        if (editMode === 'crop') {
            // Crop mode: adjust crop position
            // Calculate dynamic sensitivity for crop to be 1:1
            // Max offset is available space (100 - cropSize)
            // If cropSize is 100, we can't move. If 50, we have 50% space.
            // We want dx/width to map to the percentage of available space.
            // We want dx/width to map to the percentage of available space.

            // Using a simple 1:1 mapping for crop is tricky because cropX is relative to available space.
            // But let's stick to the previous feeling or improve it. 
            // Actually, simply using a constant that feels good is better than complex math that might feel rigid.
            // user only complained about Frame running around.
            const cropSens = 150 // Keep crop snapier

            updateCurrentConfig(prev => ({
                ...prev,
                cropX: Math.max(0, Math.min(100, dragStartConfig.cropX + (dx / rect.width) * cropSens)),
                cropY: Math.max(0, Math.min(100, dragStartConfig.cropY + (dy / rect.height) * cropSens))
            }), hasCapturedStartRef.current)
        } else {
            // Frame mode: adjust frame position
            // Sensitivity 100 means 1:1 movement with cursor
            const frameSensitivity = 100

            updateCurrentConfig(prev => ({
                ...prev,
                frameX: Math.max(-50, Math.min(50, dragStartConfig.frameX + (dx / rect.width) * frameSensitivity)),
                frameY: Math.max(-50, Math.min(50, dragStartConfig.frameY + (dy / rect.height) * frameSensitivity))
            }), hasCapturedStartRef.current)
        }

        hasCapturedStartRef.current = true
    }

    const handleMouseUp = () => setIsDragging(false)

    // --- Touch Interaction (Mobile) ---
    const handleTouchStart = (e: React.TouchEvent) => {
        if (!currentPhoto) return

        if (e.touches.length === 1) {
            // Single touch - Drag
            setIsDragging(true)
            setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
            setDragStartConfig(currentPhoto.config)
            hasCapturedStartRef.current = false
        } else if (e.touches.length === 2) {
            // Two touches - Pinch/Zoom
            setIsPinching(true)
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            )
            setLastTouchDistance(dist)
            setDragStartConfig(currentPhoto.config)
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!currentPhoto) return


        if (isPinching && e.touches.length === 2) {
            // Pinch to Zoom
            // e.preventDefault() -> Removed to fix passive event listener error. 'touch-action: none' handles scroll locking.
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            )

            if (lastTouchDistance) {
                const delta = dist - lastTouchDistance

                if (editMode === 'crop') {
                    // Zoom Crop (inverted logic: pinching out increases ZOOM, which decreases cropSize)
                    const sensitivity = 0.2
                    const newCropSize = Math.max(10, Math.min(100, dragStartConfig.cropSize - delta * sensitivity))
                    updateCurrentConfig(prev => ({ ...prev, cropSize: newCropSize }))
                } else {
                    // Scale Frame
                    const sensitivity = 0.005
                    const newFrameScale = Math.max(0.01, Math.min(2, dragStartConfig.frameScale + delta * sensitivity))
                    updateCurrentConfig(prev => ({ ...prev, frameScale: newFrameScale }), hasCapturedStartRef.current)
                }
                hasCapturedStartRef.current = true
            }
        } else if (isDragging && e.touches.length === 1) {
            // Drag
            // e.preventDefault() -> Removed to fix passive event listener error.
            const dx = e.touches[0].clientX - dragStart.x
            const dy = e.touches[0].clientY - dragStart.y

            const rect = canvasRef.current?.getBoundingClientRect()
            if (!rect) return

            if (editMode === 'crop') {
                const cropSens = 150
                updateCurrentConfig(prev => ({
                    ...prev,
                    cropX: Math.max(0, Math.min(100, dragStartConfig.cropX + (dx / rect.width) * cropSens)),
                    cropY: Math.max(0, Math.min(100, dragStartConfig.cropY + (dy / rect.height) * cropSens))
                }))
            } else {
                const frameSensitivity = 100
                updateCurrentConfig(prev => ({
                    ...prev,
                    frameX: Math.max(-50, Math.min(50, dragStartConfig.frameX + (dx / rect.width) * frameSensitivity)),
                    frameY: Math.max(-50, Math.min(50, dragStartConfig.frameY + (dy / rect.height) * frameSensitivity))
                }), hasCapturedStartRef.current)
            }
            hasCapturedStartRef.current = true
        }
    }

    const handleTouchEnd = () => {
        setIsDragging(false)
        setIsPinching(false)
        setLastTouchDistance(null)
    }



    // Zoom on wheel - adjusts crop size or frame scale based on mode
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const onWheel = (e: WheelEvent) => {
            if (!currentPhoto) return
            e.preventDefault()

            if (editMode === 'crop') {
                const delta = e.deltaY * 0.5
                const newCropSize = Math.max(10, Math.min(100, currentPhoto.config.cropSize + delta))
                updateCurrentConfig(prev => ({ ...prev, cropSize: newCropSize }), hasCapturedStartRef.current)
            } else {
                const delta = e.deltaY * -0.002
                const newFrameScale = Math.max(0.01, Math.min(2, currentPhoto.config.frameScale + delta))
                updateCurrentConfig(prev => ({ ...prev, frameScale: newFrameScale }), hasCapturedStartRef.current)
            }

            hasCapturedStartRef.current = true

            // Debounce the end of wheeling
            if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current)
            wheelTimeoutRef.current = setTimeout(() => {
                isWheelingRef.current = false
                hasCapturedStartRef.current = false
            }, 500)
        }

        container.addEventListener('wheel', onWheel, { passive: false })
        return () => {
            container.removeEventListener('wheel', onWheel)
            if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current)
        }
    }, [currentPhoto, editMode, updateCurrentConfig])



    // --- Drawing Logic ---

    // Now accepts config as argument!
    const drawToCanvas = useCallback((
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        photoImg: HTMLImageElement | null,
        frameImg: HTMLImageElement | null,
        drawConfig: FrameConfig,
        isPreview: boolean = false // If true, show full image with crop overlay
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

        if (photoImg) {
            const imgW = photoImg.naturalWidth
            const imgH = photoImg.naturalHeight
            const canvasAspect = width / height
            const imgAspect = imgW / imgH

            if (isPreview) {
                // PREVIEW MODE: Show full image with crop overlay

                // 1. Draw full image scaled to fit canvas (contain mode)
                let displayW = width
                let displayH = height
                let displayX = 0
                let displayY = 0

                if (imgAspect > canvasAspect) {
                    // Image is wider - fit by width
                    displayW = width
                    displayH = width / imgAspect
                    displayY = (height - displayH) / 2
                } else {
                    // Image is taller - fit by height
                    displayH = height
                    displayW = height * imgAspect
                    displayX = (width - displayW) / 2
                }

                // Draw full image (dimmed)
                ctx.globalAlpha = 0.4
                ctx.drawImage(photoImg, displayX, displayY, displayW, displayH)
                ctx.globalAlpha = 1.0

                // 2. Calculate crop box position in display coordinates
                // cropSize determines how much of the image is selected (100 = all, 50 = half)
                let cropW: number, cropH: number
                const outputAspect = canvasAspect // Output matches canvas aspect

                if (imgAspect > outputAspect) {
                    // Image wider than output - constrain by height
                    cropH = (drawConfig.cropSize / 100) * displayH
                    cropW = cropH * outputAspect
                } else {
                    // Image taller than output - constrain by width
                    cropW = (drawConfig.cropSize / 100) * displayW
                    cropH = cropW / outputAspect
                }

                // Crop position in display coordinates
                const maxOffsetX = displayW - cropW
                const maxOffsetY = displayH - cropH
                const cropX = displayX + (drawConfig.cropX / 100) * maxOffsetX
                const cropY = displayY + (drawConfig.cropY / 100) * maxOffsetY

                // 3. Draw the crop region (clear window) from the original image
                // Calculate source coordinates
                const srcCropW = (cropW / displayW) * imgW
                const srcCropH = (cropH / displayH) * imgH
                const srcCropX = (drawConfig.cropX / 100) * (imgW - srcCropW)
                const srcCropY = (drawConfig.cropY / 100) * (imgH - srcCropH)

                // Draw cropped region at full brightness
                ctx.drawImage(
                    photoImg,
                    srcCropX, srcCropY, srcCropW, srcCropH,
                    cropX, cropY, cropW, cropH
                )

                // 4. Draw crop border
                ctx.strokeStyle = '#efc676'
                ctx.lineWidth = 2
                ctx.setLineDash([5, 5])
                ctx.strokeRect(cropX, cropY, cropW, cropH)
                ctx.setLineDash([])

                // 5. Draw frame overlay on crop region - HIDDEN in crop mode to avoid confusion
                // if (frameImg) {
                //     ctx.drawImage(frameImg, cropX, cropY, cropW, cropH)
                // }

            } else {
                // EXPORT MODE: Draw cropped region only (fills canvas)
                let cropW: number, cropH: number

                if (imgAspect > canvasAspect) {
                    cropH = (drawConfig.cropSize / 100) * imgH
                    cropW = cropH * canvasAspect
                } else {
                    cropW = (drawConfig.cropSize / 100) * imgW
                    cropH = cropW / canvasAspect
                }

                cropW = Math.min(cropW, imgW)
                cropH = Math.min(cropH, imgH)

                const maxOffsetX = imgW - cropW
                const maxOffsetY = imgH - cropH
                const srcX = (drawConfig.cropX / 100) * maxOffsetX
                const srcY = (drawConfig.cropY / 100) * maxOffsetY

                ctx.drawImage(
                    photoImg,
                    srcX, srcY, cropW, cropH,
                    0, 0, width, height
                )

                // Draw Frame with positioning (AspectRatio Preserved)
                if (frameImg) {
                    const frameAspect = frameImg.naturalWidth / frameImg.naturalHeight
                    const canvasAspect = width / height

                    let baseFrameW, baseFrameH

                    if (frameAspect > canvasAspect) {
                        // Frame is wider than canvas - fit by width
                        baseFrameW = width
                        baseFrameH = width / frameAspect
                    } else {
                        // Frame is taller than canvas - fit by height
                        baseFrameH = height
                        baseFrameW = height * frameAspect
                    }

                    const fw = baseFrameW * drawConfig.frameScale
                    const fh = baseFrameH * drawConfig.frameScale

                    const fx = (width - fw) / 2 + (drawConfig.frameX / 100) * width
                    const fy = (height - fh) / 2 + (drawConfig.frameY / 100) * height

                    ctx.drawImage(frameImg, fx, fy, fw, fh)
                }
            }
        } else if (frameImg) {
            // Only frame, no photo
            ctx.drawImage(frameImg, 0, 0, width, height)
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
                // isPreview=true in crop mode (show full image with overlay), false in frame mode (show result)
                drawToCanvas(ctx, w, h, photoImg, frameImg, activeConfig, editMode === 'crop')
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
    }, [activePhotoIndex, photos, frameURL, drawToCanvas, editMode])
    // ^ Dependency 'photos' tracks config changes inside the array, 'editMode' updates preview


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
        if (photos.length <= 1) return

        setDialog({
            isOpen: true,
            title: 'Apply to All',
            message: 'Apply current scale and position to all photos? This will overwrite their individual adjustments.',
            type: 'confirm',
            onConfirm: () => {
                setIsApplying(true)
                const sourceConfig = photos[activePhotoIndex].config
                setPhotos(prev => prev.map(p => ({
                    ...p,
                    config: { ...sourceConfig }
                })))

                setTimeout(() => {
                    setIsApplying(false)
                    setApplySuccess(true)
                    setTimeout(() => setApplySuccess(false), 2000)
                }, 800)
            }
        })
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
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
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

                {/* --- Floating Action Bar (Crop Mode) --- */}
                {editMode === 'crop' && currentPhoto && (
                    <div className="ft-floating-controls">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setCurrentConfig({ cropSize: 100, cropX: 0, cropY: 0 })
                            }}
                            className="ft-floating-btn"
                            onMouseEnter={e => e.currentTarget.style.color = 'white'}
                            onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}
                        >
                            <RotateCcw size={16} /> Reset
                        </button>
                        <div className="ft-floating-divider" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setEditMode('frame')
                            }}
                            className="ft-floating-btn primary"
                        >
                            <Check size={16} strokeWidth={3} /> Done
                        </button>
                    </div>
                )}

                {/* --- Undo/Redo Floating Bar --- */}
                {!isDragging && (
                    <UndoRedoGroup
                        undo={undo}
                        redo={redo}
                        canUndo={canUndo}
                        canRedo={canRedo}
                        style={{
                            position: 'absolute',
                            top: '24px',
                            left: '50%',
                            transform: 'translateX(-50%)'
                        }}
                    />
                )}
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

                            {/* Edit Mode Toggle */}
                            <div className="ft-control-group" style={{ marginBottom: '32px' }}>
                                <label className="ft-control-label">
                                    Edit Mode
                                </label>
                                <div className="ft-button-group">
                                    <button
                                        onClick={() => setEditMode('crop')}
                                        className="ft-group-btn"
                                        style={{
                                            background: editMode === 'crop' ? '#3f3f46' : 'transparent',
                                            color: editMode === 'crop' ? 'white' : '#a1a1aa',
                                        }}
                                    >
                                        Crop
                                    </button>
                                    <button
                                        onClick={() => setEditMode('frame')}
                                        className="ft-group-btn"
                                        style={{
                                            background: editMode === 'frame' ? '#3f3f46' : 'transparent',
                                            color: editMode === 'frame' ? 'white' : '#a1a1aa',
                                        }}
                                    >
                                        Frame
                                    </button>
                                </div>
                            </div>

                            {/* Conditional Controls based on Edit Mode */}
                            {editMode === 'crop' ? (
                                /* Crop Controls */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <label className="ft-control-label">
                                        Crop Region
                                    </label>

                                    <div className="ft-slider-group">
                                        <div className="ft-slider-header">
                                            <span className="ft-slider-label">Zoom</span>
                                            <span className="ft-slider-value">{Math.round(100 / currentPhoto.config.cropSize * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="10" max="100" step="1"
                                            value={100 - currentPhoto.config.cropSize + 10}
                                            onChange={e => {
                                                const newCropSize = 100 - parseInt(e.target.value) + 10
                                                setCurrentConfig({ cropSize: newCropSize })
                                            }}
                                            className="ft-range-input"
                                        />
                                    </div>

                                    <div className="ft-slider-group">
                                        <div className="ft-slider-header">
                                            <span className="ft-slider-label">Pos X</span>
                                            <span className="ft-slider-value">{Math.round(currentPhoto.config.cropX)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0" max="100" step="1"
                                            value={currentPhoto.config.cropX}
                                            onChange={e => setCurrentConfig({ cropX: parseInt(e.target.value) })}
                                            className="ft-range-input"
                                        />
                                    </div>

                                    <div className="ft-slider-group">
                                        <div className="ft-slider-header">
                                            <span className="ft-slider-label">Pos Y</span>
                                            <span className="ft-slider-value">{Math.round(currentPhoto.config.cropY)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0" max="100" step="1"
                                            value={currentPhoto.config.cropY}
                                            onChange={e => setCurrentConfig({ cropY: parseInt(e.target.value) })}
                                            className="ft-range-input"
                                        />
                                    </div>


                                </div>
                            ) : (
                                /* Frame Controls */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <label className="ft-control-label">
                                        Frame Overlay
                                    </label>

                                    <div className="ft-slider-group">
                                        <div className="ft-slider-header">
                                            <span className="ft-slider-label">Scale</span>
                                            <span className="ft-slider-value">{Math.round(currentPhoto.config.frameScale * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1" max="200" step="1"
                                            value={currentPhoto.config.frameScale * 100}
                                            onChange={e => setCurrentConfig({ frameScale: parseInt(e.target.value) / 100 })}
                                            className="ft-range-input"
                                        />
                                    </div>

                                    <div className="ft-slider-group">
                                        <div className="ft-slider-header">
                                            <span className="ft-slider-label">Pos X</span>
                                            <span className="ft-slider-value">{Math.round(currentPhoto.config.frameX)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-50" max="50" step="1"
                                            value={currentPhoto.config.frameX}
                                            onChange={e => setCurrentConfig({ frameX: parseInt(e.target.value) })}
                                            className="ft-range-input"
                                        />
                                    </div>

                                    <div className="ft-slider-group">
                                        <div className="ft-slider-header">
                                            <span className="ft-slider-label">Pos Y</span>
                                            <span className="ft-slider-value">{Math.round(currentPhoto.config.frameY)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-50" max="50" step="1"
                                            value={currentPhoto.config.frameY}
                                            onChange={e => setCurrentConfig({ frameY: parseInt(e.target.value) })}
                                            className="ft-range-input"
                                        />
                                    </div>

                                    <button
                                        onClick={() => setCurrentConfig({ frameScale: 1, frameX: 0, frameY: 0 })}
                                        className="ft-action-btn"
                                    >
                                        <RotateCcw size={14} /> Reset Frame
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={handleApplyToAll}
                                disabled={isApplying || photos.length <= 1}
                                className="ft-apply-all-btn"
                                style={{
                                    marginTop: '16px',
                                    borderColor: applySuccess ? '#10b981' : 'rgba(255,255,255,0.1)',
                                    background: applySuccess ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                    color: applySuccess ? '#10b981' : 'white'
                                }}
                            >
                                {isApplying ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : applySuccess ? (
                                    <CheckCircle2 size={16} />
                                ) : (
                                    <Copy size={16} />
                                )}
                                {applySuccess ? ' Applied to All' : ' Apply Settings to All Photos'}
                            </button>

                            <button
                                onClick={handleTransferToFilter}
                                disabled={isTransferring || isProcessing || !frameURL || photos.length === 0}
                                className="ft-apply-all-btn"
                                style={{
                                    marginTop: '8px',
                                    background: isTransferring ? '#27272a' : 'rgba(167, 139, 250, 0.1)',
                                    border: '1px solid rgba(167, 139, 250, 0.2)',
                                    color: isTransferring ? '#666' : '#a78bfa',
                                    opacity: isTransferring ? 0.7 : 1
                                }}
                            >
                                {isTransferring ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Transferring {Math.round((processProgress.current / processProgress.total) * 100)}%
                                    </>
                                ) : (
                                    <>
                                        <Sliders size={16} /> Transfer to Filter Tool
                                    </>
                                )}
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
            <CustomDialog
                isOpen={dialog.isOpen}
                onClose={() => setDialog({ ...dialog, isOpen: false })}
                onConfirm={dialog.onConfirm}
                title={dialog.title}
                message={dialog.message}
                type={dialog.type}
            />
        </div>
    )
}
