import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTheme } from '../../context/ThemeContext'

gsap.registerPlugin(ScrollTrigger)

export function HeroSection() {
    const textRef = useRef<HTMLDivElement>(null)
    const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
    const { isDark } = useTheme()
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

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
                alignItems: isMobile ? 'flex-start' : 'center', // Top align on mobile
                justifyContent: isMobile ? 'center' : 'flex-end', // Center on mobile, Right on desktop
            }}
        >


            {/* Typography */}
            <div
                ref={textRef}
                style={{
                    position: 'relative',
                    zIndex: 2,
                    width: '100%',
                    padding: isMobile ? '160px 32px 0' : '0 120px 0 120px', // Mobile: Increased side padding
                    textAlign: isMobile ? 'center' : 'right', // Center text on mobile
                }}
            >
                {/* Quranic Ayah */}
                <h1
                    className="drop-in-1"
                    style={{
                        fontFamily: "'TheYearofTheCamel', sans-serif",
                        fontSize: 'clamp(3.5rem, 7vw, 6rem)',
                        fontWeight: 700,
                        color: isDark ? '#fdedcb' : '#1a1a1a',
                        marginBottom: '0.5rem',
                        marginLeft: isMobile ? 'auto' : undefined,
                        marginRight: isMobile ? 'auto' : undefined,
                        opacity: 0,
                        textShadow: isDark ? '0 4px 12px rgba(0,0,0,0.5)' : 'none',
                        direction: 'rtl',
                        lineHeight: 1.2,
                    }}
                >
                    قال إني جاعلك للناس إماما
                </h1>

                {/* Translation */}
                <p
                    className="drop-in-2"
                    style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 'clamp(1.4rem, 2.5vw, 2.2rem)',
                        color: '#efc676',
                        maxWidth: '600px',
                        marginLeft: isMobile ? 'auto' : 'auto', // Centered on mobile since textAlign is center
                        marginRight: isMobile ? 'auto' : '0', // Explicitly center on mobile
                        opacity: 0,
                        fontWeight: 300,
                        fontStyle: 'italic',
                        direction: 'ltr',
                        textAlign: isMobile ? 'center' : 'right',
                        letterSpacing: '-0.02em',
                        wordSpacing: '-0.1em',
                        marginTop: isMobile ? '0.5rem' : '-1.2rem', // Gap on mobile, tight on desktop
                        lineHeight: 1.1,
                    }}
                >
                    "He said, 'Indeed, I will make you a leader for the people.'"
                </p>
            </div>
        </section >
    )
}
