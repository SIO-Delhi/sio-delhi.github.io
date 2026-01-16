import React, { useState, useRef, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import HTMLFlipBook from 'react-pageflip'
import { ChevronLeft, ChevronRight, Maximize2, Loader2, Minimize2 } from 'lucide-react'

// Set worker path for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFFlipbookProps {
    url: string
}

// Wrapper for individual pages to support refs required by react-pageflip
const FlipPage = React.forwardRef<HTMLDivElement, { pageNumber: number, width: number, currentPage: number }>((props, ref) => {
    // Lazy loading: Only render actual PDF page if we are close to it
    // 0 is cover (page 1). index 0 = page 1.
    // currentPage from onFlip is 0-indexed (index of the page on display, or spread index?)
    // react-pageflip onFlip returns index of the *top* page.

    // Safety check for rendering buffer (render +/- 5 pages around current)
    // Page numbers are 1-based, props.currentPage is 0-based index of the page in the array.
    const pageIndex = props.pageNumber - 1
    const isNear = Math.abs(pageIndex - props.currentPage) < 5

    return (
        <div ref={ref} className="page-wrapper" style={{ background: 'white', overflow: 'hidden', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)' }}>
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isNear ? (
                    <Page
                        pageNumber={props.pageNumber}
                        width={props.width}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        loading={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc' }}><Loader2 size={24} className="animate-spin" /></div>}
                    />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#eee', fontSize: '2rem', fontWeight: 'bold' }}>
                        {props.pageNumber}
                    </div>
                )}

                {/* Page Number Footer */}
                <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '10px', color: '#888' }}>
                    {props.pageNumber}
                </div>
            </div>
        </div>
    )
})

export function PDFFlipbook({ url }: PDFFlipbookProps) {
    const [numPages, setNumPages] = useState<number>(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [currentPage, setCurrentPage] = useState(0)

    const bookRef = useRef<any>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages)
    }

    // Responsive: Update container width knowledge if needed, though react-pageflip is good at responsive.
    useEffect(() => {
        // Optional: Add resize listener if we need dynamic resolution adjustment
        // For now, fixed scale is sufficient
    }, [])

    const basePageWidth = 400
    const basePageHeight = 560

    const flipNext = () => bookRef.current?.pageFlip()?.flipNext()
    const flipPrev = () => bookRef.current?.pageFlip()?.flipPrev()

    return (
        <div
            ref={containerRef}
            style={{
                position: isFullscreen ? 'fixed' : 'relative',
                inset: isFullscreen ? 0 : 'auto',
                zIndex: isFullscreen ? 9999 : 1,
                background: '#111',
                borderRadius: isFullscreen ? 0 : '16px',
                display: 'flex',
                flexDirection: 'column',
                height: isFullscreen ? '100vh' : '800px',
                overflow: 'hidden'
            }}
        >
            {/* Header controls */}
            {/* Floating Controls */}
            <button
                onClick={flipPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                title="Previous"
            >
                <ChevronLeft size={32} />
            </button>

            <button
                onClick={flipNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                title="Next"
            >
                <ChevronRight size={32} />
            </button>

            <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
                {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
            </button>

            {/* Book Area */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#222' }}>
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div style={{ color: 'white' }}>Loading Document...</div>}
                    error={<div style={{ color: '#ff3b3b' }}>Failed to load PDF</div>}
                    className="flex items-center justify-center w-full h-full"
                >
                    {numPages > 0 && (
                        <div style={{
                            position: 'relative',
                            width: basePageWidth * 2, // 800px
                            height: basePageHeight,   // 560px
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 50px rgba(0,0,0,0.5)', // Optional: visual debug/aesthetic
                        }}>
                            {/* @ts-ignore */}
                            <HTMLFlipBook
                                width={basePageWidth}
                                height={basePageHeight}
                                size="fixed"
                                minWidth={300}
                                maxWidth={1000}
                                minHeight={400}
                                maxHeight={1533}
                                maxShadowOpacity={0.5}
                                showCover={true}
                                mobileScrollSupport={true}
                                ref={bookRef}
                                className="flip-book"
                                style={{ margin: 0 }} // Explicit reset
                                onFlip={(e) => setCurrentPage(e.data)}
                                usePortrait={false}
                                startPage={0}
                                drawShadow={true}
                                flippingTime={1000}
                                useMouseEvents={true}
                                swipeDistance={30}
                            >
                                {Array.from({ length: numPages }, (_, i) => (
                                    <FlipPage
                                        key={i}
                                        pageNumber={i + 1}
                                        width={basePageWidth}
                                        currentPage={currentPage}
                                    />
                                ))}
                            </HTMLFlipBook>
                        </div>
                    )}
                </Document>
            </div>

            <style>{`
                .flip-book {
                    box-shadow: 0 0 20px rgba(0,0,0,0.5);
                }
            `}</style>
        </div>
    )
}


