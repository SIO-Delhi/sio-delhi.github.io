import { useState, useCallback, useEffect, useRef } from 'react'
import { Share2, Link2, X, Facebook } from 'lucide-react'
import gsap from 'gsap'
import { api } from '../../lib/api'

// Custom SVG icons
const XIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
)

interface ShareButtonProps {
    postId: string
    postTitle: string
    postUrl: string
    isDark: boolean
}

// Height of the share widget
const WIDGET_HEIGHT = 48
// Width of each icon button
const ICON_SIZE = 30
// Gap between icons
const ICON_GAP = 2
// Padding around icons
const ICONS_PADDING = 8
// Size of the close circle
const CLOSE_SIZE = WIDGET_HEIGHT
// Total expanded width
const EXPANDED_WIDTH = 168

export function ShareButton({ postId, postTitle, postUrl, isDark }: ShareButtonProps) {
    const [shortUrl, setShortUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)
    const toggleRef = useRef<HTMLButtonElement>(null)
    const btnTextRef = useRef<HTMLSpanElement>(null)
    const closeIconRef = useRef<HTMLSpanElement>(null)
    const iconsRef = useRef<HTMLDivElement>(null)
    const tlRef = useRef<gsap.core.Timeline | null>(null)
    const copyBtnRef = useRef<HTMLButtonElement>(null)
    const toastRef = useRef<HTMLDivElement>(null)

    const getOrCreateShortLink = useCallback(async (): Promise<string> => {
        if (shortUrl) return shortUrl
        setLoading(true)
        try {
            const res = await api.shortLinks.create(postUrl, postId)
            if (res.data?.shortUrl) {
                setShortUrl(res.data.shortUrl)
                return res.data.shortUrl
            }
        } catch (e) {
            console.error('Failed to create short link:', e)
        } finally {
            setLoading(false)
        }
        return postUrl
    }, [shortUrl, postUrl, postId])

    // Build GSAP timeline
    useEffect(() => {
        const container = containerRef.current
        const toggle = toggleRef.current
        const btnText = btnTextRef.current
        const closeIcon = closeIconRef.current
        const icons = iconsRef.current
        if (!container || !toggle || !btnText || !closeIcon || !icons) return

        const iconItems = icons.querySelectorAll('.share-icon-item')

        const tl = gsap.timeline({ paused: true, reversed: true })

        tl
            // 1. Fade out "Share" text
            .to(btnText, {
                opacity: 0,
                scale: 0.5,
                duration: 0.2,
                ease: 'power2.in'
            })
            // 2. Expand container width
            .to(container, {
                width: EXPANDED_WIDTH,
                duration: 0.5,
                ease: 'power3.inOut'
            }, '-=0.1')
            // 3. Shrink toggle to circle on the right
            .to(toggle, {
                width: CLOSE_SIZE,
                padding: 0,
                duration: 0.5,
                ease: 'power3.inOut'
            }, '<')
            // 4. Show close X
            .to(closeIcon, {
                opacity: 1,
                scale: 1,
                rotation: 0,
                duration: 0.3,
                ease: 'back.out(2)'
            }, '-=0.25')
            // 5. Make icons container visible
            .set(icons, { visibility: 'visible' }, '-=0.35')
            // 6. Stagger icons in
            .fromTo(iconItems,
                { y: 12, opacity: 0, scale: 0.5 },
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    stagger: 0.04,
                    duration: 0.3,
                    ease: 'back.out(1.7)'
                }, '-=0.25'
            )

        tlRef.current = tl
        return () => { tl.kill() }
    }, [isDark])

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                closeMenu()
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [isOpen])

    const closeMenu = () => {
        if (tlRef.current && !tlRef.current.reversed()) {
            tlRef.current.timeScale(2.5).reverse()
            setTimeout(() => setIsOpen(false), 350)
        }
    }

    const handleToggle = async () => {
        // Native share on mobile
        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0
        if (isMobile && navigator.share) {
            const url = await getOrCreateShortLink()
            try {
                await navigator.share({ title: postTitle, text: postTitle, url })
            } catch { /* cancelled */ }
            return
        }

        if (!tlRef.current) return

        if (tlRef.current.reversed()) {
            setIsOpen(true)
            getOrCreateShortLink()
            tlRef.current.timeScale(1).play()
        } else {
            closeMenu()
        }
    }

    const handleCopyLink = async () => {
        const url = await getOrCreateShortLink()
        try {
            await navigator.clipboard.writeText(url)
        } catch {
            const textarea = document.createElement('textarea')
            textarea.value = url
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
        }
        // Update copy button visually via DOM instead of state to avoid re-render
        const btn = copyBtnRef.current
        const toast = toastRef.current
        if (btn) {
            btn.style.color = '#22c55e'
            btn.title = 'Copied!'
        }
        if (toast) {
            toast.style.opacity = '1'
            toast.style.transform = 'translateX(-50%) translateY(0)'
        }
        setTimeout(() => {
            if (btn) {
                btn.style.color = isDark ? '#fdedcb' : '#555'
                btn.title = 'Copy Link'
            }
            if (toast) {
                toast.style.opacity = '0'
                toast.style.transform = 'translateX(-50%) translateY(4px)'
            }
            closeMenu()
        }, 1000)
    }

    const shareActions = [
        {
            icon: <XIcon size={15} />, color: isDark ? '#fff' : '#000', label: 'X',
            action: async () => {
                const url = await getOrCreateShortLink()
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(postTitle)}&url=${encodeURIComponent(url)}`, '_blank')
                closeMenu()
            }
        },
        {
            icon: <Facebook size={18} />, color: '#1877F2', label: 'Facebook',
            action: async () => {
                const url = await getOrCreateShortLink()
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
                closeMenu()
            }
        },
        {
            icon: <Link2 size={18} />,
            color: isDark ? '#fdedcb' : '#555',
            label: 'Copy Link',
            action: () => handleCopyLink(),
            ref: copyBtnRef,
        },
    ]

    // Revealed background: noticeably lighter so contrast with toggle is clear
    const revealBg = isDark
        ? 'linear-gradient(135deg, #3a3a40 0%, #2c2c32 100%)'
        : 'linear-gradient(135deg, #e8e8e8 0%, #d8d8d8 100%)'
    const toggleBg = isDark
        ? 'linear-gradient(135deg, #1a1a1e 0%, #252528 100%)'
        : 'linear-gradient(135deg, #222226 0%, #333338 100%)'

    return (
        <div style={{ position: 'relative', display: 'inline-flex' }}>
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                height: WIDGET_HEIGHT,
                background: revealBg,
                borderRadius: '100px',
                border: isDark
                    ? '1px solid rgba(255,255,255,0.15)'
                    : '1px solid rgba(0,0,0,0.12)',
                boxShadow: isDark
                    ? '0 4px 20px rgba(0,0,0,0.5)'
                    : '0 4px 20px rgba(0,0,0,0.1)',
                fontFamily: '"DM Sans", sans-serif',
                overflow: 'hidden',
                maxWidth: '100%',
            }}
        >
            {/* Social Icons — always in DOM, hidden until GSAP reveals */}
            <div
                ref={iconsRef}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: ICON_GAP,
                    paddingLeft: ICONS_PADDING,
                    paddingRight: CLOSE_SIZE + ICONS_PADDING,
                    visibility: 'hidden',
                    whiteSpace: 'nowrap',
                }}
            >
                {shareActions.map(opt => (
                    <button
                        key={opt.label}
                        ref={'ref' in opt ? opt.ref as React.Ref<HTMLButtonElement> : undefined}
                        className="share-icon-item"
                        onClick={opt.action}
                        title={opt.label}
                        style={{
                            width: ICON_SIZE,
                            height: ICON_SIZE,
                            borderRadius: '50%',
                            border: 'none',
                            background: 'transparent',
                            color: opt.color,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s, transform 0.2s',
                            flexShrink: 0,
                            opacity: 0,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isDark
                                ? 'rgba(255,255,255,0.12)'
                                : 'rgba(0,0,0,0.08)'
                            e.currentTarget.style.transform = 'scale(1.2)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.transform = 'scale(1)'
                        }}
                    >
                        {opt.icon}
                    </button>
                ))}
            </div>

            {/* Toggle Button — covers everything when closed, shrinks to circle on right */}
            <button
                ref={toggleRef}
                onClick={handleToggle}
                disabled={loading}
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '100%',
                    height: '100%',
                    background: toggleBg,
                    borderRadius: '100px',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: loading ? 'wait' : 'pointer',
                    zIndex: 2,
                    color: 'white',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    fontFamily: '"DM Sans", sans-serif',
                    whiteSpace: 'nowrap',
                    padding: '0 24px',
                    overflow: 'hidden',
                    boxShadow: isDark
                        ? '0 2px 8px rgba(0,0,0,0.5)'
                        : '0 2px 8px rgba(0,0,0,0.15)',
                }}
            >
                <span
                    ref={btnTextRef}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}
                >
                    <Share2 size={16} />
                    {loading ? 'Loading...' : 'Share'}
                </span>
                <span
                    ref={closeIconRef}
                    style={{
                        position: 'absolute',
                        opacity: 0,
                        transform: 'scale(0) rotate(-90deg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <X size={20} />
                </span>
            </button>
        </div>

        {/* Copied toast */}
        <div
            ref={toastRef}
            style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: '50%',
                transform: 'translateX(-50%) translateY(4px)',
                background: '#22c55e',
                color: 'white',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                opacity: 0,
                transition: 'opacity 0.25s, transform 0.25s',
                pointerEvents: 'none',
                zIndex: 10,
                fontFamily: '"DM Sans", sans-serif',
            }}
        >
            Copied to clipboard!
        </div>
        </div>
    )
}
