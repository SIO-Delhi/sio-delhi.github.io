import { useEffect, useRef, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut } from 'lucide-react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'

interface PDFFlipbookProps {
    url: string
}

declare global {
    interface Window {
        pdfjsLib: any
    }
}

// Sub-component for the 3D Page
// Sub-component for the 3D Page - Removed unused BookPage

// Scene Component wrapper to handle hook logic
const SceneContent = ({ canvasRef, isFlipping, direction, onMidFlip, onRest, pageVersion, zoomLevel, handleFlipRequest }: any) => {
    const meshRef = useRef<THREE.Mesh>(null)
    const { viewport } = useThree()

    // Update texture from 2D canvas only when ready
    useEffect(() => {
        if (canvasRef.current && meshRef.current) {
            const canvas = canvasRef.current

            // Safety check for valid canvas dimensions
            if (canvas.width > 0 && canvas.height > 0) {
                const tex = new THREE.CanvasTexture(canvas)
                tex.colorSpace = THREE.SRGBColorSpace
                tex.minFilter = THREE.LinearFilter
                tex.magFilter = THREE.LinearFilter
                tex.generateMipmaps = false

                // Dispose old texture if exists to avoid memory leaks
                const mat = meshRef.current.material as THREE.MeshStandardMaterial
                if (mat.map) mat.map.dispose()

                mat.map = tex
                mat.needsUpdate = true
            }
        }
    }, [pageVersion])

    // Simplified SceneContent without vertex deforms

    // Handle Zoom
    useFrame(() => {
        if (meshRef.current) {
            // Smooth zoom interpolation
            meshRef.current.scale.lerp(new THREE.Vector3(zoomLevel, zoomLevel, 1), 0.1)
        }
    })

    // Drag Logic
    const dragRef = useRef({ active: false, startX: 0, currentRot: 0 })
    const timelineRef = useRef<gsap.core.Timeline | null>(null)

    // Global handlers needed for robust drag (tracking off-mesh)
    const handleGlobalPointerMove = useCallback((e: PointerEvent) => {
        if (!dragRef.current.active || !meshRef.current) return

        const deltaX = e.clientX - dragRef.current.startX
        // Map delta to rotation
        // Simple 3D rotation around Y center
        const rotation = Math.max(Math.min(deltaX * 0.005, Math.PI / 2.2), -Math.PI / 2.2)

        meshRef.current.rotation.y = rotation
        dragRef.current.currentRot = rotation
    }, [])

    const handleGlobalPointerUp = useCallback(() => {
        if (!dragRef.current.active || !meshRef.current) return

        dragRef.current.active = false
        // Remove global listeners
        window.removeEventListener('pointermove', handleGlobalPointerMove)
        window.removeEventListener('pointerup', handleGlobalPointerUp)
        window.removeEventListener('pointercancel', handleGlobalPointerUp)

        const rot = meshRef.current.rotation.y
        const threshold = Math.PI / 10

        if (rot < -threshold) {
            // Dragged Left -> Next Page
            if (handleFlipRequest('next')) {
                // Animation continues from current rotation
            } else {
                gsap.to(meshRef.current.rotation, { y: 0, duration: 0.3, ease: 'power2.out' })
            }
        } else if (rot > threshold) {
            // Dragged Right -> Prev Page
            if (handleFlipRequest('prev')) {
                // Animation continues
            } else {
                gsap.to(meshRef.current.rotation, { y: 0, duration: 0.3, ease: 'power2.out' })
            }
        } else {
            // Reset
            gsap.to(meshRef.current.rotation, { y: 0, duration: 0.3, ease: 'power2.out' })
        }
    }, [handleFlipRequest, handleGlobalPointerMove])

    const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
        if (isFlipping) return
        e.stopPropagation() // Stop propagation in R3F

        // Start Drag
        dragRef.current = { active: true, startX: e.clientX, currentRot: 0 }

        // Attach global listeners
        window.addEventListener('pointermove', handleGlobalPointerMove)
        window.addEventListener('pointerup', handleGlobalPointerUp)
        window.addEventListener('pointercancel', handleGlobalPointerUp)
    }

    useEffect(() => {
        if (isFlipping && meshRef.current) {
            const mesh = meshRef.current

            // Simple Flip Animation: 
            // 2. Flip Content
            // 3. Rotate back from other side (or same side for continuity? simple flip is usually 0 -> 90 -> 0)

            const targetAngle = direction === 'next' ? -Math.PI / 2 : Math.PI / 2

            // Atomic Flip Sequence
            // We use a ref to ensure we never start a duplicate timeline if re-renders happen
            if (dragRef.current.active) return // Don't animate if still likely dragging (safety)

            // 2. Check if timelineRef.current exists. If so, return.
            if (timelineRef.current) return

            // Only potential race condition: if isFlipping is true but timeline is active?
            // We don't track timeline active state in ref here yet.
            // Let's assume GSAP handles concurrent overwrites, but we want ONE Sequence.

            // 3. Use gsap.timeline to sequence the entire flip.
            const tl = gsap.timeline({
                onComplete: () => {
                    onRest()
                    // 4. Clear timelineRef.current in onComplete of timeline.
                    timelineRef.current = null
                }
            })

            tl.to(mesh.rotation, {
                y: targetAngle,
                duration: 0.15, // Faster 1st half
                ease: 'sine.in',
            })
                .call(() => {
                    onMidFlip()
                    // Instant rotation set for second half
                    mesh.rotation.y = direction === 'next' ? Math.PI / 2 : -Math.PI / 2
                })
                .to(mesh.rotation, {
                    y: 0,
                    duration: 0.2, // Faster 2nd half
                    ease: 'sine.out',
                })

            // Store the timeline in the ref
            timelineRef.current = tl
        }
    }, [isFlipping, direction, onMidFlip, onRest])

    return (
        <>
            <ambientLight intensity={2} />
            <directionalLight position={[5, 10, 5]} intensity={2} />

            <mesh
                ref={meshRef}
                onPointerDown={handlePointerDown}
            >
                {/*  Responsive Plane Geometry with max viewport usage */}
                {(() => {
                    const aspect = 0.71 // Standard PDF aspect ratio (e.g., A4)
                    let w = viewport.width
                    let h = viewport.height

                    // Adjust dimensions to fit within viewport while maintaining aspect ratio
                    if (w / h > aspect) { // Viewport is wider than content
                        w = h * aspect
                    } else { // Viewport is taller than content
                        h = w / aspect
                    }

                    return <planeGeometry args={[w, h]} />
                })()}
                <meshStandardMaterial side={THREE.DoubleSide} color="white" roughness={0.4} />
            </mesh>
        </>
    )
}

import { Maximize, Download } from 'lucide-react'

export function PDFFlipbook({ url }: PDFFlipbookProps) {
    const [pdfDoc, setPdfDoc] = useState<any>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    const [isFlipping, setIsFlipping] = useState(false)
    const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next')
    const [contentReady, setContentReady] = useState(false) // Trigger texture update
    const [zoomLevel, setZoomLevel] = useState(1)
    const [inputPage, setInputPage] = useState("1")

    // Hidden canvas for rendering PDF
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const renderTaskRef = useRef<any>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Load PDF
    useEffect(() => {
        const loadPdf = async () => {
            setIsLoading(true)
            try {
                if (!window.pdfjsLib) {
                    setTimeout(loadPdf, 500)
                    return
                }
                const loadingTask = window.pdfjsLib.getDocument(url)
                const pdf = await loadingTask.promise
                setPdfDoc(pdf)
                setTotalPages(pdf.numPages)
                setIsLoading(false)
            } catch (error) {
                console.error('Error loading PDF:', error)
                setIsLoading(false)
            }
        }
        loadPdf()
    }, [url])

    useEffect(() => {
        setInputPage(currentPage.toString())
    }, [currentPage])

    // Render Page via PDF.js to hidden canvas
    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return

        const renderPage = async () => {
            try {
                if (renderTaskRef.current) {
                    renderTaskRef.current.cancel()
                }

                // Higher scale for better texture quality
                // const viewport = page.getViewport({ scale: 2.0 * zoomLevel }) // Re-render at higher quality if zoomed? No, purely relying on texture scaling is faster.
                // Actually, let's keep base render high res (2.0) and use mesh scale for zoom to avoid re-rendering cost

                // Pure texture render logic (optimized scale for performance)
                const page = await pdfDoc.getPage(currentPage)
                // Reduced scale from 2.0 to 1.5 to prevent frame drops during flip
                const renderViewport = page.getViewport({ scale: 1.5 })

                const canvas = canvasRef.current
                if (!canvas) return

                const context = canvas.getContext('2d')

                if (context) {
                    canvas.height = renderViewport.height
                    canvas.width = renderViewport.width

                    const renderContext = {
                        canvasContext: context,
                        viewport: renderViewport,
                    }

                    const renderTask = page.render(renderContext)
                    renderTaskRef.current = renderTask
                    await renderTask.promise
                    setContentReady(prev => !prev) // Toggle to notify Three.js to re-read texture
                }
            } catch (error: any) {
                // Ignore cancel errors
            }
        }
        renderPage()
    }, [pdfDoc, currentPage])
    // Removed zoomLevel from dependency to avoid re-rendering PDF on simple zoom interactions


    // Ref for direction to avoid dependency cycles in callbacks
    const directionRef = useRef<'next' | 'prev'>('next')

    // Stable flip handler
    const handleFlip = useCallback((dir: 'next' | 'prev') => {
        directionRef.current = dir
        setFlipDirection(dir)
        setIsFlipping(true)
    }, [])

    const onMidFlip = useCallback(() => {
        const dir = directionRef.current
        setCurrentPage(prev => dir === 'next' ? prev + 1 : prev - 1)
    }, [])

    const onRest = useCallback(() => {
        setIsFlipping(false)
    }, [])

    // Stable state ref for bounds checking in callbacks
    const stateRef = useRef({ currentPage: 1, totalPages: 0 })
    useEffect(() => { stateRef.current = { currentPage, totalPages } }, [currentPage, totalPages])

    const handleFlipRequestStable = useCallback((dir: 'next' | 'prev') => {
        const { currentPage, totalPages } = stateRef.current
        if (dir === 'next' && currentPage >= totalPages) return false
        if (dir === 'prev' && currentPage <= 1) return false

        handleFlip(dir)
        return true
    }, [handleFlip])

    const handlePageSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const page = parseInt(inputPage)
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            setCurrentPage(page)
        } else {
            setInputPage(currentPage.toString())
        }
    }

    const [isFullscreen, setIsFullscreen] = useState(false)

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    const toggleFullscreen = () => {
        if (!document.fullscreenElement && containerRef.current) {
            containerRef.current.requestFullscreen().catch(err => console.error(err))
        } else {
            document.exitFullscreen()
        }
    }


    // Old handleFlipRequest removed

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                // Adaptive height: Fullscreen gets 100vh. 
                // Inline gets optimized Aspect Ratio + Max Height.
                // This ensures tight fit on mobile (A4 ratio) and reasonable limit on Desktop.
                height: isFullscreen ? '100vh' : 'auto',
                aspectRatio: isFullscreen ? 'unset' : '0.71', // Mobile A4 fit
                maxHeight: isFullscreen ? 'unset' : '85vh',   // Desktop limit
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: isFullscreen ? '#000' : 'transparent',
                transition: 'all 0.3s ease',
                position: 'relative' // For overlay adjustments if needed
            }}
        >
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div style={{ flex: 1, width: '100%', position: 'relative', minHeight: 0, touchAction: 'pan-y' }}>
                <Canvas shadows camera={{ position: [0, 0, 15], fov: 45 }}>
                    <SceneContent
                        canvasRef={canvasRef}
                        isFlipping={isFlipping}
                        direction={flipDirection}
                        onMidFlip={onMidFlip}
                        onRest={onRest}
                        pageVersion={contentReady}
                        zoomLevel={zoomLevel}
                        handleFlipRequest={handleFlipRequestStable}
                    />
                </Canvas>

                {isLoading && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#666' }}>
                        <Loader2 size={32} className="animate-spin" />
                        <span style={{ marginTop: 10, fontSize: '0.9rem' }}>Loading PDF...</span>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 20px',
                background: 'rgba(20, 20, 20, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '30px',
                border: '1px solid rgba(255,255,255,0.1)',
                marginTop: '10px', maxWidth: '95vw', flexWrap: 'wrap', justifyContent: 'center'
            }}>
                {/* Navigation */}
                <button
                    onClick={() => handleFlipRequestStable('prev')}
                    disabled={currentPage <= 1 || isFlipping}
                    style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: currentPage <= 1 ? 0.3 : 1 }}
                >
                    <ChevronLeft size={20} />
                </button>

                {/* Page Input */}
                <form onSubmit={handlePageSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                        type="text"
                        value={inputPage}
                        onChange={(e) => setInputPage(e.target.value)}
                        style={{ width: '40px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', color: 'white', textAlign: 'center', padding: '4px' }}
                    />
                    <span style={{ color: '#ccc', fontSize: '0.9rem' }}>/ {totalPages}</span>
                </form>

                <button
                    onClick={() => handleFlipRequestStable('next')}
                    disabled={currentPage >= totalPages || isFlipping}
                    style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: currentPage >= totalPages ? 0.3 : 1 }}
                >
                    <ChevronRight size={20} />
                </button>

                <div style={{ width: '1px', height: '16px', background: '#444' }} />

                {/* Zoom */}
                <button onClick={() => setZoomLevel(z => Math.max(z - 0.2, 0.5))} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}><ZoomOut size={18} /></button>
                <button onClick={() => setZoomLevel(1)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '0.8rem', minWidth: '40px' }}>{Math.round(zoomLevel * 100)}%</button>
                <button onClick={() => setZoomLevel(z => Math.min(z + 0.2, 3))} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}><ZoomIn size={18} /></button>

                <div style={{ width: '1px', height: '16px', background: '#444' }} />

                {/* Extras */}
                <button onClick={toggleFullscreen} title="Fullscreen" style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}>
                    <Maximize size={18} />
                </button>
                <a href={url} download target="_blank" rel="noopener noreferrer" title="Download PDF" style={{ color: '#ccc', display: 'flex', alignItems: 'center' }}>
                    <Download size={18} />
                </a>
            </div>
            <style>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}
