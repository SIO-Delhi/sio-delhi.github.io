import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTheme } from '../../context/ThemeContext'

gsap.registerPlugin(ScrollTrigger)

export function HeroSection() {
    const textRef = useRef<HTMLDivElement>(null)
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
    const { isDark } = useTheme()

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Text Entry
            gsap.fromTo(
                '.drop-in-1, .drop-in-2, .drop-in-3',
                { y: 100, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1.5,
                    stagger: 0.2,
                    ease: 'power4.out',
                    delay: 0.5,
                }
            )
        }, [textRef])

        // Proximity Hover Effect
        const handleMouseMove = (e: MouseEvent) => {
            wordRefs.current.forEach((word) => {
                if (!word) return

                const rect = word.getBoundingClientRect()
                const wordX = rect.left + rect.width / 2
                const wordY = rect.top + rect.height / 2

                const dist = Math.hypot(e.clientX - wordX, e.clientY - wordY)

                // Maximum distance to affect the word (e.g., 200px radius)
                const maxDist = 300

                if (dist < maxDist) {
                    // Map distance (0 to maxDist) to scale (1.5 to 1)
                    const scale = gsap.utils.mapRange(0, maxDist, 1.4, 1, dist)
                    gsap.to(word, {
                        scale: scale,
                        duration: 0.3,
                        overwrite: 'auto',
                        textShadow: dist < 100 ? "0 0 20px rgba(255,255,255,0.6)" : "none",
                        zIndex: dist < 100 ? 10 : 1
                    })
                } else {
                    gsap.to(word, {
                        scale: 1,
                        duration: 0.3,
                        overwrite: 'auto',
                        textShadow: "none",
                        zIndex: 1
                    })
                }
            })
        }

        window.addEventListener('mousemove', handleMouseMove)

        return () => {
            ctx.revert()
            window.removeEventListener('mousemove', handleMouseMove)
        }
    }, [])

    return (
        <section
            id="home"
            style={{
                height: '100vh',
                width: '100vw',
                position: 'relative',
                overflow: 'hidden',
                // Background handles by global CSS
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end', // Move to Right
            }}
        >


            {/* Typography */}
            <div
                ref={textRef}
                style={{
                    position: 'relative',
                    zIndex: 2,
                    textAlign: 'right',
                    width: '100%',
                    padding: '0 120px 0 120px',
                }}
            >
                {/* Quranic Ayah */}
                <h1
                    className="drop-in-1"
                    style={{
                        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                        fontWeight: 500,
                        color: isDark ? '#ffffff' : '#1a1a1a',
                        marginBottom: '0.5rem',
                        opacity: 0,
                        textShadow: isDark ? '0 4px 12px rgba(0,0,0,0.5)' : 'none',
                        direction: 'rtl',
                        lineHeight: 1.8,
                    }}
                >
                    قال إني جاعلك للناس إماما
                </h1>

                {/* Translation */}
                <p
                    className="drop-in-2"
                    style={{
                        fontFamily: "'Geist', sans-serif",
                        fontSize: 'clamp(1.2rem, 2vw, 1.8rem)',
                        color: '#ff3b3b',
                        maxWidth: '600px',
                        marginLeft: 'auto',
                        opacity: 0,
                        fontWeight: 400,
                        fontStyle: 'italic',
                        direction: 'ltr',
                        textAlign: 'right',
                        letterSpacing: '-0.02em',
                        wordSpacing: '-0.1em',
                    }}
                >
                    "He said, 'Indeed, I will make you a leader for the people.'"
                </p>
            </div>
        </section >
    )
}
