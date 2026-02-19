import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { ShareButton } from './ShareButton'
import { useTheme } from '../../context/ThemeContext'
import type { Post } from '../../types/content'
import { slugify } from '../../utils/slugify'

const getFirstImageUrl = (imageField: string | undefined): string | null => {
    if (!imageField) return null
    try {
        const parsed = JSON.parse(imageField)
        return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : imageField
    } catch {
        return imageField
    }
}

const getPostRoute = (sId: string, slug: string) => {
    switch (sId) {
        case 'about': return `/about-us/${slug}`
        case 'initiatives': return `/initiative/${slug}`
        case 'media': return `/media/${slug}`
        case 'leadership': return `/leader/${slug}`
        case 'resources':
        case 'more': return `/resource/${slug}`
        default: return `/section/${sId}/${slug}`
    }
}

interface PosterLightboxProps {
    post: Post
    onClose: () => void
    urlPath?: string   // override for nested poster URLs (e.g. /initiative/parent-slug/poster-slug)
}

export function PosterLightbox({ post, onClose, urlPath }: PosterLightboxProps) {
    const { isDark } = useTheme()
    const imageUrl = getFirstImageUrl(post.image)
    const slug = post.title ? slugify(post.title) : post.id
    const computedPath = getPostRoute(post.sectionId, slug)
    const resolvedPath = urlPath ?? computedPath
    const shareUrl = `https://siodelhi.org${resolvedPath}`
    // Title is shown only when the editor explicitly enabled it
    const showTitle = post.content === 'show-title'
    const hasText = !!(showTitle && post.title) || !!post.subtitle

    // Lock body scroll
    useEffect(() => {
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = prev }
    }, [])

    // Silently update URL so the lightbox is shareable; restore on close
    useEffect(() => {
        const prevUrl = window.location.pathname + window.location.search + window.location.hash
        window.history.replaceState(null, '', resolvedPath)
        return () => { window.history.replaceState(null, '', prevUrl) }
    }, [resolvedPath])

    // Close on Escape
    const handleKey = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
    }, [onClose])

    useEffect(() => {
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [handleKey])

    return (
        <>
            <style>{`
                @keyframes plFadeIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes plPopUp {
                    from { opacity: 0; transform: scale(0.82) translateY(24px) }
                    to   { opacity: 1; transform: scale(1)    translateY(0)    }
                }
            `}</style>

            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.92)',
                    animation: 'plFadeIn 0.2s ease',
                    cursor: 'pointer',
                }}
            />

            {/* Content panel — pointer-events: none so clicks on empty area hit backdrop */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 1001,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '24px 16px',
                pointerEvents: 'none',
                overflow: 'auto',
            }}>
                <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '20px',
                    pointerEvents: 'auto',
                    animation: 'plPopUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    maxWidth: 'min(95vw, 480px)',
                    width: '100%',
                }}>
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        style={{
                            alignSelf: 'flex-end',
                            width: '36px', height: '36px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <X size={16} />
                    </button>

                    {/* Poster image */}
                    {imageUrl && (
                        <img
                            src={imageUrl}
                            alt={post.title || 'Poster'}
                            draggable={false}
                            onContextMenu={e => e.preventDefault()}
                            style={{
                                maxWidth: '100%',
                                maxHeight: hasText ? '60vh' : '75vh',
                                width: 'auto', height: 'auto',
                                objectFit: 'contain',
                                borderRadius: '12px',
                                boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                                display: 'block',
                            }}
                        />
                    )}

                    {/* Optional title + subtitle */}
                    {hasText && (
                        <div style={{ textAlign: 'center', width: '100%' }}>
                            {showTitle && post.title && (
                                <h2 style={{
                                    margin: '0 0 8px',
                                    fontSize: '1.4rem', fontWeight: 700,
                                    color: '#efc676',
                                    fontFamily: '"DM Sans", sans-serif',
                                    lineHeight: 1.2,
                                }}>
                                    {post.title}
                                </h2>
                            )}
                            {post.subtitle && (
                                <p style={{
                                    margin: 0,
                                    fontSize: '0.95rem',
                                    color: 'rgba(255,255,255,0.7)',
                                    lineHeight: 1.5,
                                    fontFamily: '"DM Sans", sans-serif',
                                }}>
                                    {post.subtitle}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Share button */}
                    <ShareButton
                        postId={post.id}
                        postTitle={post.title || 'Poster'}
                        postUrl={shareUrl}
                        isDark={isDark}
                    />
                </div>
            </div>
        </>
    )
}
