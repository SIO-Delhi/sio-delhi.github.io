
import { useEffect, useState, useCallback, useRef } from 'react'
import { BarChart3, ChevronDown, ChevronLeft, ChevronRight, Clock, Eye, FileSpreadsheet, FileText, LogOut, MapPin, Navigation, Radio, Smartphone, Download, ArrowUpRight, ArrowDownRight, Info, TrendingUp, Loader2, UserPlus, UserCheck, Users } from 'lucide-react'
import jsPDF from 'jspdf'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import logo from '../../assets/logo.png'
import { authFetch } from '../../lib/api'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.siodelhi.org'

// Country code to emoji flag
const countryFlag = (code: string) => {
    if (!code || code.length !== 2) return ''
    return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))
}

const InfoTip = ({ text }: { text: string }) => {
    const ref = useRef<HTMLSpanElement>(null)
    const bubbleRef = useRef<HTMLSpanElement>(null)
    const show = () => {
        if (!ref.current || !bubbleRef.current) return
        const rect = ref.current.getBoundingClientRect()
        const bubble = bubbleRef.current
        bubble.style.display = 'block'
        // Position below the icon
        bubble.style.top = `${rect.bottom + 6}px`
        bubble.style.left = `${rect.left + rect.width / 2}px`
        bubble.style.transform = 'translateX(-50%)'
        // Check if it goes off-screen right
        requestAnimationFrame(() => {
            const bRect = bubble.getBoundingClientRect()
            if (bRect.right > window.innerWidth - 8) {
                bubble.style.left = `${window.innerWidth - bRect.width - 8}px`
                bubble.style.transform = 'none'
            }
            if (bRect.left < 8) {
                bubble.style.left = '8px'
                bubble.style.transform = 'none'
            }
        })
    }
    const hide = () => { if (bubbleRef.current) bubbleRef.current.style.display = 'none' }
    return (
        <span className="analytics-infotip-wrap" ref={ref} onMouseEnter={show} onMouseLeave={hide}>
            <Info size={13} className="analytics-infotip-icon" />
            <span className="analytics-infotip-bubble" ref={bubbleRef}>{text}</span>
        </span>
    )
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
        devices?: { device_type: string; count: number }[];
        prev_period?: { prev_visits: number; prev_unique: number; curr_visits: number; curr_unique: number };
        bounce_rate?: number;
        new_vs_returning?: { new: number; returning: number };
        heatmap?: { dow: number; hour: number; count: number }[];
        landing_pages?: { page: string; count: number }[];
        page_flows?: { from_page: string; to_page: string; count: number }[];
        events?: { event_name: string; event_label: string; total_count: number; unique_users: number }[];
        loading: boolean;
    }>({ totals: null, pages: [], trend: [], events: [], loading: true })
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
    const [heatmapMode, setHeatmapMode] = useState<'aggregate' | 'weekly'>('aggregate')
    const [heatmapDate, setHeatmapDate] = useState(new Date())
    const [weeklyData, setWeeklyData] = useState<any[]>([])
    const [weeklyLoading, setWeeklyLoading] = useState(false)
    const [isLandingExpanded, setIsLandingExpanded] = useState(false)
    const [isFlowExpanded, setIsFlowExpanded] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isExportOpen, setIsExportOpen] = useState(false)
    const exportRef = useRef<HTMLDivElement>(null)
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

        authFetch(`${API_BASE}/analytics/stats${qs}`)
            .then(res => res.json())
            .then(data => setAnalytics({
                totals: data.totals,
                pages: data.pages || [],
                trend: data.trend || [],
                browsers: data.browsers || [],
                oss: data.oss || [],
                referrers: data.referrers || [],
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
        authFetch(`${API_BASE}/analytics/locations${locQsStr ? `?${locQsStr}` : ''}`)
            .then(res => res.json())
            .then(data => setLocations({ locations: data.locations || [], countries: data.countries || [], loading: false }))
            .catch(() => setLocations(prev => ({ ...prev, loading: false })))

        authFetch(`${API_BASE}/analytics/events`)
            .then(res => res.json())
            .then(data => setAnalytics(prev => ({ ...prev, events: data.events || [] })))
            .catch(() => { })
    }, [buildQueryString, dateRange])

    const fetchWeeklyHeatmap = useCallback((date: Date) => {
        setWeeklyLoading(true)
        const start = new Date(date)
        start.setDate(start.getDate() - start.getDay()) // Sunday
        const end = new Date(start)
        end.setDate(end.getDate() + 6) // Saturday

        const from = start.toISOString().split('T')[0]
        const to = end.toISOString().split('T')[0]

        authFetch(`${API_BASE}/analytics/heatmap?from=${from}&to=${to}`)
            .then(res => res.json())
            .then(data => setWeeklyData(data.heatmap || []))
            .catch(() => setWeeklyData([]))
            .finally(() => setWeeklyLoading(false))
    }, [])

    useEffect(() => {
        if (isHeatmapExpanded && heatmapMode === 'weekly') {
            fetchWeeklyHeatmap(heatmapDate)
        }
    }, [isHeatmapExpanded, heatmapMode, heatmapDate, fetchWeeklyHeatmap])

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 60000)
        return () => clearInterval(interval)
    }, [fetchData])

    // Live visitors polling
    useEffect(() => {
        const fetchLive = () => {
            authFetch(`${API_BASE}/analytics/live`)
                .then(res => res.json())
                .then(data => setLiveCount(data.live_count ?? 0))
                .catch(() => { })
        }
        fetchLive()
        const interval = setInterval(fetchLive, 30000)
        return () => clearInterval(interval)
    }, [])

    // Close export dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
                setIsExportOpen(false)
            }
        }
        if (isExportOpen) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [isExportOpen])

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

    const exportPdf = async () => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
        const W = 210
        const margin = 16
        const contentW = W - margin * 2
        let y = 16

        const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        const rangeStr = dateRange.from && dateRange.to ? `${dateRange.from} — ${dateRange.to}` : 'All Time'

        // Helper: Resize image
        const resizeImage = (img: HTMLImageElement, width: number): string => {
            const canvas = document.createElement('canvas')
            const scale = width / img.width
            canvas.width = width
            canvas.height = img.height * scale
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                return canvas.toDataURL('image/png', 0.8)
            }
            return img.src
        }

        // Load logo with resizing
        const logoImg = await new Promise<string | null>((resolve) => {
            const img = new Image()
            img.src = logo
            img.onload = () => resolve(resizeImage(img, 300))
            img.onerror = () => resolve(null)
        })

        // Colors
        const amber = [245, 158, 11] as const
        const dark = [30, 30, 38] as const
        const gray = [120, 120, 130] as const

        const checkPage = (needed: number) => {
            if (y + needed > 280) { doc.addPage(); y = 16 }
        }

        // --- Title ---
        doc.setFillColor(...dark)
        doc.rect(0, 0, W, 44, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(22)
        doc.setFont('helvetica', 'bold')
        doc.text('Page Analytics Report', margin, 22)

        if (logoImg) {
            const logoDim = 24
            doc.addImage(logoImg, 'PNG', W - margin - logoDim + 4, 10, logoDim, logoDim, undefined, 'FAST')
        }

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(180, 180, 190)
        doc.text(`Generated: ${dateStr}  •  Range: ${rangeStr}`, margin, 32)
        doc.text('siodelhi.org', W - margin, 32, { align: 'right' })
        y = 54

        // --- Summary Cards ---
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...dark)
        doc.text('Overview', margin, y)
        y += 8

        const cards = [
            { label: 'Total Visits', value: String(analytics.totals?.total_visits ?? 0) },
            { label: 'Unique Visitors', value: String(analytics.totals?.unique_visitors ?? 0) },
            { label: 'Today', value: String(analytics.totals?.today_visits ?? 0) },
            { label: 'Avg. Time', value: formatDuration(analytics.totals?.avg_duration ?? null) },
            { label: 'Bounce Rate', value: analytics.bounce_rate != null ? `${analytics.bounce_rate}%` : '—' },
            { label: 'New Today', value: String(analytics.new_vs_returning?.new ?? 0) },
            { label: 'Returning', value: String(analytics.new_vs_returning?.returning ?? 0) },
        ]

        const cardW = (contentW - 8) / 4
        cards.forEach((card, i) => {
            const col = i % 4
            const row = Math.floor(i / 4)
            const cx = margin + col * (cardW + 2.5)
            const cy = y + row * 22
            doc.setFillColor(245, 245, 248)
            doc.roundedRect(cx, cy, cardW, 19, 3, 3, 'F')
            doc.setFontSize(7.5)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(...gray)
            doc.text(card.label.toUpperCase(), cx + 4, cy + 7)
            doc.setFontSize(16)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...dark)
            doc.text(card.value, cx + 4, cy + 15)
        })
        y += Math.ceil(cards.length / 4) * 22 + 10

        // --- Trend Chart ---
        if (analytics.trend.length > 0) {
            checkPage(50)
            doc.setFontSize(13)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...dark)
            doc.text(`Traffic Trend (${trendDays}d)`, margin, y)
            y += 6

            const chartH = 30
            const maxVisits = Math.max(...analytics.trend.map(t => t.visits), 1)
            const barW = Math.min((contentW) / analytics.trend.length - 1, 12)
            const chartStartX = margin + (contentW - analytics.trend.length * (barW + 1)) / 2

            // Y-axis baseline
            doc.setDrawColor(220, 220, 225)
            doc.setLineWidth(0.3)
            doc.line(margin, y + chartH, margin + contentW, y + chartH)

            analytics.trend.forEach((day, i) => {
                const h = (day.visits / maxVisits) * chartH
                const bx = chartStartX + i * (barW + 1)
                doc.setFillColor(...amber)
                doc.roundedRect(bx, y + chartH - h, barW, h, 1, 1, 'F')
                // Date label
                doc.setFontSize(5)
                doc.setTextColor(...gray)
                const label = day.visit_date.slice(5) // MM-DD
                doc.text(label, bx + barW / 2, y + chartH + 4, { align: 'center' })
                // Count on top
                doc.setFontSize(5)
                doc.setTextColor(...amber)
                doc.text(String(day.visits), bx + barW / 2, y + chartH - h - 1.5, { align: 'center' })
            })
            y += chartH + 12
        }

        // --- Page Performance Table ---
        checkPage(40)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...dark)
        doc.text('Page Performance', margin, y)
        y += 6

        // Table header
        const colWidths = [contentW * 0.38, contentW * 0.15, contentW * 0.15, contentW * 0.15, contentW * 0.17]
        const colLabels = ['Page', 'Total', 'Unique', 'Today', 'Avg Time']
        doc.setFillColor(240, 240, 243)
        doc.rect(margin, y, contentW, 7, 'F')
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...gray)
        let cx = margin + 3
        colLabels.forEach((label, i) => {
            doc.text(label, cx, y + 5)
            cx += colWidths[i]
        })
        y += 8

        // Table rows
        doc.setFont('helvetica', 'normal')
        analytics.pages.slice(0, 10).forEach((p, idx) => {
            checkPage(7)
            if (idx % 2 === 0) {
                doc.setFillColor(250, 250, 252)
                doc.rect(margin, y - 1, contentW, 7, 'F')
            }
            doc.setFontSize(7)
            doc.setTextColor(...dark)
            let rx = margin + 3
            const name = getPageLabel(p.page)
            doc.text(name.length > 35 ? name.slice(0, 32) + '...' : name, rx, y + 4)
            rx += colWidths[0]
            doc.text(String(p.total_visits), rx, y + 4)
            rx += colWidths[1]
            doc.text(String(p.unique_visitors), rx, y + 4)
            rx += colWidths[2]
            doc.text(String(p.today_visits), rx, y + 4)
            rx += colWidths[3]
            doc.text(formatDuration(p.avg_duration), rx, y + 4)
            y += 7
        })
        y += 6

        // --- Landing Pages ---
        if (analytics.landing_pages && analytics.landing_pages.length > 0) {
            checkPage(40)
            doc.setFontSize(13)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...dark)
            doc.text('Top Landing Pages', margin, y)
            y += 6

            // Table Header
            doc.setFillColor(240, 240, 243)
            doc.rect(margin, y, contentW, 7, 'F')
            doc.setFontSize(7)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...gray)
            doc.text('Rank', margin + 3, y + 5)
            doc.text('Page Path', margin + 18, y + 5)
            doc.text('Sessions', margin + contentW - 5, y + 5, { align: 'right' })
            y += 7

            // Rows
            analytics.landing_pages.slice(0, 10).forEach((lp, i) => {
                checkPage(7)
                if (i % 2 === 0) {
                    doc.setFillColor(250, 250, 252)
                    doc.rect(margin, y - 1, contentW, 7, 'F')
                }
                doc.setFontSize(8)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(...dark)

                doc.text(String(i + 1), margin + 3, y + 4)

                const label = getPageLabel(lp.page)
                const truncate = (str: string, max: number) => str.length > max ? str.slice(0, max - 3) + '...' : str
                doc.text(truncate(label, 60), margin + 18, y + 4)

                doc.setTextColor(...gray)
                doc.text(String(lp.count), margin + contentW - 5, y + 4, { align: 'right' })
                y += 7
            })
            y += 8
        }

        // --- Audience Section (Charts) ---
        checkPage(80)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...dark)
        doc.text('Audience Overview', margin, y)
        y += 10

        // Helpers for Charts
        const drawBarChart = (title: string, data: { name: string; count: number }[] | undefined, x: number, y: number, w: number, color: [number, number, number]) => {
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...dark)
            doc.text(title, x, y)
            let cy = y + 6

            if (!data || data.length === 0) {
                doc.setFontSize(8)
                doc.setFont('helvetica', 'italic')
                doc.setTextColor(150, 150, 150)
                doc.text('No data', x, cy)
                return 15
            }

            const max = Math.max(...data.map(d => d.count), 1)

            data.slice(0, 5).forEach((item) => {
                const pct = item.count / max
                // Label
                doc.setFontSize(7)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(50, 50, 60)
                const label = item.name.length > 20 ? item.name.slice(0, 18) + '...' : item.name
                doc.text(label, x, cy)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(...gray)
                doc.text(String(item.count), x + w, cy, { align: 'right' })

                // Bar Track
                cy += 2
                doc.setFillColor(240, 240, 243)
                doc.roundedRect(x, cy, w, 4, 1, 1, 'F')
                // Bar Value
                doc.setFillColor(...color)
                doc.roundedRect(x, cy, Math.max(w * pct, 2), 4, 1, 1, 'F')

                cy += 8
            })
            return cy - y
        }

        const drawPieChart = (title: string, data: { name: string; count: number }[] | undefined, cx: number, cy: number, radius: number) => {
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...dark)
            doc.text(title, cx - radius, cy - radius - 6)

            if (!data || data.length === 0) return 20

            // Fix: Ensure counts are treated as numbers to avoid string concatenation
            const total = data.reduce((sum, d) => sum + Number(d.count), 0)
            let startAngle = 0
            const colors: [number, number, number][] = [
                [59, 130, 246], // Blue
                [16, 185, 129], // Green
                [245, 158, 11], // Orange
                [239, 68, 68],  // Red
            ]

            data.forEach((item, i) => {
                const value = Number(item.count)
                if (value === 0) return
                const sliceAngle = (value / total) * 2 * Math.PI

                doc.setFillColor(...colors[i % colors.length])
                const segments = Math.max(Math.floor(sliceAngle * 10), 5)
                for (let j = 0; j < segments; j++) {
                    const a1 = startAngle + (sliceAngle * j / segments)
                    const a2 = startAngle + (sliceAngle * (j + 1) / segments)
                    doc.triangle(
                        cx, cy,
                        cx + radius * Math.cos(a1), cy + radius * Math.sin(a1),
                        cx + radius * Math.cos(a2), cy + radius * Math.sin(a2),
                        'F'
                    )
                }
                startAngle += sliceAngle
            })

            // Legend
            let ly = cy - radius + 2
            const lx = cx + radius + 12
            data.forEach((item, i) => {
                const count = Number(item.count)
                doc.setFillColor(...colors[i % colors.length])
                doc.circle(lx, ly, 2, 'F')
                doc.setFontSize(8)
                doc.setTextColor(...dark)
                doc.text(`${item.name} (${Math.round(count / total * 100)}%)`, lx + 5, ly + 1)
                ly += 6
            })
        }

        const gap = 16
        const halfW = (contentW - gap) / 2

        // Row 1: Browsers (Bar) - OS (Bar)
        const row1StartY = y
        drawBarChart('Top Browsers', analytics.browsers?.map(b => ({ name: b.browser, count: b.count })), margin, row1StartY, halfW, [59, 130, 246])
        const h2 = drawBarChart('Operating Systems', analytics.oss?.map(o => ({ name: o.os, count: o.count })), margin + halfW + gap, row1StartY, halfW, [16, 185, 129])
        y += Math.max(60, h2 + 10)

        // Row 2: Devices (Pie) - Referrers (Bar)
        checkPage(60)
        drawPieChart('Devices', analytics.devices?.map(d => ({ name: d.device_type, count: d.count })), margin + 20, y + 30, 18)
        drawBarChart('Top Referrers', analytics.referrers?.map(r => ({ name: r.referrer || 'Direct', count: r.count })), margin + halfW + gap, y, halfW, [245, 158, 11])
        y += 60

        // --- Country Breakdown ---
        if (locations.countries.length > 0) {
            checkPage(30)
            doc.setFontSize(13)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...dark)
            doc.text('Top Countries', margin, y)
            y += 6

            // Table Header
            doc.setFillColor(240, 240, 243)
            doc.rect(margin, y, contentW, 7, 'F')
            doc.setFontSize(7)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...gray)
            doc.text('Country', margin + 3, y + 5)
            doc.text('Total Visits', margin + contentW * 0.6, y + 5)
            doc.text('Unique Visitors', margin + contentW - 5, y + 5, { align: 'right' })
            y += 7

            locations.countries.slice(0, 10).forEach((c, i) => {
                checkPage(7)
                if (i % 2 === 0) {
                    doc.setFillColor(250, 250, 252)
                    doc.rect(margin, y - 1, contentW, 7, 'F')
                }
                doc.setFontSize(8)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(...dark)

                // NO EMOJI - Fixes rendering issue
                doc.text(c.country, margin + 3, y + 4)

                doc.text(String(c.visit_count), margin + contentW * 0.6, y + 4)
                doc.text(String(c.unique_visitors), margin + contentW - 5, y + 4, { align: 'right' })
                y += 7
            })
            y += 4
        }

        // --- Footer on every page ---
        const totalPages = doc.getNumberOfPages()
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i)
            doc.setFontSize(7)
            doc.setTextColor(160, 160, 170)
            doc.text(`Page ${i} of ${totalPages}`, W - margin, 290, { align: 'right' })
            doc.text('SIO Delhi Analytics', margin, 290)
        }

        doc.save(`analytics-${new Date().toISOString().split('T')[0]}.pdf`)
        setIsExportOpen(false)
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

    const sectionHeader = (icon: React.ReactNode, title: string, expanded: boolean, toggle: () => void, extra?: React.ReactNode, tooltip?: string) => (
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
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#eee', display: 'flex', alignItems: 'center' }}>{title}{tooltip && <InfoTip text={tooltip} />}</span>
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
                            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                {liveCount} online now
                                <InfoTip text="Visitors who loaded a page in the last 5 minutes. Updates every 30 seconds." />
                            </span>
                        </div>
                    )}
                    <div ref={exportRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setIsExportOpen(!isExportOpen)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 14px', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#ccc', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
                            }}
                        >
                            <Download size={14} />
                            Export
                            <ChevronDown size={12} style={{ opacity: 0.5 }} />
                        </button>
                        {isExportOpen && (
                            <div style={{
                                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                                background: '#1e1e28', border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: '10px', overflow: 'hidden', zIndex: 100,
                                boxShadow: '0 8px 30px rgba(0,0,0,0.5)', minWidth: '160px'
                            }}>
                                <button
                                    onClick={() => { exportCsv(); setIsExportOpen(false) }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                                        padding: '10px 14px', background: 'none', border: 'none',
                                        color: '#ccc', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                                        textAlign: 'left'
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                >
                                    <FileSpreadsheet size={15} color="#10b981" />
                                    CSV Spreadsheet
                                </button>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                                <button
                                    onClick={exportPdf}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                                        padding: '10px 14px', background: 'none', border: 'none',
                                        color: '#ccc', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                                        textAlign: 'left'
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                >
                                    <FileText size={15} color="#ef4444" />
                                    PDF Report
                                </button>
                            </div>
                        )}
                    </div>
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

            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                .analytics-infotip-wrap { position: relative; display: inline-flex; align-items: center; cursor: help; margin-left: 4px; }
                .analytics-infotip-icon { opacity: 0.4; flex-shrink: 0; transition: opacity 0.15s; }
                .analytics-infotip-wrap:hover .analytics-infotip-icon { opacity: 0.9; }
                .analytics-infotip-bubble {
                    display: none; position: fixed;
                    background: #1e1e28; color: #ccc; font-size: 0.72rem; font-weight: 400; text-transform: none; letter-spacing: normal;
                    padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12);
                    white-space: normal; width: max-content; max-width: 260px; line-height: 1.45;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.5); z-index: 9999; pointer-events: none;
                }
            `}</style>

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
                        <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center' }}>Visit Statistics<InfoTip text="Overview of site traffic with summary cards, trend charts, and detailed page-level breakdowns." /></h2>
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
                                    <InfoTip text="Total number of page views across all pages, including repeat visits by the same visitor." />
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
                                    <InfoTip text="Distinct visitors identified by a browser-generated UUID. Each browser/device counts as one unique visitor." />
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
                                    <InfoTip text="Page views recorded today (server timezone). Resets at midnight." />
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
                                    <InfoTip text="Average time visitors spend on a page before navigating away or closing the tab." />
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
                                    <InfoTip text="Percentage of visitors who viewed only one page and left without navigating further. Lower is better." />
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
                                    <InfoTip text="Visitors whose very first visit to the site was today. They have never been seen before." />
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
                                    <InfoTip text="Visitors who came back today but have visited the site on a previous day." />
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
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                                        Traffic Trend
                                        <InfoTip text="Daily visit counts over the selected period. Each bar represents one day. Toggle 7d/30d/90d to change the time window." />
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
                                <div style={{ padding: '16px', overflowX: 'auto' }}>
                                    {(() => {
                                        const maxVisits = Math.max(...analytics.trend.map(d => d.visits), 1)
                                        const barWidth = analytics.trend.length <= 7 ? 40 : analytics.trend.length <= 14 ? 28 : analytics.trend.length <= 30 ? 18 : 12
                                        const chartHeight = 140
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
                                                {analytics.trend.map((day, i) => {
                                                    const ratio = day.visits / maxVisits
                                                    const barH = Math.max(ratio * chartHeight, 4)
                                                    const date = new Date(day.visit_date)
                                                    const label = `${date.getMonth() + 1}/${date.getDate()}`
                                                    return (
                                                        <div key={i} style={{
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                                            minWidth: `${barWidth}px`
                                                        }}>
                                                            <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700 }}>{day.visits}</span>
                                                            <div style={{
                                                                width: `${Math.min(barWidth - 4, 24)}px`,
                                                                height: `${barH}px`,
                                                                background: 'linear-gradient(to top, #f59e0b, #d97706)',
                                                                borderRadius: '4px 4px 0 0',
                                                            }} />
                                                            <span style={{ fontSize: '0.6rem', color: '#666' }}>{label}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )
                                    })()}
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
                                () => setIsHeatmapExpanded(!isHeatmapExpanded),
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '12px' }} onClick={e => e.stopPropagation()}>
                                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px' }}>
                                        <button
                                            onClick={() => setHeatmapMode('aggregate')}
                                            style={{
                                                padding: '4px 8px', borderRadius: '4px', border: 'none',
                                                background: heatmapMode === 'aggregate' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                                color: heatmapMode === 'aggregate' ? '#eee' : '#888',
                                                fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer'
                                            }}
                                        >
                                            Aggregate
                                        </button>
                                        <button
                                            onClick={() => setHeatmapMode('weekly')}
                                            style={{
                                                padding: '4px 8px', borderRadius: '4px', border: 'none',
                                                background: heatmapMode === 'weekly' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                                color: heatmapMode === 'weekly' ? '#eee' : '#888',
                                                fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer'
                                            }}
                                        >
                                            Weekly
                                        </button>
                                    </div>
                                    {heatmapMode === 'weekly' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <button
                                                onClick={() => setHeatmapDate(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })}
                                                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}
                                                title="Previous Week"
                                            >
                                                <ChevronLeft size={14} />
                                            </button>
                                            <span style={{ fontSize: '0.7rem', color: '#aaa', minWidth: '80px', textAlign: 'center' }}>
                                                {(() => {
                                                    const s = new Date(heatmapDate); s.setDate(s.getDate() - s.getDay());
                                                    const e = new Date(s); e.setDate(e.getDate() + 6);
                                                    return `${s.getMonth() + 1}/${s.getDate()} - ${e.getMonth() + 1}/${e.getDate()}`
                                                })()}
                                            </span>
                                            <button
                                                onClick={() => setHeatmapDate(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })}
                                                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}
                                                title="Next Week"
                                            >
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>,
                                'Shows when visitors are most active. Rows are days of the week, columns are hours (0-23). Brighter cells mean more traffic.'
                            )}
                            {isHeatmapExpanded && (
                                <div style={{ padding: '16px', overflowX: 'auto' }}>
                                    {weeklyLoading ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                                            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', opacity: 0.5 }} />
                                        </div>
                                    ) : (
                                        (() => {
                                            const dataToRender = heatmapMode === 'weekly' ? weeklyData : (analytics.heatmap || [])

                                            if (!dataToRender || dataToRender.length === 0) {
                                                return <div style={{ padding: '24px', textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>No heatmap data available for this period.</div>
                                            }

                                            return (
                                                <div style={{ minWidth: isMobile ? '600px' : 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {/* Hour labels */}
                                                    <div style={{ display: 'flex', marginLeft: '40px', marginBottom: '4px' }}>
                                                        {Array.from({ length: 24 }, (_, h) => (
                                                            <div key={h} style={{
                                                                flex: 1, textAlign: 'center', fontSize: '0.6rem', color: '#666'
                                                            }}>
                                                                {h % 3 === 0 ? (h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`) : ''}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {/* Grid rows */}
                                                    {dayLabels.map((dayLabel, dayIdx) => {
                                                        const dow = dayIdx + 1 // DAYOFWEEK: 1=Sun
                                                        return (
                                                            <div key={dayIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ width: '36px', fontSize: '0.7rem', color: '#888', flexShrink: 0 }}>{dayLabel}</span>
                                                                <div style={{ display: 'flex', flex: 1, gap: '4px' }}>
                                                                    {Array.from({ length: 24 }, (_, h) => {
                                                                        const entry = dataToRender.find(e => Number(e.dow) === dow && Number(e.hour) === h)
                                                                        const count = Number(entry?.count) || 0
                                                                        const maxCount = Math.max(...dataToRender.map(e => Number(e.count)), 1)
                                                                        const intensity = count === 0 ? 0 : Math.max(count / maxCount, 0.25)
                                                                        return (
                                                                            <div
                                                                                key={h}
                                                                                title={`${dayLabel} ${h === 0 ? '12' : h > 12 ? h - 12 : h}${h < 12 ? 'am' : 'pm'} – ${(h + 1) === 24 ? '12' : (h + 1) > 12 ? (h + 1) - 12 : h + 1}${(h + 1) < 12 ? 'am' : 'pm'} — ${count} visits`}
                                                                                style={{
                                                                                    flex: 1,
                                                                                    aspectRatio: '1',
                                                                                    borderRadius: '3px',
                                                                                    background: count === 0
                                                                                        ? 'rgba(255,255,255,0.03)'
                                                                                        : intensity < 0.25
                                                                                            ? '#78350f'
                                                                                            : intensity < 0.5
                                                                                                ? '#b45309'
                                                                                                : intensity < 0.75
                                                                                                    ? '#d97706'
                                                                                                    : '#f59e0b',
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
                                            )
                                        })()
                                    )}
                                </div>
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
                                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#eee', display: 'flex', alignItems: 'center' }}>Page Performance<InfoTip text="Breakdown of visits per page. Total = all page views, Unique = distinct visitors, Today = views today, Avg Time = average time spent on the page." /></span>
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
                                () => setIsLandingExpanded(!isLandingExpanded),
                                undefined,
                                'The first page a visitor sees when they arrive at the site. Shows which pages attract visitors from external links or direct access.'
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
                                () => setIsFlowExpanded(!isFlowExpanded),
                                undefined,
                                'Shows the most common page-to-page transitions. Reveals how visitors navigate through the site after landing.'
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
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#ddd', display: 'flex', alignItems: 'center' }}>Audience & Network<InfoTip text="Technical profile of your visitors: browsers, operating systems, device types, and traffic sources." /></h3>
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
                                </div>
                            )}
                        </div>

                        {/* External Link Visits */}
                        <div style={{
                            marginTop: '24px',
                            borderRadius: '14px',
                            border: '1px solid rgba(255,255,255,0.06)',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                padding: '16px 20px',
                                background: 'rgba(255,255,255,0.03)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ArrowUpRight size={16} color="#ddd" />
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#ddd' }}>External Link Visits</h3>
                            </div>

                            <div style={{ padding: '0' }}>
                                {analytics.events && analytics.events.length > 0 ? (
                                    analytics.events.map((evt, i) => (
                                        <div key={i} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '12px 20px',
                                            borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                                            background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ color: '#eee', fontWeight: 500, fontSize: '0.9rem' }}>
                                                    {evt.event_label === 'adnan_footer' ? 'Developer Credit (Footer)' : evt.event_name}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: '#888' }}>
                                                    {evt.event_name} — {evt.event_label}
                                                </span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem', display: 'block' }}>
                                                    {evt.total_count} clicks
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: '#666' }}>
                                                    {evt.unique_users} unique
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '24px', textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>
                                        No external link clicks recorded yet.
                                    </div>
                                )}
                            </div>
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
                        <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center' }}>Visitor Map<InfoTip text="Geographic locations of visitors based on IP geolocation. Larger circles indicate more visits from that area." /></h2>
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
