import { useState, useCallback, useEffect, useRef } from 'react'
import { Share2, Link2, Check, Facebook, Instagram, Youtube, Send, MessageCircle } from 'lucide-react'
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

const ThreadsIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 192 192" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z" />
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
            icon: <MessageCircle size={18} />,
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
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: '8px',
                    background: isDark ? '#1a1a1d' : '#fff',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '16px',
                    padding: '16px',
                    minWidth: '240px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    zIndex: 50,
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
