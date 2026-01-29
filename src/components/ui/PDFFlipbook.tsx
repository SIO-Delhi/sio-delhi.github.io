import { useEffect, useRef, useState } from 'react'
import $ from 'jquery'
import '3d-flip-book/css/black-book-view.css'

// Ensure globals for the library
if (typeof window !== 'undefined') {
    (window as any).jQuery = $;
    (window as any).$ = $;
}

interface PDFFlipbookProps {
    url: string
    coverImage?: string
}

export function PDFFlipbook({ url, coverImage: _coverImage }: PDFFlipbookProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isReady, setIsReady] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1100)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        const initBook = async () => {
            if (!containerRef.current) return;
            if (!url) return;

            try {
                // Load scripts in parallel
                await Promise.all([
                    // 1. Load legacy THREE.js
                    new Promise<void>((resolve, reject) => {
                        if ((window as any).THREE && (window as any).THREE.EventDispatcher) {
                            resolve();
                            return;
                        }
                        const script = document.createElement('script');
                        script.src = '/3d-flip-book/js/three.min.js';
                        script.onload = () => resolve();
                        script.onerror = () => reject(new Error('Failed to load three.min.js'));
                        document.head.appendChild(script);
                    }),

                    // 2. Load legacy PDF.js
                    new Promise<void>((resolve, reject) => {
                        if ((window as any).PDFJS && (window as any).PDFJS.legacyPromise) {
                            (window as any).PDFJS.workerSrc = '/3d-flip-book/js/pdf.worker.js';
                            resolve();
                            return;
                        }
                        const script = document.createElement('script');
                        script.src = '/3d-flip-book/js/pdf.min.js';
                        script.onload = () => {
                            (window as any).PDFJS.workerSrc = '/3d-flip-book/js/pdf.worker.js';
                            (window as any).PDFJS.cMapUrl = '/3d-flip-book/js/cmaps/';
                            (window as any).PDFJS.cMapPacked = true;
                            resolve();
                        };
                        script.onerror = () => reject(new Error('Failed to load pdf.min.js'));
                        document.head.appendChild(script);
                    }),

                    // 3. Load FlipBook Plugin
                    new Promise<void>((resolve, reject) => {
                        if (typeof (window as any).FlipBook !== 'undefined' || typeof ($.fn as any).FlipBook !== 'undefined') {
                            resolve();
                            return;
                        }
                        const script = document.createElement('script');
                        script.src = '/3d-flip-book/js/flip-book.js';
                        script.onload = () => resolve();
                        script.onerror = () => reject(new Error('Failed to load flip-book.js'));
                        document.head.appendChild(script);
                    })
                ]);

                const options = {
                    pdf: url,
                    smartTexture: true,
                    lightBox: false,
                    template: {
                        html: '/3d-flip-book/templates/default-book-view.html',
                        styles: [
                            '/3d-flip-book/css/short-white-book-view.css'
                        ],
                        links: [
                            {
                                rel: 'stylesheet',
                                href: '/3d-flip-book/css/font-awesome.min.css'
                            }
                        ],
                        script: '/3d-flip-book/js/default-book-view.js',
                        sounds: {
                            startFlip: '/3d-flip-book/sounds/start-flip.mp3',
                            endFlip: '/3d-flip-book/sounds/end-flip.mp3'
                        }
                    },
                    singlePageMode: isMobile,
                    responsiveView: true,
                    controlsProps: {
                        actions: {
                            cmdBackward: { code: 37 },
                            cmdForward: { code: 39 },
                        }
                    },
                    ready: function () {
                        setIsReady(true);
                    }
                }

                // Clear container but keep the cover image if it exists (handled by React rendering, but jQuery .empty() will wipe it)
                // We need to render the book in a child div so we don't wipe the React-rendered cover image?
                // Actually the library appends to the target. Let's start with empty.
                // Wait, if we use $(containerRef.current).empty(), we remove the React img.
                // Strategy: Use a nested div for the book.

                const bookContainer = document.createElement('div');
                bookContainer.style.width = '100%';
                bookContainer.style.height = '100%';

                // Clear any previous book container
                $(containerRef.current).children('.book-container').remove();
                bookContainer.className = 'book-container';
                containerRef.current.appendChild(bookContainer);

                setTimeout(() => {
                    if (typeof ($(bookContainer as any) as any).FlipBook === 'function') {
                        ($(bookContainer as any) as any).FlipBook(options);
                    } else {
                        console.error('FlipBook plugin not found');
                    }
                }, 0);

            } catch (err) {
                console.error("Failed to load FlipBook dependencies", err);
            }
        }

        const timer = setTimeout(() => {
            initBook()
        }, 50);

        return () => {
            clearTimeout(timer);
        }

    }, [url, isMobile])

    return (
        <div
            ref={containerRef}
            data-ready={isReady}
            style={{
                width: '100%',
                height: '80vh',
                minHeight: '500px',
                position: 'relative',
                overflow: 'hidden' // Ensure no potential overflow
            }}
        >
            {!isReady && _coverImage && (
                <img
                    src={_coverImage}
                    alt="Book Cover"
                    loading="eager"
                    {...{ fetchPriority: "high" } as any}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        zIndex: 10
                    }}
                />
            )}
            {!isReady && !_coverImage && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    background: 'transparent'
                }}>
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-white/80 font-medium animate-pulse">Loading Syllabus...</p>
                    </div>
                </div>
            )}
        </div>
    )
}
