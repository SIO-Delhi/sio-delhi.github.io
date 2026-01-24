import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import type { FormDTO, FormFieldDTO, FormFieldType } from '../../lib/api'
import {
    ArrowLeft, Save, Plus, Trash2, GripVertical, Loader2, Settings,
    Type, AlignLeft, Hash, Mail, Phone, ChevronDown, CheckSquare, Circle,
    Calendar, Upload, Star, Copy, Check, X
} from 'lucide-react'

const FIELD_TYPES: { type: FormFieldType; label: string; icon: React.ReactNode }[] = [
    { type: 'text', label: 'Short Text', icon: <Type size={18} /> },
    { type: 'textarea', label: 'Long Text', icon: <AlignLeft size={18} /> },
    { type: 'number', label: 'Number', icon: <Hash size={18} /> },
    { type: 'email', label: 'Email', icon: <Mail size={18} /> },
    { type: 'phone', label: 'Phone', icon: <Phone size={18} /> },
    { type: 'dropdown', label: 'Dropdown', icon: <ChevronDown size={18} /> },
    { type: 'checkbox', label: 'Checkboxes', icon: <CheckSquare size={18} /> },
    { type: 'radio', label: 'Multiple Choice', icon: <Circle size={18} /> },
    { type: 'date', label: 'Date', icon: <Calendar size={18} /> },
    { type: 'file', label: 'File Upload', icon: <Upload size={18} /> },
    { type: 'rating', label: 'Rating', icon: <Star size={18} /> },
]

export function FormBuilder() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [form, setForm] = useState<Partial<FormDTO>>({
        title: '',
        description: '',
        isPublished: false,
        acceptResponses: true,
        successMessage: 'Thank you for your submission!'
    })
    const [fields, setFields] = useState<FormFieldDTO[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [loading, setLoading] = useState(!!id)
    const [activeTab, setActiveTab] = useState<'fields' | 'settings'>('fields')
    const [showFieldPicker, setShowFieldPicker] = useState(false)
    const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
    const [draggedField, setDraggedField] = useState<string | null>(null)
    const [dragOverField, setDragOverField] = useState<string | null>(null)
    const [copiedLink, setCopiedLink] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        if (id) {
            loadForm(id)
        }
    }, [id])

    const loadForm = async (formId: string) => {
        setLoading(true)
        const result = await api.forms.get(formId)
        if (result.data) {
            setForm(result.data)
            setFields(result.data.fields || [])
        } else {
            alert('Failed to load form')
            navigate('/admin/forms')
        }
        setLoading(false)
    }

    const handleSave = async () => {
        if (!form.title?.trim()) {
            alert('Please enter a form title')
            return
        }

        // Validate fields have labels
        const emptyFields = fields.filter(f => !f.label.trim())
        if (emptyFields.length > 0) {
            alert('All fields must have a label')
            return
        }

        setIsSaving(true)
        try {
            let formId = id

            if (id) {
                await api.forms.update(id, form)
            } else {
                const result = await api.forms.create(form)
                if (result.data) {
                    formId = result.data.id
                } else {
                    throw new Error(result.error || 'Failed to create form')
                }
            }

            if (formId) {
                await api.forms.updateFields(formId, fields)
            }

            navigate('/admin/forms')
        } catch (err: any) {
            console.error('Save failed:', err)
            alert('Failed to save form: ' + err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const addField = (type: FormFieldType) => {
        const newField: FormFieldDTO = {
            id: crypto.randomUUID(),
            type,
            label: '',
            isRequired: false,
            displayOrder: fields.length,
            options: ['dropdown', 'checkbox', 'radio'].includes(type) ? ['Option 1', 'Option 2'] : undefined
        }
        setFields([...fields, newField])
        setEditingFieldId(newField.id)
        setShowFieldPicker(false)
    }

    const updateField = (fieldId: string, updates: Partial<FormFieldDTO>) => {
        setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f))
    }

    const removeField = (fieldId: string) => {
        setFields(fields.filter(f => f.id !== fieldId))
        if (editingFieldId === fieldId) setEditingFieldId(null)
    }

    const handleDragStart = (e: React.DragEvent, fieldId: string) => {
        setDraggedField(fieldId)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent, fieldId: string) => {
        e.preventDefault()
        setDragOverField(fieldId)
    }

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault()
        if (!draggedField || draggedField === targetId) return

        const sourceIndex = fields.findIndex(f => f.id === draggedField)
        const targetIndex = fields.findIndex(f => f.id === targetId)

        if (sourceIndex === -1 || targetIndex === -1) return

        const newFields = [...fields]
        const [moved] = newFields.splice(sourceIndex, 1)
        newFields.splice(targetIndex, 0, moved)

        setFields(newFields.map((f, i) => ({ ...f, displayOrder: i })))
        setDraggedField(null)
        setDragOverField(null)
    }

    const copyFormLink = () => {
        if (form.slug) {
            const url = `${window.location.origin}/form/${form.slug}`
            navigator.clipboard.writeText(url)
            setCopiedLink(true)
            setTimeout(() => setCopiedLink(false), 2000)
        }
    }

    const addOption = (fieldId: string) => {
        const field = fields.find(f => f.id === fieldId)
        if (field && field.options) {
            updateField(fieldId, { options: [...field.options, `Option ${field.options.length + 1}`] })
        }
    }

    const updateOption = (fieldId: string, optionIndex: number, value: string) => {
        const field = fields.find(f => f.id === fieldId)
        if (field && field.options) {
            const newOptions = [...field.options]
            newOptions[optionIndex] = value
            updateField(fieldId, { options: newOptions })
        }
    }

    const removeOption = (fieldId: string, optionIndex: number) => {
        const field = fields.find(f => f.id === fieldId)
        if (field && field.options && field.options.length > 1) {
            const newOptions = field.options.filter((_, i) => i !== optionIndex)
            updateField(fieldId, { options: newOptions })
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
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={() => navigate('/admin/forms')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                        {id ? 'Edit Form' : 'New Form'}
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {id && form.slug && (
                        <button
                            onClick={copyFormLink}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: '#27272a', color: 'white', border: 'none',
                                padding: '10px 16px', borderRadius: '8px',
                                fontSize: '0.9rem', cursor: 'pointer'
                            }}
                        >
                            {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                            {copiedLink ? 'Copied!' : 'Copy Link'}
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: '#ff3b3b', color: 'white', border: 'none',
                            padding: '10px 24px', borderRadius: '100px',
                            fontSize: '0.9rem', fontWeight: 600, cursor: isSaving ? 'wait' : 'pointer',
                            opacity: isSaving ? 0.7 : 1
                        }}
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Form
                    </button>
                </div>
            </div>

            <div style={{ maxWidth: '900px', margin: '32px auto', padding: '0 24px' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    <button
                        onClick={() => setActiveTab('fields')}
                        style={{
                            padding: '10px 20px', borderRadius: '8px', border: 'none',
                            background: activeTab === 'fields' ? '#ff3b3b' : '#27272a',
                            color: 'white', fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        Fields
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '8px', border: 'none',
                            background: activeTab === 'settings' ? '#ff3b3b' : '#27272a',
                            color: 'white', fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        <Settings size={16} /> Settings
                    </button>
                </div>

                {activeTab === 'settings' ? (
                    /* Settings Tab */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Form Title *
                            </label>
                            <input
                                value={form.title || ''}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="Enter form title..."
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '12px',
                                    background: '#18181b', border: '1px solid #27272a',
                                    color: 'white', fontSize: '1.25rem', fontWeight: 600, outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Description
                            </label>
                            <textarea
                                value={form.description || ''}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Optional description shown to users..."
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '12px',
                                    background: '#18181b', border: '1px solid #27272a',
                                    color: 'white', fontSize: '1rem', outline: 'none',
                                    minHeight: '100px', resize: 'vertical', fontFamily: 'inherit',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Success Message
                            </label>
                            <textarea
                                value={form.successMessage || ''}
                                onChange={e => setForm({ ...form, successMessage: e.target.value })}
                                placeholder="Message shown after submission..."
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '12px',
                                    background: '#18181b', border: '1px solid #27272a',
                                    color: 'white', fontSize: '1rem', outline: 'none',
                                    minHeight: '80px', resize: 'vertical', fontFamily: 'inherit',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Response Limit
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.responseLimit || ''}
                                    onChange={e => setForm({ ...form, responseLimit: e.target.value ? parseInt(e.target.value) : null })}
                                    placeholder="Unlimited"
                                    style={{
                                        width: '100%', padding: '16px', borderRadius: '12px',
                                        background: '#18181b', border: '1px solid #27272a',
                                        color: 'white', fontSize: '1rem', outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <span style={{ fontSize: '0.8rem', color: '#71717a', marginTop: '4px', display: 'block' }}>
                                    Leave empty for unlimited responses
                                </span>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Expires At
                                </label>
                                <input
                                    type="datetime-local"
                                    value={form.expiresAt ? new Date(form.expiresAt).toISOString().slice(0, 16) : ''}
                                    onChange={e => setForm({ ...form, expiresAt: e.target.value ? new Date(e.target.value).getTime() : null })}
                                    style={{
                                        width: '100%', padding: '16px', borderRadius: '12px',
                                        background: '#18181b', border: '1px solid #27272a',
                                        color: 'white', fontSize: '1rem', outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={form.isPublished || false}
                                    onChange={e => setForm({ ...form, isPublished: e.target.checked })}
                                    style={{ width: '20px', height: '20px', accentColor: '#ff3b3b' }}
                                />
                                <div>
                                    <span style={{ fontWeight: 600, display: 'block' }}>Published</span>
                                    <span style={{ fontSize: '0.85rem', color: '#71717a' }}>Form is accessible via public link</span>
                                </div>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={form.acceptResponses !== false}
                                    onChange={e => setForm({ ...form, acceptResponses: e.target.checked })}
                                    style={{ width: '20px', height: '20px', accentColor: '#ff3b3b' }}
                                />
                                <div>
                                    <span style={{ fontWeight: 600, display: 'block' }}>Accept Responses</span>
                                    <span style={{ fontSize: '0.85rem', color: '#71717a' }}>Allow new submissions to this form</span>
                                </div>
                            </label>
                        </div>
                    </div>
                ) : (
                    /* Fields Tab */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Form Title (Quick Edit) */}
                        <div>
                            <input
                                value={form.title || ''}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="Untitled Form"
                                style={{
                                    width: '100%', padding: '0', background: 'transparent',
                                    border: 'none', borderBottom: '2px solid transparent',
                                    color: 'white', fontSize: '2rem', fontWeight: 700, outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={e => e.target.style.borderBottomColor = '#ff3b3b'}
                                onBlur={e => e.target.style.borderBottomColor = 'transparent'}
                            />
                            {form.description && (
                                <p style={{ color: '#71717a', marginTop: '8px', fontSize: '1rem' }}>{form.description}</p>
                            )}
                        </div>

                        {/* Fields List */}
                        {fields.map((field) => (
                            <div
                                key={field.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, field.id)}
                                onDragOver={(e) => handleDragOver(e, field.id)}
                                onDrop={(e) => handleDrop(e, field.id)}
                                style={{
                                    background: '#18181b',
                                    border: dragOverField === field.id ? '2px dashed #ff3b3b' : '1px solid #27272a',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    opacity: draggedField === field.id ? 0.5 : 1,
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{ paddingTop: '4px', color: '#52525b', cursor: 'grab' }}>
                                        <GripVertical size={20} />
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        {/* Field Header */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                            <span style={{ color: '#71717a' }}>
                                                {FIELD_TYPES.find(t => t.type === field.type)?.icon}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: '#71717a', textTransform: 'uppercase' }}>
                                                {FIELD_TYPES.find(t => t.type === field.type)?.label}
                                            </span>
                                            {field.isRequired && (
                                                <span style={{ fontSize: '0.75rem', background: 'rgba(255, 59, 59, 0.1)', color: '#ff3b3b', padding: '2px 6px', borderRadius: '4px' }}>
                                                    Required
                                                </span>
                                            )}
                                        </div>

                                        {/* Label Input */}
                                        <input
                                            value={field.label}
                                            onChange={e => updateField(field.id, { label: e.target.value })}
                                            placeholder="Question"
                                            style={{
                                                width: '100%', padding: '8px 0', background: 'transparent',
                                                border: 'none', borderBottom: '1px solid #27272a',
                                                color: 'white', fontSize: '1.1rem', fontWeight: 500, outline: 'none',
                                                boxSizing: 'border-box'
                                            }}
                                        />

                                        {/* Placeholder Input */}
                                        <input
                                            value={field.placeholder || ''}
                                            onChange={e => updateField(field.id, { placeholder: e.target.value })}
                                            placeholder="Placeholder text (optional)"
                                            style={{
                                                width: '100%', padding: '8px 0', background: 'transparent',
                                                border: 'none', color: '#71717a', fontSize: '0.9rem', outline: 'none',
                                                marginTop: '8px', boxSizing: 'border-box'
                                            }}
                                        />

                                        {/* Options for dropdown/checkbox/radio */}
                                        {field.options && (
                                            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {field.options.map((option, idx) => (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ color: '#52525b' }}>
                                                            {field.type === 'radio' ? <Circle size={16} /> : field.type === 'checkbox' ? <CheckSquare size={16} /> : <ChevronDown size={16} />}
                                                        </span>
                                                        <input
                                                            value={option}
                                                            onChange={e => updateOption(field.id, idx, e.target.value)}
                                                            style={{
                                                                flex: 1, padding: '8px 12px', background: '#09090b',
                                                                border: '1px solid #27272a', borderRadius: '8px',
                                                                color: 'white', fontSize: '0.9rem', outline: 'none'
                                                            }}
                                                        />
                                                        {field.options!.length > 1 && (
                                                            <button
                                                                onClick={() => removeOption(field.id, idx)}
                                                                style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px' }}
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => addOption(field.id)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '8px',
                                                        background: 'transparent', border: 'none',
                                                        color: '#71717a', cursor: 'pointer', padding: '8px 0',
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    <Plus size={16} /> Add option
                                                </button>
                                            </div>
                                        )}

                                        {/* Field Actions */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #27272a' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#a1a1aa' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={field.isRequired}
                                                    onChange={e => updateField(field.id, { isRequired: e.target.checked })}
                                                    style={{ accentColor: '#ff3b3b' }}
                                                />
                                                Required
                                            </label>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => removeField(field.id)}
                                        style={{
                                            background: 'rgba(255, 59, 59, 0.1)', color: '#ff3b3b',
                                            border: 'none', borderRadius: '8px',
                                            width: 36, height: 36, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Add Field Button */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowFieldPicker(!showFieldPicker)}
                                style={{
                                    width: '100%', padding: '20px',
                                    background: '#18181b', border: '2px dashed #27272a', borderRadius: '16px',
                                    color: '#71717a', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    fontSize: '1rem', fontWeight: 500
                                }}
                            >
                                <Plus size={20} /> Add Field
                            </button>

                            {/* Field Type Picker */}
                            {showFieldPicker && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0,
                                    marginTop: '8px', zIndex: 10,
                                    background: '#18181b', border: '1px solid #27272a', borderRadius: '16px',
                                    padding: '16px',
                                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px'
                                }}>
                                    {FIELD_TYPES.map(ft => (
                                        <button
                                            key={ft.type}
                                            onClick={() => addField(ft.type)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '12px',
                                                padding: '12px 16px', background: '#09090b',
                                                border: '1px solid #27272a', borderRadius: '8px',
                                                color: 'white', cursor: 'pointer', textAlign: 'left'
                                            }}
                                        >
                                            <span style={{ color: '#71717a' }}>{ft.icon}</span>
                                            <span style={{ fontSize: '0.9rem' }}>{ft.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {fields.length === 0 && (
                            <div style={{
                                padding: '48px', textAlign: 'center', color: '#52525b'
                            }}>
                                <p>No fields yet. Click "Add Field" to start building your form.</p>
                            </div>
                        )}
                    </div>
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
