import { useParams, useNavigate } from 'react-router-dom'
import { useContent } from '../context/ContentContext'
import { useTheme } from '../context/ThemeContext'
import { ArrowLeft, Calendar, User } from 'lucide-react'
import { useEffect } from 'react'
import { PDFFlipbook } from '../components/ui/PDFFlipbook'

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

            {post.subtitle && (
                <p style={{
                    fontSize: '1.25rem',
                    color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                    marginBottom: '32px'
                }}>
                    {post.subtitle}
                </p>
            )}

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
                    {post.content.includes('block-pdf') ? (
                        post.content.split(/<div class="siodel-block block-pdf" data-pdf-url="(.*?)"><\/div>/g).map((part: string, index: number) => {
                            // Odd indices are the captured PDF URLs
                            if (index % 2 === 1) {
                                return (
                                    <div key={index} style={{ margin: '40px 0' }}>
                                        <PDFFlipbook url={part} />
                                    </div>
                                )
                            }
                            // Even indices are HTML content
                            if (!part) return null
                            return <div key={index} dangerouslySetInnerHTML={{ __html: part }} />
                        })
                    ) : (
                        <div dangerouslySetInnerHTML={{ __html: post.content }} />
                    )}
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
