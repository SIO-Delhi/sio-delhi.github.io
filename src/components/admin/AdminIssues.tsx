import { useEffect, useState } from 'react'
import { Trash2, ExternalLink, Loader2, MessageSquare, RefreshCw } from 'lucide-react'
import { api } from '../../lib/api'
import type { DevReportDTO } from '../../lib/api'
import { useTheme } from '../../context/ThemeContext'

export function AdminIssues() {
    const { isDark } = useTheme()
    const [reports, setReports] = useState<DevReportDTO[]>([])
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState<string | null>(null)

    const fetchReports = async () => {
        setLoading(true)
        const result = await api.devReports.getAll()
        if (result.data) setReports(result.data)
        setLoading(false)
    }

    useEffect(() => { fetchReports() }, [])

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this report?')) return
        setDeleting(id)
        await api.devReports.delete(id)
        setReports(prev => prev.filter(r => r.id !== id))
        setDeleting(null)
    }

    const typeColors: Record<string, string> = {
        bug: '#ef4444',
        suggestion: '#3b82f6',
        question: '#eab308',
        other: '#8b5cf6'
    }

    const cardBg = isDark ? '#111' : '#fff'
    const cardBorder = isDark ? '#222' : '#e5e5e5'
    const textPrimary = isDark ? '#fdedcb' : '#111'
    const textSecondary = isDark ? '#888' : '#666'

    return (
        <div style={{ maxWidth: '900px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: textPrimary }}>Issues & Reports</h1>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: textSecondary }}>
                        {reports.length} report{reports.length !== 1 ? 's' : ''} from users
                    </p>
                </div>
                <button
                    onClick={fetchReports}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                        background: isDark ? '#1a1a1a' : '#f5f5f5', border: `1px solid ${cardBorder}`,
                        borderRadius: '8px', color: textPrimary, cursor: 'pointer', fontSize: '0.85rem'
                    }}
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                    <Loader2 size={24} className="animate-spin" style={{ color: '#ff3b3b' }} />
                </div>
            ) : reports.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '12px'
                }}>
                    <MessageSquare size={40} style={{ color: textSecondary, marginBottom: '12px' }} />
                    <p style={{ color: textSecondary, margin: 0 }}>No reports yet</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {reports.map(report => (
                        <div key={report.id} style={{
                            background: cardBg, border: `1px solid ${cardBorder}`,
                            borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s'
                        }}>
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                    <span style={{
                                        padding: '3px 10px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 600,
                                        textTransform: 'uppercase', letterSpacing: '0.05em',
                                        background: `${typeColors[report.issue_type] || '#666'}20`,
                                        color: typeColors[report.issue_type] || '#666',
                                        border: `1px solid ${typeColors[report.issue_type] || '#666'}40`
                                    }}>
                                        {report.issue_type}
                                    </span>
                                    <span style={{ fontWeight: 600, color: textPrimary }}>{report.name}</span>
                                    <span style={{ color: textSecondary, fontSize: '0.85rem' }}>{report.email}</span>
                                </div>
                                <button
                                    onClick={() => handleDelete(report.id)}
                                    disabled={deleting === report.id}
                                    style={{
                                        background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer',
                                        padding: '4px', opacity: deleting === report.id ? 0.5 : 0.6,
                                        transition: 'opacity 0.2s', flexShrink: 0
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                                    title="Delete report"
                                >
                                    {deleting === report.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                </button>
                            </div>

                            {/* Description */}
                            <p style={{
                                margin: '0 0 12px', color: textPrimary, fontSize: '0.9rem',
                                lineHeight: 1.6, whiteSpace: 'pre-wrap'
                            }}>
                                {report.description}
                            </p>

                            {/* Meta */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.75rem', color: textSecondary }}>
                                <span>{new Date(report.created_at).toLocaleString()}</span>
                                {report.page_url && (
                                    <a
                                        href={report.page_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                                    >
                                        {report.page_url.replace(/https?:\/\/[^/]+/, '')} <ExternalLink size={11} />
                                    </a>
                                )}
                                {report.browser_info && (
                                    <span title={report.browser_info}>
                                        {report.browser_info.length > 60 ? report.browser_info.substring(0, 60) + '...' : report.browser_info}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
