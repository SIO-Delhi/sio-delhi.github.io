import { useEffect, useRef, useState, useCallback, forwardRef } from 'react'
import HTMLFlipBook from 'react-pageflip'
import { ChevronLeft, ChevronRight, Loader2, Maximize, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface PDFFlipbookProps {
    url: string
    coverImage?: string
}

declare global {
    interface Window {
        pdfjsLib: any
    }
}

interface PageProps {
    number: number
    pdf: any
    scale?: number
    shouldRender: boolean
    width?: number
    height?: number
    isSinglePage?: boolean
}

// Single Page Component
const Page = forwardRef<HTMLDivElement, PageProps>(({ number, pdf, scale = 1.0, shouldRender, width, height, isSinglePage = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [pageLoaded, setPageLoaded] = useState(false)
    const renderTaskRef = useRef<any>(null)

    useEffect(() => {
        // Unload if shouldn't render
        if (!shouldRender) {
            if (pageLoaded) {
                if (renderTaskRef.current) {
                    renderTaskRef.current.cancel()
                    renderTaskRef.current = null
                }
                // Clear canvas to free memory
                if (canvasRef.current) {
                    canvasRef.current.width = 0
                    canvasRef.current.height = 0
                }
                setPageLoaded(false)
            }
            return
        }

        // If we should render, but already loaded, do nothing
        if (pageLoaded || !pdf) return

        let isCancelled = false

        const renderPage = async () => {
            if (!canvasRef.current) return

            try {
                if (renderTaskRef.current) {
                    renderTaskRef.current.cancel()
                    renderTaskRef.current = null
                }

                const page = await pdf.getPage(number)
                if (isCancelled) return

                const pr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1
                const renderScale = scale * Math.min(pr, 1.25)
                const viewport = page.getViewport({ scale: renderScale })
                const canvas = canvasRef.current

                canvas.width = Math.ceil(viewport.width)
                canvas.height = Math.ceil(viewport.height)
                canvas.style.width = (canvas.width / pr) + 'px'
                canvas.style.height = (canvas.height / pr) + 'px'

                const context = canvas.getContext('2d')
                if (!context) return

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                }

                const renderTask = page.render(renderContext)
                renderTaskRef.current = renderTask

                await renderTask.promise
                if (!isCancelled) {
                    setPageLoaded(true)
                }
            } catch (error: any) {
                if (error.name !== 'RenderingCancelledException' && !isCancelled) {
                    console.error(`Error rendering page ${number}:`, error)
                }
            }
        }

        renderPage()

        return () => {
            isCancelled = true
            if (renderTaskRef.current && !pageLoaded) {
                renderTaskRef.current.cancel()
            }
        }
    }, [pdf, number, scale, shouldRender, pageLoaded])

    const isEven = number % 2 === 0
    const spineShadow = isEven
        ? 'inset -10px 0 20px -10px rgba(0,0,0,0.2)'
        : 'inset 10px 0 20px -10px rgba(0,0,0,0.2)'

    return (
        <div ref={ref} className="page" style={{
            backgroundColor: 'white',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            width: width ? `${width}px` : '100%',
            height: height ? `${height}px` : '100%',
            boxShadow: `${spineShadow}, inset 0 0 5px rgba(0,0,0,0.05)`,
            transformOrigin: isEven ? 'right center' : 'left center',
            transition: 'box-shadow 220ms ease',
            willChange: 'transform',
            transform: 'translateZ(0)'
        }}>
            {(shouldRender || pageLoaded) && (
                <>
                    <canvas
                        ref={canvasRef}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            objectPosition: isSinglePage ? 'center' : (isEven ? 'right center' : 'left center'),
                            display: pageLoaded ? 'block' : 'none'
                        }}
                    />
                    {!pageLoaded && (
                        <div style={{ position: 'absolute' }}>
                            <Loader2 className="animate-spin text-gray-300" />
                        </div>
                    )}
                </>
            )}
            {(!shouldRender && !pageLoaded) && (
                <div style={{ color: '#eee', fontSize: '2rem', fontWeight: 'bold' }}>
                    {number}
                </div>
            )}
        </div>
    )
})

Page.displayName = 'Page'

export function PDFFlipbook({ url, coverImage }: PDFFlipbookProps) {
    const [pdf, setPdf] = useState<any>(null)
    const [numPages, setNumPages] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [containerSize, setContainerSize] = useState(() => {
        if (typeof window !== 'undefined') {
            const w = Math.min(window.innerWidth, 1200)
            const isMobile = w < 768
            const h = isMobile ? w * 1.41 : (w / 2) * 1.41
            return { width: w, height: Math.min(h, window.innerHeight * 0.8) }
        }
        return { width: 800, height: 600 }
    })
    const flipBookRef = useRef<any>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const zoomWrapperRef = useRef<HTMLDivElement>(null)

    // Track current page index (0-based) from flipbook events
    const [currentPageIndex, setCurrentPageIndex] = useState(0)
    const savedPageRef = useRef(0)

    // Layout State
    const [usePortrait, setUsePortrait] = useState(false)

    // Zoom state
    const [zoom, setZoom] = useState(1)
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
    const isPanningRef = useRef(false)
    const panStartRef = useRef({ x: 0, y: 0 })
    const lastPanOffset = useRef({ x: 0, y: 0 })

    const MIN_ZOOM = 1
    const MAX_ZOOM = 3
    const ZOOM_STEP = 0.25

    const handleZoomIn = useCallback(() => {
        setZoom(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM))
    }, [])

    const handleZoomOut = useCallback(() => {
        setZoom(prev => {
            const next = Math.max(prev - ZOOM_STEP, MIN_ZOOM)
            if (next === 1) setPanOffset({ x: 0, y: 0 })
            return next
        })
    }, [])

    const handleZoomReset = useCallback(() => {
        setZoom(1)
        setPanOffset({ x: 0, y: 0 })
    }, [])

    // Pinch-to-zoom
    const pinchRef = useRef<{ dist: number; zoom: number } | null>(null)

    const getTouchDistance = (touches: React.TouchList) => {
        const dx = touches[0].clientX - touches[1].clientX
        const dy = touches[0].clientY - touches[1].clientY
        return Math.sqrt(dx * dx + dy * dy)
    }

    const touchPanRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            // Pinch start
            e.preventDefault()
            touchPanRef.current = null
            pinchRef.current = {
                dist: getTouchDistance(e.touches),
                zoom: zoom
            }
        } else if (e.touches.length === 1 && zoom > 1) {
            // Single finger pan when zoomed
            e.preventDefault()
            touchPanRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                panX: panOffset.x,
                panY: panOffset.y
            }
        }
    }, [zoom, panOffset])

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2 && pinchRef.current) {
            // Pinch zoom
            e.preventDefault()
            touchPanRef.current = null
            const newDist = getTouchDistance(e.touches)
            const scale = newDist / pinchRef.current.dist
            const newZoom = Math.min(Math.max(pinchRef.current.zoom * scale, MIN_ZOOM), MAX_ZOOM)
            setZoom(newZoom)
            if (newZoom === 1) setPanOffset({ x: 0, y: 0 })
        } else if (e.touches.length === 1 && touchPanRef.current && zoom > 1) {
            // Single finger drag to pan
            e.preventDefault()
            const dx = e.touches[0].clientX - touchPanRef.current.x
            const dy = e.touches[0].clientY - touchPanRef.current.y
            setPanOffset({
                x: touchPanRef.current.panX + dx,
                y: touchPanRef.current.panY + dy
            })
        }
    }, [zoom])

    const handleTouchEnd = useCallback(() => {
        pinchRef.current = null
        touchPanRef.current = null
    }, [])

    // Mouse wheel zoom
    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            const delta = e.deltaY > 0 ? -0.1 : 0.1
            setZoom(prev => {
                const next = Math.min(Math.max(prev + delta, MIN_ZOOM), MAX_ZOOM)
                if (next === 1) setPanOffset({ x: 0, y: 0 })
                return next
            })
        }
    }, [])

    // Pan when zoomed (mouse drag)
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (zoom <= 1) return
        isPanningRef.current = true
        panStartRef.current = { x: e.clientX, y: e.clientY }
        lastPanOffset.current = { ...panOffset }
        e.preventDefault()
    }, [zoom, panOffset])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isPanningRef.current || zoom <= 1) return
        const dx = e.clientX - panStartRef.current.x
        const dy = e.clientY - panStartRef.current.y
        setPanOffset({
            x: lastPanOffset.current.x + dx,
            y: lastPanOffset.current.y + dy
        })
    }, [zoom])

    const handleMouseUp = useCallback(() => {
        isPanningRef.current = false
    }, [])

    // Controls logic
    const [isFullscreen, setIsFullscreen] = useState(false)

    const toggleFullscreen = useCallback(() => {
        // Save current page before toggling
        savedPageRef.current = currentPageIndex
        if (!document.fullscreenElement && containerRef.current) {
            containerRef.current.requestFullscreen().catch(err => console.error(err))
        } else {
            document.exitFullscreen()
        }
    }, [currentPageIndex])

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    // Restore page after fullscreen toggle causes remount
    useEffect(() => {
        if (flipBookRef.current && savedPageRef.current > 0) {
            // The HTMLFlipBook remounts due to key change, so we use startPage via key
            // But we also try to flip to the saved page after a short delay
            const timer = setTimeout(() => {
                if (flipBookRef.current) {
                    try {
                        flipBookRef.current.pageFlip().flip(savedPageRef.current)
                    } catch {
                        // flip method might not exist on all versions
                    }
                }
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [isFullscreen, usePortrait])

    // Load PDF
    useEffect(() => {
        const loadPdf = async () => {
            setIsLoading(true)
            try {
                if (!window.pdfjsLib) {
                    setTimeout(loadPdf, 500)
                    return
                }
                const loadingTask = window.pdfjsLib.getDocument({
                    url,
                    verbosity: 0
                })
                const doc = await loadingTask.promise
                setPdf(doc)
                setNumPages(doc.numPages)
                setIsLoading(false)
            } catch (error) {
                console.error('Error loading PDF:', error)
                setIsLoading(false)
            }
        }
        loadPdf()
    }, [url])

    // Robust Resizing
    useEffect(() => {
        if (!containerRef.current) return

        const updateSize = () => {
            if (!containerRef.current) return

            const windowWidth = window.innerWidth
            const isMobile = windowWidth < 768
            setUsePortrait(isMobile)

            const { width: boundsWidth, height: boundsHeight } = containerRef.current.getBoundingClientRect()

            let w = boundsWidth
            let h = boundsHeight

            if (!isFullscreen) {
                const MAX_APP_WIDTH = 1200
                if (w > MAX_APP_WIDTH) w = MAX_APP_WIDTH

                const aspectRatio = 1.41
                h = isMobile ? w * aspectRatio : (w / 2) * aspectRatio

                const maxHeight = isFullscreen
                    ? window.innerHeight * 0.95
                    : window.innerHeight - (isMobile ? 180 : 120)

                if (h > maxHeight) {
                    h = maxHeight
                    w = isMobile ? h / aspectRatio : (h / aspectRatio) * 2
                }
            } else {
                const safeH = window.innerHeight - 80
                const safeW = window.innerWidth - 40

                const aspectRatio = 1.41
                h = safeH
                w = isMobile ? h / aspectRatio : (h / aspectRatio) * 2

                if (w > safeW) {
                    w = safeW
                    h = isMobile ? w * aspectRatio : (w / 2) * aspectRatio
                }
            }

            setContainerSize({ width: w, height: h })
        }

        const observer = new ResizeObserver(() => {
            window.requestAnimationFrame(updateSize)
        })

        observer.observe(containerRef.current)
        updateSize()

        return () => observer.disconnect()
    }, [isFullscreen])

    const flipRafRef = useRef<number | null>(null)

    const onFlip = useCallback((e: any) => {
        if (flipRafRef.current) cancelAnimationFrame(flipRafRef.current)
        flipRafRef.current = requestAnimationFrame(() => {
            setCurrentPageIndex(e.data)
            savedPageRef.current = e.data
            flipRafRef.current = null
        })
    }, [])

    // Controls
    const nextFlip = useCallback(() => {
        if (flipBookRef.current) flipBookRef.current.pageFlip().flipNext()
    }, [])

    const prevFlip = useCallback(() => {
        if (flipBookRef.current) flipBookRef.current.pageFlip().flipPrev()
    }, [])

    // Page list helper
    const pages = Array.from({ length: numPages }, (_, i) => i + 1)

    const renderWindow = 5

    const shouldRenderPage = (pageIndex: number) => {
        if (pageIndex === 0) return true
        const distance = Math.abs(pageIndex - currentPageIndex)
        return distance <= renderWindow
    }

    const pageWidth = Math.max(300, Math.ceil(containerSize.width / (usePortrait ? 1 : 2) + (usePortrait ? 0 : 1)))

    const controlBtnStyle: React.CSSProperties = {
        background: 'transparent',
        border: 'none',
        color: '#ccc',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '4px',
        borderRadius: '4px',
        transition: 'color 0.15s'
    }

    const separatorStyle: React.CSSProperties = {
        width: '1px',
        height: '16px',
        background: '#444'
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                background: isFullscreen ? '#1a1a1a' : 'transparent',
                padding: isFullscreen ? '20px' : '0',
                minHeight: '300px',
                zIndex: isFullscreen ? 100 : 10,
                isolation: 'isolate',
            }}
        >
            {/* Loading / Cover State */}
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: containerSize.height || '400px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 20
                }}>
                    {coverImage ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}>
                            <img
                                src={coverImage}
                                alt="Cover"
                                style={{
                                    height: '100%',
                                    objectFit: 'contain',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                                    borderRadius: '4px'
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                bottom: '20px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'rgba(0,0,0,0.6)',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'white',
                                backdropFilter: 'blur(4px)'
                            }}>
                                <Loader2 size={16} className="animate-spin" />
                                <span style={{ fontSize: '0.85rem' }}>Loading PDF...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <Loader2 size={32} className="animate-spin text-red-500 mb-2" />
                            <span className="text-gray-500">Loading Document...</span>
                        </div>
                    )}
                </div>
            )}

            {/* FlipBook with zoom wrapper */}
            {!isLoading && pdf && containerSize.width > 0 && (
                <div
                    ref={zoomWrapperRef}
                    style={{
                        overflow: zoom > 1 ? 'hidden' : 'visible',
                        cursor: zoom > 1 ? 'grab' : 'default',
                        touchAction: 'none'
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onWheel={handleWheel}
                    onMouseDown={zoom > 1 ? handleMouseDown : undefined}
                    onMouseMove={zoom > 1 ? handleMouseMove : undefined}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <div style={{
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        overflow: 'hidden',
                        transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)` +
                            (!usePortrait && currentPageIndex === 0 ? ' translateX(-25%)' : ''),
                        transformOrigin: 'center center',
                        transition: isPanningRef.current ? 'none' : 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
                    }}>
                        {/* @ts-ignore */}
                        <HTMLFlipBook
                            key={`${usePortrait}-${isFullscreen}`}
                            width={pageWidth}
                            height={containerSize.height}
                            size="fixed"
                            minWidth={300}
                            maxWidth={1000}
                            minHeight={400}
                            maxHeight={1533}
                            maxShadowOpacity={0.45}
                            showCover={true}
                            mobileScrollSupport={zoom <= 1}
                            usePortrait={usePortrait}
                            startPage={savedPageRef.current}
                            className="demo-book"
                            style={{ margin: '0 auto' }}
                            ref={flipBookRef}
                            flippingTime={750}
                            useMouseEvents={zoom <= 1}
                            swipeDistance={30}
                            onFlip={onFlip}
                        >
                            {pages.map((pageNum, index) => (
                                <Page
                                    key={pageNum}
                                    number={pageNum}
                                    pdf={pdf}
                                    scale={1.0}
                                    width={pageWidth}
                                    height={containerSize.height}
                                    shouldRender={shouldRenderPage(index)}
                                    isSinglePage={usePortrait}
                                />
                            ))}
                        </HTMLFlipBook>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'rgba(20, 20, 20, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '30px',
                border: '1px solid rgba(255,255,255,0.1)',
                marginTop: '20px',
                maxWidth: '95vw',
                flexWrap: 'wrap',
                justifyContent: 'center',
                zIndex: 30
            }}>
                {/* Navigation */}
                <button onClick={prevFlip} style={controlBtnStyle} title="Previous page">
                    <ChevronLeft size={20} />
                </button>

                <div style={{ color: '#ccc', fontSize: '0.9rem', minWidth: '60px', textAlign: 'center' }}>
                    {currentPageIndex + 1} / {numPages}
                </div>

                <button onClick={nextFlip} style={controlBtnStyle} title="Next page">
                    <ChevronRight size={20} />
                </button>

                <div style={separatorStyle} />

                {/* Zoom Controls */}
                <button
                    onClick={handleZoomOut}
                    style={{ ...controlBtnStyle, opacity: zoom <= MIN_ZOOM ? 0.4 : 1 }}
                    disabled={zoom <= MIN_ZOOM}
                    title="Zoom out"
                >
                    <ZoomOut size={18} />
                </button>

                <div style={{
                    color: '#999',
                    fontSize: '0.75rem',
                    minWidth: '36px',
                    textAlign: 'center',
                    fontVariantNumeric: 'tabular-nums'
                }}>
                    {Math.round(zoom * 100)}%
                </div>

                <button
                    onClick={handleZoomIn}
                    style={{ ...controlBtnStyle, opacity: zoom >= MAX_ZOOM ? 0.4 : 1 }}
                    disabled={zoom >= MAX_ZOOM}
                    title="Zoom in"
                >
                    <ZoomIn size={18} />
                </button>

                {zoom > 1 && (
                    <button onClick={handleZoomReset} style={controlBtnStyle} title="Reset zoom">
                        <RotateCcw size={16} />
                    </button>
                )}

                <div style={separatorStyle} />

                {/* Fullscreen & Download */}
                <button onClick={toggleFullscreen} title="Fullscreen" style={controlBtnStyle}>
                    <Maximize size={18} />
                </button>
                <button
                    onClick={async () => {
                        try {
                            const response = await fetch(url);
                            const blob = await response.blob();
                            const blobUrl = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = blobUrl;
                            link.download = url.split('/').pop() || 'document.pdf';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(blobUrl);
                        } catch (error) {
                            console.error('Download failed:', error);
                            window.location.href = url;
                        }
                    }}
                    title="Download PDF"
                    style={controlBtnStyle}
                >
                    <Download size={18} />
                </button>
            </div>

            <style>{`
                    .animate-spin { animation: spin 1s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                    /* Pageflip smoothing + gap fixes */
                    .demo-book { perspective: 3500px; }
                    .demo-book .book-viewport, .demo-book .book { overflow: hidden !important; }
                    .demo-book .page-wrapper, .demo-book .page { margin: 0 !important; box-sizing: border-box; padding: 0 !important; transform-style: preserve-3d; backface-visibility: hidden; will-change: transform, opacity; border: none !important; }
                    .demo-book .page > canvas { display:block; width:100% !important; height:100% !important; transform: translateZ(0); will-change: transform; }
                    .demo-book .page, .demo-book .page-wrapper { margin-right: -1px !important; }
                    .demo-book .page:last-child, .demo-book .page-wrapper:last-child { margin-right: 0 !important; }
                    .demo-book .page, .demo-book .page * { outline: none !important; box-shadow: none !important; }
                    .demo-book .page-shadow, .demo-book .page__shadow { transition: opacity 0.22s ease, transform 0.22s ease; }
                    .demo-book .page-wrapper { will-change: transform; transform: translateZ(0); }
                    .demo-book { transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
                `}</style>
        </div>
    )
}
