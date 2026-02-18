import { useParams, useNavigate } from 'react-router-dom'
import { useContent } from '../context/ContentContext'
import { useTheme } from '../context/ThemeContext'
import { SectionCard } from '../components/ui/SectionCard'
import { SEOHead } from '../components/seo/SEOHead'
import { slugify } from '../utils/slugify'
import type { SectionTemplate } from '../types/content'

/**
 * Section Landing Page - shows all posts for a given section.
 * Accessed via /:sectionId (e.g., /jac, /about, /media)
 */
export function SectionLandingPage() {
    const { sectionId } = useParams<{ sectionId: string }>()
    const { sections, getPostsBySection, loading } = useContent()
    const { isDark } = useTheme()
    const navigate = useNavigate()

    const section = sections.find(s => s.id === sectionId)

    // Get the route prefix for post detail pages
    const getPostRoute = (sId: string, postSlug: string) => {
        switch (sId) {
            case 'about': return `/about-us/${postSlug}`
            case 'initiatives': return `/initiative/${postSlug}`
            case 'media': return `/media/${postSlug}`
            case 'leadership': return `/leader/${postSlug}`
            case 'resources':
            case 'more': return `/resource/${postSlug}`
            default: return `/section/${sId}/${postSlug}`
        }
    }

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#09090b',
                paddingTop: '120px',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <div className="portal-spinner" />
            </div>
        )
    }

    if (!section) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#09090b',
                paddingTop: '120px',
                textAlign: 'center',
                color: 'white',
                fontFamily: '"DM Sans", sans-serif'
            }}>
                <h1 style={{ fontSize: '2rem' }}>Section Not Found</h1>
                <a href="/" style={{ color: '#ff3b3b', textDecoration: 'none' }}>Go to Homepage</a>
            </div>
        )
    }

    const posts = getPostsBySection(section.id).filter(p => p.isPublished)
    const template = (section.template || 'standard') as SectionTemplate

    // Split title for styling
    const titleParts = section.title.split(' ')
    const firstWord = titleParts[0]
    const restWords = titleParts.slice(1).join(' ')

    return (
        <div style={{
            minHeight: '100vh',
            paddingTop: '120px',
            paddingBottom: '80px',
            background: 'transparent',
            fontFamily: '"DM Sans", sans-serif',
        }}>
            <SEOHead
                title={section.title}
                description={section.description || `${section.title} - SIO Delhi`}
                url={`https://siodelhi.org/${section.id}`}
            />

            {/* Gradient Background */}
            <div style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: '100vw',
                height: '100vh',
                background: 'radial-gradient(circle at 80% 20%, rgba(255,59,59,0.15) 0%, transparent 50%)',
                zIndex: -1,
                pointerEvents: 'none',
            }} />

            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                padding: '0 clamp(16px, 4vw, 40px)',
            }}>
                {/* Section Header */}
                <div style={{ marginBottom: '48px' }}>
                    <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: '#ff3b3b',
                        marginBottom: '12px',
                    }}>
                        {section.label}
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                        fontWeight: 700,
                        color: '#efc676',
                        lineHeight: 1.1,
                        margin: 0,
                        letterSpacing: '-0.02em',
                    }}>
                        {firstWord}{' '}
                        {restWords && <span style={{ color: '#ff3333' }}>{restWords}</span>}
                    </h1>
                    {section.description && (
                        <p style={{
                            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                            fontSize: '1.1rem',
                            marginTop: '16px',
                            maxWidth: '600px',
                            lineHeight: 1.6,
                        }}>
                            {section.description}
                        </p>
                    )}
                </div>

                {/* Posts Grid */}
                {posts.length > 0 ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '24px',
                    }}>
                        {posts.map(post => (
                            <SectionCard
                                key={post.id}
                                cardId={`card-${slugify(post.title)}`}
                                label={section.label}
                                labelColor="#FF3333"
                                title={post.title}
                                subtitle={post.subtitle || ''}
                                description={post.content?.replace(/<[^>]+>/g, '').substring(0, 100) || ''}
                                publishedDate={post.createdAt}
                                image={post.image}
                                icon={post.icon}
                                variant={template}
                                onClick={() => {
                                    const slug = slugify(post.title)
                                    navigate(getPostRoute(section.id, slug))
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 20px',
                        color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                        fontSize: '1.1rem',
                    }}>
                        No content published yet
                    </div>
                )}
            </div>
        </div>
    )
}
