
import { useEffect, useState } from 'react'
import { useContent } from '../../context/ContentContext'
import { Link } from 'react-router-dom'
import { Layers, Plus } from 'lucide-react'

export function Dashboard() {
    const { sections, posts } = useContent()
    const [isMobile, setIsMobile] = useState(false)

    // Detect screen size
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const getPostCount = (sectionId: string) => posts.filter(p => p.sectionId === sectionId).length

    return (
        <div>
            <h1 style={{
                fontSize: isMobile ? '1.75rem' : '2.5rem',
                fontWeight: 800,
                marginBottom: '8px'
            }}>Dashboard</h1>
            <p style={{ color: '#888', marginBottom: isMobile ? '20px' : '32px', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                Welcome to the Content Management System.
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: isMobile ? '16px' : '24px'
            }}>
                {/* Stats Card */}
                <div style={{
                    padding: isMobile ? '20px' : '24px',
                    borderRadius: '16px',
                    background: 'rgba(255, 59, 59, 0.1)',
                    border: '1px solid rgba(255, 59, 59, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <span style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#ff3b3b', fontWeight: 600 }}>TOTAL POSTS</span>
                    <span style={{ fontSize: isMobile ? '2.5rem' : '3.5rem', fontWeight: 800, lineHeight: 1 }}>{posts.length}</span>
                </div>

                {sections.map(section => (
                    <Link
                        key={section.id}
                        to={`/admin/section/${section.id}`}
                        style={{
                            padding: isMobile ? '20px' : '24px',
                            borderRadius: '16px',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'transform 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: isMobile ? '12px' : '16px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)'
                            e.currentTarget.style.borderColor = '#555'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.borderColor = '#333'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{
                                width: isMobile ? '36px' : '40px',
                                height: isMobile ? '36px' : '40px',
                                borderRadius: '10px',
                                background: '#333',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Layers size={isMobile ? 18 : 20} color="#fff" />
                            </div>
                            <div style={{
                                padding: '4px 10px',
                                borderRadius: '100px',
                                background: '#222',
                                fontSize: isMobile ? '0.7rem' : '0.8rem',
                                fontWeight: 600
                            }}>
                                {section.label}
                            </div>
                        </div>

                        <div>
                            <h3 style={{
                                fontSize: isMobile ? '1.1rem' : '1.2rem',
                                fontWeight: 700,
                                margin: '0 0 4px 0'
                            }}>{section.title}</h3>
                            <div style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#888' }}>
                                {getPostCount(section.id)} Posts published
                            </div>
                        </div>

                        <div style={{
                            marginTop: 'auto',
                            paddingTop: isMobile ? '12px' : '16px',
                            borderTop: '1px solid #333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: isMobile ? '0.8rem' : '0.9rem',
                            fontWeight: 500,
                            color: '#ff3b3b'
                        }}>
                            Manage Section <Plus size={14} />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
