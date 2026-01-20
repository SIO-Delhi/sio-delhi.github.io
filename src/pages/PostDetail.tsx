import { useParams, useNavigate } from 'react-router-dom'
import { useContent } from '../context/ContentContext'
import { useTheme } from '../context/ThemeContext'
import { Calendar, User, ChevronLeft, ChevronRight, Volume2, VolumeX, Mail, Instagram } from 'lucide-react'
import React, { useEffect, useState, useMemo } from 'react'
import { PDFFlipbook } from '../components/ui/PDFFlipbook'
import { SectionCard } from '../components/ui/SectionCard'
import { PostSkeleton } from '../components/ui/PostSkeleton'

// --- ContentBlockRenderer: Parses and renders enhanced content blocks ---
// --- ContentBlockRenderer: Parses and renders enhanced content blocks ---
interface ParsedBlock {
    type: 'text' | 'image' | 'video' | 'pdf' | 'legacy' | 'composite'
    content: string
    pdfUrl: string
    alignment: string
    subtitle: string
    subtitleColor?: string
    caption: string
    isCarousel: boolean
    carouselImages: string[]
    imageSrc: string
    // Composite block fields
    layout?: 'image-left' | 'image-right' | 'image-top' | 'stacked'
    imageUrl?: string
    textContent?: string
}

// Memoized Video Block to prevent re-renders (looping/refreshing issues)
const VideoBlock = React.memo(({ src, subtitle, subtitleColor, text, isDark }: { src: string, subtitle?: string, subtitleColor?: string, text?: string, isDark: boolean }) => {
    return (
        <div style={{
            margin: '32px 0',
            padding: '24px 28px',
            borderRadius: '16px',
            background: isDark
                ? 'linear-gradient(135deg, rgba(255,59,59,0.08) 0%, rgba(20,20,20,0.95) 100%)'
                : 'linear-gradient(135deg, rgba(255,59,59,0.06) 0%, rgba(255,255,255,0.95) 100%)',
            backdropFilter: 'blur(12px)',
            border: isDark ? '1px solid rgba(255,59,59,0.15)' : '1px solid rgba(255,59,59,0.1)',
            boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(255,59,59,0.05)',
        }}>
            {subtitle && (
                <h3 style={{
                    color: subtitleColor || '#ff3b3b',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    marginBottom: '16px',
                    borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    paddingBottom: '8px'
                }}>
                    {subtitle}
                </h3>
            )}

            <div style={{
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                width: '100%',
                height: 0,
                paddingBottom: '56.25%',
                background: '#000',
                marginBottom: text ? '16px' : '0'
            }}>
                <iframe
                    src={src}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>

            {text && (
                <p style={{
                    margin: 0,
                    color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
                    fontSize: '1rem',
                    lineHeight: 1.6
                }}>
                    {text}
                </p>
            )}
        </div>
    )
})

function ContentBlockRenderer({ content, isDark }: { content: string; isDark: boolean }) {
    const [carouselIndices, setCarouselIndices] = useState<{ [key: number]: number }>({})

    // Parse content into blocks
    const blocks: ParsedBlock[] = useMemo(() => {
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = content
        const blockElements = tempDiv.querySelectorAll('.siodel-block')

        if (blockElements.length === 0) {
            // Legacy content - return as single text block
            return [{
                type: 'legacy' as const,
                content,
                pdfUrl: '',
                alignment: 'left',
                subtitle: '',
                caption: '',
                isCarousel: false,
                carouselImages: [],
                imageSrc: ''
            }]
        }

        return Array.from(blockElements).map(el => {
            const isImage = el.classList.contains('block-image')
            const isVideo = el.classList.contains('block-video')
            const isPdf = el.classList.contains('block-pdf')
            const isComposite = el.classList.contains('block-composite')

            let carouselImages: string[] = []
            try {
                const imagesAttr = el.getAttribute('data-images')
                if (imagesAttr) {
                    carouselImages = JSON.parse(decodeURIComponent(imagesAttr))
                }
            } catch { /* ignore parse errors */ }

            // Determine block type
            let blockType: ParsedBlock['type'] = 'text'
            if (isComposite) blockType = 'composite'
            else if (isPdf) blockType = 'pdf'
            else if (isImage) blockType = 'image'
            else if (isVideo) blockType = 'video'

            return {
                type: blockType,
                content: isPdf || isComposite ? '' : el.innerHTML,
                pdfUrl: el.getAttribute('data-pdf-url') || '',
                alignment: el.getAttribute('data-align') || 'left',
                subtitle: decodeURIComponent(el.getAttribute('data-subtitle') || ''),
                subtitleColor: el.getAttribute('data-subtitle-color') || '',
                caption: decodeURIComponent(el.getAttribute('data-caption') || ''),
                isCarousel: el.getAttribute('data-carousel') === 'true',
                carouselImages,
                imageSrc: el.querySelector('img')?.src || '',
                // Composite fields
                layout: (el.getAttribute('data-layout') || 'image-left') as ParsedBlock['layout'],
                imageUrl: decodeURIComponent(el.getAttribute('data-image-url') || ''),
                textContent: decodeURIComponent(el.getAttribute('data-text-content') || '')
            }
        })
    }, [content])

    const navigateCarousel = (blockIndex: number, direction: 'prev' | 'next', totalImages: number) => {
        setCarouselIndices(prev => {
            const current = prev[blockIndex] || 0
            const next = direction === 'next'
                ? (current + 1) % totalImages
                : (current - 1 + totalImages) % totalImages
            return { ...prev, [blockIndex]: next }
        })
    }

    // Auto-play effect for carousels
    useEffect(() => {
        const interval = setInterval(() => {
            blocks.forEach((block, index) => {
                // Get images list - prefer carouselImages if available
                let images: string[] = []
                if (block.carouselImages && block.carouselImages.length > 0) {
                    images = block.carouselImages
                } else if (block.imageUrl) {
                    images = [block.imageUrl]
                } else if (block.imageSrc) {
                    images = [block.imageSrc]
                }

                // Only auto-advance if there are multiple images
                if (images.length > 1) {
                    setCarouselIndices(prev => {
                        const current = prev[index] || 0
                        return { ...prev, [index]: (current + 1) % images.length }
                    })
                }
            })
        }, 3000)
        return () => clearInterval(interval)
    }, [blocks])

    return (
        <>
            {blocks.map((block, index) => {
                const alignStyle = {
                    textAlign: block.alignment as 'left' | 'center' | 'right',
                    justifyContent: block.alignment === 'center' ? 'center' : (block.alignment === 'right' ? 'flex-end' : 'flex-start')
                }

                // Video Block (No glass card needed as it handles its own style in existing HTML)
                if (block.type === 'video') {
                    // Parse inline HTML from editor to get video src for cleaner rendering
                    const tempDiv = document.createElement('div')
                    tempDiv.innerHTML = block.content
                    const iframeSrc = tempDiv.querySelector('iframe')?.src || ''

                    return (
                        <VideoBlock
                            key={index}
                            src={iframeSrc}
                            subtitle={block.subtitle}
                            subtitleColor={block.subtitleColor}
                            text={block.textContent}
                            isDark={isDark}
                        />
                    )
                }

                // Text Block with Glass Card
                if (block.type === 'text') {
                    return (
                        <div
                            key={index}
                            style={{
                                margin: '24px 0',
                                padding: '24px 28px',
                                borderRadius: '16px',
                                background: isDark
                                    ? 'linear-gradient(135deg, rgba(255,59,59,0.08) 0%, rgba(20,20,20,0.95) 100%)'
                                    : 'linear-gradient(135deg, rgba(255,59,59,0.06) 0%, rgba(255,255,255,0.95) 100%)',
                                backdropFilter: 'blur(12px)',
                                border: isDark ? '1px solid rgba(255,59,59,0.15)' : '1px solid rgba(255,59,59,0.1)',
                                boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(255,59,59,0.05)',
                                ...alignStyle
                            }}
                        >
                            {block.subtitle && (
                                <h3 style={{
                                    fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px',
                                    color: block.subtitleColor || '#ff3b3b',
                                    borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                    paddingBottom: '8px'
                                }}>
                                    {block.subtitle}
                                </h3>
                            )}
                            <div
                                className="rich-text-content"
                                dangerouslySetInnerHTML={{ __html: block.content }}
                                style={{ textAlign: alignStyle.textAlign }}
                            />
                        </div>
                    )
                }

                // Image Block (single or carousel)
                if (block.type === 'image') {
                    // Build list of images - prefer carouselImages if available, otherwise use imageSrc
                    const images = (block.carouselImages && block.carouselImages.length > 0)
                        ? block.carouselImages
                        : (block.imageSrc ? [block.imageSrc] : [])

                    // Skip rendering if no images
                    if (images.length === 0) return null

                    const currentIndex = carouselIndices[index] || 0

                    return (
                        <div
                            key={index}
                            style={{
                                margin: '32px 0',
                                width: '100%',
                                textAlign: (block.alignment as 'left' | 'center' | 'right') || 'left'
                            }}
                        >
                            {/* Image/Carousel Container */}
                            <div style={{
                                position: 'relative',
                                width: '100%'
                            }}>
                                <img
                                    src={images[currentIndex]}
                                    alt={block.caption || 'Image'}
                                    style={{
                                        width: '100%',
                                        borderRadius: '12px',
                                        display: 'block'
                                    }}
                                />

                                {/* Carousel Controls */}
                                {block.isCarousel && images.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => navigateCarousel(index, 'prev', images.length)}
                                            style={{
                                                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                                                width: '40px', height: '40px', borderRadius: '50%',
                                                background: 'rgba(0,0,0,0.6)', border: 'none',
                                                color: 'white', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button
                                            onClick={() => navigateCarousel(index, 'next', images.length)}
                                            style={{
                                                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                                width: '40px', height: '40px', borderRadius: '50%',
                                                background: 'rgba(0,0,0,0.6)', border: 'none',
                                                color: 'white', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            <ChevronRight size={20} />
                                        </button>

                                        {/* Dots */}
                                        <div style={{
                                            position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
                                            display: 'flex', gap: '6px'
                                        }}>
                                            {images.map((_: string, i: number) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        width: '8px', height: '8px', borderRadius: '50%',
                                                        background: i === currentIndex ? '#ff3b3b' : 'rgba(255,255,255,0.5)',
                                                        transition: 'background 0.2s'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Caption */}
                            {block.caption && (
                                <p style={{
                                    marginTop: '12px',
                                    color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                                    fontSize: '0.9rem',
                                    fontStyle: 'italic',
                                    textAlign: alignStyle.textAlign
                                }}>
                                    {block.caption}
                                </p>
                            )}
                        </div>
                    )
                }

                // PDF Block
                if (block.type === 'pdf' && block.pdfUrl) {
                    return (
                        <div key={index} style={{ margin: '40px 0' }}>
                            <PDFFlipbook url={block.pdfUrl} />
                        </div>
                    )
                }

                // Composite Block (Image + Text Layout)
                if (block.type === 'composite' && (block.imageUrl || block.textContent)) {
                    const layout = block.layout || 'image-left'
                    const isVertical = layout === 'image-top' || layout === 'stacked'
                    return (
                        <div
                            key={index}
                            className="composite-block-wrapper" // Added for responsive CSS
                            style={{
                                margin: '40px 0',
                                padding: '32px',
                                borderRadius: '16px',
                                background: isDark
                                    ? 'linear-gradient(135deg, rgba(255,59,59,0.08) 0%, rgba(20,20,20,0.95) 100%)'
                                    : 'linear-gradient(135deg, rgba(255,59,59,0.06) 0%, rgba(255,255,255,0.95) 100%)',
                                backdropFilter: 'blur(12px)',
                                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                display: 'grid',
                                gridTemplateColumns: isVertical ? '1fr' : '1fr 1fr',
                                gap: '32px',
                                alignItems: 'stretch'
                            }}
                        >
                            <div className="composite-block-image" style={{ order: layout === 'image-right' ? 2 : 1, position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
                                {/* Composite Carousel Logic */}
                                {(() => {
                                    const images = (block.carouselImages && block.carouselImages.length > 0
                                        ? block.carouselImages
                                        : (block.imageUrl ? [block.imageUrl] : [])
                                    )
                                    const currentIndex = carouselIndices[index] || 0

                                    return (
                                        <>
                                            <img
                                                src={images[currentIndex]}
                                                alt=""
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    minHeight: isVertical ? '300px' : '100%',
                                                    objectFit: 'cover',
                                                    display: 'block',
                                                    borderRadius: '12px'
                                                }}
                                            />
                                            {images.length > 1 && (
                                                <>
                                                    <div style={{
                                                        position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
                                                        display: 'flex', gap: '6px', zIndex: 10
                                                    }}>
                                                        {images.map((_: string, i: number) => (
                                                            <div
                                                                key={i}
                                                                style={{
                                                                    width: '6px', height: '6px', borderRadius: '50%',
                                                                    background: i === currentIndex ? '#ff3b3b' : 'rgba(255,255,255,0.5)',
                                                                    transition: 'background 0.2s',
                                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )
                                })()}
                            </div>
                            <div
                                className="composite-block-text"
                                style={{
                                    order: layout === 'image-right' ? 1 : 2,
                                    maxWidth: '100%'
                                }}
                            >
                                {block.subtitle && (
                                    <h3 style={{
                                        color: block.subtitleColor || '#ff8080',
                                        fontSize: '1.25rem',
                                        fontWeight: 600,
                                        marginBottom: '16px',
                                        marginTop: 0,
                                        textAlign: (block.alignment as 'left' | 'center' | 'right') || (layout === 'image-top' ? 'center' : 'left')
                                    }}>
                                        {block.subtitle}
                                    </h3>
                                )}
                                <div
                                    className="rich-text-content"
                                    style={{
                                        lineHeight: 1.8,
                                        fontSize: '1.1rem',
                                        textAlign: (block.alignment as 'left' | 'center' | 'right') || (layout === 'image-top' ? 'center' : 'left')
                                    }}
                                    dangerouslySetInnerHTML={{ __html: block.textContent || '' }}
                                />
                            </div>
                        </div>
                    )
                }

                // Legacy fallback
                if (block.type === 'legacy') {
                    return <div key={index} dangerouslySetInnerHTML={{ __html: block.content }} />
                }

                return null
            })}
        </>
    )
}

interface PostDetailProps {
    sectionType: 'about' | 'initiatives' | 'media' | 'leadership' | 'resources'
}

export function PostDetail({ sectionType }: PostDetailProps) {
    const { id } = useParams()
    const { isDark } = useTheme()
    const { getPostById, posts, loading } = useContent()
    const navigate = useNavigate()

    const post = id ? getPostById(id) : undefined

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    if (loading && !post) {
        return <PostSkeleton isDark={isDark} />
    }

    if (!post) {
        return (
            <div className="container" style={{ paddingTop: '120px', textAlign: 'center', color: isDark ? 'white' : 'black' }}>
                <h1>Post Not Found</h1>
                <button onClick={() => navigate(-1)} style={{ color: '#ff3b3b', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>Back</button>
            </div>
        )
    }

    // Section-specific labels and colors
    const sectionConfig = {
        about: { label: 'About', color: '#ef4444' },
        initiatives: { label: 'Initiative', color: '#e82828' },
        media: { label: 'News', color: '#3b82f6' },
        leadership: { label: 'Leader', color: '#10b981' },
        resources: { label: 'Resource', color: '#8b5cf6' }
    }

    const config = sectionConfig[sectionType]

    // Determine Hero Image validity
    // Media always shows image
    // Show hero for all posts/subsections unless it's leadership (which has own layout)
    const isSubsection = !!post.isSubsection
    const showHero = post.image && sectionType !== 'leadership'

    // Render section-specific content
    const renderContent = () => {
        switch (sectionType) {
            case 'leadership':
                return <LeadershipLayout post={post} isDark={isDark} />
            case 'media':
                return <MediaLayout post={post} isDark={isDark} />
            default:
                return <DefaultLayout post={post} isDark={isDark} sectionLabel={config.label} posts={posts} />
        }
    }

    return (
        <div style={{ paddingTop: showHero ? '0' : '100px', paddingBottom: '80px', minHeight: '100vh', background: 'transparent' }}>
            {/* Gradient Background (Global) */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    width: '100vw',
                    height: '100vh',
                    background: `radial-gradient(circle at 80% 20%, ${config.color}22 0%, transparent 50%)`,
                    zIndex: -1,
                    pointerEvents: 'none',
                }}
            />

            {/* Hero Image (Wide) */}
            {showHero && <HeroCarousel post={post} />}

            <div className="container" style={{
                maxWidth: isSubsection ? '100%' : '900px',
                paddingLeft: isSubsection ? '4%' : '24px',
                paddingRight: isSubsection ? '4%' : '24px',
                position: 'relative',
                zIndex: 2,
                margin: '0 auto'
            }}>
                {/* Back button removed */}

                {renderContent()}
            </div>
        </div>
    )
}

// --- Hero Carousel Component ---
function HeroCarousel({ post }: { post: any }) {
    const [heroIndex, setHeroIndex] = useState(0)

    // Parse images
    const heroImages = useMemo(() => {
        if (!post?.image) return []
        try {
            const parsed = JSON.parse(post.image)
            return Array.isArray(parsed) ? parsed : [post.image]
        } catch {
            return [post.image]
        }
    }, [post?.image])

    // Auto-play
    useEffect(() => {
        if (heroImages.length <= 1) return
        const interval = setInterval(() => {
            setHeroIndex(current => (current + 1) % heroImages.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [heroImages.length])

    if (heroImages.length === 0) return null

    return (
        <div style={{
            width: '100%',
            height: '45vh',
            minHeight: '350px',
            maxHeight: '480px',
            position: 'relative',
            marginBottom: '0',
            overflow: 'hidden',
            maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
        }}>
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 100%)',
                zIndex: 1
            }} />

            <img
                src={heroImages[heroIndex]}
                alt={post.title}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center 20%',
                    transition: 'opacity 0.5s ease-in-out'
                }}
            />

            {/* Controls */}
            {heroImages.length > 1 && (
                <>
                    <button
                        onClick={() => setHeroIndex(prev => (prev - 1 + heroImages.length) % heroImages.length)}
                        style={{
                            position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)',
                            zIndex: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                            width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={() => setHeroIndex(prev => (prev + 1) % heroImages.length)}
                        style={{
                            position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
                            zIndex: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                            width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <ChevronRight size={24} />
                    </button>

                    <div style={{
                        position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
                        zIndex: 10, display: 'flex', gap: '8px'
                    }}>
                        {heroImages.map((_, idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: idx === heroIndex ? '#ff3b3b' : 'rgba(255,255,255,0.5)',
                                    transition: 'all 0.3s'
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

// --- Read Article Button (ResponsiveVoice TTS) ---
declare global {
    interface Window {
        responsiveVoice: {
            speak: (text: string, voice?: string, options?: any) => void;
            cancel: () => void;
            isPlaying: () => boolean;
        };
    }
}

function ReadArticleButton({ post, isDark }: { post: any; isDark: boolean }) {
    const [isPlaying, setIsPlaying] = useState(false)

    const extractTextFromPost = () => {
        // Extract text from title, subtitle, and content
        let text = post.title + '. '
        if (post.subtitle) text += post.subtitle + '. '

        // Parse HTML content to extract plain text
        if (post.content) {
            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = post.content
            text += tempDiv.textContent || ''
        }

        return text
    }

    const fullText = useMemo(() => extractTextFromPost(), [post])

    const handleToggle = () => {
        if (!window.responsiveVoice) {
            alert('Text-to-speech is not available. Please refresh the page.')
            return
        }

        if (isPlaying) {
            window.responsiveVoice.cancel()
            setIsPlaying(false)
        } else {
            window.responsiveVoice.speak(fullText, 'UK English Male', {
                onend: () => {
                    setIsPlaying(false)
                },
                onerror: () => {
                    setIsPlaying(false)
                }
            })
            setIsPlaying(true)
        }
    }

    // Cleanup: Stop TTS when navigating away or tab visibility changes
    useEffect(() => {
        const stopAudio = () => {
            if (window.responsiveVoice) {
                window.responsiveVoice.cancel()
            }
            setIsPlaying(false)
        }

        // Stop on tab hidden
        const handleVisibilityChange = () => {
            if (document.hidden) stopAudio()
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Stop on unmount (navigation away)
        return () => {
            stopAudio()
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [])



    // Generate random bar heights for waveform visualization
    const barHeights = useMemo(() =>
        Array.from({ length: 60 }, () => 0.2 + Math.random() * 0.8)
        , [])

    const [isHovered, setIsHovered] = useState(false)

    return (
        <div
            style={{
                marginBottom: '32px',
                borderRadius: '16px',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                overflow: 'hidden',
                width: '100%',
                // maxWidth removed to fill content
                transition: 'all 0.3s ease',
                transform: isHovered ? 'translateY(-2px)' : 'none',
                boxShadow: isHovered ? '0 8px 30px rgba(0,0,0,0.15)' : 'none'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'
                }}>
                    🎧 Listen to this article
                </span>
                <span style={{
                    fontSize: '0.65rem',
                    color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'
                }}>
                    Text-to-Speech
                </span>
            </div>

            {/* Player Controls */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '16px 20px'
            }}>
                {/* Play/Stop Button */}
                <button
                    onClick={handleToggle}
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: isPlaying
                            ? 'linear-gradient(135deg, #ff3b3b 0%, #ff6b6b 100%)'
                            : (isDark ? '#fff' : '#222'),
                        color: isPlaying ? 'white' : (isDark ? '#000' : '#fff'),
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                        boxShadow: isPlaying
                            ? '0 4px 20px rgba(255,59,59,0.5)'
                            : '0 2px 10px rgba(0,0,0,0.1)'
                    }}
                    title={isPlaying ? 'Stop reading' : 'Start reading'}
                >
                    {isPlaying ? <VolumeX size={22} /> : <Volume2 size={22} />}
                </button>

                {/* Waveform (Centered & Clean) */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        height: '28px',
                        opacity: 1,
                        maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)'
                    }}>
                        {barHeights.map((height, i) => (
                            <div
                                key={i}
                                style={{
                                    width: '3px', // Thin bars
                                    height: `${(0.3 + height * 0.7) * 100}%`,
                                    borderRadius: '10px',
                                    background: isPlaying
                                        ? `linear-gradient(to top, #ff3b3b, #ff8080)`
                                        : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
                                    animation: isPlaying ? `waveformPulse 0.5s ease-in-out ${i * 0.05}s infinite alternate` : 'none',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Animation Keyframes */}
            <style>{`
                @keyframes waveformPulse {
                    0% { transform: scaleY(0.3); }
                    100% { transform: scaleY(1); }
                }
            `}</style>
        </div>
    )
}

// Default layout for About and Initiatives
function DefaultLayout({ post, isDark, posts = [] }: { post: any; isDark: boolean; sectionLabel?: string; posts?: any[] }) {
    // Simplified layout for subsection child posts (has parentId)
    const isSubsectionChild = !!post.parentId
    // Check if this post IS a subsection (parent with children)
    const isSubsection = !!post.isSubsection

    // Filter children for this subsection
    const childPosts = posts.filter(p => p.parentId === post.id)

    if (isSubsectionChild) {
        return (
            <>
                <h1 style={{
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    fontWeight: 700,
                    color: isDark ? '#ffffff' : '#111111',
                    marginBottom: '16px',
                    lineHeight: 1.1
                }}>
                    {post.title}
                </h1>

                {/* Audio Player - Only show if enabled */}
                {post.enableAudio && <ReadArticleButton post={post} isDark={isDark} />}

                {/* PDF Flipbook (main content for subsection posts) */}
                {post.pdfUrl && (
                    <div style={{ marginBottom: '40px' }}>
                        <PDFFlipbook url={post.pdfUrl} />
                    </div>
                )}

                {/* Content */}
                {post.content && (
                    <div
                        className="post-content"
                        style={{
                            color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)',
                            fontSize: '1.1rem',
                            lineHeight: 1.8
                        }}
                    >
                        <ContentBlockRenderer content={post.content} isDark={isDark} />
                    </div>
                )}
            </>
        )
    }

    // Regular full layout for top-level posts
    return (
        <>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                <h1 style={{
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    fontWeight: 700,
                    color: isDark ? '#ffffff' : '#111111',
                    marginBottom: '16px',
                    lineHeight: 1.1,
                    textAlign: 'center'
                }}>
                    {post.title}
                </h1>

                {/* Read Article Button - Only show for non-subsection posts with audio enabled */}
                {!isSubsection && post.enableAudio && <ReadArticleButton post={post} isDark={isDark} />}

                {/* PDF Flipbook (if PDF attached AND not embedded in content) */}
                {post.pdfUrl && !post.content?.includes('block-pdf') && (
                    <div style={{ marginBottom: '40px' }}>
                        <PDFFlipbook url={post.pdfUrl} />
                    </div>
                )}

                {/* Content */}
                {post.content && (
                    <div
                        className="post-content"
                        style={{
                            color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)',
                            fontSize: '1.1rem',
                            lineHeight: 1.8
                        }}
                    >
                        <ContentBlockRenderer content={post.content} isDark={isDark} />
                    </div>
                )}
            </div>

            {/* Child Cards Grid for Subsection Posts */}
            {isSubsection && childPosts.length > 0 && (
                <div style={{ marginTop: '64px', width: '100%' }}>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '24px',
                        justifyContent: 'flex-start'
                    }}>
                        {childPosts.map(child => (
                            <SectionCard
                                key={child.id}
                                label=""
                                labelColor="#ff3b3b"
                                title={child.title}
                                subtitle={child.subtitle || ''}
                                description=""
                                publishedDate={child.createdAt}
                                image={child.image}


                                onClick={() => {
                                    // Map sectionId to correct route path
                                    const routeMap: Record<string, string> = {
                                        'about': 'about-us',
                                        'initiatives': 'initiative',
                                        'media': 'media',
                                        'leadership': 'leader'
                                    }
                                    const routePath = routeMap[post.sectionId] || 'about-us'
                                    window.location.href = `/${routePath}/${child.id}`
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .post-content h1, .post-content h2 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin-top: 40px;
                    margin-bottom: 16px;
                    color: ${isDark ? '#ffffff' : '#111111'};
                }
                .post-content h3 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin-top: 32px;
                    margin-bottom: 16px;
                    color: ${isDark ? '#ffffff' : '#111111'};
                }
                .post-content p {
                    margin-bottom: 24px;
                }
                .post-content ul, .post-content ol {
                    margin-bottom: 24px;
                    padding-left: 24px;
                }
                .post-content li {
                    margin-bottom: 8px;
                }
                /* Removed forced red color on strong - let inline styles win */
                .post-content strong {
                    font-weight: 700;
                }
            `}</style>
        </>
    )
}

// Leadership-specific layout (profile style)
function LeadershipLayout({ post, isDark }: { post: any; isDark: boolean }) {
    return (
        <div style={{
            padding: '40px',
            borderRadius: '24px',
            background: isDark
                ? 'linear-gradient(135deg, rgba(255,59,59,0.08) 0%, rgba(20,20,20,0.95) 100%)'
                : 'linear-gradient(135deg, rgba(255,59,59,0.06) 0%, rgba(255,255,255,0.95) 100%)',
            backdropFilter: 'blur(12px)',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
            // Enhanced shadow for "gradient under card" effect
            boxShadow: isDark
                ? '0 30px 80px -20px rgba(255, 59, 59, 0.15), 0 0 0 1px rgba(255,255,255,0.05)'
                : '0 20px 40px -10px rgba(0,0,0,0.1)',
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'row',
            gap: '48px',
            alignItems: 'flex-start',
            flexWrap: 'wrap'
        }}>
            {/* Left Column: Profile */}
            <div style={{
                flexShrink: 0,
                width: '320px',
                maxWidth: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                alignItems: 'center',
                textAlign: 'center'
            }}>
                {/* Photo */}
                {post.image && (
                    <div
                        style={{
                            width: '100%',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
                            aspectRatio: '3/4'
                        }}
                    >
                        <img
                            src={post.image}
                            alt={post.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                )}

                {/* Name & Position */}
                <div>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        color: isDark ? '#ffffff' : '#111111',
                        margin: '0 0 8px 0',
                        lineHeight: 1.1
                    }}>
                        {post.title}
                    </h1>

                    {post.subtitle && (
                        <p style={{
                            fontSize: '0.9rem',
                            color: '#ff3b3b',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            margin: 0
                        }}>
                            {post.subtitle}
                        </p>
                    )}

                    {/* Social Icons */}
                    {(post.email || post.instagram) && (
                        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', justifyContent: 'center' }}>
                            {post.email && (
                                <a href={`mailto:${post.email}`} style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', transition: 'color 0.2s' }} className="hover:text-[#ff3b3b]">
                                    <Mail size={20} />
                                </a>
                            )}
                            {post.instagram && (
                                <a
                                    href={post.instagram.startsWith('http') ? post.instagram : `https://instagram.com/${post.instagram.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', transition: 'color 0.2s' }}
                                    className="hover:text-[#ff3b3b]"
                                >
                                    <Instagram size={20} />
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Bio Content */}
            <div style={{ flex: 1, minWidth: '300px' }}>
                {post.content && (
                    <div
                        className="leader-bio"
                        style={{
                            color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)',
                            fontSize: '1.1rem',
                            lineHeight: 1.8,
                            textAlign: 'left'
                        }}
                    >
                        {/* We use ContentBlockRenderer but cheat by overriding styles via CSS if needed, 
                            or simpler: Just render the content directly if it's text. 
                            Given the user wants a single card, forcing ContentBlockRenderer (which has its own cards) is bad.
                            I'll basically unwind the renderer for this specific view to just be the content.
                         */}
                        <div dangerouslySetInnerHTML={{ __html: post.content }} />
                    </div>
                )}
            </div>
        </div>
    )
}

// Media/News-specific layout
function MediaLayout({ post, isDark }: { post: any; isDark: boolean }) {
    const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    return (
        <>
            {/* News Badge */}
            <div style={{ marginBottom: '16px' }}>
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 16px',
                        background: '#3b82f6',
                        borderRadius: '100px',
                    }}
                >
                    <span
                        style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#ffffff',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    >
                        News
                    </span>
                </div>
            </div>

            <h1 style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 700,
                color: isDark ? '#ffffff' : '#111111',
                marginBottom: '16px',
                lineHeight: 1.2
            }}>
                {post.title}
            </h1>

            {/* Meta info */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                marginBottom: '32px',
                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                fontSize: '0.9rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} />
                    {formattedDate}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} />
                    SIO Delhi
                </div>
            </div>

            {/* Cover Image moved to Hero */}

            {/* Article Content */}
            {post.content && (
                <article
                    className="news-content"
                    style={{
                        color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)',
                        fontSize: '1.15rem',
                        lineHeight: 1.9
                    }}
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />
            )}

            <style>{`
                .news-content h1, .news-content h2 {
                    font-size: 1.6rem;
                    font-weight: 700;
                    margin-top: 40px;
                    margin-bottom: 16px;
                    color: ${isDark ? '#ffffff' : '#111111'};
                }
                .news-content p {
                    margin-bottom: 24px;
                }
                .news-content blockquote {
                    border-left: 4px solid #3b82f6;
                    padding-left: 20px;
                    margin: 32px 0;
                    font-style: italic;
                    color: ${isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'};
                }
            `}</style>
        </>
    )
}
