import { useEffect, useRef } from 'react'

interface PDFFlipbookProps {
    url: string
}

declare global {
    interface Window {
        jQuery: any
    }
}

export function PDFFlipbook({ url }: PDFFlipbookProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const bookInstance = useRef<any>(null)
    const uniqueId = useRef(`df_book_${Math.random().toString(36).substr(2, 9)}`)

    useEffect(() => {
        let timeoutId: any = null

        // Wait for jQuery and dFlip to load
        const initBook = () => {
            if (window.jQuery && typeof window.jQuery().flipBook === 'function' && containerRef.current) {
                const $ = window.jQuery

                // CRITICAL: Always empty container before initializing to prevent duplicates (double layer issue)
                $(containerRef.current).empty()

                // Initialize DearFlip
                const options = {
                    source: url,
                    height: window.innerWidth < 768 ? 400 : 800, // Responsive height
                    webgl: true, // Enable 3D
                    // 3D settings
                    stiffness: 3,
                    backgroundColor: 'transparent',
                    pageMode: 'single', // Force single page view
                    singlePageMode: true, // Force single page mode
                    // Disable mouse zoom interactions
                    scrollWheel: false,
                    zoomRatio: window.innerWidth < 768 ? 1.5 : 1, // Slight zoom on mobile
                    maxZoom: 1, // Limit max zoom level effectively disabling it
                    doubleClickZoom: false,
                }

                bookInstance.current = $(containerRef.current).flipBook(url, options)
            } else {
                // Retry if scripts haven't loaded yet
                timeoutId = setTimeout(initBook, 100)
            }
        }

        initBook()

        // Cleanup
        return () => {
            if (timeoutId) clearTimeout(timeoutId)
            if (window.jQuery && containerRef.current) {
                window.jQuery(containerRef.current).empty()
            }
        }
    }, [url])

    return (
        <div
            style={{
                width: '100%',
                // height handled by inner container
                position: 'relative',
                background: 'transparent'
            }}
        >
            <style>{`
                .flipbook-container-wrapper {
                    height: 850px;
                }
                @media (max-width: 768px) {
                    .flipbook-container-wrapper {
                        height: 450px !important;
                    }
                }
            `}</style>
            <div
                id={uniqueId.current}
                ref={containerRef}
                className="flipbook-container-wrapper"
                style={{ width: '100%' }}
            />
            {/* Customized DearFlip UI Styles */}
            <style>{`
                ._df_book-stage { background: transparent !important; }
                
                /* Add padding to stage to center book and leave space at bottom */
                ._df_book-stage { 
                    height: calc(100% - 120px) !important; /* Force book to end higher for clear gap */
                    margin-bottom: 120px !important;
                    padding: 0 20px !important; 
                    box-sizing: border-box !important;
                }

                /* Side Navigation Buttons (floating ones, NOT the ones in bottom control bar) */
                ._df_book-stage > .df-ui-next,
                ._df_book-stage > .df-ui-prev,
                .df-container > .df-ui-next,
                .df-container > .df-ui-prev {
                    background: rgba(0, 0, 0, 0.6) !important;
                    border: 1px solid rgba(255, 255, 255, 0.2) !important;
                    border-radius: 50% !important;
                    width: 48px !important;
                    height: 48px !important;
                    color: white !important;
                    opacity: 0.8 !important;
                    transition: all 0.2s ease !important;
                }
                ._df_book-stage > .df-ui-next:hover,
                ._df_book-stage > .df-ui-prev:hover,
                .df-container > .df-ui-next:hover,
                .df-container > .df-ui-prev:hover {
                    opacity: 1 !important;
                    background: rgba(0, 0, 0, 0.8) !important;
                }
                ._df_book-stage > .df-ui-prev,
                .df-container > .df-ui-prev {
                    left: -60px !important;
                }
                ._df_book-stage > .df-ui-next,
                .df-container > .df-ui-next {
                    right: -60px !important;
                }

                /* More Menu & All Popups - Elegant & Compact */
                .df-ui-popup, 
                .df-ui-more .more-container, 
                .more-container,
                div[class*="popup"] {
                    background: rgba(15, 15, 15, 0.95) !important;
                    backdrop-filter: blur(16px) !important;
                    -webkit-backdrop-filter: blur(16px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 12px !important;
                    color: white !important;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5) !important;
                    width: 220px !important; /* Wider to fit text */
                    padding: 6px !important;
                    bottom: 60px !important;
                }
                
                /* Triangle/Arrow fix */
                .df-ui-popup::after, .more-container::after {
                    border-top-color: rgba(15, 15, 15, 0.95) !important;
                }
                
                /* Hide the More Button (... 3 dots) entirely - Aggressive Targeting */
                .df-ui-more,
                .df-ui-btn.df-ui-more,
                button.df-ui-more,
                .ti-more, 
                .ti-more-alt,
                .df-ui-btn[title="More"],
                .df-ui-btn:has(.ti-more),
                .df-ui-btn:has(.ti-more-alt) {
                    display: none !important;
                }

                /* Bottom Control Bar - Perfectly Centered & Aligned */
                .df-ui-controls {
                    background: rgba(10, 10, 10, 0.95) !important; /* Darker bg */
                    backdrop-filter: blur(20px) !important;
                    -webkit-backdrop-filter: blur(20px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.15) !important;
                    border-radius: 20px !important; /* Capsule shape */
                    bottom: 10px !important; /* Sit lower at edge */
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6) !important;
                    padding: 6px 16px !important;
                    width: auto !important;
                    max-width: fit-content !important;
                    /* Center trick */
                    left: 50% !important;
                    transform: translateX(-50%) !important;
                    margin: 0 !important;
                    display: flex !important;
                    align-items: center !important; /* Vertical center alignment */
                    gap: 12px !important;
                }

                /* Fix alignment for text/inputs inside controls */
                .df-ui-controls > * {
                    display: flex !important;
                    align-items: center !important;
                    margin: 0 !important;
                    height: 100% !important;
                }
                
                /* Specific fix for page number input area */
                input.df-ui-page-input {
                    background: transparent !important;
                    border: none !important;
                    color: white !important;
                    height: auto !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    line-height: 1 !important;
                    text-align: center !important;
                }
                label.df-ui-page-label {
                    margin: 0 4px !important;
                    display: flex !important;
                    align-items: center !important;
                }

                /* Control buttons inside bar */
                .df-ui-btn { 
                    background: transparent !important;
                    border-radius: 8px !important;
                    color: rgba(255, 255, 255, 0.8) !important;
                    border: none !important;
                    margin: 0 2px !important;
                    padding: 8px !important;
                    width: auto !important;
                    height: auto !important;
                    aspect-ratio: 1;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: all 0.2s ease;
                }
                .df-ui-btn:hover {
                    background: rgba(255, 255, 255, 0.1) !important;
                    color: white !important;
                    transform: translateY(-2px);
                }
                .df-ui-btn.df-ui-active {
                    color: #ff3b3b !important;
                }
                
                /* Wrapper adjustments */
                .df-ui-wrapper {
                     background: transparent !important;
                }
            `}</style>
        </div>
    )
}


