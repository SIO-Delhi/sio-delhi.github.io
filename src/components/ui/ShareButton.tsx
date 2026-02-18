import { useState, useCallback, useEffect, useRef } from 'react'
import { Share2, Link2, Check, Facebook, Instagram } from 'lucide-react'
import { api } from '../../lib/api'

// Custom SVG icons for platforms not in lucide-react
const XIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
)

const TelegramIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42l10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.004.002l-.317 4.743c.466 0 .672-.214.929-.472l2.228-2.15l4.641 3.429c.854.471 1.466.226 1.677-.796l3.036-14.318c.311-1.246-.474-1.808-1.394-1.396z" />
    </svg>
)



const WhatsAppIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
)

const LinkedInIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
)

interface ShareButtonProps {
    postId: string
    postTitle: string
    postUrl: string
    isDark: boolean
}

export function ShareButton({ postId, postTitle, postUrl, isDark }: ShareButtonProps) {
    const [shortUrl, setShortUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Close menu on outside click
    useEffect(() => {
        if (!showMenu) return
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowMenu(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [showMenu])

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
        // Fallback to full URL
        return postUrl
    }, [shortUrl, postUrl, postId])

    const handleShare = async () => {
        const url = await getOrCreateShortLink()
        const shareData = { title: postTitle, text: postTitle, url }

        // Use native share on mobile (touch devices)
        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0
        if (isMobile && navigator.share) {
            try {
                await navigator.share(shareData)
                return
            } catch {
                // User cancelled — don't fall through to menu
                return
            }
        }

        // Desktop: toggle share menu
        setShowMenu(prev => !prev)
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
        setCopied(true)
        setTimeout(() => {
            setCopied(false)
            setShowMenu(false)
        }, 1500)
    }

    const shareOptions = [
        {
            icon: <WhatsAppIcon />,
            label: 'WhatsApp',
            color: '#25D366',
            action: async () => {
                const url = await getOrCreateShortLink()
                window.open(`https://wa.me/?text=${encodeURIComponent(postTitle + ' ' + url)}`, '_blank')
                setShowMenu(false)
            }
        },
        {
            icon: <TelegramIcon />,
            label: 'Telegram',
            color: '#26A5E4',
            action: async () => {
                const url = await getOrCreateShortLink()
                window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(postTitle)}`, '_blank')
                setShowMenu(false)
            }
        },
        {
            icon: <XIcon />,
            label: 'X / Twitter',
            color: isDark ? '#fdedcb' : '#000',
            action: async () => {
                const url = await getOrCreateShortLink()
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(postTitle)}&url=${encodeURIComponent(url)}`, '_blank')
                setShowMenu(false)
            }
        },
        {
            icon: <Facebook size={18} />,
            label: 'Facebook',
            color: '#1877F2',
            action: async () => {
                const url = await getOrCreateShortLink()
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
                setShowMenu(false)
            }
        },
        {
            icon: <LinkedInIcon />,
            label: 'LinkedIn',
            color: '#0A66C2',
            action: async () => {
                const url = await getOrCreateShortLink()
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
                setShowMenu(false)
            }
        },
        {
            icon: <Instagram size={18} />,
            label: 'Instagram',
            color: '#E4405F',
            action: () => {
                // Instagram doesn't support URL sharing — copy link instead
                handleCopyLink()
            }
        },
    ]

    return (
        <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={handleShare}
                disabled={loading}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '100px',
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
                    color: isDark ? '#fdedcb' : '#333',
                    cursor: loading ? 'wait' : 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    fontFamily: '"DM Sans", sans-serif',
                    transition: 'all 0.2s',
                }}
            >
                <Share2 size={16} />
                {loading ? 'Loading...' : 'Share'}
            </button>

            {showMenu && (
                <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: '8px',
                    background: isDark ? '#1a1a1d' : '#fff',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '16px',
                    padding: '16px',
                    minWidth: '240px',
                    boxShadow: '0 -8px 32px rgba(0,0,0,0.3)',
                    zIndex: 9999,
                }}>
                    {/* Icon grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                        marginBottom: '12px',
                    }}>
                        {shareOptions.map(opt => (
                            <button
                                key={opt.label}
                                onClick={opt.action}
                                title={opt.label}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '12px 8px',
                                    border: 'none',
                                    borderRadius: '12px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    color: opt.color,
                                    fontSize: '0.7rem',
                                    fontFamily: '"DM Sans", sans-serif',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = isDark
                                        ? 'rgba(255,255,255,0.06)'
                                        : 'rgba(0,0,0,0.04)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent'
                                }}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: isDark
                                        ? 'rgba(255,255,255,0.08)'
                                        : 'rgba(0,0,0,0.06)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    {opt.icon}
                                </div>
                                <span style={{
                                    color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {opt.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Copy Link button */}
                    <div style={{
                        borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                        paddingTop: '12px',
                    }}>
                        <button
                            onClick={handleCopyLink}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                width: '100%',
                                padding: '10px 12px',
                                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                                borderRadius: '10px',
                                background: copied
                                    ? (isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)')
                                    : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'),
                                cursor: 'pointer',
                                color: copied ? '#22c55e' : (isDark ? '#fdedcb' : '#333'),
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                fontFamily: '"DM Sans", sans-serif',
                                transition: 'all 0.2s',
                            }}
                        >
                            {copied ? <Check size={16} /> : <Link2 size={16} />}
                            {copied ? 'Link Copied!' : 'Copy Link'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
