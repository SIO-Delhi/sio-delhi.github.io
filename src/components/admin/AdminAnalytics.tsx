
import { useEffect, useState } from 'react'
import { BarChart3, Eye, Users, TrendingUp, MapPin, Loader2 } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.siodelhi.org'

export function AdminAnalytics() {
    const [isMobile, setIsMobile] = useState(false)
    const [analytics, setAnalytics] = useState<{
        totals: { total_visits: number; unique_visitors: number; today_visits: number } | null;
        pages: { page: string; total_visits: number; unique_visitors: number; today_visits: number; first_visit: string; last_visit: string }[];
        trend: { visit_date: string; visits: number; unique_visitors: number }[];
        browsers?: { browser: string; count: number }[];
        oss?: { os: string; count: number }[];
        referrers?: { referrer: string; count: number }[];
        isps?: { isp: string; count: number }[];
        organizations?: { organization: string; count: number }[];
        loading: boolean;
    }>({ totals: null, pages: [], trend: [], loading: true })
    const [locations, setLocations] = useState<{
        locations: { city: string; region: string; country: string; lat: number; lon: number; visit_count: number; unique_visitors: number }[];
        countries: { country: string; visit_count: number; unique_visitors: number }[];
        loading: boolean;
    }>({ locations: [], countries: [], loading: true })

    const [isPagesExpanded, setIsPagesExpanded] = useState(true)
    const [sortBy, setSortBy] = useState<'total' | 'unique' | 'today'>('total')
    const [page, setPage] = useState(1)
    const [isAudienceExpanded, setIsAudienceExpanded] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const itemsPerPage = 7

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        fetch(`${API_BASE}/analytics/stats`)
            .then(res => res.json())
            .then(data => setAnalytics({
                totals: data.totals,
                pages: data.pages || [],
                trend: data.trend || [],
                browsers: data.browsers || [],
                oss: data.oss || [],
                referrers: data.referrers || [],
                isps: data.isps || [],
                organizations: data.organizations || [],
                loading: false
            }))
            .catch(() => setAnalytics(prev => ({ ...prev, loading: false })))

        fetch(`${API_BASE}/analytics/locations`)
            .then(res => res.json())
            .then(data => setLocations({ locations: data.locations || [], countries: data.countries || [], loading: false }))
            .catch(() => setLocations(prev => ({ ...prev, loading: false })))
    }, [])

    const getPageLabel = (pagePath: string) => {
        const labels: Record<string, string> = {
            '/': 'Home',
            '/utilities': 'Utilities',
            '/utilities/poster-tool': 'Poster Maker',
            '/utilities/frame-tool': 'Frame Tool',
            '/utilities/filter-tool': 'Filter Tool',
        }
        return labels[pagePath] || pagePath
    }

    const filteredPages = analytics.pages.filter(p =>
        getPageLabel(p.page).toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.page.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const sortedPages = [...filteredPages].sort((a, b) => {
        if (sortBy === 'unique') return b.unique_visitors - a.unique_visitors;
        if (sortBy === 'today') return b.today_visits - a.today_visits;
        return b.total_visits - a.total_visits;
    })

    const totalPages = Math.ceil(sortedPages.length / itemsPerPage)
    const paginatedPages = sortedPages.slice((page - 1) * itemsPerPage, page * itemsPerPage)

    // Reset page when sorting or searching changes
    useEffect(() => {
        setPage(1)
    }, [sortBy, searchQuery])



    // Helper for simple listing tables
    const SimpleTable = ({ title, icon: Icon, color, data }: { title: string, icon: any, color: string, data: { name: string, count: number }[] }) => (
        <div style={{
            borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
        }}>
            <div style={{
                padding: '12px 16px', background: 'rgba(255,255,255,0.03)',
                display: 'flex', alignItems: 'center', gap: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.04)'
            }}>
                <Icon size={14} color={color} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {title}
                </span>
            </div>
            <div style={{ flex: 1 }}>
                {data.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#666', fontSize: '0.8rem' }}>No data</div>
                ) : (
                    data.map((item, i) => (
                        <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 16px',
                            borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                            background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                        }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#eee', maxWidth: '80%' }}>
                                {item.name || 'Unknown'}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: color }}>
                                {item.count}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    )

    return (
        <div>
            <h1 style={{
                fontSize: isMobile ? '1.75rem' : '2.5rem',
                fontWeight: 800,
                marginBottom: '8px'
            }}>Page Analytics</h1>
            <p style={{ color: '#888', marginBottom: isMobile ? '20px' : '32px', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                Track visitor activity, demographics, and network sources.
            </p>

            {/* Page Analytics Section */}
            <div style={{
                marginBottom: isMobile ? '24px' : '32px',
                padding: isMobile ? '20px' : '28px',
                borderRadius: '20px',
                background: 'linear-gradient(145deg, rgba(20, 20, 25, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <BarChart3 size={20} color="#000" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 700, margin: 0 }}>Visit Statistics</h2>
                        <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>Unique visitors per page per day</p>
                    </div>
                </div>

                {analytics.loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                            gap: '16px',
                            marginBottom: '24px'
                        }}>
                            <div style={{
                                padding: '16px 20px', borderRadius: '14px',
                                background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <Eye size={16} color="#f59e0b" />
                                    <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600, textTransform: 'uppercase' }}>Total Visits</span>
                                </div>
                                <span style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 800, lineHeight: 1 }}>
                                    {analytics.totals?.total_visits || 0}
                                </span>
                            </div>
                            <div style={{
                                padding: '16px 20px', borderRadius: '14px',
                                background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <Users size={16} color="#3b82f6" />
                                    <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase' }}>Unique Visitors</span>
                                </div>
                                <span style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 800, lineHeight: 1 }}>
                                    {analytics.totals?.unique_visitors || 0}
                                </span>
                            </div>
                            <div style={{
                                padding: '16px 20px', borderRadius: '14px',
                                background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <TrendingUp size={16} color="#10b981" />
                                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, textTransform: 'uppercase' }}>Today</span>
                                </div>
                                <span style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 800, lineHeight: 1 }}>
                                    {analytics.totals?.today_visits || 0}
                                </span>
                            </div>
                        </div>

                        {/* Collapsible Page Analytics Section */}
                        <div style={{
                            borderRadius: '14px',
                            border: '1px solid rgba(255,255,255,0.06)',
                            overflow: 'hidden',
                            marginTop: '24px'
                        }}>
                            <div
                                style={{
                                    padding: '16px 20px',
                                    background: 'rgba(255,255,255,0.03)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    userSelect: 'none'
                                }}
                                onClick={() => setIsPagesExpanded(!isPagesExpanded)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        padding: '6px',
                                        borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.05)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <TrendingUp size={16} color="#ddd" />
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#eee' }}>Page Performance</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {isPagesExpanded && (
                                        <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Search pages..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    style={{
                                                        background: '#1a1a20',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: '6px',
                                                        color: '#ddd',
                                                        fontSize: '0.8rem',
                                                        padding: '6px 12px',
                                                        outline: 'none',
                                                        width: isMobile ? '100px' : '150px'
                                                    }}
                                                />
                                            </div>
                                            <div style={{ position: 'relative' }}>
                                                <select
                                                    value={sortBy}
                                                    onChange={(e) => setSortBy(e.target.value as any)}
                                                    style={{
                                                        appearance: 'none',
                                                        background: '#1a1a20',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: '6px',
                                                        color: '#ddd',
                                                        fontSize: '0.8rem',
                                                        padding: '6px 28px 6px 12px',
                                                        outline: 'none',
                                                        cursor: 'pointer',
                                                        minWidth: '130px'
                                                    }}
                                                >
                                                    <option value="total" style={{ background: '#1a1a20', color: '#ddd' }}>Most Visited</option>
                                                    <option value="unique" style={{ background: '#1a1a20', color: '#ddd' }}>Most Unique</option>
                                                    <option value="today" style={{ background: '#1a1a20', color: '#ddd' }}>Trending Today</option>
                                                </select>
                                                <div style={{ pointerEvents: 'none', position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ transform: isPagesExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', cursor: 'pointer' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#888' }}><path d="M6 9l6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>

                            {isPagesExpanded && (
                                <div>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: isMobile ? '1fr auto auto' : '2fr 1fr 1fr 1fr',
                                        padding: '12px 16px',
                                        background: 'rgba(0,0,0,0.2)',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: '#888',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        borderTop: '1px solid rgba(255,255,255,0.04)'
                                    }}>
                                        <span>Page</span>
                                        <span style={{ textAlign: 'center' }}>Total</span>
                                        <span style={{ textAlign: 'center' }}>Unique</span>
                                        {!isMobile && <span style={{ textAlign: 'center' }}>Today</span>}
                                    </div>

                                    {paginatedPages.map((page, i) => (
                                        <div key={page.page} style={{
                                            display: 'grid',
                                            gridTemplateColumns: isMobile ? '1fr auto auto' : '2fr 1fr 1fr 1fr',
                                            padding: '14px 16px',
                                            borderTop: '1px solid rgba(255,255,255,0.04)',
                                            background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{ fontWeight: 600, fontSize: isMobile ? '0.85rem' : '0.95rem' }}>
                                                {getPageLabel(page.page)}
                                            </span>
                                            <span style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                                                {page.total_visits}
                                            </span>
                                            <span style={{ textAlign: 'center', color: '#3b82f6', fontWeight: 600 }}>
                                                {page.unique_visitors}
                                            </span>
                                            {!isMobile && (
                                                <span style={{ textAlign: 'center', color: '#10b981', fontWeight: 600 }}>
                                                    {page.today_visits}
                                                </span>
                                            )}
                                        </div>
                                    ))}

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '16px',
                                            borderTop: '1px solid rgba(255,255,255,0.04)'
                                        }}>
                                            <button
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: 'none',
                                                    color: page === 1 ? '#666' : '#eee',
                                                    cursor: page === 1 ? 'default' : 'pointer',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                Previous
                                            </button>
                                            <span style={{ fontSize: '0.85rem', color: '#888' }}>
                                                Page <span style={{ color: '#eee' }}>{page}</span> of {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                disabled={page === totalPages}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: 'none',
                                                    color: page === totalPages ? '#666' : '#eee',
                                                    cursor: page === totalPages ? 'default' : 'pointer',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}

                                    {analytics.pages.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '32px', color: '#666', fontSize: '0.9rem' }}>
                                            No page data yet.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* New Audience & Network Metrics */}
                        <div style={{
                            marginTop: '24px',
                            borderRadius: '14px',
                            border: '1px solid rgba(255,255,255,0.06)',
                            overflow: 'hidden'
                        }}>
                            <div
                                style={{
                                    padding: '16px 20px',
                                    background: 'rgba(255,255,255,0.03)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    userSelect: 'none'
                                }}
                                onClick={() => setIsAudienceExpanded(!isAudienceExpanded)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Users size={16} color="#bbb" />
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#ddd' }}>Audience & Network</h3>
                                </div>
                                <div style={{ transform: isAudienceExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#888' }}><path d="M6 9l6 6 6-6" /></svg>
                                </div>
                            </div>

                            {isAudienceExpanded && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
                                    gap: '16px',
                                    padding: '20px'
                                }}>
                                    <SimpleTable
                                        title="Top Browsers"
                                        icon={BarChart3}
                                        color="#3b82f6"
                                        data={analytics.browsers?.map(b => ({ name: b.browser, count: b.count })) || []}
                                    />
                                    <SimpleTable
                                        title="Top OS"
                                        icon={MapPin}
                                        color="#10b981"
                                        data={analytics.oss?.map(o => ({ name: o.os, count: o.count })) || []}
                                    />
                                    <SimpleTable
                                        title="Referrers"
                                        icon={TrendingUp}
                                        color="#f59e0b"
                                        data={analytics.referrers?.map(r => ({ name: r.referrer, count: r.count })) || []}
                                    />
                                    <SimpleTable
                                        title="Top ISPs"
                                        icon={TrendingUp}
                                        color="#8b5cf6"
                                        data={analytics.isps?.map(i => ({ name: i.isp, count: i.count })) || []}
                                    />
                                    <SimpleTable
                                        title="Organizations"
                                        icon={Users}
                                        color="#ec4899"
                                        data={analytics.organizations?.map(o => ({ name: o.organization, count: o.count })) || []}
                                    />
                                </div>
                            )}
                        </div>

                        {analytics.pages.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '32px', color: '#666', fontSize: '0.9rem' }}>
                                No visits recorded yet. Analytics will appear as visitors browse the site.
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Visitor Map Section */}
            <div style={{
                marginBottom: isMobile ? '24px' : '32px',
                padding: isMobile ? '20px' : '28px',
                borderRadius: '20px',
                background: 'linear-gradient(145deg, rgba(20, 20, 25, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <MapPin size={20} color="#fff" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 700, margin: 0 }}>Visitor Map</h2>
                        <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>Geographic distribution of visitors</p>
                    </div>
                </div>

                {locations.loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : locations.locations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#666', fontSize: '0.9rem' }}>
                        No location data yet. Visitor locations will appear as people browse the site.
                    </div>
                ) : (
                    <>
                        {/* Interactive Leaflet Map */}
                        <div style={{
                            borderRadius: '14px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.06)',
                            marginBottom: '20px',
                            height: isMobile ? '300px' : '450px'
                        }}>
                            <MapContainer
                                center={[20, 78]}
                                zoom={3}
                                minZoom={2.5}
                                maxZoom={18}
                                style={{ height: '100%', width: '100%', background: '#0a0a14' }}
                                scrollWheelZoom={true}
                                zoomSnap={0.25}
                                zoomDelta={0.5}
                                wheelDebounceTime={80}
                                wheelPxPerZoomLevel={120}
                                attributionControl={false}
                                maxBounds={[[-85, -180], [85, 180]]}
                                maxBoundsViscosity={1.0}
                            >
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                    noWrap={true}
                                />
                                {locations.locations.map((loc, i) => {
                                    // Absolute scaling: sqrt for visual proportionality, capped at reasonable range
                                    const radius = Math.max(5, Math.min(18, 3 + Math.sqrt(loc.visit_count) * 2.5))
                                    return (
                                        <CircleMarker
                                            key={`${loc.lat}-${loc.lon}-${i}`}
                                            center={[loc.lat, loc.lon]}
                                            radius={radius}
                                            pathOptions={{
                                                fillColor: '#f59e0b',
                                                fillOpacity: 0.6,
                                                color: '#f59e0b',
                                                weight: 1.5,
                                                opacity: 0.9
                                            }}
                                        >
                                            <Tooltip direction="top" offset={[0, -radius]} opacity={0.95}>
                                                <div style={{ fontFamily: 'system-ui', fontSize: '12px', lineHeight: 1.4 }}>
                                                    <strong>{loc.city || 'Unknown'}{loc.region ? `, ${loc.region}` : ''}</strong>
                                                    <span style={{ color: '#888' }}> ({loc.country})</span>
                                                    <br />
                                                    <span style={{ color: '#f59e0b' }}>{loc.visit_count} visits</span>
                                                    {' · '}
                                                    <span style={{ color: '#3b82f6' }}>{loc.unique_visitors} unique</span>
                                                </div>
                                            </Tooltip>
                                        </CircleMarker>
                                    )
                                })}
                            </MapContainer>
                        </div>

                        {/* Top Locations Table */}
                        <div style={{ borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: isMobile ? '1fr auto' : '2fr 1fr 1fr',
                                padding: '12px 16px',
                                background: 'rgba(255,255,255,0.03)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: '#888',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                <span>Location</span>
                                <span>Visits</span>
                                {!isMobile && <span style={{ textAlign: 'center' }}>Unique</span>}
                            </div>
                            {locations.locations.slice(0, 10).map((loc, i) => (
                                <div key={`${loc.city}-${loc.country}-${i}`} style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr auto' : '2fr 1fr 1fr',
                                    padding: '14px 16px',
                                    borderTop: '1px solid rgba(255,255,255,0.04)',
                                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ fontWeight: 600, fontSize: isMobile ? '0.85rem' : '0.95rem' }}>
                                        {loc.city || 'Unknown'}{loc.region ? `, ${loc.region}` : ''} <span style={{ color: '#888', fontWeight: 400 }}>({loc.country})</span>
                                    </span>
                                    <span style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                                        {loc.visit_count}
                                    </span>
                                    {!isMobile && (
                                        <span style={{ textAlign: 'center', color: '#3b82f6', fontWeight: 600 }}>
                                            {loc.unique_visitors}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
