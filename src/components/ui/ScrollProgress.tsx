import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { Observer } from 'gsap/Observer'
import { ArrowDown } from 'lucide-react'

gsap.registerPlugin(Observer)

export function ScrollProgress() {
    const progressRef = useRef<SVGCircleElement>(null)
    const textRef = useRef<SVGSVGElement>(null)

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY
            const docHeight = document.documentElement.scrollHeight - window.innerHeight
            const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0

            // Animate the stroke
            if (progressRef.current) {
                const circumference = 2 * Math.PI * 28 // radius = 28
                const offset = circumference - (scrollPercent / 100) * circumference
                gsap.to(progressRef.current, {
                    strokeDashoffset: offset,
                    duration: 0.3,
                    ease: 'power2.out',
                })
            }
        }

        // Observer for velocity-based rotation speed
        const observer = Observer.create({
            target: window,
            type: 'scroll',
            onChangeY: (self) => {
                if (textRef.current) {
                    // Speed up rotation based on scroll velocity
                    const velocity = Math.abs(self.velocityY || 0)
                    const speed = Math.max(5, 15 - velocity / 100)
                    textRef.current.style.animationDuration = `${speed}s`
                }
            },
        })

        // Initialize
        handleScroll()
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => {
            window.removeEventListener('scroll', handleScroll)
            observer.kill()
        }
    }, [])

    const circumference = 2 * Math.PI * 28

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '40px',
                right: '40px',
                zIndex: 100,
                width: '80px',
                height: '80px',
            }}
        >
            {/* Rotating Text */}
            <svg
                ref={textRef}
                viewBox="0 0 100 100"
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    animation: 'rotate 15s linear infinite',
                }}
            >
                <defs>
                    <path
                        id="textPath"
                        d="M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"
                    />
                </defs>
                <text
                    style={{
                        fontSize: '9px',
                        fill: 'currentColor',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                    }}
                >
                    <textPath href="#textPath" startOffset="0%">
                        • SCROLL TO EXPLORE • SCROLL TO EXPLORE
                    </textPath>
                </text>
            </svg>

            {/* Progress Circle */}
            <svg
                viewBox="0 0 70 70"
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '70px',
                    height: '70px',
                }}
            >
                {/* Background Circle */}
                <circle
                    cx="35"
                    cy="35"
                    r="28"
                    fill="rgba(0, 0, 0, 0.8)"
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="2"
                />
                {/* Progress Circle */}
                <circle
                    ref={progressRef}
                    cx="35"
                    cy="35"
                    r="28"
                    fill="none"
                    stroke="#ff3b3b" // Red
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference}
                    style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center',
                    }}
                />
            </svg>

            {/* Center Arrow */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: '#fdedcb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <ArrowDown size={20} strokeWidth={1.5} />
            </div>

            {/* CSS for rotation animation */}
            <style>{`
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
