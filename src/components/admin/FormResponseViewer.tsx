import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import type { FormDTO, FormResponseDTO, FormFieldDTO } from '../../lib/api'
import { ArrowLeft, Download, RefreshCw, ChevronLeft, ChevronRight, Trash2, Loader2, Eye } from 'lucide-react'

export function FormResponseViewer() {
    const { formId } = useParams()
    const navigate = useNavigate()

    const [form, setForm] = useState<FormDTO | null>(null)
    const [responses, setResponses] = useState<FormResponseDTO[]>([])
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 })
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        if (formId) {
            loadForm()
            loadResponses(1)
        }
    }, [formId])

    const loadForm = async () => {
        const result = await api.forms.get(formId!)
        if (result.data) {
            setForm(result.data)
        }
    }

    const loadResponses = async (page: number) => {
        setLoading(true)
        const result = await api.forms.getResponses(formId!, page)
        if (result.data) {
            setResponses(result.data.responses)
            setPagination(result.data.pagination)
        }
        setLoading(false)
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await loadResponses(pagination.page)
        setRefreshing(false)
    }

    const handleExport = (format: 'csv' | 'json') => {
        window.open(api.forms.getExportUrl(formId!, format), '_blank')
    }

    const handleDeleteResponse = async (responseId: string) => {
        if (!confirm('Delete this response?')) return

        setDeletingId(responseId)
        const result = await api.forms.deleteResponse(formId!, responseId)
        if (!result.error) {
            setResponses(responses.filter(r => r.id !== responseId))
            setPagination(prev => ({ ...prev, total: prev.total - 1 }))
        } else {
            alert('Failed to delete response: ' + result.error)
        }
        setDeletingId(null)
    }

    const getFieldValue = (response: FormResponseDTO, field: FormFieldDTO): string => {
        const value = response.responseData[field.id]
        if (value === undefined || value === null) return '-'
        if (Array.isArray(value)) return value.join(', ')
        return String(value)
    }

    const formatDate = (timestamp: number): string => {
        return new Date(timestamp).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading && !form) {
        return (
            <div style={{ padding: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <Loader2 size={32} className="animate-spin" style={{ color: '#a1a1aa' }} />
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: '#09090b', color: 'white', paddingBottom: '100px' }}>
            {/* Header */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 50,
                background: 'rgba(9, 9, 11, 0.8)', backdropFilter: 'blur(12px)',
                borderBottom: '1px solid #27272a', padding: '16px 24px',
                display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between', gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={() => navigate('/admin/forms')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                            {form?.title?.replace(/<[^>]*>/g, '')} - Responses
                        </h1>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#71717a' }}>
                            {pagination.total} total response{pagination.total !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: '#27272a', color: 'white', border: 'none',
                            padding: '10px 16px', borderRadius: '8px',
                            cursor: refreshing ? 'wait' : 'pointer', fontSize: '0.9rem'
                        }}
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={() => handleExport('csv')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: '#ff3b3b', color: 'white', border: 'none',
                            padding: '10px 16px', borderRadius: '8px',
                            cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600
                        }}
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
                {responses.length === 0 ? (
                    <div style={{
                        padding: '64px 32px',
                        border: '2px dashed #27272a',
                        borderRadius: '16px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                        color: '#52525b', textAlign: 'center'
                    }}>
                        <p style={{ margin: 0, fontSize: '1.1rem', color: '#a1a1aa' }}>No responses yet</p>
                        <p style={{ margin: 0 }}>Share your form to start collecting responses.</p>
                    </div>
                ) : (
                    <>
                        {/* Responses Table */}
                        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #27272a' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ background: '#18181b' }}>
                                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.8rem', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                                            Submitted
                                        </th>
                                        {form?.fields?.map(field => (
                                            <th key={field.id} style={{ padding: '16px', textAlign: 'left', fontSize: '0.8rem', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                                {field.label || 'Untitled'}
                                            </th>
                                        ))}
                                        <th style={{ padding: '16px', textAlign: 'center', fontSize: '0.8rem', color: '#71717a', fontWeight: 600, width: '60px' }}>

                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {responses.map((response, idx) => (
                                        <tr
                                            key={response.id}
                                            onClick={() => navigate(`/admin/forms/${formId}/responses/${response.id}`)}
                                            style={{
                                                background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                                                borderTop: '1px solid #27272a',
                                                cursor: 'pointer',
                                                transition: 'background 0.15s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}
                                        >
                                            <td style={{ padding: '16px', fontSize: '0.9rem', color: '#a1a1aa', whiteSpace: 'nowrap' }}>
                                                {formatDate(response.submittedAt)}
                                            </td>
                                            {form?.fields?.map(field => (
                                                <td key={field.id} style={{ padding: '16px', fontSize: '0.9rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {getFieldValue(response, field)}
                                                </td>
                                            ))}
                                            <td style={{ padding: '16px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => navigate(`/admin/forms/${formId}/responses/${response.id}`)}
                                                        style={{
                                                            background: 'transparent', border: 'none',
                                                            color: '#71717a', cursor: 'pointer', padding: '4px'
                                                        }}
                                                        title="View & Edit"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteResponse(response.id)}
                                                        disabled={deletingId === response.id}
                                                        style={{
                                                            background: 'transparent', border: 'none',
                                                            color: '#ff3b3b', cursor: 'pointer', padding: '4px'
                                                        }}
                                                        title="Delete"
                                                    >
                                                        {deletingId === response.id ? (
                                                            <Loader2 size={16} className="animate-spin" />
                                                        ) : (
                                                            <Trash2 size={16} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
                                marginTop: '24px'
                            }}>
                                <button
                                    onClick={() => loadResponses(pagination.page - 1)}
                                    disabled={pagination.page <= 1 || loading}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        background: '#27272a', color: 'white', border: 'none',
                                        padding: '10px 16px', borderRadius: '8px',
                                        cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                                        opacity: pagination.page <= 1 ? 0.5 : 1
                                    }}
                                >
                                    <ChevronLeft size={16} /> Previous
                                </button>

                                <span style={{ color: '#71717a', fontSize: '0.9rem' }}>
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>

                                <button
                                    onClick={() => loadResponses(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages || loading}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        background: '#27272a', color: 'white', border: 'none',
                                        padding: '10px 16px', borderRadius: '8px',
                                        cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                                        opacity: pagination.page >= pagination.totalPages ? 0.5 : 1
                                    }}
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <style>{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
