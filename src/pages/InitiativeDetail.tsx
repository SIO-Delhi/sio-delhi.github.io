import { useParams, Link } from 'react-router-dom'
import { API_BASE } from '../lib/api'
import { initiatives } from '../data/initiatives'
import { useContent } from '../context/ContentContext'
import { useTheme } from '../context/ThemeContext'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { PDFFlipbook } from '../components/ui/PDFFlipbook'

export function InitiativeDetail() {
    const { id } = useParams()
    const { isDark } = useTheme()
    const { getPostById } = useContent()

    // Try to find in database first, then static data
    const dbPost = id ? getPostById(id) : undefined
    const staticInitiative = initiatives.find(i => i.id === id)

    const initiative = useMemo(() => {
        if (dbPost) {
            return {
                id: dbPost.id,
                title: dbPost.title,
                category: 'Initiative',
                image: dbPost.image || '',
                description: dbPost.subtitle || '',
                content: dbPost.content,
                pdfUrl: dbPost.pdfUrl
            }
        }
        return staticInitiative
    }, [dbPost, staticInitiative])

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    if (!initiative) {
        return (
            <div className="container" style={{ paddingTop: '120px', textAlign: 'center', color: isDark ? 'white' : 'black' }}>
                <h1>Initiative Not Found</h1>
                <Link to="/" style={{ color: '#ff3b3b' }}>Back to Home</Link>
            </div>
        )
    }

    return (
        <div style={{ paddingTop: '100px', paddingBottom: '80px', minHeight: '100vh', background: 'transparent' }}>
            {/* Gradient Background for Detail Page */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'radial-gradient(circle at 80% 20%, rgba(255, 59, 59, 0.15) 0%, transparent 50%)',
                    zIndex: -1,
                    pointerEvents: 'none',
                }}
            />

            <div className="container" style={{ maxWidth: '900px' }}>
                <Link
                    to="/"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: isDark ? '#fdedcb' : 'rgba(0,0,0,0.6)',
                        textDecoration: 'none',
                        marginBottom: '32px',
                        fontSize: '14px',
                        fontWeight: 500,
                        transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ff3b3b'}
                    onMouseLeave={(e) => e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}
                >
                    <ArrowLeft size={16} /> Back to Home
                </Link>

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
                                color: isDark ? '#fdedcb' : '#111111',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}
                        >
                            {initiative.category}
                        </span>
                    </div>
                </div>

                <h1 style={{
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    fontWeight: 700,
                    color: isDark ? '#efc676' : '#111111',
                    marginBottom: '24px',
                    lineHeight: 1.1
                }}>
                    {initiative.title}
                </h1>

                {/* Cover Image */}
                {initiative.image && (
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
                            src={initiative.image}
                            alt={initiative.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                )}

                {/* PDF Flipbook (if PDF attached) */}
                {'pdfUrl' in initiative && initiative.pdfUrl && (
                    <div style={{ marginBottom: '40px' }}>
                        <PDFFlipbook
                            url={initiative.pdfUrl.startsWith('http')
                                ? initiative.pdfUrl
                                : `${API_BASE}/uploads/pdfs/${initiative.pdfUrl}`
                            }
                            coverImage={initiative.image}
                        />
                    </div>
                )}

                {/* Content */}
                {initiative.content && (
                    <div
                        className="initiative-content"
                        style={{
                            color: isDark ? '#fdedcb' : 'rgba(0,0,0,0.7)',
                            fontSize: '1.1rem',
                            lineHeight: 1.8
                        }}
                        dangerouslySetInnerHTML={{ __html: initiative.content }}
                    />
                )}

                <style>{`
                    .initiative-content h3 {
                        font-size: 1.5rem;
                        font-weight: 600;
                        margin-top: 32px;
                        margin-bottom: 16px;
                        color: ${isDark ? '#fdedcb' : '#111111'};
                    }
                    .initiative-content p {
                        margin-bottom: 24px;
                    }
                    .initiative-content ul {
                        margin-bottom: 24px;
                        padding-left: 24px;
                    }
                    .initiative-content li {
                        margin-bottom: 8px;
                        list-style-type: disc;
                    }
                    .initiative-content strong {
                        color: ${isDark ? '#ff3b3b' : '#cc2929'};
                    }
                    .initiative-content img {
                        max-width: 100%;
                        height: auto;
                    }
                `}</style>
            </div>
        </div>
    )
}
