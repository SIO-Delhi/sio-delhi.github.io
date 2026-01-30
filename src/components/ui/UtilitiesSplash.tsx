import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ChevronDown, FlaskConical } from 'lucide-react'
import logo from '/logo.svg'

interface UtilitiesSplashProps {
    onComplete: () => void
}

export function UtilitiesSplash({ onComplete }: UtilitiesSplashProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const logoRef = useRef<HTMLImageElement>(null)
    const textRef = useRef<HTMLDivElement>(null)
    const labIconRef = useRef<HTMLDivElement>(null)
    const scrollTextRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        let exitTriggered = false
        const ctx = gsap.context(() => {


            const exitTl = gsap.timeline({ paused: true, onComplete: () => { setTimeout(onComplete, 100) } })

            // Initial State for Global Elements
            gsap.set(containerRef.current, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' })
            gsap.set([logoRef.current, textRef.current, labIconRef.current, scrollTextRef.current], { opacity: 0, y: 20 })

            // 1. Global Entrance
            const entranceTl = gsap.timeline()
            entranceTl.to([logoRef.current, labIconRef.current], {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out',
                stagger: 0.1
            })
                .to(textRef.current, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
                .to(scrollTextRef.current, { opacity: 1, y: 0, duration: 0.6, delay: 0.5 })

            // 2. Continuous Hopping Animation
            gsap.to('.lab-icon-bouncer', {
                y: -10,
                duration: 1.5,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                delay: 1 // Wait for entrance
            })

            // Grid Movement Animation
            gsap.to(containerRef.current, {
                backgroundPosition: '40px 40px',
                duration: 20,
                repeat: -1,
                ease: 'none'
            })


            // 3. Exit Animation
            exitTl.to([contentRef.current, scrollTextRef.current], {
                opacity: 0,
                y: -50,
                duration: 0.5,
                ease: 'power2.in'
            })
                .to(containerRef.current, {
                    clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
                    y: -100,
                    duration: 0.8,
                    ease: 'power4.inOut'
                })

            // Scroll/Interact Listener
            const triggerExit = () => {
                if (exitTriggered) return
                exitTriggered = true
                exitTl.play()
            }

            window.addEventListener('wheel', triggerExit)
            window.addEventListener('touchmove', triggerExit)
            window.addEventListener('keydown', triggerExit)
            window.addEventListener('click', triggerExit)

            return () => {
                window.removeEventListener('wheel', triggerExit)
                window.removeEventListener('touchmove', triggerExit)
                window.removeEventListener('keydown', triggerExit)
                window.removeEventListener('click', triggerExit)
            }

        }, containerRef)

        return () => ctx.revert()
    }, [onComplete])

    // --- Canvas Particle System ---
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resizeCanvas()

        interface Particle {
            x: number
            y: number
            size: number
            baseX: number
            baseY: number
            density: number
            opacity: number
            twinkleSpeed: number
        }

        let particles: Particle[] = []

        const initParticles = () => {
            particles = []
            const numberOfParticles = (canvas.width * canvas.height) / 800
            for (let i = 0; i < numberOfParticles; i++) {
                const x = Math.random() * canvas.width
                const y = Math.random() * canvas.height
                particles.push({
                    x,
                    y,
                    baseX: x,
                    baseY: y,
                    size: Math.random() * 1.5 + 0.1,
                    density: (Math.random() * 30) + 1,
                    opacity: Math.random(),
                    twinkleSpeed: Math.random() * 0.02 + 0.005
                })
            }
        }
        initParticles()

        const mouse = { x: -1000, y: -1000, radius: 100 }

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX
            mouse.y = e.clientY
        }
        window.addEventListener('mousemove', handleMouseMove)

        let animationFrameId: number

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            for (let i = 0; i < particles.length; i++) {
                let p = particles[i]

                let dx = mouse.x - p.x
                let dy = mouse.y - p.y
                let distance = Math.sqrt(dx * dx + dy * dy)

                if (distance < mouse.radius) {
                    let forceDirectionX = dx / distance
                    let forceDirectionY = dy / distance
                    let maxDistance = mouse.radius
                    let force = (maxDistance - distance) / maxDistance
                    let directionX = forceDirectionX * force * p.density
                    let directionY = forceDirectionY * force * p.density

                    p.x -= directionX
                    p.y -= directionY
                } else {
                    if (p.x !== p.baseX) {
                        let dx = p.x - p.baseX
                        p.x -= dx / 10
                    }
                    if (p.y !== p.baseY) {
                        let dy = p.y - p.baseY
                        p.y -= dy / 10
                    }
                }

                p.opacity += p.twinkleSpeed;
                if (p.opacity > 1 || p.opacity < 0.2) p.twinkleSpeed *= -1;

                ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(p.opacity)})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            animationFrameId = requestAnimationFrame(animate)
        }
        animate()

        const handleResize = () => {
            resizeCanvas()
            initParticles()
        }
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('resize', handleResize)
            cancelAnimationFrame(animationFrameId)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 9999,
                backgroundColor: '#050505',
                backgroundImage: `
                    linear-gradient(rgba(255, 59, 59, 0.25) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 59, 59, 0.25) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 0 150px rgba(0,0,0,0.9)',
                overflow: 'hidden'
            }}
        >
            {/* Canvas Stars Layer */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                }}
            />


            <div
                ref={contentRef}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '24px',
                    zIndex: 10,
                    marginBottom: '40px',
                    pointerEvents: 'none'
                }}
            >
                <div style={{ position: 'relative' }}>
                    <img
                        ref={logoRef}
                        src={logo}
                        alt="SIO Logo"
                        style={{
                            width: '120px',
                            height: 'auto',
                            filter: 'drop-shadow(0 0 20px rgba(255, 59, 59, 0.2))'
                        }}
                    />

                    {/* ANIMATED LUCIDE ICONS */}
                    <div
                        ref={labIconRef}
                        style={{
                            position: 'absolute',
                            top: -25,
                            right: -25,
                            width: '70px',
                            height: '70px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {/* Container for Animation */}
                        <div className="lab-icon-bouncer" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                            {/* Glass Circle Background */}
                            <div style={{
                                position: 'absolute',
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'radial-gradient(circle at 30% 30%, rgba(255, 59, 59, 0.2), rgba(255, 0, 0, 0.05))',
                                backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(255, 59, 59, 0.3)',
                                boxShadow: '0 0 20px rgba(255, 59, 59, 0.15), inset 0 0 10px rgba(255, 59, 59, 0.1)',
                                zIndex: -1
                            }} />

                            {/* Static Flask Icon */}
                            <div style={{ position: 'relative', marginBottom: '-4px' }}>
                                <FlaskConical size={32} strokeWidth={1.5} color="#FCA5A5" style={{ filter: 'drop-shadow(0 0 10px rgba(255,59,59,0.5))' }} />
                            </div>

                        </div>
                    </div>
                </div>

                <div
                    ref={textRef}
                    style={{
                        fontFamily: '"DM Sans", sans-serif',
                        textAlign: 'center'
                    }}
                >
                    <div style={{
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        color: '#ff3b3b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        justifyContent: 'center'
                    }}>
                        <span style={{ width: '20px', height: '1px', background: 'rgba(255,59,59,0.3)' }}></span>
                        Lab for Members
                        <span style={{ width: '20px', height: '1px', background: 'rgba(255,59,59,0.3)' }}></span>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div
                ref={scrollTextRef}
                style={{
                    position: 'absolute',
                    bottom: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#52525b',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    fontWeight: 500,
                    cursor: 'pointer',
                    zIndex: 20,
                    pointerEvents: 'auto'
                }}
            >
                Scroll to Enter
                <ChevronDown size={20} color="#71717a" />
            </div>
        </div>
    )
}
