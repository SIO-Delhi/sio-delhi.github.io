import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useContent } from '../../context/ContentContext'
import { validateImage, compressImage } from '../../lib/imageProcessing'
import { uploadImage } from '../../lib/storage'
import {
    Frame, Upload, X, Check, Loader2, Download,
    Image as ImageIcon, FolderOpen, Eye,
    ChevronLeft, ChevronRight, Settings2,
    ZoomIn, ZoomOut, Move, RotateCcw
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.siodelhi.org'

interface GallerySection {
    id: string
    title: string
    images: string[]
}

export function FrameTool() {
    // Frame state
    const [frameFile, setFrameFile] = useState<File | null>(null)
    const [framePreview, setFramePreview] = useState<string | null>(null)

    // Photos state
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
    const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
    const [photoSource, setPhotoSource] = useState<'upload' | 'gallery'>('upload')

    // Gallery selector state
    const [showGalleryPicker, setShowGalleryPicker] = useState(false)
    const { posts } = useContent()

    // Processing state
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState({ current: 0, total: 0 })
    const [isUploading, setIsUploading] = useState(false)

    // Preview state
    const [previewResult, setPreviewResult] = useState<string | null>(null)
    const [previewIndex, setPreviewIndex] = useState(0)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Cached images for instant preview updates
    const frameImageRef = useRef<HTMLImageElement | null>(null)
    const photoImageRef = useRef<HTMLImageElement | null>(null)
    const [imagesLoaded, setImagesLoaded] = useState(false)

    // Fit mode state
    type FitMode = 'cover' | 'contain' | 'fill'
    const [fitMode, setFitMode] = useState<FitMode>('cover')

    // Frame position and scale controls (frame moves, not photo)
    const [frameScale, setFrameScale] = useState(1.0) // 0.5 to 2.0
    const [frameOffsetX, setFrameOffsetX] = useState(0) // -50 to 50 (percentage)
    const [frameOffsetY, setFrameOffsetY] = useState(0) // -50 to 50 (percentage)

    // Get galleries from posts
    const galleries = posts.filter(p =>
        p.layout === 'gallery' && p.galleryImages &&
        (Array.isArray(p.galleryImages) && p.galleryImages.length > 0)
    )

    // Handle frame upload
    const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate PNG
        if (!file.type.includes('png')) {
            alert('Frame must be a PNG file with transparency')
            return
        }

        // Validate size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Frame file must be less than 5MB')
            return
        }

        setFrameFile(file)
        setFramePreview(URL.createObjectURL(file))
        e.target.value = ''
    }

    // Handle photo uploads
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsUploading(true)
        const newUrls: string[] = []

        try {
            for (const file of Array.from(files)) {
                try {
                    validateImage(file)
                    const compressed = await compressImage(file)
                    const url = await uploadImage(compressed)
                    newUrls.push(url)
                } catch (err: any) {
                    console.error(`Failed to upload ${file.name}:`, err)
                    alert(`Failed to upload ${file.name}: ${err.message}`)
                }
            }

            if (newUrls.length > 0) {
                setUploadedPhotos(prev => [...prev, ...newUrls])
                setSelectedPhotos(prev => [...prev, ...newUrls])
            }
        } finally {
            setIsUploading(false)
            e.target.value = ''
        }
    }

    // Toggle photo selection from gallery
    const togglePhotoSelection = (url: string) => {
        setSelectedPhotos(prev =>
            prev.includes(url)
                ? prev.filter(u => u !== url)
                : [...prev, url]
        )
    }

    // Remove photo from selection
    const removePhoto = (url: string) => {
        setSelectedPhotos(prev => prev.filter(u => u !== url))
        setUploadedPhotos(prev => prev.filter(u => u !== url))
    }

    // Reset preview index when photos change
    useEffect(() => {
        if (previewIndex >= selectedPhotos.length) {
            setPreviewIndex(Math.max(0, selectedPhotos.length - 1))
        }
    }, [selectedPhotos.length, previewIndex])

    // Generate preview using canvas
    const generatePreview = useCallback(async () => {
        if (!framePreview || selectedPhotos.length === 0 || !canvasRef.current) {
            setPreviewResult(null)
            return
        }

        const currentIndex = Math.min(previewIndex, selectedPhotos.length - 1)
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        try {
            // Load frame
            const frameImg = new Image()
            frameImg.crossOrigin = 'anonymous'
            await new Promise((resolve, reject) => {
                frameImg.onload = resolve
                frameImg.onerror = reject
                frameImg.src = framePreview
            })

            // Load current photo
            const photoImg = new Image()
            photoImg.crossOrigin = 'anonymous'
            await new Promise((resolve, reject) => {
                photoImg.onload = resolve
                photoImg.onerror = reject
                photoImg.src = selectedPhotos[currentIndex]
            })

            // Set canvas size to frame size
            canvas.width = frameImg.width
            canvas.height = frameImg.height

            // Calculate photo scaling based on fit mode
            const photoRatio = photoImg.width / photoImg.height
            const frameRatio = frameImg.width / frameImg.height

            let destWidth: number, destHeight: number, destX: number, destY: number

            if (fitMode === 'cover') {
                // Cover: scale to fill frame, crop overflow
                if (photoRatio > frameRatio) {
                    destHeight = frameImg.height
                    destWidth = frameImg.height * photoRatio
                    destX = (frameImg.width - destWidth) / 2
                    destY = 0
                } else {
                    destWidth = frameImg.width
                    destHeight = frameImg.width / photoRatio
                    destX = 0
                    destY = (frameImg.height - destHeight) / 2
                }
            } else if (fitMode === 'contain') {
                // Contain: fit entirely within frame, show background
                if (photoRatio > frameRatio) {
                    destWidth = frameImg.width
                    destHeight = frameImg.width / photoRatio
                    destX = 0
                    destY = (frameImg.height - destHeight) / 2
                } else {
                    destHeight = frameImg.height
                    destWidth = frameImg.height * photoRatio
                    destX = (frameImg.width - destWidth) / 2
                    destY = 0
                }
            } else {
                // Fill: stretch to fill exactly
                destWidth = frameImg.width
                destHeight = frameImg.height
                destX = 0
                destY = 0
            }

            // Clear and draw photo (photo stays in place based on fit mode)
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(photoImg, destX, destY, destWidth, destHeight)

            // Calculate frame position and size with user adjustments
            const scaledFrameWidth = frameImg.width * frameScale
            const scaledFrameHeight = frameImg.height * frameScale

            // Center the scaled frame, then apply offset
            const frameX = (frameImg.width - scaledFrameWidth) / 2 + (frameOffsetX / 100) * frameImg.width
            const frameY = (frameImg.height - scaledFrameHeight) / 2 + (frameOffsetY / 100) * frameImg.height

            // Draw the frame with scale and position
            ctx.drawImage(frameImg, frameX, frameY, scaledFrameWidth, scaledFrameHeight)

            setPreviewResult(canvas.toDataURL('image/png'))
        } catch (err) {
            console.error('Preview generation failed:', err)
        }
    }, [framePreview, selectedPhotos, previewIndex, fitMode, frameScale, frameOffsetX, frameOffsetY])

    // Navigate preview
    const goToPrevPhoto = () => {
        setPreviewIndex(prev => (prev > 0 ? prev - 1 : selectedPhotos.length - 1))
    }

    const goToNextPhoto = () => {
        setPreviewIndex(prev => (prev < selectedPhotos.length - 1 ? prev + 1 : 0))
    }

    // Reset position controls
    const resetPositionControls = () => {
        setFrameScale(1.0)
        setFrameOffsetX(0)
        setFrameOffsetY(0)
    }

    // Update preview when inputs change
    useEffect(() => {
        generatePreview()
    }, [generatePreview])

    // Process and download
    const handleProcess = async () => {
        if (!frameFile || selectedPhotos.length === 0) {
            alert('Please select a frame and at least one photo')
            return
        }

        setIsProcessing(true)
        setProgress({ current: 0, total: selectedPhotos.length })

        try {
            const formData = new FormData()
            formData.append('frame', frameFile)
            formData.append('fitMode', fitMode)
            formData.append('frameScale', frameScale.toString())
            formData.append('frameOffsetX', frameOffsetX.toString())
            formData.append('frameOffsetY', frameOffsetY.toString())
            selectedPhotos.forEach(url => {
                formData.append('images[]', url)
            })

            const response = await fetch(`${API_BASE}/frame/apply-bulk`, {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Processing failed')
            }

            // Download the ZIP
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `framed_images_${new Date().toISOString().slice(0, 10)}.zip`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            // Clear state after success
            setSelectedPhotos([])
            setUploadedPhotos([])
            setFrameFile(null)
            if (framePreview) {
                URL.revokeObjectURL(framePreview)
                setFramePreview(null)
            }
            setPreviewResult(null)

        } catch (err: any) {
            console.error('Processing failed:', err)
            alert('Failed to process images: ' + err.message)
        } finally {
            setIsProcessing(false)
            setProgress({ current: 0, total: 0 })
        }
    }

    // Cleanup
    useEffect(() => {
        return () => {
            if (framePreview) URL.revokeObjectURL(framePreview)
        }
    }, [framePreview])

    return (
        <div style={{ minHeight: '100vh', background: '#09090b', color: 'white', paddingBottom: '100px' }}>
            {/* Header */}
            <div style={{
                borderBottom: '1px solid #27272a', padding: '24px',
                display: 'flex', alignItems: 'center', gap: '16px'
            }}>
                <div style={{
                    width: 48, height: 48, borderRadius: '12px',
                    background: 'linear-gradient(135deg, #ff3b3b 0%, #ff6b6b 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Frame size={24} color="white" />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Frame Tool</h1>
                    <p style={{ fontSize: '0.9rem', color: '#71717a', margin: 0 }}>
                        Apply PNG frames to multiple photos at once
                    </p>
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    {/* Left Column - Inputs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Frame Upload Section */}
                        <div style={{
                            background: '#18181b', border: '1px solid #27272a', borderRadius: '16px',
                            padding: '24px'
                        }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Frame size={18} />
                                1. Upload Frame (PNG)
                            </h2>

                            {framePreview ? (
                                <div style={{ position: 'relative' }}>
                                    <img
                                        src={framePreview}
                                        alt="Frame preview"
                                        style={{
                                            width: '100%', maxHeight: '200px',
                                            objectFit: 'contain', borderRadius: '8px',
                                            background: 'repeating-conic-gradient(#27272a 0% 25%, #18181b 0% 50%) 50% / 20px 20px'
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            setFrameFile(null)
                                            if (framePreview) URL.revokeObjectURL(framePreview)
                                            setFramePreview(null)
                                        }}
                                        style={{
                                            position: 'absolute', top: 8, right: 8,
                                            background: 'rgba(0,0,0,0.7)', color: 'white',
                                            border: 'none', borderRadius: '50%',
                                            width: 32, height: 32, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <label style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                                    padding: '40px 24px', border: '2px dashed #3f3f46', borderRadius: '12px',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    background: 'rgba(255, 59, 59, 0.02)'
                                }}>
                                    <Upload size={32} color="#71717a" />
                                    <span style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>
                                        Click to upload PNG frame
                                    </span>
                                    <span style={{ color: '#52525b', fontSize: '0.75rem' }}>
                                        Max 5MB, must have transparency
                                    </span>
                                    <input
                                        type="file"
                                        accept=".png,image/png"
                                        onChange={handleFrameUpload}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            )}
                        </div>

                        {/* Photo Selection Section */}
                        <div style={{
                            background: '#18181b', border: '1px solid #27272a', borderRadius: '16px',
                            padding: '24px'
                        }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ImageIcon size={18} />
                                2. Select Photos
                            </h2>

                            {/* Tab Switcher */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                <button
                                    onClick={() => setPhotoSource('upload')}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px',
                                        border: 'none', cursor: 'pointer',
                                        background: photoSource === 'upload' ? '#ff3b3b' : '#27272a',
                                        color: 'white', fontWeight: 500, fontSize: '0.85rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <Upload size={16} />
                                    Upload New
                                </button>
                                <button
                                    onClick={() => setPhotoSource('gallery')}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px',
                                        border: 'none', cursor: 'pointer',
                                        background: photoSource === 'gallery' ? '#ff3b3b' : '#27272a',
                                        color: 'white', fontWeight: 500, fontSize: '0.85rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <FolderOpen size={16} />
                                    From Gallery
                                </button>
                            </div>

                            {photoSource === 'upload' ? (
                                <label style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                                    padding: '32px 24px', border: '2px dashed #3f3f46', borderRadius: '12px',
                                    cursor: isUploading ? 'wait' : 'pointer',
                                    opacity: isUploading ? 0.6 : 1
                                }}>
                                    {isUploading ? (
                                        <Loader2 size={32} color="#71717a" className="animate-spin" />
                                    ) : (
                                        <Upload size={32} color="#71717a" />
                                    )}
                                    <span style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>
                                        {isUploading ? 'Uploading...' : 'Click to upload photos'}
                                    </span>
                                    <span style={{ color: '#52525b', fontSize: '0.75rem' }}>
                                        JPG, PNG, WebP - Max 5MB each
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handlePhotoUpload}
                                        disabled={isUploading}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            ) : (
                                <div>
                                    <button
                                        onClick={() => setShowGalleryPicker(true)}
                                        style={{
                                            width: '100%', padding: '16px', borderRadius: '12px',
                                            border: '2px dashed #3f3f46', background: 'transparent',
                                            color: '#a1a1aa', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                        }}
                                    >
                                        <FolderOpen size={20} />
                                        Browse Galleries ({galleries.length} available)
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Selected Photos Grid */}
                        {selectedPhotos.length > 0 && (
                            <div style={{
                                background: '#18181b', border: '1px solid #27272a', borderRadius: '16px',
                                padding: '24px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, color: '#a1a1aa' }}>
                                        Selected Photos ({selectedPhotos.length})
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setSelectedPhotos([])
                                            setUploadedPhotos([])
                                        }}
                                        style={{
                                            background: 'rgba(255, 59, 59, 0.1)', color: '#ff3b3b',
                                            border: 'none', borderRadius: '6px', padding: '6px 12px',
                                            fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500
                                        }}
                                    >
                                        Clear All
                                    </button>
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                                    gap: '8px',
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                }}>
                                    {selectedPhotos.map((url, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setPreviewIndex(idx)}
                                            style={{
                                                position: 'relative', aspectRatio: '1',
                                                borderRadius: '8px', overflow: 'hidden',
                                                border: previewIndex === idx ? '2px solid #ff3b3b' : '1px solid #27272a',
                                                cursor: 'pointer',
                                                opacity: previewIndex === idx ? 1 : 0.7,
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removePhoto(url) }}
                                                style={{
                                                    position: 'absolute', top: 4, right: 4,
                                                    background: 'rgba(0,0,0,0.7)', color: 'white',
                                                    border: 'none', borderRadius: '50%',
                                                    width: 20, height: 20, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Fit Mode Section */}
                        {selectedPhotos.length > 0 && framePreview && (
                            <div style={{
                                background: '#18181b', border: '1px solid #27272a', borderRadius: '16px',
                                padding: '24px'
                            }}>
                                <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Settings2 size={18} />
                                    3. Frame Fit Mode
                                </h2>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {[
                                        { id: 'cover', label: 'Cover', desc: 'Fill frame, crop overflow' },
                                        { id: 'contain', label: 'Contain', desc: 'Fit inside, show background' },
                                        { id: 'fill', label: 'Stretch', desc: 'Stretch to fill exactly' }
                                    ].map(mode => (
                                        <button
                                            key={mode.id}
                                            onClick={() => setFitMode(mode.id as FitMode)}
                                            style={{
                                                flex: 1, padding: '12px 8px', borderRadius: '8px',
                                                border: fitMode === mode.id ? '2px solid #ff3b3b' : '1px solid #27272a',
                                                background: fitMode === mode.id ? 'rgba(255, 59, 59, 0.1)' : '#09090b',
                                                cursor: 'pointer', textAlign: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ color: fitMode === mode.id ? '#ff3b3b' : 'white', fontWeight: 600, fontSize: '0.85rem' }}>
                                                {mode.label}
                                            </div>
                                            <div style={{ color: '#52525b', fontSize: '0.7rem', marginTop: '4px' }}>
                                                {mode.desc}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Position & Scale Section */}
                        {selectedPhotos.length > 0 && framePreview && (
                            <div style={{
                                background: '#18181b', border: '1px solid #27272a', borderRadius: '16px',
                                padding: '24px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Move size={18} />
                                        4. Adjust Frame Position & Size
                                    </h2>
                                    <button
                                        onClick={resetPositionControls}
                                        style={{
                                            background: 'rgba(255, 59, 59, 0.1)', color: '#ff3b3b',
                                            border: 'none', borderRadius: '6px', padding: '6px 12px',
                                            fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500,
                                            display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                    >
                                        <RotateCcw size={12} />
                                        Reset
                                    </button>
                                </div>

                                {/* Frame Scale Slider */}
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <label style={{ color: '#a1a1aa', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <ZoomIn size={14} />
                                            Frame Size
                                        </label>
                                        <span style={{ color: '#71717a', fontSize: '0.8rem' }}>
                                            {Math.round(frameScale * 100)}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="2"
                                        step="0.05"
                                        value={frameScale}
                                        onChange={e => setFrameScale(parseFloat(e.target.value))}
                                        style={{
                                            width: '100%', height: '6px', appearance: 'none',
                                            background: '#27272a', borderRadius: '3px', cursor: 'pointer'
                                        }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                        <span style={{ color: '#52525b', fontSize: '0.7rem' }}>Smaller</span>
                                        <span style={{ color: '#52525b', fontSize: '0.7rem' }}>Larger</span>
                                    </div>
                                </div>

                                {/* Frame X Position Slider */}
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <label style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>
                                            Move Frame Horizontally
                                        </label>
                                        <span style={{ color: '#71717a', fontSize: '0.8rem' }}>
                                            {frameOffsetX > 0 ? '+' : ''}{frameOffsetX}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-50"
                                        max="50"
                                        step="1"
                                        value={frameOffsetX}
                                        onChange={e => setFrameOffsetX(parseInt(e.target.value))}
                                        style={{
                                            width: '100%', height: '6px', appearance: 'none',
                                            background: '#27272a', borderRadius: '3px', cursor: 'pointer'
                                        }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                        <span style={{ color: '#52525b', fontSize: '0.7rem' }}>Left</span>
                                        <span style={{ color: '#52525b', fontSize: '0.7rem' }}>Right</span>
                                    </div>
                                </div>

                                {/* Frame Y Position Slider */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <label style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>
                                            Move Frame Vertically
                                        </label>
                                        <span style={{ color: '#71717a', fontSize: '0.8rem' }}>
                                            {frameOffsetY > 0 ? '+' : ''}{frameOffsetY}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-50"
                                        max="50"
                                        step="1"
                                        value={frameOffsetY}
                                        onChange={e => setFrameOffsetY(parseInt(e.target.value))}
                                        style={{
                                            width: '100%', height: '6px', appearance: 'none',
                                            background: '#27272a', borderRadius: '3px', cursor: 'pointer'
                                        }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                        <span style={{ color: '#52525b', fontSize: '0.7rem' }}>Up</span>
                                        <span style={{ color: '#52525b', fontSize: '0.7rem' }}>Down</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Preview & Action */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Preview Section */}
                        <div style={{
                            background: '#18181b', border: '1px solid #27272a', borderRadius: '16px',
                            padding: '24px', flex: 1
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Eye size={18} />
                                    Preview
                                </h2>
                                {selectedPhotos.length > 1 && (
                                    <span style={{ color: '#71717a', fontSize: '0.85rem' }}>
                                        {previewIndex + 1} / {selectedPhotos.length}
                                    </span>
                                )}
                            </div>

                            <canvas ref={canvasRef} style={{ display: 'none' }} />

                            {previewResult ? (
                                <div style={{ position: 'relative' }}>
                                    <div style={{
                                        borderRadius: '12px', overflow: 'hidden',
                                        background: 'repeating-conic-gradient(#27272a 0% 25%, #18181b 0% 50%) 50% / 20px 20px'
                                    }}>
                                        <img
                                            src={previewResult}
                                            alt="Preview"
                                            style={{ width: '100%', display: 'block' }}
                                        />
                                    </div>

                                    {/* Carousel Navigation */}
                                    {selectedPhotos.length > 1 && (
                                        <>
                                            <button
                                                onClick={goToPrevPhoto}
                                                style={{
                                                    position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                                                    background: 'rgba(0,0,0,0.7)', color: 'white',
                                                    border: 'none', borderRadius: '50%',
                                                    width: 40, height: 40, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 59, 59, 0.8)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                                            >
                                                <ChevronLeft size={24} />
                                            </button>
                                            <button
                                                onClick={goToNextPhoto}
                                                style={{
                                                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                                    background: 'rgba(0,0,0,0.7)', color: 'white',
                                                    border: 'none', borderRadius: '50%',
                                                    width: 40, height: 40, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 59, 59, 0.8)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                                            >
                                                <ChevronRight size={24} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div style={{
                                    height: '300px', borderRadius: '12px',
                                    border: '2px dashed #27272a',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    color: '#52525b', gap: '12px'
                                }}>
                                    <Frame size={48} />
                                    <span style={{ fontSize: '0.9rem' }}>
                                        {!framePreview ? 'Upload a frame first' :
                                         selectedPhotos.length === 0 ? 'Select photos to preview' :
                                         'Generating preview...'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleProcess}
                            disabled={!frameFile || selectedPhotos.length === 0 || isProcessing}
                            style={{
                                width: '100%', padding: '16px 24px', borderRadius: '12px',
                                border: 'none', cursor: isProcessing ? 'wait' : 'pointer',
                                background: (!frameFile || selectedPhotos.length === 0)
                                    ? '#27272a'
                                    : 'linear-gradient(135deg, #ff3b3b 0%, #ff6b6b 100%)',
                                color: 'white', fontWeight: 600, fontSize: '1rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                opacity: isProcessing ? 0.7 : 1,
                                transition: 'all 0.2s'
                            }}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Processing {progress.current}/{progress.total}...
                                </>
                            ) : (
                                <>
                                    <Download size={20} />
                                    Apply Frame & Download ZIP
                                </>
                            )}
                        </button>

                        {/* Info */}
                        <div style={{
                            background: 'rgba(255, 59, 59, 0.05)', border: '1px solid rgba(255, 59, 59, 0.1)',
                            borderRadius: '12px', padding: '16px',
                            fontSize: '0.85rem', color: '#a1a1aa', lineHeight: 1.6
                        }}>
                            <strong style={{ color: 'white' }}>How it works:</strong>
                            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                                <li>Upload a PNG frame with transparency</li>
                                <li>Select or upload photos to frame</li>
                                <li>Choose fit mode and adjust position/size</li>
                                <li>Use arrows to preview each photo</li>
                                <li>Download all framed images as a ZIP file</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gallery Picker Modal */}
            {showGalleryPicker && (
                <div
                    onClick={() => setShowGalleryPicker(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '24px'
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#18181b', borderRadius: '16px', border: '1px solid #27272a',
                            width: '100%', maxWidth: '800px', maxHeight: '80vh',
                            display: 'flex', flexDirection: 'column', overflow: 'hidden'
                        }}
                    >
                        <div style={{
                            padding: '20px 24px', borderBottom: '1px solid #27272a',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                                Select from Galleries
                            </h2>
                            <button
                                onClick={() => setShowGalleryPicker(false)}
                                style={{
                                    background: 'none', border: 'none', color: '#71717a',
                                    cursor: 'pointer', padding: '4px'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                            {galleries.length === 0 ? (
                                <div style={{
                                    textAlign: 'center', padding: '48px', color: '#52525b'
                                }}>
                                    No galleries found
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {galleries.map(gallery => {
                                        // Parse gallery images
                                        let images: string[] = []
                                        if (Array.isArray(gallery.galleryImages)) {
                                            if (typeof gallery.galleryImages[0] === 'string') {
                                                images = gallery.galleryImages as string[]
                                            } else {
                                                // GallerySection format
                                                const sections = gallery.galleryImages as unknown as GallerySection[]
                                                images = sections.flatMap(s => s.images)
                                            }
                                        }

                                        if (images.length === 0) return null

                                        return (
                                            <div key={gallery.id}>
                                                <h3 style={{
                                                    fontSize: '0.9rem', fontWeight: 600,
                                                    margin: '0 0 12px 0', color: '#a1a1aa'
                                                }}>
                                                    {gallery.title} ({images.length} images)
                                                </h3>
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                                    gap: '8px'
                                                }}>
                                                    {images.map((img, idx) => {
                                                        const isSelected = selectedPhotos.includes(img)
                                                        return (
                                                            <div
                                                                key={idx}
                                                                onClick={() => togglePhotoSelection(img)}
                                                                style={{
                                                                    position: 'relative', aspectRatio: '1',
                                                                    borderRadius: '8px', overflow: 'hidden',
                                                                    cursor: 'pointer',
                                                                    border: isSelected ? '2px solid #ff3b3b' : '2px solid transparent',
                                                                    opacity: isSelected ? 1 : 0.7,
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                <img
                                                                    src={img}
                                                                    alt=""
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                />
                                                                {isSelected && (
                                                                    <div style={{
                                                                        position: 'absolute', top: 4, right: 4,
                                                                        background: '#ff3b3b', borderRadius: '50%',
                                                                        width: 20, height: 20,
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                    }}>
                                                                        <Check size={12} color="white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <div style={{
                            padding: '16px 24px', borderTop: '1px solid #27272a',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                            <span style={{ color: '#71717a', fontSize: '0.85rem' }}>
                                {selectedPhotos.length} photos selected
                            </span>
                            <button
                                onClick={() => setShowGalleryPicker(false)}
                                style={{
                                    background: '#ff3b3b', color: 'white', border: 'none',
                                    padding: '10px 24px', borderRadius: '8px',
                                    fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                input[type="range"] {
                    -webkit-appearance: none;
                    appearance: none;
                    background: #27272a;
                    border-radius: 3px;
                    height: 6px;
                }
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #ff3b3b;
                    cursor: pointer;
                    border: 2px solid #18181b;
                    transition: all 0.15s;
                }
                input[type="range"]::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                    background: #ff5555;
                }
                input[type="range"]::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #ff3b3b;
                    cursor: pointer;
                    border: 2px solid #18181b;
                }
            `}</style>
        </div>
    )
}
