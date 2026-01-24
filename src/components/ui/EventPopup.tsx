import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useContent } from '../../context/ContentContext'

export function EventPopup() {
    const { popup } = useContent()
    const location = useLocation()
    const [isVisible, setIsVisible] = useState(false)
    const [isClosing, setIsClosing] = useState(false)
    const [hasShownThisLoad, setHasShownThisLoad] = useState(false)

    useEffect(() => {
        // Only show popup on home page
        if (location.pathname !== '/') return

        // Don't show popup on admin pages
        if (location.pathname.startsWith('/admin')) return

        // Check if popup should be shown
        if (!popup?.isActive || !popup.image) return

        // Don't show again if already shown this page load
        if (hasShownThisLoad) return

        // Wait for splash screen to be dismissed before showing popup
        const checkSplashAndShow = () => {
            const splashSeen = sessionStorage.getItem('sio_splash_seen') === 'true'
            if (splashSeen) {
                // Splash is done, show popup after a short delay
                const timer = setTimeout(() => {
                    setIsVisible(true)
                    setHasShownThisLoad(true)
                }, 1500)
                return () => clearTimeout(timer)
            } else {
                // Splash not done yet, check again in 500ms
                const checkTimer = setTimeout(checkSplashAndShow, 500)
                return () => clearTimeout(checkTimer)
            }
        }

        const cleanup = checkSplashAndShow()
        return cleanup
    }, [popup, location.pathname, hasShownThisLoad])

    const handleClose = () => {
        setIsClosing(true)

        // Wait for animation to complete before hiding
        setTimeout(() => {
            setIsVisible(false)
            setIsClosing(false)
        }, 300)
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
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
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px',
                opacity: isClosing ? 0 : 1,
                transition: 'opacity 0.3s ease',
                cursor: 'pointer'
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
                    animation: !isClosing ? 'popupEnter 0.4s ease' : 'none'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}


                {/* Popup Image */}
                <img
                    src={popup.image}
                    alt="Event announcement"
                    style={{
                        maxWidth: '100%',
                        maxHeight: '85vh',
                        borderRadius: '16px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        display: 'block'
                    }}
                />
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
                `}
            </style>
        </div>
    )
}
