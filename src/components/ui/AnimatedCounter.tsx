import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface AnimatedCounterProps {
    value: number
    suffix?: string
    prefix?: string
    duration?: number
}

export function AnimatedCounter({ value, suffix = '', prefix = '', duration = 2 }: AnimatedCounterProps) {
    const [displayValue, setDisplayValue] = useState(0)
    const containerRef = useRef<HTMLSpanElement>(null)
    const hasAnimated = useRef(false)

    useEffect(() => {
        if (!containerRef.current || hasAnimated.current) return

        const trigger = ScrollTrigger.create({
            trigger: containerRef.current,
            start: 'top 90%',
            onEnter: () => {
                if (hasAnimated.current) return
                hasAnimated.current = true

                gsap.to({ val: 0 }, {
                    val: value,
                    duration: duration,
                    ease: 'power2.out',
                    onUpdate: function () {
                        setDisplayValue(Math.floor(this.targets()[0].val))
                    },
                })
            },
        })

        return () => trigger.kill()
    }, [value, duration])

    return (
        <span ref={containerRef} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {prefix}{displayValue}{suffix}
        </span>
    )
}
