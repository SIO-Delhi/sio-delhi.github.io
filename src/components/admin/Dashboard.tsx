
import { useContent } from '../../context/ContentContext'
import { Link } from 'react-router-dom'
import { Layers, Plus } from 'lucide-react'

export function Dashboard() {
    const { sections, posts } = useContent()

    const getPostCount = (sectionId: string) => posts.filter(p => p.sectionId === sectionId).length

    return (
        <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Dashboard</h1>
            <p style={{ color: '#888', marginBottom: '32px' }}>Welcome to the Content Management System.</p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px'
            }}>
                {/* Stats Card */}
                <div style={{
                    padding: '24px',
                    borderRadius: '16px',
                    background: 'rgba(255, 59, 59, 0.1)',
                    border: '1px solid rgba(255, 59, 59, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <span style={{ fontSize: '0.9rem', color: '#ff3b3b', fontWeight: 600 }}>TOTAL POSTS</span>
                    <span style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1 }}>{posts.length}</span>
                </div>

                {sections.map(section => (
                    <Link
                        key={section.id}
                        to={`/admin/section/${section.id}`}
                        style={{
                            padding: '24px',
                            borderRadius: '16px',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'transform 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
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
                                width: '40px', height: '40px', borderRadius: '10px', background: '#333',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Layers size={20} color="#fff" />
                            </div>
                            <div style={{
                                padding: '4px 12px', borderRadius: '100px', background: '#222',
                                fontSize: '0.8rem', fontWeight: 600
                            }}>
                                {section.label}
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px 0' }}>{section.title}</h3>
                            <div style={{ fontSize: '0.9rem', color: '#888' }}>
                                {getPostCount(section.id)} Posts published
                            </div>
                        </div>

                        <div style={{
                            marginTop: 'auto',
                            paddingTop: '16px',
                            borderTop: '1px solid #333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            color: '#ff3b3b'
                        }}>
                            Manage Section <Plus size={16} />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
