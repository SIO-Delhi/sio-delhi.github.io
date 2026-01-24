import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SplitType from 'split-type'

gsap.registerPlugin(ScrollTrigger)

// Hook for registering ScrollTrigger animations with cleanup
export function useScrollTrigger(
    animationFn: (ctx: gsap.Context) => void,
    deps: React.DependencyList = []
) {
    const ref = useRef<HTMLElement>(null)

    useEffect(() => {
        if (!ref.current) return

        const ctx = gsap.context(animationFn, ref.current)
        return () => ctx.revert()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return ref
}

// Hook for split-text animations
export function useSplitText(options?: { type?: 'chars' | 'words' | 'lines' }) {
    const ref = useRef<HTMLElement>(null)
    const splitRef = useRef<SplitType | null>(null)

    useEffect(() => {
        if (!ref.current) return

        splitRef.current = new SplitType(ref.current, {
            types: options?.type || 'chars',
            tagName: 'span',
        })

        return () => {
            splitRef.current?.revert()
        }
    }, [options?.type])

    return { ref, split: splitRef }
}

// Hook for magnetic button effect
export function useMagneticEffect(strength = 0.3) {
    const ref = useRef<HTMLElement>(null)

    useEffect(() => {
        const element = ref.current
        if (!element) return

        const handleMouseMove = (e: MouseEvent) => {
            const rect = element.getBoundingClientRect()
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2

            const deltaX = (e.clientX - centerX) * strength
            const deltaY = (e.clientY - centerY) * strength

            gsap.to(element, {
                x: deltaX,
                y: deltaY,
                duration: 0.3,
                ease: 'power2.out',
            })
        }

        const handleMouseLeave = () => {
            gsap.to(element, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: 'elastic.out(1, 0.3)',
            })
        }

        element.addEventListener('mousemove', handleMouseMove)
        element.addEventListener('mouseleave', handleMouseLeave)

        return () => {
            element.removeEventListener('mousemove', handleMouseMove)
            element.removeEventListener('mouseleave', handleMouseLeave)
        }
    }, [strength])

    return ref
}

// Hook for parallax effect
export function useParallax(speed = 0.5) {
    const ref = useRef<HTMLElement>(null)

    useEffect(() => {
        const element = ref.current
        if (!element) return

        gsap.to(element, {
            yPercent: speed * 100,
            ease: 'none',
            scrollTrigger: {
                trigger: element,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
            },
        })
    }, [speed])

    return ref
}

// Hook for reveal on scroll animation
export function useRevealOnScroll(
    options: {
        direction?: 'up' | 'down' | 'left' | 'right'
        distance?: number
        duration?: number
        delay?: number
        stagger?: number
        selector?: string
    } = {}
) {
    const ref = useRef<HTMLElement>(null)

    const {
        direction = 'up',
        distance = 60,
        duration = 0.8,
        delay = 0,
        stagger = 0.1,
        selector,
    } = options

    useEffect(() => {
        const element = ref.current
        if (!element) return

        const targets = selector ? element.querySelectorAll(selector) : element

        const fromVars: gsap.TweenVars = { opacity: 0 }
        const toVars: gsap.TweenVars = {
            opacity: 1,
            duration,
            delay,
            stagger: selector ? stagger : 0,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: element,
                start: 'top 80%',
                toggleActions: 'play none none none',
            },
        }

        switch (direction) {
            case 'up':
                fromVars.y = distance
                toVars.y = 0
                break
            case 'down':
                fromVars.y = -distance
                toVars.y = 0
                break
            case 'left':
                fromVars.x = distance
                toVars.x = 0
                break
            case 'right':
                fromVars.x = -distance
                toVars.x = 0
                break
        }

        gsap.fromTo(targets, fromVars, toVars)
    }, [direction, distance, duration, delay, stagger, selector])

    return ref
}

// Utility for creating stagger animations
export function createStaggerAnimation(
    elements: string | Element | Element[],
    options: {
        fromVars?: gsap.TweenVars
        toVars?: gsap.TweenVars
        stagger?: number
        scrollTrigger?: ScrollTrigger.Vars
    } = {}
) {
    const {
        fromVars = { opacity: 0, y: 40 },
        toVars = { opacity: 1, y: 0, duration: 0.6 },
        stagger = 0.1,
        scrollTrigger,
    } = options

    return gsap.fromTo(elements, fromVars, {
        ...toVars,
        stagger,
        scrollTrigger,
    })
}

// Create a smooth scroll-linked animation
export const useScrollLinkedAnimation = (
    animationFn: (progress: number) => void,
    options: { start?: string; end?: string } = {}
) => {
    const ref = useRef<HTMLElement>(null)

    const memoizedAnimationFn = useCallback((progress: number) => animationFn(progress), [animationFn])

    useEffect(() => {
        const element = ref.current
        if (!element) return

        ScrollTrigger.create({
            trigger: element,
            start: options.start || 'top bottom',
            end: options.end || 'bottom top',
            scrub: true,
            onUpdate: (self) => memoizedAnimationFn(self.progress),
        })
    }, [options.start, options.end, memoizedAnimationFn])

    return ref
}
