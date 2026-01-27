    import { useEffect, useRef, useState, useCallback, forwardRef } from 'react'
    import HTMLFlipBook from 'react-pageflip'
    import { ChevronLeft, ChevronRight, Loader2, Maximize, Download } from 'lucide-react'

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
    }

    // Single Page Component
    const Page = forwardRef<HTMLDivElement, PageProps>(({ number, pdf, scale = 1.0, shouldRender, width, height }, ref) => {
        const canvasRef = useRef<HTMLCanvasElement>(null)
        const [pageLoaded, setPageLoaded] = useState(false)
        const renderTaskRef = useRef<any>(null)

        useEffect(() => {
            // optimized: if already loaded, don't re-render/re-fetch
            if ((!shouldRender && !pageLoaded) || !pdf) return

            let isCancelled = false

            const renderPage = async () => {
                // If already loaded, just skip (we keep the canvas)
                if (pageLoaded) return

                if (!canvasRef.current) return

                try {
                    // Ensure previous render is truly cancelled/cleaned up
                    if (renderTaskRef.current) {
                        renderTaskRef.current.cancel()
                        renderTaskRef.current = null
                    }

                    const page = await pdf.getPage(number)
                    if (isCancelled) return

                    const pr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1
                    // Cap the DPR factor so we don't create huge canvases on very high-DPR displays
                    const renderScale = scale * Math.min(pr, 1.25)
                    const viewport = page.getViewport({ scale: renderScale })
                    const canvas = canvasRef.current

                    // Set pixel dimensions but also reserve CSS layout size (viewport / pr) to prevent CLS
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
                // Only cancel if we haven't finished loading yet
                if (renderTaskRef.current && !pageLoaded) {
                    renderTaskRef.current.cancel()
                }
            }
        }, [pdf, number, scale, shouldRender, pageLoaded])

        const isEven = number % 2 === 0
        // Spine shadow: Darker on the edge that touches the spine
        // Left page (Even) -> Spine is on Right edge
        // Right page (Odd) -> Spine is on Left edge
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
                // Reserve explicit layout size to prevent CLS
                width: width ? `${width}px` : '100%',
                height: height ? `${height}px` : '100%',
                // Combine general depth shadow with spine shadow
                boxShadow: `${spineShadow}, inset 0 0 5px rgba(0,0,0,0.05)`
            }}>
                {/* Keep canvas mounted if it has ever successfully loaded, just toggle visibility */}
                {(shouldRender || pageLoaded) ? (
                    <>
                        {/* Key forces fresh canvas on re-mount scenarios if needed, usually mostly stable */}
                        <canvas
                            ref={canvasRef}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                display: pageLoaded || shouldRender ? 'block' : 'none'
                            }}
                        />
                        {!pageLoaded && (
                            <div style={{ position: 'absolute' }}>
                                <Loader2 className="animate-spin text-gray-300" />
                            </div>
                        )}
                    </>
                ) : (
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

        // Track current page index (0-based) from flipbook events
        const [currentPageIndex, setCurrentPageIndex] = useState(0)

        // Layout State
        const [usePortrait, setUsePortrait] = useState(false)


        // Controls logic
        const [isFullscreen, setIsFullscreen] = useState(false)
        const toggleFullscreen = () => {
            if (!document.fullscreenElement && containerRef.current) {
                containerRef.current.requestFullscreen().catch(err => console.error(err))
            } else {
                document.exitFullscreen()
            }
        }

        useEffect(() => {
            const handleFullscreenChange = () => {
                setIsFullscreen(!!document.fullscreenElement)
            }
            document.addEventListener('fullscreenchange', handleFullscreenChange)
            return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
        }, [])

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
                        verbosity: 0 // Suppress "missing font" warnings
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

                // 1. Determine Mode based on Window Width (User preference mostly)
                // If explicit fullscreen, we use the screen dimensions
                const windowWidth = window.innerWidth
                const isMobile = windowWidth < 768 // Standard Tablet/Desktop breakpoint
                setUsePortrait(isMobile)

                // 2. Calculate Available Space
                // In fullscreen, we use the bounding box of the container (which should be 100% of viewport)
                // In normal mode, we use the container's width, bounded by a max.
                const { width: boundsWidth, height: boundsHeight } = containerRef.current.getBoundingClientRect()

                let w = boundsWidth
                let h = boundsHeight

                // Normal mode limits
                if (!isFullscreen) {
                    // Max width for the viewer in rendering
                    const MAX_APP_WIDTH = 1200
                    if (w > MAX_APP_WIDTH) w = MAX_APP_WIDTH

                    // Height calculation
                    const aspectRatio = 1.41
                    h = isMobile ? w * aspectRatio : (w / 2) * aspectRatio

                    // Cap height to viewport
                    // Subtract top padding (Navbar ~80px + margin)
                    const maxHeight = isFullscreen
                        ? window.innerHeight * 0.95
                        : window.innerHeight - (isMobile ? 180 : 120)

                    if (h > maxHeight) {
                        h = maxHeight
                        w = isMobile ? h / aspectRatio : (h / aspectRatio) * 2
                    }
                } else {
                    // Fullscreen Mode
                    // We want to fit within the screen with some padding
                    const safeH = window.innerHeight - 80 // Leave room for controls
                    const safeW = window.innerWidth - 40

                    const aspectRatio = 1.41
                    // Try fitting by height first
                    h = safeH
                    w = isMobile ? h / aspectRatio : (h / aspectRatio) * 2

                    // If width overflows, fit by width
                    if (w > safeW) {
                        w = safeW
                        h = isMobile ? w * aspectRatio : (w / 2) * aspectRatio
                    }
                }

                setContainerSize({ width: w, height: h })
                // Adjust scale slightly for cleaner rendering if needed
            }

            const observer = new ResizeObserver(() => {
                // Debounce or just run? React state mismatch might occur if too fast, but usually fine.
                window.requestAnimationFrame(updateSize)
            })

            observer.observe(containerRef.current)
            updateSize() // Initial call

            return () => observer.disconnect()
        }, [isFullscreen]) // Re-calc when fullscreen toggles

        const flipRafRef = useRef<number | null>(null)

        const onFlip = useCallback((e: any) => {
            if (flipRafRef.current) cancelAnimationFrame(flipRafRef.current)
            flipRafRef.current = requestAnimationFrame(() => {
                setCurrentPageIndex(e.data) // update page index on next frame
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

        // Calculate rendering window
        // Render current page, +/- 2 pages for smoothness, and maybe page 1 (cover) always?
        // Page 1 is index 0.
        const renderWindow = 10 // Increased window slightly

        // Helper to determine if a page should force render
        const shouldRenderPage = (pageIndex: number) => {
            // Always render cover (page 0)
            if (pageIndex === 0) return true

            // Range check
            const distance = Math.abs(pageIndex - currentPageIndex)
            return distance <= renderWindow
        }

        // Page width calculation: add 1px on wide screens so two page widths fully cover the container (prevents gaps)
        const pageWidth = Math.max(300, Math.ceil(containerSize.width / (usePortrait ? 1 : 2) + (usePortrait ? 0 : 1)))

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
                    zIndex: isFullscreen ? 100 : 10, // Ensure below Navbar (z=50) normally, but above in fullscreen
                    isolation: 'isolate', // Create new stacking context so children don't leak z-index

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

                {/* FlipBook */}
                {!isLoading && pdf && containerSize.width > 0 && (
                    <div style={{
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        overflow: 'hidden',
                        // Center the cover when closed (Page 0) on Desktop
                        // Closed book (cover) is the right half of the spread.
                        // We translate -25% (half of the right page width relative to total) to move the visual center of the cover to the center of the container.
                        transform: !usePortrait && currentPageIndex === 0 ? 'translateX(-25%)' : 'translateX(0)',
                        transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)'
                    }} >
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
                            maxShadowOpacity={0.1}
                            showCover={true}
                            mobileScrollSupport={true}
                            usePortrait={usePortrait}
                            startPage={0}
                            className="demo-book"
                            style={{ margin: '0 auto' }}
                            ref={flipBookRef}
                            flippingTime={600}
                            useMouseEvents={true}
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
                                />
                            ))}
                        </HTMLFlipBook>
                    </div>
                )}

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
                    marginTop: '20px',
                    maxWidth: '95vw',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    zIndex: 30
                }}>
                    <button
                        onClick={prevFlip}
                        style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div style={{ color: '#ccc', fontSize: '0.9rem' }}>
                        {currentPageIndex + 1} / {numPages}
                    </div>

                    <button
                        onClick={nextFlip}
                        style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
                    >
                        <ChevronRight size={20} />
                    </button>

                    <div style={{ width: '1px', height: '16px', background: '#444' }} />

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

                    /* Pageflip smoothing + gap fixes */
                    .demo-book { perspective: 2000px; }
                    /* Ensure the viewport hides any subpixel hairlines */
                    .demo-book .book-viewport, .demo-book .book { overflow: hidden !important; }
                    .demo-book .page-wrapper, .demo-book .page { margin: 0 !important; box-sizing: border-box; padding: 0 !important; transform-style: preserve-3d; backface-visibility: hidden; will-change: transform, opacity; border: none !important; }
                    .demo-book .page > canvas { display:block; width:100% !important; height:100% !important; transform: translateZ(0); will-change: transform; }
                    /* Small negative overlap to avoid a hairline gutter from rounding; harmless and invisible when pages meet exactly */
                    .demo-book .page, .demo-book .page-wrapper { margin-right: -1px !important; }
                    .demo-book .page:last-child, .demo-book .page-wrapper:last-child { margin-right: 0 !important; }
                    /* remove any internal borders/shadows that create the hairline */
                    .demo-book .page, .demo-book .page * { outline: none !important; box-shadow: none !important; }
                    .demo-book .page-shadow, .demo-book .page__shadow { transition: opacity 0.12s ease; }
                    /* Ensure the outer wrapper transition matches our translate logic */
                    .demo-book { transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
                `}</style>
            </div>
        )
    }
