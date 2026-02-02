
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
        loading: boolean;
    }>({ totals: null, pages: [], trend: [], loading: true })
    const [locations, setLocations] = useState<{
        locations: { city: string; region: string; country: string; lat: number; lon: number; visit_count: number; unique_visitors: number }[];
        countries: { country: string; visit_count: number; unique_visitors: number }[];
        loading: boolean;
    }>({ locations: [], countries: [], loading: true })

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        fetch(`${API_BASE}/analytics/stats`)
            .then(res => res.json())
            .then(data => setAnalytics({ totals: data.totals, pages: data.pages || [], trend: data.trend || [], loading: false }))
            .catch(() => setAnalytics(prev => ({ ...prev, loading: false })))

        fetch(`${API_BASE}/analytics/locations`)
            .then(res => res.json())
            .then(data => setLocations({ locations: data.locations || [], countries: data.countries || [], loading: false }))
            .catch(() => setLocations(prev => ({ ...prev, loading: false })))
    }, [])

    const getPageLabel = (page: string) => {
        const labels: Record<string, string> = {
            '/': 'Home',
            '/utilities': 'Utilities',
            '/utilities/poster-tool': 'Poster Maker',
            '/utilities/frame-tool': 'Frame Tool',
            '/utilities/filter-tool': 'Filter Tool',
        }
        return labels[page] || page
    }

    const maxVisitCount = Math.max(...locations.locations.map(l => l.visit_count), 1)

    return (
        <div>
            <h1 style={{
                fontSize: isMobile ? '1.75rem' : '2.5rem',
                fontWeight: 800,
                marginBottom: '8px'
            }}>Page Analytics</h1>
            <p style={{ color: '#888', marginBottom: isMobile ? '20px' : '32px', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                Track visitor activity and geographic distribution.
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

                        {/* Per-page breakdown */}
                        {analytics.pages.length > 0 && (
                            <div style={{ borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr auto auto' : '2fr 1fr 1fr 1fr',
                                    padding: '12px 16px',
                                    background: 'rgba(255,255,255,0.03)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: '#888',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    <span>Page</span>
                                    <span style={{ textAlign: 'center' }}>Total</span>
                                    <span style={{ textAlign: 'center' }}>Unique</span>
                                    {!isMobile && <span style={{ textAlign: 'center' }}>Today</span>}
                                </div>
                                {analytics.pages.map((page, i) => (
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
                            </div>
                        )}

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
                                <span style={{ textAlign: 'center' }}>Visits</span>
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
