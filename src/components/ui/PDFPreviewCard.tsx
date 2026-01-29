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
        <div
            onClick={onClick}
            className="group"
            style={{
                position: 'relative',
                width: '100%',
                maxWidth: '400px',
                aspectRatio: '1/1.41',
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                background: '#1a1a1a',
                border: '1px solid #333',
                margin: '0 auto',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
        >
            {/* Hover Effect */}
            <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.3s ease',
                zIndex: 10
            }} className="group-hover:opacity-100">
                <button style={{
                    background: '#ff3b3b', color: 'white', border: 'none',
                    padding: '12px 24px', borderRadius: '30px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '8px',
                    transform: 'translateY(10px)', transition: 'transform 0.3s ease'
                }} className="group-hover:translate-y-0">
                    <Eye size={20} /> View PDF
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
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Loader2 className="animate-spin text-gray-400" size={32} />
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

            <style>{`
                .group:hover .group-hover\\:opacity-100 { opacity: 1 !important; }
                .group:hover .group-hover\\:translate-y-0 { transform: translateY(0) !important; }
                .group:hover { transform: translateY(-5px); box-shadow: 0 15px 40px rgba(0,0,0,0.5) !important; }
            `}</style>
        </div>
    )
}
