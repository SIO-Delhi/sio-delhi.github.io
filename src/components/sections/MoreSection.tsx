
import SectionLayout from '../layout/SectionLayout'
import { FileText, Link, Download, ExternalLink, File, Folder, Book, Globe, MapPin, Phone, Award, Briefcase, Calendar, Clock, Lock, Unlock, Settings, ShoppingBag, ShoppingCart, User, Users, Video, Mic, Music, Layout, Grid, PieChart, BarChart, Heart, Star, Zap, Shield, Flag, Bell, Search, Home, Menu, ArrowRight, ArrowUpRight, CheckCircle, AlertTriangle, Info, Mail } from 'lucide-react'
import { useContent } from '../../context/ContentContext'
import { slugify } from '../../utils/slugify'

const ICON_MAP: Record<string, any> = {
    FileText, Link, Download, ExternalLink, File, Folder, Book, Globe, MapPin, Phone, Mail, Award, Briefcase, Calendar, Clock, Lock, Unlock, Settings, ShoppingBag, ShoppingCart, User, Users, Video, Mic, Music, Layout, Grid, PieChart, BarChart, Heart, Star, Zap, Shield, Flag, Bell, Search, Home, Menu, ArrowRight, ArrowUpRight, CheckCircle, AlertTriangle, Info
}

import { useNavigate } from 'react-router-dom'

export function MoreSection() {
    const navigate = useNavigate()
    const { getPostsBySection } = useContent()
    const resources = getPostsBySection('more').filter(p => p.isPublished)

    // Only render if we have posts
    // if (resources.length === 0) return null // Removed to keep section visible

    const headerContent = (
        <h1
            style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: 700,
                color: '#efc676',
                lineHeight: 1.1,
                margin: 0,
                fontFamily: '"DM Sans", sans-serif',
                letterSpacing: '-0.02em'
            }}
        >
            More <span style={{ color: '#ff3333' }}>Resources</span>
        </h1>
    )

    const renderResourceCard = (item: any) => {
        console.log('Resource Item:', item.title, 'Icon:', item.icon, 'Mapped:', !!ICON_MAP[item.icon])
        const IconComponent = item.icon && ICON_MAP[item.icon] ? ICON_MAP[item.icon] : FileText

        return (
            <div
                key={item.id}
                id={`card-${slugify(item.title)}`}
                data-cursor="view"
                style={{
                    background: 'rgba(255, 255, 255, 0.03)', // Glass transparent
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    // width: '300px', // Removed fixed width for responsiveness
                    minWidth: '280px',
                    flex: 1,
                    maxWidth: '360px',
                    height: '260px', // Smaller height
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    zIndex: 5,
                    isolation: 'isolate',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    padding: '24px',
                    justifyContent: 'center', // Centered alignment
                    alignItems: 'center', // Center align content items
                    textAlign: 'center', // Center text
                    gap: '20px',
                    position: 'relative'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ff3b3b'
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 16px 48px rgba(255, 59, 59, 0.15)'
                    e.currentTarget.style.zIndex = '10'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 59, 59, 0.1)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)'
                    e.currentTarget.style.zIndex = '5'
                }}
                onClick={() => navigate(`/resource/${slugify(item.title)}`)}
                draggable={false}
            >
                {/* Icon */}
                <div style={{
                    color: '#ff3b3b',
                    marginBottom: '8px',
                    display: 'flex', justifyContent: 'center'
                }}>
                    {IconComponent !== FileText ? (
                        <IconComponent size={40} strokeWidth={1.5} />
                    ) : item.icon && (item.icon.includes('/') || item.icon.startsWith('data:')) ? (
                        <img
                            src={item.icon}
                            alt=""
                            style={{
                                width: '40px',
                                height: '40px',
                                objectFit: 'contain',
                                filter: 'brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(339deg) brightness(119%) contrast(119%)' // Attempt to tint red or just keep original
                                // actually, users probably want their original color icon. Let's remove filter for now.
                            }}
                        />
                    ) : (
                        <FileText size={40} strokeWidth={1.5} />
                    )}
                </div>

                {/* Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        color: '#efc676',
                        fontFamily: '"DM Sans", sans-serif',
                        lineHeight: 1.2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {item.title}
                    </h3>
                    <p style={{
                        margin: 0,
                        fontSize: '0.9rem',
                        color: 'rgba(255,255,255,0.5)',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {item.subtitle || 'Read our organizational resource.'}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <SectionLayout id="more" header={headerContent}>
            {resources.length > 0 ? (
                resources.map(renderResourceCard)
            ) : (
                <div style={{
                    padding: '40px',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '1.2rem',
                    border: '1px dashed rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    width: '100%',
                    textAlign: 'center'
                }}>
                    No resources available yet.
                </div>
            )}
        </SectionLayout>
    )
}
