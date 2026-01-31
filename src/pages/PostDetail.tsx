import { useParams, useNavigate } from 'react-router-dom'
import { API_BASE } from '../lib/api'
import { useContent } from '../context/ContentContext'
import { useTheme } from '../context/ThemeContext'
import { Calendar, User, ChevronLeft, ChevronRight, Volume2, VolumeX, Mail, Instagram } from 'lucide-react'
import React, { useEffect, useState, useMemo } from 'react'
import { PDFFlipbook } from '../components/ui/PDFFlipbook'
import { SectionCard } from '../components/ui/SectionCard'
import { PostSkeleton } from '../components/ui/PostSkeleton'
import { ViewGalleryButton } from '../components/ui/ViewGalleryButton'
import { EmbeddableGallery } from '../components/ui/EmbeddableGallery'
import { PDFPreviewCard } from '../components/ui/PDFPreviewCard'
import { PDFModal } from '../components/ui/PDFModal'

// --- Helper: Detect RTL Text (Urdu/Arabic) ---
const isRtl = (text: string) => {
    if (!text) return false;
    // Range includes Arabic, Persian, Urdu, etc.
    // \u0600-\u06FF: Arabic
    // \u0750-\u077F: Arabic Supplement
    // \u08A0-\u08FF: Arabic Extended-A
    // \uFB50-\uFDFF: Arabic Presentation Forms-A
    // \uFE70-\uFEFF: Arabic Presentation Forms-B
    const rtlRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return rtlRegex.test(text);
};
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
    // Video block pre-calc
    videoSrc?: string

}

// Memoized Video Block to prevent re-renders (looping/refreshing issues)
const VideoBlock = React.memo(({ src, subtitle, subtitleColor, text, isDark }: { src: string, subtitle?: string, subtitleColor?: string, text?: string, isDark: boolean }) => {
    // Detect platform from embed URL
    const isInstagram = src.includes('instagram.com')
    const isFacebook = src.includes('facebook.com')

    // Load Instagram embed script when needed
    useEffect(() => {
        if (isInstagram) {
            // Load Instagram embed.js if not already loaded
            if (!document.querySelector('script[src*="instagram.com/embed.js"]')) {
                const script = document.createElement('script')
                script.src = 'https://www.instagram.com/embed.js'
                script.async = true
                document.body.appendChild(script)
            } else {
                // Re-process embeds if script already exists
                // @ts-ignore
                if (window.instgrm?.Embeds?.process) {
                    // @ts-ignore
                    window.instgrm.Embeds.process()
                }
            }
        }

        if (isFacebook) {
            // Load Facebook SDK if not already loaded
            if (!document.querySelector('script[src*="connect.facebook.net"]')) {
                const script = document.createElement('script')
                script.src = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0'
                script.async = true
                script.defer = true
                script.crossOrigin = 'anonymous'
                document.body.appendChild(script)
            } else {
                // Re-parse FB embeds
                // @ts-ignore
                if (window.FB?.XFBML?.parse) {
                    // @ts-ignore
                    window.FB.XFBML.parse()
                }
            }
        }
    }, [isInstagram, isFacebook, src])

    // For Instagram - extract post ID and use blockquote embed
    const getInstagramPostId = (url: string) => {
        const match = url.match(/instagram\.com\/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/)
        return match ? match[1] : null
    }

    // Render different content based on platform
    const renderEmbed = () => {
        if (isInstagram) {
            const postId = getInstagramPostId(src)
            if (postId) {
                return (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            minHeight: '450px'
                        }}
                        dangerouslySetInnerHTML={{
                            __html: `
                                <blockquote 
                                    class="instagram-media" 
                                    data-instgrm-permalink="https://www.instagram.com/p/${postId}/"
                                    data-instgrm-version="14"
                                    style="background:#FFF; border:0; border-radius:12px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 0 auto; max-width:540px; min-width:326px; padding:0; width:calc(100% - 2px);">
                                </blockquote>
                            `
                        }}
                    />
                )
            }
        }

        if (isFacebook) {
            // Decode the URL from the plugins/video.php format
            const decodedUrl = decodeURIComponent(src.replace('https://www.facebook.com/plugins/video.php?href=', '').split('&')[0])
            return (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        minHeight: '300px'
                    }}
                    dangerouslySetInnerHTML={{
                        __html: `
                            <div class="fb-video" 
                                data-href="${decodedUrl}" 
                                data-width="500" 
                                data-show-text="false">
                            </div>
                        `
                    }}
                />
            )
        }

        // YouTube, Vimeo, and other iframes
        return (
            <div style={{
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                width: '100%',
                height: 0,
                paddingBottom: '56.25%',
                background: '#000'
            }}>
                <iframe
                    src={src}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                />
            </div>
        )
    }

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

            <div style={{ marginBottom: text ? '16px' : '0' }}>
                {renderEmbed()}
            </div>

            {text && (
                <p style={{
                    margin: 0,
                    color: isDark ? '#fdedcb' : 'rgba(0,0,0,0.85)',
                    fontSize: '1.1rem',
                    lineHeight: 1.6
                }}>
                    {text}
                </p>
            )}
        </div>
    )
})


// Self-contained Carousel Component via props
const CarouselBlock = React.memo(({ images, containerStyle, imageStyle }: { images: string[], containerStyle?: any, imageStyle?: any }) => {
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        if (images.length <= 1) return
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % images.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [images.length])

    const goNext = () => setCurrentIndex(prev => (prev + 1) % images.length)
    const goPrev = () => setCurrentIndex(prev => (prev - 1 + images.length) % images.length)

    const currentImage = images[currentIndex]

    return (
        <div style={{ position: 'relative', width: '100%', ...containerStyle }} className="group">
            <img
                src={currentImage}
                alt="Carousel Slide"
                style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    transition: 'opacity 0.5s ease-in-out',
                    ...imageStyle
                }}
            />
            {images.length > 1 && (
                <>
                    {/* Navigation Buttons */}
                    <button
                        onClick={(e) => { e.stopPropagation(); goPrev(); }}
                        style={{
                            position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)',
                            zIndex: 20, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none',
                            width: '36px', height: '36px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            opacity: 0, transition: 'opacity 0.2s'
                        }}
                        className="carousel-nav-btn"
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); goNext(); }}
                        style={{
                            position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)',
                            zIndex: 20, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none',
                            width: '36px', height: '36px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            opacity: 0, transition: 'opacity 0.2s'
                        }}
                        className="carousel-nav-btn"
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                    >
                        <ChevronRight size={20} />
                    </button>

                    {/* Dots */}
                    <div style={{
                        position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
                        display: 'flex', gap: '6px', zIndex: 10
                    }}>
                        {images.map((_: string, i: number) => (
                            <div
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                                style={{
                                    width: '6px', height: '6px', borderRadius: '50%',
                                    background: i === currentIndex ? '#ff3b3b' : 'rgba(255,255,255,0.5)',
                                    transition: 'background 0.2s',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                    cursor: 'pointer'
                                }}
                            />
                        ))}
                    </div>

                    <style>{`
                        .group:hover .carousel-nav-btn {
                            opacity: 1 !important;
                        }
                    `}</style>
                </>
            )}
        </div>
    )
})

// PDF Block Rendering Logic component to keep state separate
const PDFBlockRenderer = ({ url, onOpen }: { url: string, onOpen: (url: string) => void }) => {
    return (
        <div style={{ margin: '40px 0' }}>
            <PDFPreviewCard url={url} onClick={() => onOpen(url)} />
        </div>
    )
}

function ContentBlockRenderer({ content, isDark }: { content: string; isDark: boolean }) {
    // State for PDF Modal
    const [activePdf, setActivePdf] = useState<string | null>(null)
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


            // Pre-calculate video src if needed
            let videoSrc = ''
            if (isVideo) {
                // Parse video src from the block content immediately
                // We use a temporary div scope just for this element's content
                const vidTemp = document.createElement('div')
                vidTemp.innerHTML = el.innerHTML
                videoSrc = vidTemp.querySelector('iframe')?.src || ''
            }

            return {
                type: blockType,
                content: isPdf || isComposite ? '' : el.innerHTML,
                pdfUrl: decodeURIComponent(el.getAttribute('data-pdf-url') || ''),
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
                textContent: decodeURIComponent(el.getAttribute('data-text-content') || ''),

                videoSrc,

            }
        })
    }, [content])

    return (
        <>
            {blocks.map((block, index) => {
                // Detect RTL for text-based blocks
                const isTextRtl = (block.type === 'text' || block.type === 'legacy') ? isRtl(block.content) : false;

                const alignStyle = {
                    textAlign: (block.alignment as 'left' | 'center' | 'right') || (isTextRtl ? 'right' : 'left'),
                    justifyContent: block.alignment === 'center' ? 'center' : ((block.alignment === 'right' || isTextRtl) ? 'flex-end' : 'flex-start'),
                    direction: (isTextRtl ? 'rtl' : 'ltr') as 'rtl' | 'ltr'
                }

                // Text Block (and Legacy)
                if (block.type === 'text' || block.type === 'legacy') {
                    // Check if content is just a raw URL or contains link tags?
                    // Tiptap outputs <a> tags. We need to ensure they are styled.
                    // We can add a global style or a scoped style.

                    return (
                        <div key={index} className="siodel-block block-text" style={{
                            marginBottom: '24px',
                            ...alignStyle
                        }}>
                            {/* Style for links within this block */}
                            <style>{`
                                .siodel-block a {
                                    color: ${isDark ? '#ff8080' : '#d93025'};
                                    text-decoration: underline;
                                    text-underline-offset: 4px;
                                }
                                .siodel-block a:hover {
                                    opacity: 0.8;
                                }
                            `}</style>
                            {block.subtitle && (
                                <h3 style={{
                                    color: block.subtitleColor || '#ff3b3b',
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                    margin: '0 0 12px 0'
                                }}>
                                    {block.subtitle}
                                </h3>
                            )}
                            <div
                                style={{
                                    fontSize: '1.1rem',
                                    lineHeight: 1.8,
                                    color: isDark ? '#eee' : '#333'
                                }}
                                dangerouslySetInnerHTML={{ __html: block.content }}
                            />
                        </div>
                    )
                }
                // Video Block
                if (block.type === 'video') {
                    // Smart Duplicate Title Check
                    // We removed internalDuplicate check because block.content might contain the title 
                    // (saved by editor) but we don't render block.content, so we shouldn't fallback/hide based on it.

                    // Check PREVIOUS block for duplication (Strict Header Match)
                    let previousBlockDuplicate = false
                    if (index > 0) {
                        const prevBlock = blocks[index - 1]
                        if (prevBlock.type === 'text' || prevBlock.type === 'legacy') {
                            const temp = document.createElement('div')
                            temp.innerHTML = prevBlock.content
                            const prevText = temp.textContent?.trim().toLowerCase() || ''
                            const currentTitle = block.subtitle.trim().toLowerCase()

                            // Only hide if the previous block IS exactly the title (acting as a header)
                            // ignoring common punctuation like colons
                            const cleanPrev = prevText.replace(/[:\s]+$/, '')
                            if (cleanPrev && currentTitle && cleanPrev === currentTitle) {
                                previousBlockDuplicate = true
                            }
                        }
                    }

                    const displaySubtitle = previousBlockDuplicate ? undefined : block.subtitle

                    return (
                        <VideoBlock
                            key={`video-${index}`} // Explicit string key
                            src={block.videoSrc || ''}
                            subtitle={displaySubtitle}
                            subtitleColor={block.subtitleColor}
                            text={block.textContent}
                            isDark={isDark}
                        />
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

                    // For single image or carousel, use CarouselBlock for consistency
                    // OR just render single image simply if performant.
                    // Let's use CarouselBlock but styled to look native.

                    return (
                        <div
                            key={index}
                            style={{
                                margin: '32px 0',
                                width: '100%',
                                textAlign: (block.alignment as 'left' | 'center' | 'right') || 'left'
                            }}
                        >
                            {/* Use CarouselBlock for both single and multiple to simplify logic */}
                            <CarouselBlock
                                images={images}
                                containerStyle={{
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                                    maxWidth: '100%'
                                }}
                            />
                            {block.caption && (
                                <p style={{
                                    marginTop: '12px',
                                    color: isDark ? '#fdedcb' : 'rgba(0,0,0,0.5)',
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
                    const fullPdfUrl = block.pdfUrl.startsWith('http')
                        ? block.pdfUrl
                        : `${API_BASE}/uploads/pdfs/${block.pdfUrl}`

                    return (
                        <div key={index}>
                            <PDFBlockRenderer url={fullPdfUrl} onOpen={setActivePdf} />
                        </div>
                    )
                }

                // Composite Block (Image + Text Layout)
                if (block.type === 'composite' && (block.imageUrl || block.textContent)) {
                    const layout = block.layout || 'image-left'
                    const isVertical = layout === 'image-top' || layout === 'stacked'
                    const images = (block.carouselImages && block.carouselImages.length > 0
                        ? block.carouselImages
                        : (block.imageUrl ? [block.imageUrl] : [])
                    )

                    return (
                        <div
                            key={index}

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
                            className={`composite-block-wrapper ${isVertical ? "composite-block-vertical" : "composite-block-grid"}`}
                        >
                            <div className="composite-block-image" style={{ order: layout === 'image-right' ? 2 : 1, position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
                                <CarouselBlock
                                    images={images}
                                    containerStyle={{ height: '100%', minHeight: isVertical ? '300px' : '100%' }}
                                    imageStyle={{ height: '100%', objectFit: 'cover' }}
                                />
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
                                        fontSize: '1.1rem',
                                        lineHeight: 1.6,
                                        textAlign: (block.alignment as 'left' | 'center' | 'right') || (layout === 'image-top' ? 'center' : 'left')
                                    }}
                                    dangerouslySetInnerHTML={{ __html: block.textContent || '' }}
                                />
                            </div>
                        </div>
                    )
                }



                return null
            })}

            {/* Global PDF Modal for this renderer */}
            <PDFModal isOpen={!!activePdf} onClose={() => setActivePdf(null)}>
                {activePdf && <PDFFlipbook url={activePdf} />}
            </PDFModal>
        </>
    )
}

interface PostDetailProps {
    sectionType: 'about' | 'initiatives' | 'media' | 'leadership' | 'resources' | 'dynamic'
}



export function PostDetail({ sectionType }: PostDetailProps) {
    const { id, sectionId } = useParams()
    const { isDark } = useTheme()
    const { getPostById, posts, loading, sections } = useContent()
    const navigate = useNavigate()

    const post = id ? getPostById(id) : undefined

    // Scroll to top on mount
    // Scroll to top on mount and ID change
    useEffect(() => {
        // Handle Lenis smooth scroll if active
        // @ts-ignore
        if (window.lenis) {
            // @ts-ignore
            window.lenis.scrollTo(0, { immediate: true })
        } else {
            window.scrollTo(0, 0)
        }
    }, [id])

    // Early returns MUST come after all hooks are called
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

    // Dynamic Section Config Logic
    let currentLabel = 'Section'
    let currentColor = '#ff3b3b'

    if (sectionType === 'dynamic' && sectionId) {
        const dynamicSection = sections.find(s => s.id === sectionId)
        if (dynamicSection) {
            currentLabel = dynamicSection.label
            // Hashing color based on label or ID for consistency? Or just default red.
            currentColor = '#ff3b3b'
        }
    } else {
        const sectionConfig: Record<string, { label: string, color: string }> = {
            about: { label: 'About', color: '#ef4444' },
            initiatives: { label: 'Initiative', color: '#e82828' },
            media: { label: 'News', color: '#3b82f6' },
            leadership: { label: 'Leader', color: '#10b981' },
            resources: { label: 'Resource', color: '#8b5cf6' }
        }
        const config = sectionConfig[sectionType]
        if (config) {
            currentLabel = config.label
            currentColor = config.color
        }
    }

    // Resolve layout template
    let layoutType = 'standard'

    if (sectionType === 'dynamic' && sectionId) {
        const dynamicSection = sections.find(s => s.id === sectionId)
        if (dynamicSection?.template) {
            layoutType = dynamicSection.template
        }
    } else {
        // Map hardcoded routes to templates
        if (sectionType === 'leadership') layoutType = 'leadership'
        else if (sectionType === 'media') layoutType = 'media'
        else if (sectionType === 'resources') layoutType = 'resource'
        // 'about' and 'initiatives' stay 'standard'
    }

    // Determine Hero Image validity
    // Media always shows image
    // Show hero for all posts/subsections unless it's leadership (which has own layout)
    const isSubsection = !!post.isSubsection
    const showHero = post.image && layoutType !== 'leadership'

    const hasGallery = post.galleryImages && post.galleryImages.length > 0

    // Build gallery URL based on current route
    const galleryUrl = (() => {
        if (sectionType === 'dynamic' && sectionId) {
            return `/section/${sectionId}/${id}/gallery`
        }
        const sectionPaths: Record<string, string> = {
            about: 'about-us',
            initiatives: 'initiative',
            media: 'media',
            leadership: 'leader',
            resources: 'resource'
        }
        return `/${sectionPaths[sectionType] || sectionType}/${id}/gallery`
    })()

    // Render section-specific content
    const renderContent = () => {
        switch (layoutType) {
            case 'leadership':
                return <LeadershipLayout post={post} isDark={isDark} galleryUrl={galleryUrl} hasGallery={hasGallery} />
            case 'media':
                return <MediaLayout post={post} isDark={isDark} galleryUrl={galleryUrl} hasGallery={hasGallery} />
            default:
                return <DefaultLayout post={post} isDark={isDark} sectionLabel={currentLabel} posts={posts} galleryUrl={galleryUrl} hasGallery={hasGallery} />
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
                    background: `radial-gradient(circle at 80% 20%, ${currentColor}22 0%, transparent 50%)`,
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
                            zIndex: 10, background: 'rgba(0,0,0,0.5)', color: '#fdedcb', border: '1px solid rgba(255,255,255,0.2)',
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
                            zIndex: 10, background: 'rgba(0,0,0,0.5)', color: '#fdedcb', border: '1px solid rgba(255,255,255,0.2)',
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
                            : (isDark ? '#fdedcb' : '#222'),
                        color: isPlaying ? '#fdedcb' : (isDark ? '#000' : '#fdedcb'),
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
function DefaultLayout({ post, isDark, posts = [], galleryUrl, hasGallery }: { post: any; isDark: boolean; sectionLabel?: string; posts?: any[], galleryUrl?: string, hasGallery?: boolean }) {

    // Simplified layout for subsection child posts (has parentId)
    const isSubsectionChild = !!post.parentId
    // Check if this post IS a subsection (parent with children)
    const isSubsection = !!post.isSubsection

    // Filter children for this subsection
    // Filter children for this subsection and sort by order
    const childPosts = posts
        .filter(p => p.parentId === post.id)
        .sort((a, b) => {
            const orderA = (a.order !== undefined && a.order !== null) ? a.order : Number.MAX_SAFE_INTEGER
            const orderB = (b.order !== undefined && b.order !== null) ? b.order : Number.MAX_SAFE_INTEGER
            return orderA - orderB
        })

    if (isSubsectionChild) {
        return (
            <>
                <h1 className={`${isRtl(post.title || '') ? 'font-urdu' : ''}`} style={{
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    fontWeight: 700,
                    color: isDark ? '#efc676' : '#111111',
                    marginBottom: '16px',
                    lineHeight: 1.1,
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                    textAlign: isRtl(post.title || '') ? 'right' : 'left',
                    direction: isRtl(post.title || '') ? 'rtl' : 'ltr'
                }}>
                    {post.title}
                </h1>

                {/* Audio Player - Only show if enabled */}
                {post.enableAudio && <ReadArticleButton post={post} isDark={isDark} />}

                {/* Custom Gallery Component for Subsections */}
                {hasGallery && (
                    <>
                        {post.layout === 'gallery' ? (
                            <EmbeddableGallery imagesRaw={post.galleryImages} isDark={isDark} />
                        ) : galleryUrl && (
                            <div style={{ marginBottom: '24px' }}>
                                <ViewGalleryButton to={galleryUrl} isDark={isDark} variant="outline" />
                            </div>
                        )}
                    </>
                )}

                {/* PDF Flipbook (main content for subsection posts) */}
                {/* STRICT CHECK: If content uses new block system (siodel-block) OR explicitly has a PDF block (block-pdf), we assume PDF is managed content. */}
                {post.pdfUrl &&
                    !post.content?.toLowerCase().includes('siodel-block') &&
                    !post.content?.toLowerCase().includes('block-pdf') && (
                        <div style={{ marginBottom: '40px' }}>
                            <PDFFlipbook url={post.pdfUrl} />
                        </div>
                    )}

                {/* Content */}
                {post.content && (
                    <div
                        className="post-content"
                        style={{
                            color: isDark ? '#fdedcb' : 'rgba(0,0,0,0.7)',
                            fontSize: '1.1rem',
                            lineHeight: 1.4
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
                <h1 className={`${isRtl(post.title || '') ? 'font-urdu' : ''}`} style={{
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    fontWeight: 700,
                    color: isDark ? '#efc676' : '#111111',
                    marginBottom: '16px',
                    lineHeight: 1.1,
                    textAlign: 'center',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                    maxWidth: '100%',
                    direction: isRtl(post.title || '') ? 'rtl' : 'ltr'
                }}>
                    {post.title}
                </h1>

                {/* Gallery Description (for gallery layout) - only plain text, not block markup */}
                {post.layout === 'gallery' && post.content && !post.content.includes('siodel-block') && (
                    <div style={{
                        background: isDark
                            ? 'linear-gradient(145deg, rgba(18,18,21,0.9), rgba(13,13,16,0.9))'
                            : 'rgba(255,255,255,0.8)',
                        border: `1px solid ${isDark ? '#27272a' : '#e4e4e7'}`,
                        borderBottom: `2px solid ${isDark ? 'rgba(255,59,59,0.4)' : 'rgba(255,59,59,0.3)'}`,
                        borderRadius: '16px',
                        padding: 'clamp(24px, 4vw, 40px)',
                        maxWidth: '800px',
                        margin: '0 auto 32px',
                        position: 'relative' as const,
                        overflow: 'hidden'
                    }}>
                        {/* Red gradient accent at bottom */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '60px',
                            background: 'linear-gradient(to top, rgba(255,59,59,0.08), transparent)',
                            pointerEvents: 'none'
                        }} />
                        <p style={{
                            color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
                            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                            lineHeight: 1.7,
                            margin: 0,
                            whiteSpace: 'pre-line',
                            position: 'relative' as const
                        }}>
                            {post.content}
                        </p>
                    </div>
                )}



                {/* Non-gallery display (View Gallery button) */}
                {hasGallery && post.layout !== 'gallery' && galleryUrl && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                        <ViewGalleryButton to={galleryUrl} isDark={isDark} variant="default" />
                    </div>
                )}

                {/* Read Article Button - Only show for non-subsection posts with audio enabled */}
                {!isSubsection && post.enableAudio && <ReadArticleButton post={post} isDark={isDark} />}

                {/* PDF Flipbook (if PDF attached AND not embedded in content) */}
                {/* STRICT CHECK: If content uses new block system (siodel-block) OR explicitly has a PDF block (block-pdf), we assume PDF is managed content. */}
                {post.pdfUrl &&
                    !post.content?.toLowerCase().includes('siodel-block') &&
                    !post.content?.toLowerCase().includes('block-pdf') && (
                        <div style={{ marginBottom: '40px' }}>
                            <PDFFlipbook url={post.pdfUrl} />
                        </div>
                    )}

                {/* Content (only if NOT gallery layout) */}
                {post.content && post.layout !== 'gallery' && (
                    <div
                        className="post-content"
                        style={{
                            color: isDark ? '#fdedcb' : 'rgba(0,0,0,0.7)',
                            fontSize: '1.1rem',
                            lineHeight: 1.4
                        }}
                    >
                        <ContentBlockRenderer content={post.content} isDark={isDark} />
                    </div>
                )}
            </div >

            {/* Gallery Display - break out of 900px container to full viewport width */}
            {hasGallery && post.layout === 'gallery' && (
                <div style={{
                    width: '100vw',
                    position: 'relative',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '0 16px'
                }}>
                    <EmbeddableGallery imagesRaw={post.galleryImages} isDark={isDark} />
                </div>
            )}

            {/* Child Cards Grid for Subsection Posts */}
            {
                isSubsection && childPosts.length > 0 && (
                    <div style={{ marginTop: '64px', width: '100%' }}>
                        <div className="subsection-grid" style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '24px',
                            /* justifyContent handled by media query now */
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
                )
            }

            <style>{`
                .post-content h1, .post-content h2 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin-top: 40px;
                    margin-bottom: 16px;
                    color: ${isDark ? '#fdedcb' : '#111111'};
                }
                /* Override H1 specifically to be gold if it appears in content (rare, but consistent) */
                .post-content h1 {
                    color: ${isDark ? '#efc676' : '#111111'};
                }

                .post-content h3 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin-top: 32px;
                    margin-bottom: 16px;
                    color: ${isDark ? '#fdedcb' : '#111111'};
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
                .post-content strong {
                    font-weight: 700;
                }
                
                /* Composite Block Responsive */
                @media (max-width: 768px) {
                    .composite-block-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .composite-block-image {
                        order: 1 !important;
                        min-height: 250px !important;
                    }
                    .composite-block-text {
                        order: 2 !important;
                    }
                }

                /* Responsive Images */
                .post-content img, .leader-bio img, .news-content img {
                    max-width: 100%;
                    height: auto;
                }
                
                /* Leadership Layout Responsive - handled via clean inline styles & flex-wrap, 
                   but let's ensure padding reduction on small screens if needed */
                @media (max-width: 600px) {
                    .container {
                        padding-left: 16px !important;
                        padding-right: 16px !important;
                    }
                }
                @media (max-width: 600px) {
                    .container {
                        padding-left: 16px !important;
                        padding-right: 16px !important;
                    }
                }

                .subsection-grid {
                    justify-content: flex-start;
                }
                @media (max-width: 900px) {
                    .subsection-grid {
                        justify-content: center;
                    }
                }
            `}</style>
        </>
    )
}

// Leadership-specific layout (profile style)
function LeadershipLayout({ post, isDark, galleryUrl, hasGallery }: { post: any; isDark: boolean, galleryUrl?: string, hasGallery?: boolean }) {
    return (
        <div
            className="leadership-card"
            style={{
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
                width: '100%',
                maxWidth: '320px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                alignItems: 'center',
                textAlign: 'center',
                margin: '0 auto' // Center on mobile wrap
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
                    <h1 className={`${isRtl(post.title || '') ? 'font-urdu' : ''}`} style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        color: isDark ? '#efc676' : '#111111',
                        margin: '0 0 8px 0',
                        lineHeight: 1.1,
                        overflowWrap: 'anywhere',
                        wordBreak: 'break-word',
                        textAlign: 'center',
                        direction: isRtl(post.title || '') ? 'rtl' : 'ltr'
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
                                <a href={`mailto:${post.email}`} style={{ color: isDark ? '#fdedcb' : 'rgba(0,0,0,0.6)', transition: 'color 0.2s' }} className="hover:text-[#ff3b3b]">
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
                        </div >
                    )
                    }
                </div >


                {/* Gallery Display for Leadership */}
                {hasGallery && (
                    <div style={{ marginTop: '24px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                        {post.layout === 'gallery' ? (
                            <EmbeddableGallery imagesRaw={post.galleryImages} isDark={isDark} />
                        ) : galleryUrl && (
                            <ViewGalleryButton to={galleryUrl} isDark={isDark} variant="pill" />
                        )}
                    </div>
                )}
            </div >


            {/* Right Column: Bio Content */}
            <div style={{ flex: 1, minWidth: '0', maxWidth: '100%' }}>
                {
                    post.content && (
                        <div
                            className={`leader-bio ${isRtl(post.content || '') ? 'font-urdu' : ''}`}
                            style={{
                                color: isDark ? '#fdedcb' : 'rgba(0,0,0,0.7)',
                                fontSize: '1.1rem',
                                lineHeight: 1.4,
                                textAlign: isRtl(post.content || '') ? 'right' : 'left',
                                direction: isRtl(post.content || '') ? 'rtl' : 'ltr'
                            }}
                        >
                            {/* We use ContentBlockRenderer but cheat by overriding styles via CSS if needed, 
                            or simpler: Just render the content directly if it's text. 
                            Given the user wants a single card, forcing ContentBlockRenderer (which has its own cards) is bad.
                            I'll basically unwind the renderer for this specific view to just be the content.
                         */}
                            <div dangerouslySetInnerHTML={{ __html: post.content }} />
                        </div>
                    )
                }
            </div >
            <style>{`
                /* Force single-column stacking on mobile/small screens */
                @media (max-width: 640px) {
                    .leadership-card {
                        flex-direction: column !important;
                        padding: 24px !important;
                        gap: 32px !important;
                        align-items: center !important;
                    }
                    .leadership-card > div:first-child {
                        max-width: 100% !important;
                        width: 100% !important;
                    }
                    .leadership-card > div:last-child {
                        width: 100% !important;
                    }
                }
                @media (max-width: 768px) and (min-width: 641px) {
                    .leadership-card {
                        padding: 24px !important;
                        gap: 32px !important;
                    }
                }
                @media (max-width: 480px) {
                    .leadership-card {
                        padding: 16px !important;
                        gap: 24px !important;
                    }
                    /* Ensure content doesn't get too squished */
                    .leader-bio {
                        font-size: 1rem !important;
                    }
                }
            `}</style>
        </div >
    )
}

// Media/News-specific layout
function MediaLayout({ post, isDark, galleryUrl, hasGallery }: { post: any; isDark: boolean, galleryUrl?: string, hasGallery?: boolean }) {
    const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    return (
        <>
            {/* News Badge */}
            {/* Dynamic Tags Badge */}
            <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(post.tags && post.tags.length > 0 ? post.tags : ['News']).map((tag: string, index: number) => (
                    <div
                        key={index}
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
                                color: '#fdedcb',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}
                        >
                            {tag}
                        </span>
                    </div>
                ))}
            </div>

            <h1 className={`${isRtl(post.title || '') ? 'font-urdu' : ''}`} style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 700,
                color: isDark ? '#fdedcb' : '#111111',
                marginBottom: '16px',
                lineHeight: 1.2,
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
                maxWidth: '100%',
                textAlign: isRtl(post.title || '') ? 'right' : 'left',
                direction: isRtl(post.title || '') ? 'rtl' : 'ltr'
            }}>
                {post.title}
            </h1>

            {/* Meta info */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                marginBottom: '32px',
                color: isDark ? '#fdedcb' : 'rgba(0,0,0,0.5)',
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

            {/* Gallery Description (for gallery layout) */}
            {post.layout === 'gallery' && post.content && (
                <div
                    className="news-content"
                    style={{
                        color: isDark ? '#fdedcb' : 'rgba(0,0,0,0.7)',
                        fontSize: '1.2rem',
                        lineHeight: 1.5,
                        marginBottom: '32px'
                    }}
                >
                    <p>{post.content}</p>
                </div>
            )}


            {/* Gallery Display media */}
            {
                hasGallery && (
                    <div style={{ marginBottom: '32px' }}>
                        {post.layout === 'gallery' ? (
                            <EmbeddableGallery imagesRaw={post.galleryImages} isDark={isDark} />
                        ) : galleryUrl && (
                            <ViewGalleryButton to={galleryUrl} isDark={isDark} variant="card" />
                        )}
                    </div>
                )
            }

            {/* Cover Image moved to Hero */}

            {/* Article Content (only if NOT gallery layout) */}
            {
                post.content && post.layout !== 'gallery' && (
                    <div
                        className={`news-content ${isRtl(post.content || '') ? 'font-urdu' : ''}`}
                        style={{
                            color: isDark ? '#fdedcb' : 'rgba(0,0,0,0.7)',
                            fontSize: '1.15rem',
                            lineHeight: 1.4,
                            textAlign: isRtl(post.content || '') ? 'right' : 'left',
                            direction: isRtl(post.content || '') ? 'rtl' : 'ltr'
                        }}
                    >
                        <ContentBlockRenderer content={post.content} isDark={isDark} />
                    </div>
                )
            }

            <style>{`
                .news-content h1, .news-content h2 {
                    font-size: 1.6rem;
                    font-weight: 700;
                    margin-top: 40px;
                    margin-bottom: 16px;
                    color: ${isDark ? '#fdedcb' : '#111111'};
                }
                .news-content p {
                    margin-bottom: 24px;
                }
                .news-content blockquote {
                    border-left: 4px solid #3b82f6;
                    padding-left: 20px;
                    margin: 32px 0;
                    font-style: italic;
                    color: ${isDark ? '#fdedcb' : 'rgba(0,0,0,0.6)'};
                }
            `}</style>
        </>
    )
}
