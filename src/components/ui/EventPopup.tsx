import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useContent } from '../../context/ContentContext'
import { X } from 'lucide-react'

export function EventPopup() {
    const { popup } = useContent()
    const location = useLocation()
    const [isVisible, setIsVisible] = useState(false)
    const [isClosing, setIsClosing] = useState(false)
    const [hasShownThisLoad, setHasShownThisLoad] = useState(false)
    const [showCloseButton, setShowCloseButton] = useState(false)

    useEffect(() => {
        // Only show popup on home page
        if (location.pathname !== '/') return

        // Don't show popup on admin pages
        if (location.pathname.startsWith('/admin')) return

        // Check if popup should be shown
        if (!popup?.isActive || !popup.image) return

        // Don't show again if already shown this page load
        if (hasShownThisLoad) return

        let isMounted = true

        // Preload image in background
        const preloadImage = (src: string): Promise<void> => {
            return new Promise((resolve, reject) => {
                const img = new Image()
                img.src = src
                img.onload = () => resolve()
                img.onerror = reject
            })
        }

        // Wait for splash screen to be dismissed before showing popup
        const checkSplashAndShow = async () => {
            const splashSeen = sessionStorage.getItem('sio_splash_seen') === 'true'

            if (splashSeen) {
                try {
                    // Start preloading immediately
                    await preloadImage(popup.image)

                    if (!isMounted) return

                    // Show immediately after load (plus small buffer for smoothness)
                    setIsVisible(true)
                    setHasShownThisLoad(true)
                } catch (err) {
                    console.error('Failed to preload popup image', err)
                }
            } else {
                // Splash not done yet, check again in 500ms
                setTimeout(checkSplashAndShow, 500)
            }
        }

        checkSplashAndShow()

        return () => {
            isMounted = false
        }
    }, [popup, location.pathname, hasShownThisLoad])

    // Show close button after 3 seconds
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                setShowCloseButton(true)
            }, 3000)
            return () => clearTimeout(timer)
        } else {
            setShowCloseButton(false)
        }
    }, [isVisible])

    const handleClose = () => {
        setIsClosing(true)

        // Wait for animation to complete before hiding
        setTimeout(() => {
            setIsVisible(false)
            setIsClosing(false)
        }, 300)
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && showCloseButton) {
            handleClose()
        }
    }

    if (!isVisible || !popup?.isActive || !popup.image) {
        return null
    }

    return (
        <div
            onClick={handleBackdropClick}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px',
                opacity: isClosing ? 0 : 1,
                transition: 'opacity 0.3s ease',
                cursor: showCloseButton ? 'pointer' : 'default'
            }}
        >
            <div
                style={{
                    position: 'relative',
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    cursor: 'default',
                    transform: isClosing ? 'scale(0.95)' : 'scale(1)',
                    opacity: isClosing ? 0 : 1,
                    transition: 'all 0.3s ease',
                    animation: !isClosing ? 'popupEnter 0.4s ease' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button - appears after 3 seconds */}
                {showCloseButton && (
                    <button
                        onClick={handleClose}
                        style={{
                            position: 'absolute',
                            top: '-12px',
                            right: '-12px',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            zIndex: 10,
                            animation: 'fadeIn 0.3s ease'
                        }}
                    >
                        <X size={20} color="#333" />
                    </button>
                )}

                {/* Popup Image */}
                <img
                    src={popup.image}
                    alt="Event announcement"
                    style={{
                        maxWidth: '100%',
                        maxHeight: popup.buttonText ? '75vh' : '85vh',
                        borderRadius: '16px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        display: 'block'
                    }}
                />

                {/* Action Button - Shiny style like navbar */}
                {popup.buttonText && (
                    <div
                        className="shiny-button-container"
                        style={{ animation: 'fadeIn 0.4s ease 0.2s both' }}
                    >
                        <a
                            href={popup.buttonLink || '#'}
                            target={popup.buttonLink?.startsWith('http') ? '_blank' : '_self'}
                            rel="noopener noreferrer"
                            className="shiny-button"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '14px 32px',
                                color: 'white',
                                borderRadius: '100px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                textDecoration: 'none',
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.02)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)'
                            }}
                        >
                            {popup.buttonText}
                        </a>
                    </div>
                )}
            </div>

            {/* Animation Keyframes */}
            <style>
                {`
                    @keyframes popupEnter {
                        from {
                            opacity: 0;
                            transform: scale(0.9) translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1) translateY(0);
                        }
                    }
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: scale(0.8);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                `}
            </style>
        </div>
    )
}
