import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import type { FormDTO, FormResponseDTO, FormFieldDTO } from '../../lib/api'
import { ArrowLeft, Save, Loader2, Trash2, Calendar, FileText, ExternalLink } from 'lucide-react'

export function FormResponseDetail() {
    const { formId, responseId } = useParams()
    const navigate = useNavigate()

    const [form, setForm] = useState<FormDTO | null>(null)
    const [response, setResponse] = useState<FormResponseDTO | null>(null)
    const [editedData, setEditedData] = useState<Record<string, unknown>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        if (formId && responseId) {
            loadData()
        }
    }, [formId, responseId])

    const loadData = async () => {
        setLoading(true)
        const [formResult, responseResult] = await Promise.all([
            api.forms.get(formId!),
            api.forms.getResponse(formId!, responseId!)
        ])

        if (formResult.data) {
            setForm(formResult.data)
        }

        if (responseResult.data) {
            setResponse(responseResult.data)
            setEditedData(responseResult.data.responseData || {})
        } else {
            alert('Response not found')
            navigate(`/admin/forms/${formId}/responses`)
        }

        setLoading(false)
    }

    const handleFieldChange = (fieldId: string, value: unknown) => {
        setEditedData(prev => ({ ...prev, [fieldId]: value }))
        setHasChanges(true)
    }

    const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
        const currentValues = (editedData[fieldId] as string[]) || []
        if (checked) {
            handleFieldChange(fieldId, [...currentValues, option])
        } else {
            handleFieldChange(fieldId, currentValues.filter(v => v !== option))
        }
    }

    const handleSave = async () => {
        setSaving(true)
        const result = await api.forms.updateResponse(formId!, responseId!, editedData)
        if (result.data) {
            setResponse(result.data)
            setHasChanges(false)
            alert('Response updated successfully')
        } else {
            alert('Failed to update response: ' + result.error)
        }
        setSaving(false)
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this response? This action cannot be undone.')) {
            return
        }

        setDeleting(true)
        const result = await api.forms.deleteResponse(formId!, responseId!)
        if (!result.error) {
            navigate(`/admin/forms/${formId}/responses`)
        } else {
            alert('Failed to delete response: ' + result.error)
        }
        setDeleting(false)
    }

    const formatDate = (timestamp: number): string => {
        return new Date(timestamp).toLocaleString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const renderFieldInput = (field: FormFieldDTO) => {
        const value = editedData[field.id]
        const baseInputStyle: React.CSSProperties = {
            width: '100%',
            padding: '14px 16px',
            borderRadius: '10px',
            background: '#18181b',
            border: '1px solid #27272a',
            color: 'white',
            fontSize: '1rem',
            outline: 'none',
            boxSizing: 'border-box'
        }

        switch (field.type) {
            case 'text':
            case 'email':
            case 'phone':
                return (
                    <input
                        type={field.type === 'phone' ? 'tel' : field.type}
                        value={(value as string) || ''}
                        onChange={e => handleFieldChange(field.id, e.target.value)}
                        style={baseInputStyle}
                    />
                )

            case 'textarea':
                return (
                    <textarea
                        value={(value as string) || ''}
                        onChange={e => handleFieldChange(field.id, e.target.value)}
                        style={{ ...baseInputStyle, minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                )

            case 'number':
                return (
                    <input
                        type="number"
                        value={(value as string) || ''}
                        onChange={e => handleFieldChange(field.id, e.target.value)}
                        style={baseInputStyle}
                    />
                )

            case 'date':
                return (
                    <input
                        type="date"
                        value={(value as string) || ''}
                        onChange={e => handleFieldChange(field.id, e.target.value)}
                        style={baseInputStyle}
                    />
                )

            case 'dropdown':
                return (
                    <select
                        value={(value as string) || ''}
                        onChange={e => handleFieldChange(field.id, e.target.value)}
                        style={{ ...baseInputStyle, cursor: 'pointer' }}
                    >
                        <option value="">Select an option</option>
                        {field.options?.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                        ))}
                    </select>
                )

            case 'radio':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {field.options?.map((opt, idx) => (
                            <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name={field.id}
                                    value={opt}
                                    checked={value === opt}
                                    onChange={() => handleFieldChange(field.id, opt)}
                                    style={{ width: '20px', height: '20px', accentColor: '#ff3b3b' }}
                                />
                                <span style={{ color: '#a1a1aa', fontSize: '1rem' }}>{opt}</span>
                            </label>
                        ))}
                    </div>
                )

            case 'checkbox':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {field.options?.map((opt, idx) => (
                            <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={((value as string[]) || []).includes(opt)}
                                    onChange={e => handleCheckboxChange(field.id, opt, e.target.checked)}
                                    style={{ width: '20px', height: '20px', accentColor: '#ff3b3b' }}
                                />
                                <span style={{ color: '#a1a1aa', fontSize: '1rem' }}>{opt}</span>
                            </label>
                        ))}
                    </div>
                )

            case 'rating':
                const ratingValue = (value as number) || 0
                return (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => handleFieldChange(field.id, star)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    fontSize: '24px',
                                    color: star <= ratingValue ? '#fbbf24' : '#52525b'
                                }}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                )

            case 'file':
                const strValue = String(value || '').trim()
                const isUrl = strValue.startsWith('http') || strValue.startsWith('/')
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {isUrl && (
                            <a
                                href={value as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    color: '#3b82f6', textDecoration: 'none',
                                    fontSize: '0.9rem', fontWeight: 500,
                                    padding: '8px 12px', background: 'rgba(59, 130, 246, 0.1)',
                                    borderRadius: '8px', width: 'fit-content'
                                }}
                            >
                                <FileText size={16} />
                                View File
                                <ExternalLink size={14} />
                            </a>
                        )}
                        <input
                            type="text"
                            value={(value as string) || ''}
                            onChange={e => handleFieldChange(field.id, e.target.value)}
                            placeholder="File URL or name"
                            style={baseInputStyle}
                        />
                    </div>
                )

            default:
                return (
                    <input
                        type="text"
                        value={(value as string) || ''}
                        onChange={e => handleFieldChange(field.id, e.target.value)}
                        style={baseInputStyle}
                    />
                )
        }
    }

    if (loading) {
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
                    <button
                        onClick={() => navigate(`/admin/forms/${formId}/responses`)}
                        style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                            View Response
                        </h1>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#71717a' }}>
                            {form?.title}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(255, 59, 59, 0.1)', color: '#ff3b3b', border: 'none',
                            padding: '10px 16px', borderRadius: '8px',
                            cursor: deleting ? 'wait' : 'pointer', fontSize: '0.9rem'
                        }}
                    >
                        <Trash2 size={16} />
                        Delete
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: hasChanges ? '#ff3b3b' : '#27272a',
                            color: 'white', border: 'none',
                            padding: '10px 16px', borderRadius: '8px',
                            cursor: saving || !hasChanges ? 'not-allowed' : 'pointer',
                            opacity: hasChanges ? 1 : 0.5,
                            fontSize: '0.9rem', fontWeight: 600
                        }}
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Changes
                    </button>
                </div>
            </div>

            <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
                {/* Submission Info */}
                <div style={{
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <Calendar size={20} style={{ color: '#71717a' }} />
                    <div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#71717a' }}>Submitted</p>
                        <p style={{ margin: 0, fontWeight: 500 }}>
                            {response && formatDate(response.submittedAt)}
                        </p>
                    </div>
                </div>

                {/* Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {form?.fields?.map(field => (
                        <div
                            key={field.id}
                            style={{
                                background: '#18181b',
                                border: '1px solid #27272a',
                                borderRadius: '12px',
                                padding: '20px'
                            }}
                        >
                            <label style={{ display: 'block', marginBottom: '12px' }}>
                                <span style={{
                                    fontWeight: 600,
                                    color: '#a1a1aa',
                                    fontSize: '0.85rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {field.label}
                                    {field.isRequired && <span style={{ color: '#ff3b3b', marginLeft: '4px' }}>*</span>}
                                </span>
                            </label>
                            {renderFieldInput(field)}
                        </div>
                    ))}
                </div>
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
