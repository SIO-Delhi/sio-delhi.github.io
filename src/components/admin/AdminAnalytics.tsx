
import { useEffect, useState, useCallback } from 'react'
import { BarChart3, Eye, Users, TrendingUp, MapPin, Loader2, Clock, LogOut, UserPlus, UserCheck, Smartphone, Download, ArrowUpRight, ArrowDownRight, Radio, Navigation } from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.siodelhi.org'

// Country code to emoji flag
const countryFlag = (code: string) => {
    if (!code || code.length !== 2) return ''
    return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))
}

export function AdminAnalytics() {
    const [isMobile, setIsMobile] = useState(false)
    const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null })
    const [trendDays, setTrendDays] = useState<7 | 30 | 90>(7)
    const [liveCount, setLiveCount] = useState<number | null>(null)
    const [analytics, setAnalytics] = useState<{
        totals: { total_visits: number; unique_visitors: number; today_visits: number; avg_duration: number | null } | null;
        pages: { page: string; total_visits: number; unique_visitors: number; today_visits: number; first_visit: string; last_visit: string; avg_duration: number | null }[];
        trend: { visit_date: string; visits: number; unique_visitors: number }[];
        browsers?: { browser: string; count: number }[];
        oss?: { os: string; count: number }[];
        referrers?: { referrer: string; count: number }[];
        isps?: { isp: string; count: number }[];
        organizations?: { organization: string; count: number }[];
        devices?: { device_type: string; count: number }[];
        prev_period?: { prev_visits: number; prev_unique: number; curr_visits: number; curr_unique: number };
        bounce_rate?: number;
        new_vs_returning?: { new: number; returning: number };
        heatmap?: { dow: number; hour: number; count: number }[];
        landing_pages?: { page: string; count: number }[];
        page_flows?: { from_page: string; to_page: string; count: number }[];
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
    const [isHeatmapExpanded, setIsHeatmapExpanded] = useState(false)
    const [isLandingExpanded, setIsLandingExpanded] = useState(false)
    const [isFlowExpanded, setIsFlowExpanded] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const itemsPerPage = 7

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const buildQueryString = useCallback(() => {
        const params = new URLSearchParams()
        if (dateRange.from) params.set('from', dateRange.from)
        if (dateRange.to) params.set('to', dateRange.to)
        params.set('trend_days', String(trendDays))
        const str = params.toString()
        return str ? `?${str}` : ''
    }, [dateRange, trendDays])

    const fetchData = useCallback(() => {
        const qs = buildQueryString()
        setAnalytics(prev => ({ ...prev, loading: true }))
        setLocations(prev => ({ ...prev, loading: true }))

        fetch(`${API_BASE}/analytics/stats${qs}`)
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
                devices: data.devices || [],
                prev_period: data.prev_period || null,
                bounce_rate: data.bounce_rate ?? null,
                new_vs_returning: data.new_vs_returning || null,
                heatmap: data.heatmap || [],
                landing_pages: data.landing_pages || [],
                page_flows: data.page_flows || [],
                loading: false
            }))
            .catch(() => setAnalytics(prev => ({ ...prev, loading: false })))

        const locQs = new URLSearchParams()
        if (dateRange.from) locQs.set('from', dateRange.from)
        if (dateRange.to) locQs.set('to', dateRange.to)
        const locQsStr = locQs.toString()
        fetch(`${API_BASE}/analytics/locations${locQsStr ? `?${locQsStr}` : ''}`)
            .then(res => res.json())
            .then(data => setLocations({ locations: data.locations || [], countries: data.countries || [], loading: false }))
            .catch(() => setLocations(prev => ({ ...prev, loading: false })))
    }, [buildQueryString, dateRange])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Live visitors polling
    useEffect(() => {
        const fetchLive = () => {
            fetch(`${API_BASE}/analytics/live`)
                .then(res => res.json())
                .then(data => setLiveCount(data.live_count ?? 0))
                .catch(() => {})
        }
        fetchLive()
        const interval = setInterval(fetchLive, 30000)
        return () => clearInterval(interval)
    }, [])

    const getPageLabel = (pagePath: string) => {
        const labels: Record<string, string> = {
            '/': 'Home',
            '/utilities': 'Utilities',
            '/utilities/': 'Utilities',
            '/utilities/poster-tool': 'Poster Maker',
            '/utilities/frame-tool': 'Frame Tool',
            '/utilities/filter-tool': 'Filter Tool',
        }
        if (labels[pagePath]) return labels[pagePath]

        const slugToTitle = (slug: string) =>
            slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

        const patterns: [RegExp, (m: RegExpMatchArray) => string][] = [
            [/^\/about-us\/(.+?)\/gallery$/, m => `${slugToTitle(m[1])} — Gallery`],
            [/^\/about-us\/(.+)$/, m => slugToTitle(m[1])],
            [/^\/initiative\/(.+?)\/gallery$/, m => `${slugToTitle(m[1])} — Gallery`],
            [/^\/initiative\/(.+)$/, m => slugToTitle(m[1])],
            [/^\/media\/(.+?)\/gallery$/, m => `${slugToTitle(m[1])} — Gallery`],
            [/^\/media\/(.+)$/, m => slugToTitle(m[1])],
            [/^\/leader\/(.+?)\/gallery$/, m => `${slugToTitle(m[1])} — Gallery`],
            [/^\/leader\/(.+)$/, m => slugToTitle(m[1])],
            [/^\/resource\/(.+?)\/gallery$/, m => `${slugToTitle(m[1])} — Gallery`],
            [/^\/resource\/(.+)$/, m => slugToTitle(m[1])],
            [/^\/section\/[^/]+\/(.+?)\/gallery$/, m => `${slugToTitle(m[1])} — Gallery`],
            [/^\/section\/[^/]+\/(.+)$/, m => slugToTitle(m[1])],
            [/^\/f\/(.+)$/, m => `Form: ${m[1].slice(0, 8)}...`],
        ]

        for (const [regex, formatter] of patterns) {
            const match = pagePath.match(regex)
            if (match) return formatter(match)
        }

        return pagePath
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

    useEffect(() => {
        setPage(1)
    }, [sortBy, searchQuery])

    const formatDuration = (seconds: number | null) => {
        if (!seconds || seconds <= 0) return '—'
        if (seconds < 60) return `${seconds}s`
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return s > 0 ? `${m}m ${s}s` : `${m}m`
    }

    const pctChange = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0
        return Math.round(((curr - prev) / prev) * 100)
    }

    const exportCsv = () => {
        const headers = ['Page', 'Path', 'Total Visits', 'Unique Visitors', 'Today Visits', 'Avg Duration (s)']
        const rows = analytics.pages.map(p => [
            getPageLabel(p.page), p.page, p.total_visits, p.unique_visitors, p.today_visits, p.avg_duration ?? ''
        ])
        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    // Date range presets
    const setPreset = (preset: 'all' | '7d' | '30d' | '90d') => {
        if (preset === 'all') {
            setDateRange({ from: null, to: null })
        } else {
            const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90
            const to = new Date().toISOString().split('T')[0]
            const from = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]
            setDateRange({ from, to })
        }
    }

    const activePreset = (() => {
        if (!dateRange.from && !dateRange.to) return 'all'
        const today = new Date().toISOString().split('T')[0]
        if (dateRange.to !== today) return null
        const diff = Math.round((Date.now() - new Date(dateRange.from!).getTime()) / 86400000)
        if (diff === 7) return '7d'
        if (diff === 30) return '30d'
        if (diff === 90) return '90d'
        return null
    })()

    // Heatmap helpers
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const SimpleTable = ({ title, icon: Icon, color, data }: { title: string, icon: React.ComponentType<{ size?: number; color?: string }>, color: string, data: { name: string, count: number }[] }) => (
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

    const chevron = (expanded: boolean) => (
        <div style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#888' }}><path d="M6 9l6 6 6-6" /></svg>
        </div>
    )

    const sectionHeader = (icon: React.ReactNode, title: string, expanded: boolean, toggle: () => void, extra?: React.ReactNode) => (
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
            onClick={toggle}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {icon}
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#eee' }}>{title}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {extra}
                {chevron(expanded)}
            </div>
        </div>
    )

    return (
        <div>
            {/* Header with live badge and CSV export */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Page Analytics</h1>
                    <p style={{ color: '#888', marginBottom: 0, fontSize: isMobile ? '0.9rem' : '1rem' }}>
                        Track visitor activity, demographics, and network sources.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    {liveCount !== null && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 14px', borderRadius: '20px',
                            background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}>
                            <div style={{
                                width: '8px', height: '8px', borderRadius: '50%', background: '#10b981',
                                boxShadow: '0 0 6px #10b981',
                                animation: 'pulse 2s infinite'
                            }} />
                            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                                {liveCount} online now
                            </span>
                        </div>
                    )}
                    <button
                        onClick={exportCsv}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '10px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#ccc', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
                        }}
                    >
                        <Download size={14} />
                        CSV
                    </button>
                </div>
            </div>

            {/* Date Range Picker */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
                marginBottom: isMobile ? '20px' : '28px'
            }}>
                {(['all', '7d', '30d', '90d'] as const).map(preset => (
                    <button
                        key={preset}
                        onClick={() => setPreset(preset)}
                        style={{
                            padding: '6px 14px', borderRadius: '8px',
                            background: activePreset === preset ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${activePreset === preset ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255,255,255,0.08)'}`,
                            color: activePreset === preset ? '#f59e0b' : '#999',
                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
                        }}
                    >
                        {preset === 'all' ? 'All Time' : preset}
                    </button>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
                    <input
                        type="date"
                        value={dateRange.from || ''}
                        onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value || null }))}
                        style={{
                            background: '#1a1a20', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px', color: '#ddd', fontSize: '0.8rem', padding: '6px 8px', outline: 'none'
                        }}
                    />
                    <span style={{ color: '#666', fontSize: '0.8rem' }}>to</span>
                    <input
                        type="date"
                        value={dateRange.to || ''}
                        onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value || null }))}
                        style={{
                            background: '#1a1a20', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px', color: '#ddd', fontSize: '0.8rem', padding: '6px 8px', outline: 'none'
                        }}
                    />
                </div>
            </div>

            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>

            {/* Visit Statistics Section */}
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
                        <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>Unique visitors tracked per browser</p>
                    </div>
                </div>

                {analytics.loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : (
                    <>
                        {/* Summary Cards Row 1 */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                            gap: '16px',
                            marginBottom: '16px'
                        }}>
                            {/* Total Visits */}
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
                                {analytics.prev_period && analytics.prev_period.prev_visits > 0 && (() => {
                                    const pct = pctChange(analytics.prev_period.curr_visits, analytics.prev_period.prev_visits)
                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                                            {pct >= 0 ? <ArrowUpRight size={14} color="#10b981" /> : <ArrowDownRight size={14} color="#ef4444" />}
                                            <span style={{ fontSize: '0.75rem', color: pct >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                                {Math.abs(pct)}% vs last 7d
                                            </span>
                                        </div>
                                    )
                                })()}
                            </div>
                            {/* Unique Visitors */}
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
                                {analytics.prev_period && analytics.prev_period.prev_unique > 0 && (() => {
                                    const pct = pctChange(analytics.prev_period.curr_unique, analytics.prev_period.prev_unique)
                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                                            {pct >= 0 ? <ArrowUpRight size={14} color="#10b981" /> : <ArrowDownRight size={14} color="#ef4444" />}
                                            <span style={{ fontSize: '0.75rem', color: pct >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                                {Math.abs(pct)}% vs last 7d
                                            </span>
                                        </div>
                                    )
                                })()}
                            </div>
                            {/* Today */}
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
                            {/* Avg Time */}
                            <div style={{
                                padding: '16px 20px', borderRadius: '14px',
                                background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <Clock size={16} color="#a855f7" />
                                    <span style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 600, textTransform: 'uppercase' }}>Avg. Time</span>
                                </div>
                                <span style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 800, lineHeight: 1 }}>
                                    {formatDuration(analytics.totals?.avg_duration ?? null)}
                                </span>
                            </div>
                        </div>

                        {/* Summary Cards Row 2 */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
                            gap: '16px',
                            marginBottom: '24px'
                        }}>
                            {/* Bounce Rate */}
                            <div style={{
                                padding: '16px 20px', borderRadius: '14px',
                                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <LogOut size={16} color="#ef4444" />
                                    <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, textTransform: 'uppercase' }}>Bounce Rate</span>
                                </div>
                                <span style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 800, lineHeight: 1 }}>
                                    {analytics.bounce_rate != null ? `${analytics.bounce_rate}%` : '—'}
                                </span>
                            </div>
                            {/* New Visitors */}
                            <div style={{
                                padding: '16px 20px', borderRadius: '14px',
                                background: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.2)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <UserPlus size={16} color="#14b8a6" />
                                    <span style={{ fontSize: '0.75rem', color: '#14b8a6', fontWeight: 600, textTransform: 'uppercase' }}>New Today</span>
                                </div>
                                <span style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 800, lineHeight: 1 }}>
                                    {analytics.new_vs_returning?.new ?? 0}
                                </span>
                            </div>
                            {/* Returning Visitors */}
                            <div style={{
                                padding: '16px 20px', borderRadius: '14px',
                                background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <UserCheck size={16} color="#6366f1" />
                                    <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, textTransform: 'uppercase' }}>Returning Today</span>
                                </div>
                                <span style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 800, lineHeight: 1 }}>
                                    {analytics.new_vs_returning?.returning ?? 0}
                                </span>
                            </div>
                        </div>

                        {/* Trend Chart with Toggle */}
                        {analytics.trend.length > 0 && (
                            <div style={{
                                borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)',
                                overflow: 'hidden', marginBottom: '24px'
                            }}>
                                <div style={{
                                    padding: '12px 16px', background: 'rgba(255,255,255,0.03)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Traffic Trend
                                    </span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {([7, 30, 90] as const).map(d => (
                                            <button
                                                key={d}
                                                onClick={() => setTrendDays(d)}
                                                style={{
                                                    padding: '4px 10px', borderRadius: '6px',
                                                    background: trendDays === d ? 'rgba(245,158,11,0.2)' : 'transparent',
                                                    border: `1px solid ${trendDays === d ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.06)'}`,
                                                    color: trendDays === d ? '#f59e0b' : '#888',
                                                    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600
                                                }}
                                            >
                                                {d}d
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ padding: '16px', display: 'flex', alignItems: 'flex-end', gap: '2px', height: '180px', overflowX: 'auto' }}>
                                    {analytics.trend.map((day, i) => {
                                        const maxVisits = Math.max(...analytics.trend.map(d => d.visits), 1)
                                        const height = (day.visits / maxVisits) * 100
                                        const date = new Date(day.visit_date)
                                        const label = `${date.getMonth() + 1}/${date.getDate()}`
                                        const barWidth = analytics.trend.length <= 7 ? 40 : analytics.trend.length <= 14 ? 28 : analytics.trend.length <= 30 ? 18 : 12
                                        return (
                                            <div key={i} style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                                minWidth: `${barWidth}px`, flex: analytics.trend.length >= trendDays * 0.5 ? 1 : 'none'
                                            }}>
                                                <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700 }}>{day.visits}</span>
                                                <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                                    <div style={{
                                                        width: `${Math.min(barWidth - 4, 24)}px`,
                                                        height: `${Math.max(height, 6)}%`,
                                                        background: 'linear-gradient(to top, rgba(245,158,11,0.7), rgba(245,158,11,0.25))',
                                                        borderRadius: '4px 4px 0 0'
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: '0.6rem', color: '#666' }}>{label}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Hourly Heatmap */}
                        <div style={{
                            borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)',
                            overflow: 'hidden', marginBottom: '24px'
                        }}>
                            {sectionHeader(
                                <BarChart3 size={16} color="#ddd" />,
                                'Hourly Traffic Heatmap',
                                isHeatmapExpanded,
                                () => setIsHeatmapExpanded(!isHeatmapExpanded)
                            )}
                            {isHeatmapExpanded && analytics.heatmap && analytics.heatmap.length > 0 && (
                                <div style={{ padding: '16px', overflowX: 'auto' }}>
                                    <div style={{ minWidth: isMobile ? '600px' : 'auto' }}>
                                        {/* Hour labels */}
                                        <div style={{ display: 'flex', marginLeft: '40px', marginBottom: '4px' }}>
                                            {Array.from({ length: 24 }, (_, h) => (
                                                <div key={h} style={{
                                                    flex: 1, textAlign: 'center', fontSize: '0.6rem', color: '#666'
                                                }}>
                                                    {h % 3 === 0 ? `${h}` : ''}
                                                </div>
                                            ))}
                                        </div>
                                        {/* Grid rows */}
                                        {dayLabels.map((dayLabel, dayIdx) => {
                                            const dow = dayIdx + 1 // DAYOFWEEK: 1=Sun
                                            return (
                                                <div key={dayIdx} style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                                                    <span style={{ width: '36px', fontSize: '0.7rem', color: '#888', flexShrink: 0 }}>{dayLabel}</span>
                                                    <div style={{ display: 'flex', flex: 1, gap: '2px' }}>
                                                        {Array.from({ length: 24 }, (_, h) => {
                                                            const entry = analytics.heatmap!.find(e => e.dow === dow && e.hour === h)
                                                            const count = entry?.count || 0
                                                            const maxCount = Math.max(...analytics.heatmap!.map(e => e.count), 1)
                                                            const intensity = count / maxCount
                                                            return (
                                                                <div
                                                                    key={h}
                                                                    title={`${dayLabel} ${h}:00 — ${count} visits`}
                                                                    style={{
                                                                        flex: 1,
                                                                        aspectRatio: '1',
                                                                        borderRadius: '3px',
                                                                        background: count === 0
                                                                            ? 'rgba(255,255,255,0.03)'
                                                                            : `rgba(245, 158, 11, ${0.15 + intensity * 0.75})`,
                                                                        cursor: 'default',
                                                                        minHeight: '16px'
                                                                    }}
                                                                />
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                            {isHeatmapExpanded && (!analytics.heatmap || analytics.heatmap.length === 0) && (
                                <div style={{ padding: '24px', textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>No heatmap data available.</div>
                            )}
                        </div>

                        {/* Page Performance */}
                        <div style={{
                            borderRadius: '14px',
                            border: '1px solid rgba(255,255,255,0.06)',
                            overflow: 'hidden',
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
                                                    onChange={(e) => setSortBy(e.target.value as 'total' | 'unique' | 'today')}
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
                                    {chevron(isPagesExpanded)}
                                </div>
                            </div>

                            {isPagesExpanded && (
                                <div>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: isMobile ? '1fr auto auto' : '2fr 1fr 1fr 1fr 1fr',
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
                                        {!isMobile && <span style={{ textAlign: 'center' }}>Avg Time</span>}
                                    </div>

                                    {paginatedPages.map((pg, i) => (
                                        <div key={pg.page} style={{
                                            display: 'grid',
                                            gridTemplateColumns: isMobile ? '1fr auto auto' : '2fr 1fr 1fr 1fr 1fr',
                                            padding: '14px 16px',
                                            borderTop: '1px solid rgba(255,255,255,0.04)',
                                            background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                                            alignItems: 'center'
                                        }}>
                                            <a
                                                href={`https://siodelhi.org${pg.page}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    fontWeight: 600,
                                                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                                                    color: '#eee',
                                                    textDecoration: 'none',
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                                                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                                            >
                                                {getPageLabel(pg.page)}
                                            </a>
                                            <span style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                                                {pg.total_visits}
                                            </span>
                                            <span style={{ textAlign: 'center', color: '#3b82f6', fontWeight: 600 }}>
                                                {pg.unique_visitors}
                                            </span>
                                            {!isMobile && (
                                                <span style={{ textAlign: 'center', color: '#10b981', fontWeight: 600 }}>
                                                    {pg.today_visits}
                                                </span>
                                            )}
                                            {!isMobile && (
                                                <span style={{ textAlign: 'center', color: '#a855f7', fontWeight: 600 }}>
                                                    {formatDuration(pg.avg_duration)}
                                                </span>
                                            )}
                                        </div>
                                    ))}

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
                                                    padding: '6px 12px', borderRadius: '6px',
                                                    background: 'rgba(255,255,255,0.05)', border: 'none',
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
                                                    padding: '6px 12px', borderRadius: '6px',
                                                    background: 'rgba(255,255,255,0.05)', border: 'none',
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

                        {/* Top Landing Pages */}
                        <div style={{
                            marginTop: '24px',
                            borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)',
                            overflow: 'hidden'
                        }}>
                            {sectionHeader(
                                <Navigation size={16} color="#ddd" />,
                                'Top Landing Pages',
                                isLandingExpanded,
                                () => setIsLandingExpanded(!isLandingExpanded)
                            )}
                            {isLandingExpanded && (
                                <div style={{ padding: 0 }}>
                                    {(!analytics.landing_pages || analytics.landing_pages.length === 0) ? (
                                        <div style={{ padding: '24px', textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>No landing page data.</div>
                                    ) : (
                                        analytics.landing_pages.map((lp, i) => (
                                            <div key={i} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '12px 20px',
                                                borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                                                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                                            }}>
                                                <a
                                                    href={`https://siodelhi.org${lp.page}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: '#eee', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}
                                                    onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                                                    onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                                                >
                                                    {getPageLabel(lp.page)}
                                                </a>
                                                <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem' }}>{lp.count}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Page Flow / Journey */}
                        <div style={{
                            marginTop: '24px',
                            borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)',
                            overflow: 'hidden'
                        }}>
                            {sectionHeader(
                                <Radio size={16} color="#ddd" />,
                                'Page Flow / Journey',
                                isFlowExpanded,
                                () => setIsFlowExpanded(!isFlowExpanded)
                            )}
                            {isFlowExpanded && (
                                <div style={{ padding: 0 }}>
                                    {(!analytics.page_flows || analytics.page_flows.length === 0) ? (
                                        <div style={{ padding: '24px', textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>No page flow data.</div>
                                    ) : (
                                        analytics.page_flows.map((flow, i) => (
                                            <div key={i} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '12px 20px',
                                                borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                                                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                                                gap: '12px'
                                            }}>
                                                <span style={{ fontSize: '0.85rem', color: '#eee', fontWeight: 500 }}>
                                                    {getPageLabel(flow.from_page)}
                                                    <span style={{ color: '#f59e0b', margin: '0 8px' }}>{' -> '}</span>
                                                    {getPageLabel(flow.to_page)}
                                                </span>
                                                <span style={{ color: '#3b82f6', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                                                    {flow.count}x
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Audience & Network */}
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
                                {chevron(isAudienceExpanded)}
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
                                        title="Devices"
                                        icon={Smartphone}
                                        color="#f472b6"
                                        data={analytics.devices?.map(d => ({ name: d.device_type, count: d.count })) || []}
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
                                        data={analytics.isps?.map(isp => ({ name: isp.isp, count: isp.count })) || []}
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
                                                    <span style={{ color: '#888' }}> {countryFlag(loc.country)} ({loc.country})</span>
                                                    <br />
                                                    <span style={{ color: '#f59e0b' }}>{loc.visit_count} visits</span>
                                                    {' . '}
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
                                        {countryFlag(loc.country)}{' '}
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
