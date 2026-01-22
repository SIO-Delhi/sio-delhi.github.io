import React, { useState } from 'react'
import { Grid, X, ZoomIn } from 'lucide-react'

interface GalleryModalProps {
    images: string[]
    onClose: () => void
    isDark: boolean
    title?: string
}

export const GalleryModal = ({ images, onClose, isDark, title }: GalleryModalProps) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: isDark ? 'rgba(0,0,0,0.97)' : 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(20px)',
            display: 'flex', flexDirection: 'column',
            animation: 'galleryFadeIn 0.3s ease-out'
        }}>
            {/* Header */}
            <div className="gallery-header" style={{
                padding: '20px 24px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
                backdropFilter: 'blur(10px)',
                gap: '12px',
                flexWrap: 'wrap'
            }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    color: isDark ? 'white' : 'black',
                    flex: 1,
                    minWidth: 0
                }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: '#ff3b3b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Grid size={20} color="white" />
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '2px',
                        minWidth: 0,
                        flex: 1
                    }}>
                        <span className="gallery-title" style={{ 
                            fontSize: '1.2rem', 
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {title ? `${title}` : 'Event Gallery'}
                        </span>
                        <span className="gallery-subtitle" style={{
                            fontSize: '0.85rem',
                            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
                        }}>
                            Explore the vibrant moments and highlights from our event
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
                        color: isDark ? 'white' : 'black',
                        padding: '6px 14px', 
                        borderRadius: '20px', 
                        fontSize: '0.85rem', 
                        fontWeight: 600,
                        flexShrink: 0
                    }}>{images.length} Photos</span>
                    <button
                        onClick={onClose}
                        style={{
                            background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
                            border: 'none',
                            color: isDark ? 'white' : 'black', cursor: 'pointer',
                            padding: '10px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                            flexShrink: 0
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#ff3b3b'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = isDark ? 'white' : 'black'; }}
                    >
                        <X size={22} />
                    </button>
                </div>
            </div>

            {/* Masonry Grid Content */}
            <div className="gallery-container" style={{
                flex: 1, 
                overflowY: 'auto', 
                padding: '24px'
            }}>
                <div className="gallery-masonry">
                    {images.map((img, idx) => (
                        <div 
                            key={idx} 
                            className="gallery-item"
                            onClick={() => setSelectedImage(img)}
                            style={{ cursor: 'pointer' }}
                        >
                            <img 
                                src={img} 
                                alt={`Gallery ${idx + 1}`} 
                                loading="lazy"
                                style={{ 
                                    width: '100%', 
                                    display: 'block',
                                    borderRadius: '12px',
                                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                                }} 
                            />
                            <div className="gallery-overlay">
                                <ZoomIn size={24} color="white" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lightbox for selected image */}
            {selectedImage && (
                <div 
                    style={{
                        position: 'fixed', inset: 0, zIndex: 1001,
                        background: 'rgba(0,0,0,0.95)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '20px',
                        animation: 'galleryFadeIn 0.2s ease-out'
                    }}
                    onClick={() => setSelectedImage(null)}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        style={{
                            position: 'absolute', top: '20px', right: '20px',
                            background: 'rgba(255,255,255,0.1)', border: 'none',
                            color: 'white', cursor: 'pointer',
                            padding: '12px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.2s',
                            zIndex: 10
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#ff3b3b'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    >
                        <X size={24} />
                    </button>
                    <img 
                        src={selectedImage} 
                        alt="Full size" 
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        style={{ 
                            maxWidth: '95vw', 
                            maxHeight: '90vh', 
                            objectFit: 'contain',
                            borderRadius: '8px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                            userSelect: 'none',
                            pointerEvents: 'auto'
                        }} 
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <style>{`
                @keyframes galleryFadeIn { 
                    from { opacity: 0; } 
                    to { opacity: 1; } 
                }
                
                /* Masonry layout for large screens */
                .gallery-masonry {
                    column-count: 3;
                    column-gap: 20px;
                }
                
                .gallery-item {
                    break-inside: avoid;
                    margin-bottom: 20px;
                    position: relative;
                    overflow: hidden;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                
                .gallery-item:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 40px rgba(0,0,0,0.25);
                }
                
                .gallery-item img {
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
                
                /* Medium screens (tablets) - 2 columns */
                @media (max-width: 1024px) {
                    .gallery-masonry {
                        column-count: 2;
                        column-gap: 16px;
                    }
                    .gallery-item {
                        margin-bottom: 16px;
                    }
                    .gallery-container {
                        padding: 16px !important;
                    }
                }
                
                /* Small screens (phones) - 2 columns compact */
                @media (max-width: 768px) {
                    .gallery-masonry {
                        column-count: 2;
                        column-gap: 12px;
                    }
                    .gallery-item {
                        margin-bottom: 12px;
                        border-radius: 10px !important;
                    }
                    .gallery-item img {
                        border-radius: 10px !important;
                    }
                    .gallery-overlay {
                        border-radius: 10px !important;
                    }
                    .gallery-container {
                        padding: 12px !important;
                    }
                    .gallery-header {
                        padding: 14px 16px !important;
                    }
                    .gallery-title {
                        font-size: 1rem !important;
                        white-space: normal !important;
                        line-height: 1.3 !important;
                    }
                    .gallery-subtitle {
                        font-size: 0.75rem !important;
                        display: -webkit-box !important;
                        -webkit-line-clamp: 2 !important;
                        -webkit-box-orient: vertical !important;
                        overflow: hidden !important;
                    }
                }
                
                /* Extra small screens - single column */
                @media (max-width: 480px) {
                    .gallery-masonry {
                        column-count: 1;
                        column-gap: 0;
                    }
                    .gallery-item {
                        margin-bottom: 12px;
                        border-radius: 8px !important;
                    }
                    .gallery-item img {
                        border-radius: 8px !important;
                    }
                    .gallery-overlay {
                        border-radius: 8px !important;
                    }
                    .gallery-container {
                        padding: 10px !important;
                    }
                    .gallery-header {
                        padding: 12px !important;
                        flex-wrap: nowrap !important;
                    }
                    .gallery-title {
                        font-size: 0.9rem !important;
                        white-space: normal !important;
                        word-break: break-word !important;
                    }
                    .gallery-subtitle {
                        display: none !important;
                    }
                }
                
                /* Very large screens - 4 columns */
                @media (min-width: 1400px) {
                    .gallery-masonry {
                        column-count: 4;
                        column-gap: 24px;
                    }
                    .gallery-item {
                        margin-bottom: 24px;
                    }
                }
                
                /* Custom scrollbar */
                .gallery-container::-webkit-scrollbar {
                    width: 8px;
                }
                .gallery-container::-webkit-scrollbar-track {
                    background: transparent;
                }
                .gallery-container::-webkit-scrollbar-thumb {
                    background: rgba(255,59,59,0.3);
                    border-radius: 4px;
                }
                .gallery-container::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,59,59,0.5);
                }
            `}</style>
        </div>
    )
}
