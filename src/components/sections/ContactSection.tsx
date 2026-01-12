import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SplitType from 'split-type'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Send, CheckCircle } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { useTheme } from '../../context/ThemeContext'

gsap.registerPlugin(ScrollTrigger)

const contactSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    subject: z.string().min(5, 'Subject must be at least 5 characters'),
    message: z.string().min(20, 'Message must be at least 20 characters'),
})

type ContactForm = z.infer<typeof contactSchema>

export function ContactSection() {
    const sectionRef = useRef<HTMLElement>(null)
    const headingRef = useRef<HTMLHeadingElement>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const { isDark } = useTheme()

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ContactForm>({
        resolver: zodResolver(contactSchema),
    })

    useEffect(() => {
        const ctx = gsap.context(() => {
            const headingSplit = new SplitType(headingRef.current!, {
                types: 'chars',
                tagName: 'span',
            })

            gsap.fromTo(
                headingSplit.chars,
                { opacity: 0, y: 40 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.02,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: headingRef.current,
                        start: 'top 80%',
                    },
                }
            )

            gsap.fromTo(
                '.contact-form',
                { opacity: 0, y: 40 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    scrollTrigger: {
                        trigger: '.contact-form',
                        start: 'top 75%',
                    },
                }
            )

            return () => headingSplit.revert()
        }, sectionRef)

        return () => ctx.revert()
    }, [])

    const onSubmit = async (data: ContactForm) => {
        setIsSubmitting(true)
        await new Promise((resolve) => setTimeout(resolve, 1500))
        console.log('Form submitted:', data)
        toast.success('Message sent! We will get back to you soon.')
        reset()
        setIsSubmitted(true)
        setTimeout(() => setIsSubmitted(false), 3000)
        setIsSubmitting(false)
    }

    const inputStyle: React.CSSProperties = {
        width: '100%',
        height: '40px',
        padding: '0 12px',
        borderRadius: '10px',
        background: isDark ? 'rgba(187, 187, 187, 0.15)' : 'rgba(0, 0, 0, 0.05)',
        border: isDark ? '1px solid rgba(136, 136, 136, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
        color: isDark ? '#ffffff' : '#111111',
        fontSize: '14px',
        outline: 'none',
        transition: 'all 0.3s ease',
    }

    return (
        <section
            id="contact"
            ref={sectionRef}
            style={{
                padding: '96px 0',
                background: 'transparent',
                transition: 'background 0.3s ease',
            }}
        >
            <Toaster position="top-center" richColors />

            <div className="container">
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '64px',
                }}>
                    {/* Header */}
                    <div>
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 20px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '100px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                marginBottom: '24px',
                            }}
                        >
                            <div
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#ff3b3b',
                                }}
                            />
                            <span
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: '#ffffff',
                                }}
                            >
                                Contact Us
                            </span>
                        </div>
                        <p style={{
                            color: isDark ? '#999999' : '#666666',
                            fontSize: '18px',
                            maxWidth: '500px',
                            lineHeight: 1.6,
                            transition: 'color 0.3s ease',
                        }}>
                            Have a question or want to get involved? We'd love to hear from you. Connect with us to make a difference.
                        </p>
                    </div>

                    {/* Form */}
                    <form
                        className="contact-form"
                        onSubmit={handleSubmit(onSubmit)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            maxWidth: '620px',
                        }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            {/* Name */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label
                                    htmlFor="name"
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        color: isDark ? '#ffffff' : '#111111',
                                        transition: 'color 0.3s ease',
                                    }}
                                >
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    {...register('name')}
                                    style={inputStyle}
                                    placeholder="John Doe"
                                />
                                {errors.name && (
                                    <p style={{ color: '#f43f5e', fontSize: '12px' }}>{errors.name.message}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label
                                    htmlFor="email"
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        color: isDark ? '#ffffff' : '#111111',
                                        transition: 'color 0.3s ease',
                                    }}
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    {...register('email')}
                                    style={inputStyle}
                                    placeholder="john@example.com"
                                />
                                {errors.email && (
                                    <p style={{ color: '#f43f5e', fontSize: '12px' }}>{errors.email.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Subject */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label
                                htmlFor="subject"
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: isDark ? '#ffffff' : '#111111',
                                    transition: 'color 0.3s ease',
                                }}
                            >
                                Subject
                            </label>
                            <input
                                id="subject"
                                type="text"
                                {...register('subject')}
                                style={inputStyle}
                                placeholder="How can we help?"
                            />
                            {errors.subject && (
                                <p style={{ color: '#f43f5e', fontSize: '12px' }}>{errors.subject.message}</p>
                            )}
                        </div>

                        {/* Message */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label
                                htmlFor="message"
                                style={{
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: isDark ? '#ffffff' : '#111111',
                                    transition: 'color 0.3s ease',
                                }}
                            >
                                Message
                            </label>
                            <textarea
                                id="message"
                                {...register('message')}
                                style={{
                                    ...inputStyle,
                                    height: 'auto',
                                    minHeight: '100px',
                                    padding: '12px',
                                    resize: 'vertical',
                                }}
                                placeholder="Your message here..."
                            />
                            {errors.message && (
                                <p style={{ color: '#f43f5e', fontSize: '12px' }}>{errors.message.message}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                width: '100%',
                                height: '40px',
                                padding: '16px 28px',
                                borderRadius: '118px',
                                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                                color: isDark ? '#ffffff' : '#111111',
                                fontWeight: 500,
                                fontSize: '16px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                opacity: isSubmitting ? 0.7 : 1,
                                transition: 'all 0.3s ease',
                            }}
                        >
                            {isSubmitting ? (
                                'Sending...'
                            ) : isSubmitted ? (
                                <>
                                    <CheckCircle size={16} />
                                    Sent!
                                </>
                            ) : (
                                <>
                                    Send Message
                                    <Send size={16} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    )
}
