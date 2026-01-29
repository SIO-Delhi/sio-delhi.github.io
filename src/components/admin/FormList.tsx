import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2, Eye, EyeOff, FileText, Users, ExternalLink, Copy, Check } from 'lucide-react'
import { api } from '../../lib/api'
import type { FormDTO } from '../../lib/api'

export function FormList() {
    const navigate = useNavigate()
    const [forms, setForms] = useState<FormDTO[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingForm, setDeletingForm] = useState<FormDTO | null>(null)
    const [deleteInput, setDeleteInput] = useState('')
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        loadForms()
    }, [])

    const loadForms = async () => {
        setLoading(true)
        const result = await api.forms.getAll()
        if (result.data) {
            setForms(result.data)
        }
        setLoading(false)
    }

    const handleTogglePublish = async (form: FormDTO) => {
        const result = await api.forms.update(form.id, { isPublished: !form.isPublished })
        if (result.data) {
            setForms(forms.map(f => f.id === form.id ? result.data! : f))
        }
    }

    const executeDelete = async () => {
        if (!deletingForm || deleteInput !== deletingForm.title) return

        const result = await api.forms.delete(deletingForm.id)
        if (!result.error) {
            setForms(forms.filter(f => f.id !== deletingForm.id))
            setDeletingForm(null)
            setDeleteInput('')
        } else {
            alert('Failed to delete form: ' + result.error)
        }
    }

    const copyFormLink = (form: FormDTO) => {
        const url = `${window.location.origin}/f/${form.slug}`
        navigator.clipboard.writeText(url)
        setCopiedId(form.id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const openFormPreview = (form: FormDTO) => {
        window.open(`/f/${form.slug}`, '_blank')
    }

    if (loading) {
        return (
            <div style={{ padding: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <div style={{ color: '#a1a1aa' }}>Loading forms...</div>
            </div>
        )
    }

    return (
        <div style={{ padding: isMobile ? '20px 20px 100px 20px' : '32px 32px 100px 32px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: isMobile ? '16px' : '0',
                marginBottom: '32px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h1 style={{ fontSize: isMobile ? '1.75rem' : '2rem', fontWeight: 700 }}>Form Builder</h1>
                </div>

                <button
                    onClick={() => navigate('/admin/forms/new')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: '#ff3b3b', color: 'white', border: 'none',
                        padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
                        width: isMobile ? '100%' : 'auto', justifyContent: 'center'
                    }}
                >
                    <Plus size={20} /> New Form
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            {deletingForm && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }} onClick={() => setDeletingForm(null)}>
                    <div style={{
                        background: '#09090b',
                        border: '1px solid rgba(255, 59, 59, 0.2)',
                        borderRadius: '24px',
                        padding: '40px',
                        maxWidth: '480px',
                        width: '100%',
                        display: 'flex', flexDirection: 'column', gap: '32px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        textAlign: 'center'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: 'rgba(255, 59, 59, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#ff3b3b'
                            }}>
                                <Trash2 size={32} />
                            </div>
                            <div>
                                <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
                                    Delete Form
                                </h2>
                                <p style={{ margin: 0, color: '#a1a1aa', lineHeight: '1.6', fontSize: '0.95rem' }}>
                                    This will permanently delete <strong style={{ color: '#fff' }}>"{deletingForm.title}"</strong> and all its responses. This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                            <label style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: 500, marginLeft: '4px' }}>
                                Type <span style={{ color: '#ff3b3b' }}>{deletingForm.title}</span> to confirm
                            </label>
                            <input
                                value={deleteInput}
                                onChange={e => setDeleteInput(e.target.value)}
                                placeholder={deletingForm.title}
                                style={{
                                    padding: '16px', borderRadius: '12px',
                                    border: '1px solid #27272a',
                                    background: '#18181b',
                                    color: 'white', fontSize: '1rem',
                                    outline: 'none',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setDeletingForm(null)}
                                style={{
                                    flex: 1,
                                    padding: '16px', borderRadius: '12px',
                                    background: 'transparent', border: '1px solid #27272a', color: '#fff',
                                    cursor: 'pointer', fontWeight: 600
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeDelete}
                                disabled={deleteInput !== deletingForm.title}
                                style={{
                                    flex: 1,
                                    padding: '16px', borderRadius: '12px',
                                    background: deleteInput === deletingForm.title ? '#ff3b3b' : 'rgba(255, 59, 59, 0.1)',
                                    border: 'none',
                                    color: deleteInput === deletingForm.title ? 'white' : '#ff3b3b',
                                    opacity: deleteInput === deletingForm.title ? 1 : 0.5,
                                    cursor: deleteInput === deletingForm.title ? 'pointer' : 'not-allowed',
                                    fontWeight: 600
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Forms List */}
            {forms.length === 0 ? (
                <div style={{
                    padding: '64px 32px',
                    border: '2px dashed #27272a',
                    borderRadius: '16px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                    color: '#52525b', textAlign: 'center'
                }}>
                    <FileText size={48} />
                    <div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#a1a1aa' }}>No forms yet</p>
                        <p style={{ margin: 0 }}>Create your first form to start collecting responses.</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/forms/new')}
                        style={{
                            marginTop: '8px',
                            background: '#ff3b3b', color: 'white', border: 'none',
                            padding: '12px 24px', borderRadius: '100px',
                            fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        Create First Form
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {forms.map(form => (
                        <div
                            key={form.id}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                padding: isMobile ? '16px' : '20px 24px',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                flexDirection: isMobile ? 'column' : 'row',
                                alignItems: isMobile ? 'flex-start' : 'center',
                                gap: isMobile ? '12px' : '16px',
                            }}>
                                {/* Icon & Content */}
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '12px',
                                        background: form.isPublished ? 'rgba(46, 255, 113, 0.1)' : 'rgba(255,255,255,0.05)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: form.isPublished ? '#2eff71' : '#71717a',
                                        flexShrink: 0
                                    }}>
                                        <FileText size={24} />
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{form.title?.replace(/<[^>]*>/g, '') || 'Untitled Form'}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#71717a' }}>/{form.slug}</span>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                background: form.isPublished ? 'rgba(46, 255, 113, 0.1)' : 'rgba(255, 59, 59, 0.1)',
                                                color: form.isPublished ? '#2eff71' : '#ff3b3b',
                                                padding: '2px 8px', borderRadius: '4px'
                                            }}>
                                                {form.isPublished ? 'PUBLISHED' : 'DRAFT'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Response Count */}
                                <Link
                                    to={`/admin/forms/${form.id}/responses`}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '8px 16px', borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: '#a1a1aa', textDecoration: 'none',
                                        fontSize: '0.9rem', fontWeight: 500
                                    }}
                                >
                                    <Users size={16} />
                                    {form.responseCount || 0} responses
                                </Link>

                                {/* Actions */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    width: isMobile ? '100%' : 'auto',
                                    justifyContent: isMobile ? 'flex-end' : 'flex-start',
                                    borderTop: isMobile ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    paddingTop: isMobile ? '12px' : '0'
                                }}>
                                    <button
                                        onClick={() => copyFormLink(form)}
                                        title="Copy form link"
                                        style={{
                                            padding: '8px', background: 'transparent', border: 'none',
                                            color: copiedId === form.id ? '#2eff71' : '#aaa', cursor: 'pointer'
                                        }}
                                    >
                                        {copiedId === form.id ? <Check size={18} /> : <Copy size={18} />}
                                    </button>
                                    <button
                                        onClick={() => openFormPreview(form)}
                                        title="Preview form"
                                        style={{
                                            padding: '8px', background: 'transparent', border: 'none',
                                            color: '#aaa', cursor: 'pointer'
                                        }}
                                    >
                                        <ExternalLink size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleTogglePublish(form)}
                                        title={form.isPublished ? "Unpublish form" : "Publish form"}
                                        style={{
                                            padding: '8px', background: 'transparent', border: 'none',
                                            color: form.isPublished ? '#2eff71' : '#666', cursor: 'pointer'
                                        }}
                                    >
                                        {form.isPublished ? <Eye size={20} /> : <EyeOff size={20} />}
                                    </button>
                                    <Link
                                        to={`/admin/forms/${form.id}`}
                                        style={{
                                            padding: '8px', background: 'transparent', border: 'none',
                                            color: '#aaa', cursor: 'pointer', display: 'flex'
                                        }}
                                    >
                                        <Edit2 size={18} />
                                    </Link>
                                    <button
                                        onClick={() => setDeletingForm(form)}
                                        style={{
                                            padding: '8px', background: 'transparent', border: 'none',
                                            color: '#ff3b3b', cursor: 'pointer'
                                        }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
