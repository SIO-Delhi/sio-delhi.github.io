import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useContent } from '../../context/ContentContext'

const POPUP_SHOWN_KEY = 'popup_shown_this_tab'

export function EventPopup() {
    const { popup } = useContent()
    const location = useLocation()
    const [isVisible, setIsVisible] = useState(false)
    const [isClosing, setIsClosing] = useState(false)

    useEffect(() => {
        // Don't show popup on admin pages
        if (location.pathname.startsWith('/admin')) return

        // Check if popup should be shown
        if (!popup?.isActive || !popup.image) return

        // Check if popup was already shown in this tab (using sessionStorage)
        const alreadyShown = sessionStorage.getItem(POPUP_SHOWN_KEY)
        if (alreadyShown) return

        // Show popup after 3 seconds
        const timer = setTimeout(() => {
            setIsVisible(true)
            // Mark as shown for this tab
            sessionStorage.setItem(POPUP_SHOWN_KEY, 'true')
        }, 3000)

        return () => clearTimeout(timer)
    }, [popup, location.pathname])

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
                <button
                    onClick={handleClose}
                    style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '-12px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#fff',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1,
                        transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    aria-label="Close popup"
                >
                    <X size={20} color="#111" />
                </button>

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
