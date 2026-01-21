import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut } from 'lucide-react'

interface PDFFlipbookProps {
    url: string
}

declare global {
    interface Window {
        pdfjsLib: any
    }
}

export function PDFFlipbook({ url }: PDFFlipbookProps) {
    const [pdfDoc, setPdfDoc] = useState<any>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isFlipping, setIsFlipping] = useState(false)
    const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next')
    const [scale, setScale] = useState(1)
    const [resizeTrigger, setResizeTrigger] = useState(0) // Used to force re-render on resize


    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const renderTaskRef = useRef<any>(null)

    // Load PDF
    useEffect(() => {
        const loadPdf = async () => {
            setIsLoading(true)
            try {
                // Ensure PDFUtil is loaded
                if (!window.pdfjsLib) {
                    // Retry briefly if script not yet ready
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

    // Render Page
    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return

        const renderPage = async () => {
            try {
                // Cancel any pending render
                if (renderTaskRef.current) {
                    renderTaskRef.current.cancel()
                }

                const page = await pdfDoc.getPage(currentPage)

                // Calculate scale to fit container width OR height (object-fit: contain)
                const containerWidth = containerRef.current?.clientWidth || 800
                const maxHeight = window.innerHeight - 180 // Subtract space for navbar & controls

                const viewport = page.getViewport({ scale: 1 })

                // Determine scale factors for both dimensions
                const widthScale = containerWidth / viewport.width
                const heightScale = maxHeight / viewport.height

                // Use the limiting dimension to ensure the whole page is visible
                const baseScale = Math.min(widthScale, heightScale)
                const finalScale = baseScale * scale

                const scaledViewport = page.getViewport({ scale: finalScale })

                const canvas = canvasRef.current
                const context = canvas?.getContext('2d')

                if (canvas && context) {
                    canvas.height = scaledViewport.height
                    canvas.width = scaledViewport.width

                    const renderContext = {
                        canvasContext: context,
                        viewport: scaledViewport,
                    }

                    const renderTask = page.render(renderContext)
                    renderTaskRef.current = renderTask
                    await renderTask.promise
                }
            } catch (error: any) {
                if (error.name !== 'RenderingCancelledException') {
                    console.error('Render error:', error)
                }
            }
        }

        renderPage()
        renderPage()
    }, [pdfDoc, currentPage, scale, resizeTrigger])

    // Window resize handler
    useEffect(() => {
        const handleResize = () => {
            setResizeTrigger(prev => prev + 1)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])


    const handlePrev = () => {
        if (currentPage > 1 && !isFlipping) {
            setFlipDirection('prev')
            setIsFlipping(true)
            setTimeout(() => {
                setCurrentPage(p => p - 1)
                setIsFlipping(false)
            }, 300) // Match transition duration
        }
    }

    const handleNext = () => {
        if (currentPage < totalPages && !isFlipping) {
            setFlipDirection('next')
            setIsFlipping(true)
            setTimeout(() => {
                setCurrentPage(p => p + 1)
                setIsFlipping(false)
            }, 300)
        }
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                position: 'relative',
                minHeight: '400px'
            }}
        >
            {/* Book View */}
            <div style={{
                position: 'relative',
                perspective: '1500px',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                overflow: 'visible', // Allow 3D effect to overflow
                flex: 1, // Allow taking available space
                minHeight: '0' // Fix flexbox overflow
            }}>
                {isLoading && (
                    <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#666' }}>
                        <Loader2 size={32} className="animate-spin" />
                        <span style={{ marginTop: 10, fontSize: '0.9rem' }}>Loading PDF...</span>
                    </div>
                )}

                <div
                    style={{
                        position: 'relative',
                        transition: 'transform 0.4s ease-in-out, opacity 0.3s',
                        transformStyle: 'preserve-3d',
                        transformOrigin: flipDirection === 'next' ? 'left center' : 'right center',
                        transform: isFlipping
                            ? (flipDirection === 'next' ? 'rotateY(-90deg) scale(0.95)' : 'rotateY(90deg) scale(0.95)')
                            : 'rotateY(0) scale(1)',
                        opacity: isFlipping ? 0.5 : 1,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        style={{
                            maxWidth: '100%',
                            height: 'auto',
                            display: 'block',
                            background: 'white' // Paper color
                        }}
                    />
                </div>
            </div>

            {/* Controls Overlay - Moved to Bottom */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px 24px',
                background: 'rgba(20, 20, 20, 0.8)',
                backdropFilter: 'blur(10px)',
                borderRadius: '30px',
                border: '1px solid rgba(255,255,255,0.1)',
                zIndex: 10,
                marginTop: '10px'
            }}>
                <button
                    onClick={handlePrev}
                    disabled={currentPage <= 1}
                    style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: currentPage <= 1 ? 0.3 : 1 }}
                >
                    <ChevronLeft size={24} />
                </button>

                <span style={{ color: 'white', minWidth: '60px', textAlign: 'center', fontFamily: 'monospace' }}>
                    {currentPage} / {totalPages}
                </span>

                <button
                    onClick={handleNext}
                    disabled={currentPage >= totalPages}
                    style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: currentPage >= totalPages ? 0.3 : 1 }}
                >
                    <ChevronRight size={24} />
                </button>

                <div style={{ width: '1px', height: '16px', background: '#444', margin: '0 8px' }} />

                <button onClick={() => setScale(s => Math.min(s + 0.1, 2))} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}>
                    <ZoomIn size={18} />
                </button>
                <button onClick={() => setScale(s => Math.max(s - 0.1, 0.5))} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}>
                    <ZoomOut size={18} />
                </button>
            </div>

            <style>{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
