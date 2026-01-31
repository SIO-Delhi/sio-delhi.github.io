
import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ZoomIn, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

// Lazy loading image component with Intersection Observer
function LazyImage({ src, alt, onClick, isDark }: { src: string; alt: string; onClick: () => void; isDark: boolean }) {
    const [isInView, setIsInView] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    const imgRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const element = imgRef.current
        if (!element) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true)
                    observer.disconnect()
                }
            },
            { rootMargin: '200px', threshold: 0.01 }
        )

        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    return (
        <div
            ref={imgRef}
            className="gallery-item"
            onClick={onClick}
            style={{
                minHeight: isLoaded ? 'auto' : '200px',
                background: isDark
                    ? 'linear-gradient(135deg, rgba(255,59,59,0.08), rgba(40,40,40,0.5))'
                    : 'linear-gradient(135deg, rgba(255,59,59,0.05), rgba(200,200,200,0.3))'
            }}
        >
            {isInView ? (
                <>
                    <img
                        src={src}
                        alt={alt}
                        draggable={false}
                        onLoad={() => setIsLoaded(true)}
                        style={{
                            opacity: isLoaded ? 1 : 0,
                            transition: 'opacity 0.4s ease'
                        }}
                    />
                    {!isLoaded && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Loader2 size={24} color="rgba(255,59,59,0.5)" style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                    )}
                </>
            ) : (
                <div style={{ minHeight: '200px' }} />
            )}
            <div className="gallery-overlay">
                <ZoomIn size={24} color="white" />
            </div>
        </div>
    )
}

// Lightbox component with loading state
// Lightbox component with loading state
function LightboxImage({
    src,
    onClose,
    onNext,
    onPrev,
    hasNext,
    hasPrev
}: {
    src: string;
    onClose: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    hasNext?: boolean;
    hasPrev?: boolean;
}) {
    const [isLoaded, setIsLoaded] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)

    // Reset loaded state when src changes
    useEffect(() => {
        setIsLoaded(false)
    }, [src])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' && hasNext && onNext) {
                onNext()
            } else if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
                onPrev()
            } else if (e.key === 'Escape') {
                onClose()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [hasNext, hasPrev, onNext, onPrev, onClose])

    // Download image directly without redirecting
    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsDownloading(true)

        try {
            // Extract filename from URL
            const urlParts = src.split('/')
            const filename = urlParts[urlParts.length - 1].split('?')[0] || 'gallery-image.jpg'

            // Check if it's from our API - use download endpoint
            if (src.includes('api.siodelhi.org')) {
                // Use download proxy endpoint
                const downloadUrl = src.replace('/uploads/images/', '/api/download/images/')
                window.location.href = downloadUrl
            } else {
                // For external images, try fetch with blob
                const response = await fetch(src, { mode: 'cors' })
                const blob = await response.blob()
                const blobUrl = URL.createObjectURL(blob)

                const link = document.createElement('a')
                link.href = blobUrl
                link.download = filename
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(blobUrl)
            }
        } catch (error) {
            console.error('Download failed:', error)
            // Fallback: open in new tab
            window.open(src, '_blank')
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1001,
                background: 'rgba(0,0,0,0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            onClick={onClose}
            onContextMenu={(e) => e.preventDefault()}
        >

            {/* Navigation Buttons */}
            {hasPrev && (
                <button
                    className="lightbox-nav-btn prev"
                    onClick={(e) => {
                        e.stopPropagation()
                        onPrev?.()
                    }}
                >
                    <ChevronLeft size={32} />
                </button>
            )}

            {hasNext && (
                <button
                    className="lightbox-nav-btn next"
                    onClick={(e) => {
                        e.stopPropagation()
                        onNext?.()
                    }}
                >
                    <ChevronRight size={32} />
                </button>
            )}

            {/* Loading spinner */}
            {!isLoaded && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <Loader2 size={40} color="#ff3b3b" style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Loading full image...</span>
                </div>
            )}

            <img
                key={src}
                src={src}
                alt="Full size"
                draggable={false}
                onLoad={() => setIsLoaded(true)}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                    maxWidth: '95vw',
                    maxHeight: '90vh',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    userSelect: 'none',
                    pointerEvents: 'auto',
                    opacity: isLoaded ? 1 : 0,
                    transition: 'opacity 0.3s ease'
                }}
                onClick={(e) => e.stopPropagation()}
            />

            {/* Download Button - fixed at bottom center */}
            {isLoaded && (
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    style={{
                        position: 'absolute',
                        bottom: '24px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 18px',
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '8px',
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        cursor: isDownloading ? 'wait' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: isDownloading ? 0.6 : 1
                    }}
                    onMouseEnter={e => {
                        if (!isDownloading) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.18)'
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
                        }
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                    }}
                >
                    {isDownloading ? (
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                    )}
                    {isDownloading ? 'Downloading...' : 'Download'}
                </button>
            )}
        </div>
    )
}

interface EmbeddableGalleryProps {
    imagesRaw: any
    isDark: boolean
    title?: string
}

export function EmbeddableGallery({ imagesRaw, isDark }: EmbeddableGalleryProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    // Normalize to sections
    const gallerySections: { id: string, title: string, images: string[] }[] = (() => {
        if (!imagesRaw || imagesRaw.length === 0) return []

        // Check if it's the old format (array of strings)
        if (typeof imagesRaw[0] === 'string') {
            return [{
                id: 'default',
                title: '',
                images: imagesRaw as unknown as string[]
            }]
        }

        return imagesRaw as unknown as { id: string, title: string, images: string[] }[]
    })()

    if (gallerySections.length === 0) return null

    // Calculate total if needed, or iterate

    return (
        <div style={{ marginTop: '30px' }}>
            <h2 style={{
                textAlign: 'center',
                fontSize: '2rem',
                fontWeight: 700,
                marginBottom: '40px',
                color: isDark ? 'white' : 'black'
            }}>
                Gallery
            </h2>

            {gallerySections.map((section, idx) => (
                <div key={section.id || idx} style={{ marginBottom: '48px' }}>
                    {section.title && (
                        <h3 style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            marginBottom: '24px',
                            borderBottom: isDark ? '1px solid #333' : '1px solid #eee',
                            paddingBottom: '12px',
                            display: 'flex', alignItems: 'center', gap: '12px',
                            color: isDark ? '#eee' : '#111'
                        }}>
                            {section.title}
                            <span style={{ fontSize: '0.9rem', fontWeight: 500, opacity: 0.5 }}>
                                {section.images.length}
                            </span>
                        </h3>
                    )}
                    <div className="gallery-masonry">
                        {section.images.map((img: string, imgIdx: number) => (
                            <LazyImage
                                key={`${idx}-${imgIdx}`}
                                src={img}
                                alt={`Gallery ${imgIdx + 1}`}
                                onClick={() => setSelectedImage(img)}
                                isDark={isDark}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {selectedImage && (() => {
                const allImages = gallerySections.flatMap(s => s.images)
                const currentIndex = allImages.indexOf(selectedImage)

                return createPortal(
                    <LightboxImage
                        src={selectedImage}
                        onClose={() => setSelectedImage(null)}
                        hasNext={currentIndex < allImages.length - 1}
                        hasPrev={currentIndex > 0}
                        onNext={() => {
                            if (currentIndex < allImages.length - 1) {
                                setSelectedImage(allImages[currentIndex + 1])
                            }
                        }}
                        onPrev={() => {
                            if (currentIndex > 0) {
                                setSelectedImage(allImages[currentIndex - 1])
                            }
                        }}
                    />,
                    document.body
                )
            })()}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                /* CSS Masonry using columns */
                .gallery-masonry {
                    column-count: 4;
                    column-gap: 16px;
                }

                /* Lightbox Navigation Buttons */
                .lightbox-nav-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 16px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    z-index: 10;
                }
                .lightbox-nav-btn:hover {
                    background: rgba(255,255,255,0.2);
                }
                .lightbox-nav-btn.prev {
                    left: 20px;
                }
                .lightbox-nav-btn.next {
                    right: 20px;
                }

                @media (max-width: 768px) {
                    .lightbox-nav-btn {
                        padding: 10px;
                    }
                    .lightbox-nav-btn svg {
                        width: 24px;
                        height: 24px;
                    }
                    .lightbox-nav-btn.prev {
                        left: 10px;
                    }
                    .lightbox-nav-btn.next {
                        right: 10px;
                    }
                }



                .gallery-item {
                    break-inside: avoid;
                    margin-bottom: 16px;
                    position: relative;
                    overflow: hidden;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    cursor: pointer;
                }

                .gallery-item:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 40px rgba(0,0,0,0.25);
                }

                .gallery-item img {
                    width: 100%;
                    display: block;
                    border-radius: 12px;
                }

                .gallery-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%, transparent 100%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                }

                .gallery-item:hover .gallery-overlay {
                    opacity: 1;
                }

                /* Medium screens - 3 columns */
                @media (max-width: 1024px) {
                    .gallery-masonry {
                        column-count: 3;
                        column-gap: 14px;
                    }
                    .gallery-item {
                        margin-bottom: 14px;
                    }
                }

                /* Small screens - 2 columns */
                @media (max-width: 768px) {
                    .gallery-masonry {
                        column-count: 2;
                        column-gap: 12px;
                    }
                    .gallery-item {
                        margin-bottom: 12px;
                        border-radius: 10px;
                    }
                    .gallery-item img {
                        border-radius: 10px;
                    }
                    .gallery-overlay {
                        border-radius: 10px;
                    }
                }

                /* Extra small screens */
                @media (max-width: 480px) {
                    .gallery-masonry {
                        column-count: 2;
                        column-gap: 10px;
                    }
                    .gallery-item {
                        margin-bottom: 10px;
                        border-radius: 8px;
                    }
                    .gallery-item img {
                        border-radius: 8px;
                    }
                    .gallery-overlay {
                        border-radius: 8px;
                    }
                }

                /* Very large screens - 5 columns */
                @media (min-width: 1400px) {
                    .gallery-masonry {
                        column-count: 5;
                        column-gap: 20px;
                    }
                    .gallery-item {
                        margin-bottom: 20px;
                    }
                }
            `}</style>
        </div>
    )
}
