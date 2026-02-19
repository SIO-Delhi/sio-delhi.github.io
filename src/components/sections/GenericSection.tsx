import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { SectionCard } from '../ui/SectionCard'
import { PosterLightbox } from '../ui/PosterLightbox'
import SectionLayout from '../layout/SectionLayout'
import { useContent } from '../../context/ContentContext'
import type { Post, SectionTemplate } from '../../types/content'
import { slugify } from '../../utils/slugify'

interface GenericSectionProps {
    sectionId: string
    title: string
    label: string
    template?: SectionTemplate
}

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

export function GenericSection({ sectionId, title, label, template }: GenericSectionProps) {
    const { isDark } = useTheme()
    const navigate = useNavigate()
    const { getPostsBySection } = useContent()
    const [activePoster, setActivePoster] = useState<Post | null>(null)

    const cards = getPostsBySection(sectionId).filter(post => post.isPublished)
    const hasContent = cards.length > 0

    const titleParts = title.split(' ')
    const firstWord = titleParts[0]
    const restWords = titleParts.slice(1).join(' ')

    const headerContent = (
        <h1
            style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: 700,
                color: '#efc676',
                lineHeight: 1.1,
                margin: 0,
                fontFamily: '"DM Sans", sans-serif',
                letterSpacing: '-0.02em'
            }}
        >
            {firstWord} {restWords && <span style={{ color: '#ff3333' }}>{restWords}</span>}
        </h1>
    )

    return (
        <>
        <SectionLayout
            id={sectionId}
            header={headerContent}
        >
            {hasContent ? (
                cards.map((card) => {
                    const isPoster = card.layout === 'poster'
                    const slug = isPoster
                        ? (card.title ? slugify(card.title) : card.id)
                        : slugify(card.title)

                    // Poster cards are rendered as a direct image-only element
                    // (bypasses SectionCard variant system for guaranteed appearance)
                    if (isPoster) {
                        const imgSrc = getPosterImageUrl(card.image)
                        return (
                            <div
                                key={card.id}
                                id={`card-${slug}`}
                                draggable={false}
                                onClick={() => setActivePoster(card)}
                                style={{
                                    borderRadius: '16px',
                                    width: '300px',
                                    height: '420px',
                                    flexShrink: 0,
                                    cursor: 'pointer',
                                    background: 'rgba(20,20,25,0.65)',
                                    backdropFilter: 'blur(20px)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                    position: 'relative',
                                    zIndex: 5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '16px',
                                    boxSizing: 'border-box',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-4px)'
                                    e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.5)'
                                    e.currentTarget.style.zIndex = '10'
                                    const img = e.currentTarget.querySelector('img') as HTMLImageElement | null
                                    if (img) img.style.transform = 'scale(1.04)'
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'
                                    e.currentTarget.style.zIndex = '5'
                                    const img = e.currentTarget.querySelector('img') as HTMLImageElement | null
                                    if (img) img.style.transform = 'scale(1)'
                                }}
                            >
                                {imgSrc ? (
                                    <img
                                        src={imgSrc}
                                        alt={card.title || 'Poster'}
                                        draggable={false}
                                        loading="lazy"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            display: 'block',
                                            borderRadius: '8px',
                                            transition: 'transform 0.4s ease',
                                            userSelect: 'none',
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem',
                                    }}>
                                        No Image
                                    </div>
                                )}
                            </div>
                        )
                    }

                    return (
                        <SectionCard
                            key={card.id}
                            cardId={`card-${slug}`}
                            {...card}
                            label={label}
                            labelColor="#FF3333"
                            description={card.subtitle || card.content.replace(/<[^>]+>/g, '').substring(0, 100)}
                            publishedDate={(card as any).publishedDate || card.createdAt}
                            image={(card as any).coverImage || card.image}
                            icon={card.icon}
                            variant={template || 'default'}
                            onClick={() => navigate(getPostRoute(sectionId, slug), { state: { post: card } })}
                        />
                    )
                })
            ) : (
                <div style={{
                    minWidth: '100%',
                    height: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                    fontSize: '1.1rem'
                }}>
                    No content published yet
                </div>
            )}
        </SectionLayout>

        {activePoster && (
            <PosterLightbox
                post={activePoster}
                onClose={() => setActivePoster(null)}
            />
        )}
        </>
    )
}
