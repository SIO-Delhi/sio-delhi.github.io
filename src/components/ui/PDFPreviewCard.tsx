import { useEffect, useRef, useState } from 'react'
import { Loader2, Eye } from 'lucide-react'

interface PDFPreviewCardProps {
    url: string
    onClick: () => void
    coverImage?: string
}

declare global {
    interface Window {
        pdfjsLib: any
    }
}

export function PDFPreviewCard({ url, onClick, coverImage }: PDFPreviewCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (coverImage) {
            setLoading(false)
            return
        }

        let isCancelled = false
        let renderTask: any = null

        const loadCover = async () => {
            setLoading(true)
            setError(false)
            try {
                // Ensure PDF.js is loaded
                if (!window.pdfjsLib) {
                    await new Promise(resolve => setTimeout(resolve, 500))
                    if (!window.pdfjsLib) throw new Error("PDF.js not loaded")
                }

                const loadingTask = window.pdfjsLib.getDocument(url)
                const pdf = await loadingTask.promise
                if (isCancelled) return

                const page = await pdf.getPage(1)
                if (isCancelled) return

                const canvas = canvasRef.current
                if (!canvas) return

                const viewport = page.getViewport({ scale: 1.5 })
                canvas.width = viewport.width
                canvas.height = viewport.height

                const context = canvas.getContext('2d')
                const renderContext = {
                    canvasContext: context!,
                    viewport: viewport
                }

                renderTask = page.render(renderContext)
                await renderTask.promise

                // We're done with the PDF document for this preview
                pdf.destroy()
                setLoading(false)

            } catch (err) {
                console.error("Error loading PDF cover:", err)
                if (!isCancelled) {
                    setError(true)
                    setLoading(false)
                }
            }
        }

        loadCover()

        return () => {
            isCancelled = true
            if (renderTask) renderTask.cancel()
        }
    }, [url, coverImage])

    return (
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
            <div
                onClick={onClick}
                className="group"
                style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1/1.41',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    // margin: '0 auto', // Removed margin from here as it's on parent
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
            >
                {/* Desktop Hover Effect */}
                <div className="pdf-overlay" style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.3s ease',
                    zIndex: 10
                }}>
                    <button style={{
                        background: '#ff3b3b', color: 'white', border: 'none',
                        padding: '12px 24px', borderRadius: '30px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '8px',
                        transform: 'translateY(10px)', transition: 'transform 0.3s ease',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }} className="view-pdf-btn">
                        <Eye size={20} /> Read
                    </button>
                </div>

                {/* Content */}
                {coverImage ? (
                    <img src={coverImage} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <>
                        <canvas
                            ref={canvasRef}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: loading || error ? 'none' : 'block' }}
                        />

                        {loading && (
                            <div style={{
                                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', gap: '12px',
                                background: '#1a1a1a', color: '#888'
                            }}>
                                <Loader2 className="animate-spin text-[#ff3b3b]" size={36} />
                                <span style={{ fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.02em' }}>
                                    Generating Preview...
                                </span>
                            </div>
                        )}

                        {error && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#666', padding: '20px', textAlign: 'center' }}>
                                <span style={{ fontSize: '3rem', marginBottom: '10px' }}>📄</span>
                                <span>Click to View PDF</span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Mobile "Read Book" Button - Outside the card */}
            <div className="mobile-read-btn-container" style={{ marginTop: '16px', display: 'none', justifyContent: 'center' }}>
                <button
                    onClick={onClick}
                    style={{
                        background: '#ff3b3b',
                        color: 'white',
                        border: 'none',
                        padding: '12px 0',
                        width: '100%',
                        borderRadius: '8px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '1rem',
                        boxShadow: '0 4px 12px rgba(255, 59, 59, 0.2)'
                    }}
                >
                    <Eye size={20} /> Read
                </button>
            </div>

            <style>{`
                .group:hover .pdf-overlay { opacity: 1 !important; }
                .group:hover .view-pdf-btn { transform: translateY(0) !important; }
                .group:hover { transform: translateY(-5px); box-shadow: 0 15px 40px rgba(0,0,0,0.5) !important; }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }

                @media (max-width: 768px) {
                    .pdf-overlay {
                        display: none !important; /* Hide overlay on mobile completely */
                    }
                    .mobile-read-btn-container {
                        display: flex !important; /* Show bottom button on mobile */
                    }
                }
            `}</style>
        </div>
    )
}
