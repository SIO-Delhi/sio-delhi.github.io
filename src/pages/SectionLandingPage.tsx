import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useContent } from '../context/ContentContext'
import { useTheme } from '../context/ThemeContext'
import { SectionCard } from '../components/ui/SectionCard'
import { PosterLightbox } from '../components/ui/PosterLightbox'
import { SEOHead } from '../components/seo/SEOHead'
import { slugify } from '../utils/slugify'
import type { Post, SectionTemplate } from '../types/content'

// Extract first image URL from JSON array or plain URL
const getPosterImageUrl = (image: string | undefined): string => {
    if (!image) return ''
    try {
        const parsed = JSON.parse(image)
        return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : image
    } catch {
        return image
    }
}

/**
 * Section Landing Page - shows all posts for a given section.
 * Accessed via /:sectionId (e.g., /jac, /about, /media)
 */
export function SectionLandingPage({ sectionIdOverride }: { sectionIdOverride?: string }) {
    const { sectionId: paramsSectionId } = useParams<{ sectionId: string }>()
    const sectionId = sectionIdOverride || paramsSectionId
    const { sections, getPostsBySection, loading } = useContent()
    const { isDark } = useTheme()
    const navigate = useNavigate()
    const [activePoster, setActivePoster] = useState<Post | null>(null)

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

    // Separate posters from regular posts
    const posterPosts = posts.filter(p => p.layout === 'poster')
    const regularPosts = posts.filter(p => p.layout !== 'poster')

    // Split title for styling
    const titleParts = section.title.split(' ')
    const firstWord = titleParts[0]
    const restWords = titleParts.slice(1).join(' ')

    return (
        <>
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

                {posts.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 20px',
                        color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                        fontSize: '1.1rem',
                    }}>
                        No content published yet
                    </div>
                ) : (
                    <>
                        {/* Poster grid — image-only cards, custom rendering */}
                        {posterPosts.length > 0 && (
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '20px',
                                marginBottom: regularPosts.length > 0 ? '48px' : 0,
                            }}>
                                {posterPosts.map(post => {
                                    const slug = post.title ? slugify(post.title) : post.id
                                    const imgSrc = getPosterImageUrl(post.image)
                                    return (
                                        <div
                                            key={post.id}
                                            id={`card-${slug}`}
                                            draggable={false}
                                            onClick={() => setActivePoster(post)}
                                            style={{
                                                borderRadius: '12px',
                                                overflow: 'hidden',
                                                width: '200px',
                                                aspectRatio: '2/3',
                                                flexShrink: 0,
                                                cursor: 'pointer',
                                                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                                background: '#111',
                                                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                                position: 'relative',
                                                zIndex: 5,
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)'
                                                e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,0.6)'
                                                e.currentTarget.style.zIndex = '10'
                                                const img = e.currentTarget.querySelector('img') as HTMLImageElement | null
                                                if (img) img.style.transform = 'scale(1.06)'
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)'
                                                e.currentTarget.style.zIndex = '5'
                                                const img = e.currentTarget.querySelector('img') as HTMLImageElement | null
                                                if (img) img.style.transform = 'scale(1)'
                                            }}
                                        >
                                            {imgSrc ? (
                                                <img
                                                    src={imgSrc}
                                                    alt={post.title || 'Poster'}
                                                    draggable={false}
                                                    loading="lazy"
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        display: 'block',
                                                        transition: 'transform 0.4s ease',
                                                        userSelect: 'none',
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '100%', height: '100%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem',
                                                }}>
                                                    No Image
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Regular posts grid */}
                        {regularPosts.length > 0 && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: '24px',
                            }}>
                                {regularPosts.map(post => {
                                    const slug = slugify(post.title)
                                    return (
                                        <SectionCard
                                            key={post.id}
                                            cardId={`card-${slug}`}
                                            label={section.label}
                                            labelColor="#FF3333"
                                            title={post.title}
                                            subtitle={post.subtitle || ''}
                                            description={post.content?.replace(/<[^>]+>/g, '').substring(0, 100) || ''}
                                            publishedDate={post.createdAt}
                                            image={post.image}
                                            icon={post.icon}
                                            variant={template}
                                            onClick={() => navigate(getPostRoute(section.id, slug))}
                                        />
                                    )
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>

        {activePoster && (
            <PosterLightbox
                post={activePoster}
                onClose={() => setActivePoster(null)}
            />
        )}
        </>
    )
}
