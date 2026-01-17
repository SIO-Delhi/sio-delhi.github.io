import { useParams, Link, useNavigate } from 'react-router-dom'
import { useContent } from '../context/ContentContext'
import { SectionCard } from '../components/ui/SectionCard'
import { ArrowLeft, FileText } from 'lucide-react'

export function SubsectionDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { getPostById, getChildPosts, sections } = useContent()

    const subsection = id ? getPostById(id) : undefined
    const childPosts = id ? getChildPosts(id) : []
    const section = subsection ? sections.find(s => s.id === subsection.sectionId) : undefined

    // Get section color for cards
    const getSectionColor = (sectionId: string) => {
        switch (sectionId) {
            case 'about': return '#FFD700'
            case 'initiatives': return '#ff3b3b'
            case 'media': return '#00bfff'
            case 'leadership': return '#9b59b6'
            default: return '#888'
        }
    }

    // Determine the correct route prefix based on section
    const getPostRoute = (sectionId: string) => {
        switch (sectionId) {
            case 'about': return '/about-us'
            case 'initiatives': return '/initiative'
            case 'media': return '/media'
            case 'leadership': return '/leader'
            default: return '/post'
        }
    }

    if (!subsection) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0a0a0a',
                color: 'white'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '16px' }}>Subsection not found</h1>
                    <Link to="/" style={{ color: '#ff3b3b', textDecoration: 'none' }}>
                        ← Go back home
                    </Link>
                </div>
            </div>
        )
    }

    const routePrefix = getPostRoute(subsection.sectionId)
    const labelColor = getSectionColor(subsection.sectionId)

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0a0a0a',
            color: 'white',
            padding: '120px 24px 60px'
        }}>
            {/* Red Gradient Background */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    width: '100vw',
                    height: '100vh',
                    background: `radial-gradient(circle at 80% 20%, ${labelColor}22 0%, transparent 50%)`,
                    zIndex: -1,
                    pointerEvents: 'none',
                }}
            />
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#888',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        marginBottom: '32px',
                        fontSize: '0.9rem',
                        transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                >
                    <ArrowLeft size={18} />
                    Back
                </button>

                {/* Header - just title and subtitle, no cover image */}
                <div style={{ marginBottom: '48px' }}>
                    <h1 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                        fontWeight: 800,
                        marginBottom: '12px'
                    }}>
                        {subsection.title}
                    </h1>
                    {subsection.subtitle && (
                        <p style={{ fontSize: '1.2rem', color: '#888' }}>
                            {subsection.subtitle}
                        </p>
                    )}
                </div>

                {/* Child Posts Grid using SectionCard */}
                {childPosts.length === 0 ? (
                    <div style={{
                        padding: '64px',
                        borderRadius: '16px',
                        border: '2px dashed #333',
                        textAlign: 'center',
                        color: '#666'
                    }}>
                        <FileText size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                        <p>No items in this collection yet.</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '24px',
                        justifyContent: 'flex-start' // Align to left
                    }}>
                        {childPosts.filter(p => p.isPublished).map(post => (
                            <SectionCard
                                key={post.id}
                                label={section?.label || 'POST'}
                                labelColor={labelColor}
                                title={post.title}
                                subtitle={post.subtitle || ''}
                                description={post.subtitle || ''}
                                image={post.image}
                                publishedDate={post.createdAt}
                                onClick={() => navigate(`${routePrefix}/${post.id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
