import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import type { FormDTO, FormFieldDTO, FormFieldType, FormPageDTO } from '../../lib/api'
import { uploadImage } from '../../lib/storage'
import { validateImage, compressImage } from '../../lib/imageProcessing'
import { ImageCropper } from './ImageCropper'
import {
    ArrowLeft, Save, Plus, Trash2, GripVertical, Loader2, Settings,
    Type, AlignLeft, Hash, Mail, Phone, ChevronDown, CheckSquare, Circle,
    Calendar, Upload, Star, Copy, Check, X, Image as ImageIcon
} from 'lucide-react'
import { RichTextEditor } from './RichTextEditor'
import { FormFooter } from '../ui/FormFooter'

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
        successMessage: 'Thank you for your submission!',
        themePrimaryColor: '#ff3b3b',
        themeBackground: '#fafafa'
    })
    const [pages, setPages] = useState<FormPageDTO[]>([])
    const [activePageId, setActivePageId] = useState<string | null>(null)
    const [fields, setFields] = useState<FormFieldDTO[]>([])

    // Sync helper: Update fields view when active page changes
    useEffect(() => {
        if (activePageId && pages.length > 0) {
            const page = pages.find(p => p.id === activePageId)
            if (page) {
                setFields(page.fields || [])
            }
        } else if (pages.length > 0 && !activePageId) {
            setActivePageId(pages[0].id)
        }
    }, [activePageId, pages])

    const [isSaving, setIsSaving] = useState(false)
    const [loading, setLoading] = useState(!!id)
    const [activeTab, setActiveTab] = useState<'fields' | 'settings'>('fields')
    const [showFieldPicker, setShowFieldPicker] = useState(false)
    const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
    const [draggedField, setDraggedField] = useState<string | null>(null)
    const [dragOverField, setDragOverField] = useState<string | null>(null)
    const [copiedLink, setCopiedLink] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [bannerCropSrc, setBannerCropSrc] = useState<string | null>(null)
    const [isUploadingBanner, setIsUploadingBanner] = useState(false)

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
            const { fields: rawFields, pages: rawPages, ...formData } = result.data
            setForm(formData)

            if (rawPages && rawPages.length > 0) {
                setPages(rawPages)
                setActivePageId(rawPages[0].id)
            } else {
                setPages([]) // Should fallback to creating default page on save or handle legacy
                setFields(rawFields || [])
            }
        } else {
            alert('Failed to load form')
            navigate('/admin/forms')
        }
        setLoading(false)
    }

    const updatePageFields = (newFields: FormFieldDTO[]) => {
        setFields(newFields)
        setPages(prev => prev.map(p =>
            p.id === activePageId ? { ...p, fields: newFields } : p
        ))
    }

    const handleAddPage = () => {
        const newPage: FormPageDTO = {
            id: crypto.randomUUID(),
            title: `Page ${pages.length + 1}`,
            displayOrder: pages.length,
            fields: []
        }
        setPages(prev => [...prev, newPage])
        setActivePageId(newPage.id)
    }

    const handleDeletePage = (pageId: string) => {
        if (pages.length <= 1) {
            alert("Forms must have at least one page.")
            return
        }
        if (!confirm("Delete this page and all its fields?")) return

        const newPages = pages.filter(p => p.id !== pageId)
        setPages(newPages)
        if (activePageId === pageId) {
            setActivePageId(newPages[0].id)
        }
    }

    const handleSave = async () => {
        if (!form.title?.trim()) {
            alert('Please enter a form title')
            return
        }

        // Validate fields have labels
        // Check all pages? Or just active? 
        // Ideally check all pages. 
        // For simplicity, let's trust the user or check current page.
        // Let's iterate all pages
        let hasError = false
        pages.forEach(p => {
            if (p.fields?.some(f => !f.label.trim())) hasError = true
        })

        if (hasError) {
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
                // Prepare final pages payload
                // Ensure active page is synced
                const finalPages = pages.map(p =>
                    p.id === activePageId ? { ...p, fields: fields } : p
                )
                await api.forms.updateFields(formId, { pages: finalPages } as any)
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
        updatePageFields([...fields, newField])
        setEditingFieldId(newField.id)
        setShowFieldPicker(false)
    }

    const updateField = (fieldId: string, updates: Partial<FormFieldDTO>) => {
        const newFields = fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
        updatePageFields(newFields)
    }

    const removeField = (fieldId: string) => {
        const newFields = fields.filter(f => f.id !== fieldId)
        updatePageFields(newFields)
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

        const orderedFields = newFields.map((f, i) => ({ ...f, displayOrder: i }))
        updatePageFields(orderedFields)
        setDraggedField(null)
        setDragOverField(null)
    }

    const copyFormLink = () => {
        if (form.slug) {
            const url = `${window.location.origin}/f/${form.slug}`
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

    const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            validateImage(file)
            setBannerCropSrc(URL.createObjectURL(file))
        } catch (err: any) {
            alert(err.message)
        }
        e.target.value = ''
    }

    const handleBannerCropComplete = async (croppedBlob: Blob) => {
        console.log('FormBuilder Banner Upload - Current id param:', id) // DEBUG
        setIsUploadingBanner(true)
        try {
            const file = new File([croppedBlob], 'banner.webp', { type: 'image/webp' })
            const compressed = await compressImage(file)
            const url = await uploadImage(compressed, undefined, id)
            setForm({ ...form, bannerImage: url })
        } catch (err: any) {
            console.error('Banner upload failed:', err)
            alert('Failed to upload banner: ' + err.message)
        } finally {
            setIsUploadingBanner(false)
            if (bannerCropSrc) {
                URL.revokeObjectURL(bannerCropSrc)
            }
            setBannerCropSrc(null)
        }
    }

    const handleBannerCropCancel = () => {
        if (bannerCropSrc) {
            URL.revokeObjectURL(bannerCropSrc)
        }
        setBannerCropSrc(null)
    }

    const removeBanner = () => {
        setForm({ ...form, bannerImage: null })
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
            {/* Banner Cropper Modal */}
            {bannerCropSrc && (
                <ImageCropper
                    imageSrc={bannerCropSrc}
                    aspectRatio={3}
                    onCancel={handleBannerCropCancel}
                    onCropComplete={handleBannerCropComplete}
                />
            )}

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
                            <RichTextEditor
                                value={form.title || ''}
                                onChange={(content) => setForm({ ...form, title: content })}
                                placeholder="Enter form title..."
                                minHeight="100px"
                            />
                        </div>



                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Description
                            </label>
                            <RichTextEditor
                                value={form.description || ''}
                                onChange={(content) => setForm({ ...form, description: content })}
                                placeholder="Optional description shown to users..."
                                minHeight="200px"
                            />
                        </div>

                        {/* Banner Image */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Banner Image
                            </label>
                            <p style={{ fontSize: '0.8rem', color: '#71717a', marginBottom: '12px' }}>
                                Recommended size: 1200 x 400 pixels (3:1 ratio). Displays at the top of your form.
                            </p>
                            <div style={{
                                position: 'relative',
                                width: '100%',
                                aspectRatio: '3/1',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                background: '#18181b',
                                border: form.bannerImage ? 'none' : '2px dashed #27272a',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {form.bannerImage ? (
                                    <>
                                        <img
                                            src={form.bannerImage}
                                            alt="Form banner"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            display: 'flex',
                                            gap: '8px'
                                        }}>
                                            <label style={{
                                                background: 'rgba(0,0,0,0.6)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '8px 12px',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                <Upload size={14} />
                                                Change
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleBannerSelect}
                                                    style={{ display: 'none' }}
                                                />
                                            </label>
                                            <button
                                                onClick={removeBanner}
                                                style={{
                                                    background: 'rgba(255, 59, 59, 0.8)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    padding: '8px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <label style={{
                                        cursor: isUploadingBanner ? 'wait' : 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '12px',
                                        color: '#71717a',
                                        padding: '24px'
                                    }}>
                                        {isUploadingBanner ? (
                                            <Loader2 size={32} className="animate-spin" />
                                        ) : (
                                            <ImageIcon size={32} />
                                        )}
                                        <span style={{ fontSize: '0.9rem' }}>
                                            {isUploadingBanner ? 'Uploading...' : 'Click to upload banner image'}
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleBannerSelect}
                                            disabled={isUploadingBanner}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Theme Customization */}
                        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '20px' }}>
                            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Theme Customization
                            </h3>

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
                                {/* Primary Color */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>
                                        Primary Color
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                        {['#ff3b3b', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#000000'].map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setForm({ ...form, themePrimaryColor: color })}
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '8px',
                                                    background: color, border: (form.themePrimaryColor || '#ff3b3b') === color ? '3px solid white' : '1px solid #27272a',
                                                    cursor: 'pointer', boxShadow: (form.themePrimaryColor || '#ff3b3b') === color ? '0 0 0 2px ' + color : 'none'
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="color"
                                            value={form.themePrimaryColor || '#ff3b3b'}
                                            onChange={e => setForm({ ...form, themePrimaryColor: e.target.value })}
                                            style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                                        />
                                        <input
                                            type="text"
                                            value={form.themePrimaryColor || '#ff3b3b'}
                                            onChange={e => setForm({ ...form, themePrimaryColor: e.target.value })}
                                            placeholder="#ff3b3b"
                                            style={{
                                                flex: 1, padding: '10px 12px', borderRadius: '8px',
                                                background: '#09090b', border: '1px solid #27272a',
                                                color: 'white', fontSize: '0.9rem', outline: 'none',
                                                fontFamily: 'monospace'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Background Color */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>
                                        Background
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                        {[
                                            '#fafafa',
                                            '#f5f5f5',
                                            '#e5e5e5',
                                            '#1a1a1a',
                                            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                                        ].map((bg, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setForm({ ...form, themeBackground: bg })}
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '8px',
                                                    background: bg, border: (form.themeBackground || '#fafafa') === bg ? '3px solid white' : '1px solid #27272a',
                                                    cursor: 'pointer', boxShadow: (form.themeBackground || '#fafafa') === bg ? '0 0 0 2px #ff3b3b' : 'none'
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="color"
                                            value={form.themeBackground?.startsWith('#') ? form.themeBackground : '#fafafa'}
                                            onChange={e => setForm({ ...form, themeBackground: e.target.value })}
                                            style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                                        />
                                        <input
                                            type="text"
                                            value={form.themeBackground || '#fafafa'}
                                            onChange={e => setForm({ ...form, themeBackground: e.target.value })}
                                            placeholder="#fafafa or linear-gradient(...)"
                                            style={{
                                                flex: 1, padding: '10px 12px', borderRadius: '8px',
                                                background: '#09090b', border: '1px solid #27272a',
                                                color: 'white', fontSize: '0.9rem', outline: 'none',
                                                fontFamily: 'monospace'
                                            }}
                                        />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: '#52525b', marginTop: '4px', display: 'block' }}>
                                        Supports hex colors or CSS gradients
                                    </span>
                                </div>

                                {/* Footer Text Color */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>
                                        Footer Text Color
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="color"
                                            value={form.footerTextColor || '#fdedcb'}
                                            onChange={e => setForm({ ...form, footerTextColor: e.target.value })}
                                            style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                                        />
                                        <input
                                            type="text"
                                            value={form.footerTextColor || '#fdedcb'}
                                            onChange={e => setForm({ ...form, footerTextColor: e.target.value })}
                                            placeholder="#fdedcb"
                                            style={{
                                                flex: 1, padding: '10px 12px', borderRadius: '8px',
                                                background: '#09090b', border: '1px solid #27272a',
                                                color: 'white', fontSize: '0.9rem', outline: 'none',
                                                fontFamily: 'monospace'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Footer Background Color */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>
                                        Footer Background
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="color"
                                            value={form.footerBgColor || '#6a63fe'}
                                            onChange={e => setForm({ ...form, footerBgColor: e.target.value })}
                                            style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                                        />
                                        <input
                                            type="text"
                                            value={form.footerBgColor || '#6a63fe'}
                                            onChange={e => setForm({ ...form, footerBgColor: e.target.value })}
                                            placeholder="#6a63fe"
                                            style={{
                                                flex: 1, padding: '10px 12px', borderRadius: '8px',
                                                background: '#09090b', border: '1px solid #27272a',
                                                color: 'white', fontSize: '0.9rem', outline: 'none',
                                                fontFamily: 'monospace'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Footer Pattern Color */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>
                                        Footer Pattern Color
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="color"
                                            value={form.footerPatternColor || '#6e6ef9'}
                                            onChange={e => setForm({ ...form, footerPatternColor: e.target.value })}
                                            style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                                        />
                                        <input
                                            type="text"
                                            value={form.footerPatternColor || '#6e6ef9'}
                                            onChange={e => setForm({ ...form, footerPatternColor: e.target.value })}
                                            placeholder="#6e6ef9"
                                            style={{
                                                flex: 1, padding: '10px 12px', borderRadius: '8px',
                                                background: '#09090b', border: '1px solid #27272a',
                                                color: 'white', fontSize: '0.9rem', outline: 'none',
                                                fontFamily: 'monospace'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            <div style={{ marginTop: '20px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>
                                    Preview
                                </label>
                                <div style={{
                                    padding: '24px', borderRadius: '12px',
                                    background: form.themeBackground || '#fafafa',
                                    display: 'flex', flexDirection: 'column', gap: '12px'
                                }}>
                                    <div style={{ background: 'white', padding: '16px', borderRadius: '8px', borderTop: `4px solid ${form.themePrimaryColor || '#ff3b3b'}` }}>
                                        <p style={{ margin: 0, color: '#374151', fontWeight: 600, fontSize: '0.9rem' }}>Sample Question</p>
                                        <div style={{ height: '36px', background: '#f3f4f6', borderRadius: '6px', marginTop: '8px' }} />
                                    </div>
                                    <button style={{
                                        background: form.themePrimaryColor || '#ff3b3b', color: 'white',
                                        border: 'none', padding: '10px 20px', borderRadius: '8px',
                                        fontWeight: 600, fontSize: '0.85rem', alignSelf: 'flex-start'
                                    }}>
                                        Submit
                                    </button>

                                    {/* Footer Preview */}
                                    <div style={{ marginTop: '20px', width: '100%' }}>
                                        <FormFooter
                                            bgColor={form.footerBgColor || undefined}
                                            textColor={form.footerTextColor || undefined}
                                            patternColor={form.footerPatternColor || undefined}
                                        />
                                    </div>
                                </div>
                            </div>
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
                                    value={form.expiresAt ? (() => {
                                        const d = new Date(form.expiresAt)
                                        const year = d.getFullYear()
                                        const month = String(d.getMonth() + 1).padStart(2, '0')
                                        const day = String(d.getDate()).padStart(2, '0')
                                        const hours = String(d.getHours()).padStart(2, '0')
                                        const minutes = String(d.getMinutes()).padStart(2, '0')
                                        return `${year}-${month}-${day}T${hours}:${minutes}`
                                    })() : ''}
                                    onChange={e => setForm({ ...form, expiresAt: e.target.value ? new Date(e.target.value).getTime() : null })}
                                    style={{
                                        width: '100%', padding: '16px', borderRadius: '12px',
                                        background: '#18181b', border: '1px solid #27272a',
                                        color: 'white', fontSize: '1rem', outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <span style={{ fontSize: '0.8rem', color: '#71717a', marginTop: '4px', display: 'block' }}>
                                    Leave empty for no expiration
                                </span>
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
                        {/* Page Tabs */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '4px', background: '#18181b',
                            borderRadius: '12px', border: '1px solid #27272a',
                            overflowX: 'auto'
                        }}>
                            {pages.map((page, idx) => (
                                <div
                                    key={page.id}
                                    onClick={() => setActivePageId(page.id)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        background: activePageId === page.id ? '#27272a' : 'transparent',
                                        color: activePageId === page.id ? 'white' : '#71717a',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        border: activePageId === page.id ? '1px solid #3f3f46' : '1px solid transparent'
                                    }}
                                >
                                    {page.title || `Page ${idx + 1}`}
                                    {activePageId === page.id && pages.length > 1 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeletePage(page.id) }}
                                            style={{
                                                padding: '4px',
                                                borderRadius: '4px',
                                                color: '#ef4444',
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex'
                                            }}
                                            title="Delete Page"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                onClick={handleAddPage}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    background: '#27272a',
                                    color: '#a1a1aa',
                                    border: '1px dashed #3f3f46',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.85rem'
                                }}
                            >
                                <Plus size={14} /> Add Page
                            </button>
                        </div>
                        {/* Form Title (Quick Edit) */}
                        <div>
                            <div
                                style={{
                                    marginBottom: '16px',
                                    fontSize: '2rem',
                                    fontWeight: 700,
                                    color: 'white',
                                    borderBottom: '1px solid #27272a', /* Added subtle divider to mimic input/section */
                                    paddingBottom: '8px',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setActiveTab('settings')}
                                title="Click to edit in Settings"
                                dangerouslySetInnerHTML={{ __html: form.title || 'Untitled Form' }}
                                className="prose prose-invert prose-lg max-w-none prose-headings:m-0 prose-p:m-0"
                            />
                            {form.description && (
                                <div
                                    style={{ color: '#71717a', marginTop: '8px', fontSize: '1rem' }}
                                    dangerouslySetInnerHTML={{ __html: form.description }}
                                    className="prose prose-invert prose-sm max-w-none"
                                />
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
                                            dir="auto"
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
                                            dir="auto"
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
                                                            dir="auto"
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
