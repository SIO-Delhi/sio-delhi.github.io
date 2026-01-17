import { useParams, useNavigate } from 'react-router-dom'
import { useContent } from '../context/ContentContext'
import { useTheme } from '../context/ThemeContext'
import { ArrowLeft, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
import { PDFFlipbook } from '../components/ui/PDFFlipbook'

// --- ContentBlockRenderer: Parses and renders enhanced content blocks ---
interface ParsedBlock {
    type: 'text' | 'image' | 'pdf' | 'legacy' | 'composite'
    content: string
    pdfUrl: string
    alignment: string
    subtitle: string
    caption: string
    isCarousel: boolean
    carouselImages: string[]
    imageSrc: string
    // Composite block fields
    layout?: 'image-left' | 'image-right' | 'image-top' | 'stacked'
    imageUrl?: string
    textContent?: string
}

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

            return {
                type: blockType,
                content: isPdf || isComposite ? '' : el.innerHTML,
                pdfUrl: el.getAttribute('data-pdf-url') || '',
                alignment: el.getAttribute('data-align') || 'left',
                subtitle: decodeURIComponent(el.getAttribute('data-subtitle') || ''),
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

    return (
        <>
            {blocks.map((block, index) => {
                const alignStyle = {
                    textAlign: block.alignment as 'left' | 'center' | 'right',
                    justifyContent: block.alignment === 'center' ? 'center' : (block.alignment === 'right' ? 'flex-end' : 'flex-start')
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
                                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                ...alignStyle
                            }}
                        >
                            {block.subtitle && (
                                <h3 style={{
                                    color: '#ff3b3b',
                                    fontSize: '1.2rem',
                                    fontWeight: 600,
                                    marginBottom: '12px',
                                    textAlign: alignStyle.textAlign
                                }}>
                                    {block.subtitle}
                                </h3>
                            )}
                            <div
                                dangerouslySetInnerHTML={{ __html: block.content }}
                                style={{ textAlign: alignStyle.textAlign }}
                            />
                        </div>
                    )
                }

                // Image Block (single or carousel)
                if (block.type === 'image') {
                    const images = block.isCarousel && block.carouselImages.length > 0
                        ? block.carouselImages
                        : [block.imageSrc]
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
                            <div style={{ order: layout === 'image-right' ? 2 : 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {(block.carouselImages && block.carouselImages.length > 0
                                    ? block.carouselImages
                                    : (block.imageUrl ? [block.imageUrl] : [])
                                ).map((img, i, arr) => (
                                    <img
                                        key={i}
                                        src={img}
                                        alt=""
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            minHeight: arr.length > 1 ? 'auto' : '100%',
                                            objectFit: 'cover',
                                            borderRadius: '12px',
                                            display: 'block'
                                        }}
                                    />
                                ))}
                            </div>
                            <div
                                style={{
                                    order: layout === 'image-right' ? 1 : 2,
                                    maxWidth: '100%'
                                }}
                            >
                                {block.subtitle && (
                                    <h3 style={{
                                        color: '#ff8080',
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
                                    style={{
                                        color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
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
    sectionType: 'about' | 'initiatives' | 'media' | 'leadership'
}

export function PostDetail({ sectionType }: PostDetailProps) {
    const { id } = useParams()
    const { isDark } = useTheme()
    const { getPostById } = useContent()
    const navigate = useNavigate()

    const post = id ? getPostById(id) : undefined

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

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
        leadership: { label: 'Leader', color: '#10b981' }
    }

    const config = sectionConfig[sectionType]

    // Render section-specific content
    const renderContent = () => {
        switch (sectionType) {
            case 'leadership':
                return <LeadershipLayout post={post} isDark={isDark} />
            case 'media':
                return <MediaLayout post={post} isDark={isDark} />
            default:
                return <DefaultLayout post={post} isDark={isDark} sectionLabel={config.label} />
        }
    }

    return (
        <div style={{ paddingTop: '100px', paddingBottom: '80px', minHeight: '100vh', background: 'transparent' }}>
            {/* Gradient Background */}
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

            <div className="container" style={{ maxWidth: '900px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                        textDecoration: 'none',
                        marginBottom: '32px',
                        fontSize: '14px',
                        fontWeight: 500,
                        transition: 'color 0.2s',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = config.color}
                    onMouseLeave={(e) => e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}
                >
                    <ArrowLeft size={16} /> Back
                </button>

                {renderContent()}
            </div>
        </div>
    )
}

// Default layout for About and Initiatives
function DefaultLayout({ post, isDark, sectionLabel }: { post: any; isDark: boolean; sectionLabel: string }) {
    // Simplified layout for subsection child posts (has parentId)
    const isSubsectionChild = !!post.parentId

    if (isSubsectionChild) {
        return (
            <>
                <h1 style={{
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    fontWeight: 700,
                    color: isDark ? '#ffffff' : '#111111',
                    marginBottom: '32px',
                    lineHeight: 1.1
                }}>
                    {post.title}
                </h1>

                {/* PDF Flipbook (main content for subsection posts) */}
                {post.pdfUrl && (
                    <div style={{ marginBottom: '40px' }}>
                        <PDFFlipbook url={post.pdfUrl} />
                    </div>
                )}
            </>
        )
    }

    // Regular full layout for top-level posts
    return (
        <>
            {/* Badge */}
            <div style={{ marginBottom: '24px' }}>
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 16px',
                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderRadius: '100px',
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    }}
                >
                    <div
                        style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#ff3b3b',
                        }}
                    />
                    <span
                        style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: isDark ? '#ffffff' : '#111111',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    >
                        {sectionLabel}
                    </span>
                </div>
            </div>

            <h1 style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: 700,
                color: isDark ? '#ffffff' : '#111111',
                marginBottom: '16px',
                lineHeight: 1.1
            }}>
                {post.title}
            </h1>

            {/* Cover Image */}
            {post.image && (
                <div
                    style={{
                        width: '100%',
                        height: '400px',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        marginBottom: '40px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}
                >
                    <img
                        src={post.image}
                        alt={post.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
            )}

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
                .post-content strong {
                    color: ${isDark ? '#ff3b3b' : '#cc2929'};
                }
            `}</style>
        </>
    )
}

// Leadership-specific layout (profile style)
function LeadershipLayout({ post, isDark }: { post: any; isDark: boolean }) {
    return (
        <div style={{ textAlign: 'center' }}>
            {/* Large Profile Photo */}
            {post.image && (
                <div
                    style={{
                        width: '200px',
                        height: '200px',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        margin: '0 auto 32px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                        border: '4px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <img
                        src={post.image}
                        alt={post.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
            )}

            <h1 style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 700,
                color: isDark ? '#ffffff' : '#111111',
                marginBottom: '8px',
                lineHeight: 1.2
            }}>
                {post.title}
            </h1>

            {post.subtitle && (
                <p style={{
                    fontSize: '1.1rem',
                    color: '#10b981',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '40px'
                }}>
                    {post.subtitle}
                </p>
            )}

            {/* Bio Content */}
            {post.content && (
                <div
                    className="leader-bio"
                    style={{
                        color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)',
                        fontSize: '1.1rem',
                        lineHeight: 1.8,
                        textAlign: 'left',
                        maxWidth: '700px',
                        margin: '0 auto',
                        padding: '40px',
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        borderRadius: '24px',
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
                    }}
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />
            )}
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

            {/* Cover Image */}
            {post.image && (
                <div
                    style={{
                        width: '100%',
                        height: '450px',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        marginBottom: '40px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}
                >
                    <img
                        src={post.image}
                        alt={post.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
            )}

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
