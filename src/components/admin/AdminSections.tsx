import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useContent } from '../../context/ContentContext'
import { Plus, Edit2, Trash2, Eye, EyeOff, GripVertical, Check, X, FolderOpen } from 'lucide-react'
import type { Section, SectionTemplate } from '../../types/content'
import { TemplateSelector } from './TemplateSelector'

export function AdminSections() {
    const { sections, createSection, updateSection, deleteSection } = useContent()
    const [isEditing, setIsEditing] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<Section>>({})
    const [isCreating, setIsCreating] = useState(false)
    const [newSection, setNewSection] = useState<{ title: string; label: string; template: SectionTemplate }>({
        title: '',
        label: '',
        template: 'standard'
    })

    const [deletingSection, setDeletingSection] = useState<Section | null>(null)
    const [deleteInput, setDeleteInput] = useState('')

    // Drag and Drop State
    const [draggedItem, setDraggedItem] = useState<string | null>(null)
    const [dragOverItem, setDragOverItem] = useState<string | null>(null)

    const [isMobile, setIsMobile] = useState(false)

    // Detect screen size
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedItem(id)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault()
        setDragOverItem(id)
    }

    const handleDrop = async (e: React.DragEvent, targetId: string) => {
        e.preventDefault()
        if (!draggedItem || draggedItem === targetId) return

        const sourceIndex = sections.findIndex(s => s.id === draggedItem)
        const targetIndex = sections.findIndex(s => s.id === targetId)

        if (sourceIndex === -1 || targetIndex === -1) return

        const newSections = [...sections]
        const [moved] = newSections.splice(sourceIndex, 1)
        newSections.splice(targetIndex, 0, moved)

        // Optimistic UI update (optional, but effectively handled by re-fetch)

        // Update all orders
        for (let i = 0; i < newSections.length; i++) {
            if (newSections[i].display_order !== i + 1) {
                await updateSection(newSections[i].id, { display_order: i + 1 })
            }
        }

        setDraggedItem(null)
        setDragOverItem(null)
    }

    const handleCreate = async () => {
        if (!newSection.title || !newSection.label) return
        try {
            const id = newSection.label.toLowerCase().replace(/[^a-z0-9]/g, '-')
            await createSection({
                id,
                title: newSection.title,
                label: newSection.label.toUpperCase(),
                description: '',
                template: newSection.template
            })
            setIsCreating(false)
            setNewSection({ title: '', label: '', template: 'standard' })
        } catch (err: any) {
            console.error('Create failed:', err)
            alert('Failed to create section: ' + (err.message || 'Unknown error'))
        }
    }

    const handleUpdate = async (id: string) => {
        try {
            // Only send fields that should be updated
            const { title, label, template, description } = editForm
            await updateSection(id, { title, label, template, description })
            setIsEditing(null)
        } catch (err: any) {
            console.warn('Update with template failed, retrying without template:', err)
            // Retry without template (in case column is missing in DB)
            try {
                const { title, label, description } = editForm
                await updateSection(id, { title, label, description })
                setIsEditing(null)
            } catch (retryErr: any) {
                console.error('Update retry failed:', retryErr)
                alert('Failed to update section: ' + (retryErr.message || 'Unknown error'))
            }
        }
    }

    const initDelete = (section: Section) => {
        setDeletingSection(section)
        setDeleteInput('')
    }

    const executeDelete = async () => {
        if (!deletingSection) return
        if (deleteInput !== deletingSection.title) return

        try {
            await deleteSection(deletingSection.id)
            setDeletingSection(null)
            setDeleteInput('')
        } catch (err: any) {
            console.error('Delete failed:', err)
            alert('Failed to delete section: ' + (err.message || 'Unknown error'))
        }
    }

    const handleTogglePublish = async (id: string, currentStatus: boolean) => {
        try {
            await updateSection(id, { is_published: !currentStatus })
        } catch (err: any) {
            console.error('Toggle failed:', err)
            alert('Failed to toggle visibility: ' + (err.message || 'Unknown error'))
        }
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
                    <h1 style={{ fontSize: isMobile ? '1.75rem' : '2rem', fontWeight: 700 }}>Manage Sections</h1>
                </div>

                <div style={{ display: 'flex', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
                    <button
                        onClick={() => setIsCreating(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: '#ff3b3b', color: 'white', border: 'none',
                            padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
                            width: isMobile ? '100%' : 'auto', justifyContent: 'center'
                        }}
                    >
                        <Plus size={20} /> New Section
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deletingSection && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }} onClick={() => setDeletingSection(null)}>
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
                                    Delete Section
                                </h2>
                                <p style={{ margin: 0, color: '#a1a1aa', lineHeight: '1.6', fontSize: '0.95rem' }}>
                                    This will permanently delete <strong style={{ color: '#fff' }}>"{deletingSection.title}"</strong>. This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                            <label style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: 500, marginLeft: '4px' }}>
                                Type <span style={{ color: '#ff3b3b' }}>{deletingSection.title}</span> to confirm
                            </label>
                            <input
                                value={deleteInput}
                                onChange={e => setDeleteInput(e.target.value)}
                                placeholder={deletingSection.title}
                                style={{
                                    padding: '16px', borderRadius: '12px',
                                    border: '1px solid #27272a',
                                    background: '#18181b',
                                    color: 'white', fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#ff3b3b'}
                                onBlur={(e) => e.target.style.borderColor = '#27272a'}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setDeletingSection(null)}
                                style={{
                                    flex: 1,
                                    padding: '16px', borderRadius: '12px',
                                    background: 'transparent', border: '1px solid #27272a', color: '#fff',
                                    cursor: 'pointer', fontWeight: 600,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#27272a'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeDelete}
                                disabled={deleteInput !== deletingSection.title}
                                style={{
                                    flex: 1,
                                    padding: '16px', borderRadius: '12px',
                                    background: deleteInput === deletingSection.title ? '#ff3b3b' : 'rgba(255, 59, 59, 0.1)',
                                    border: 'none',
                                    color: deleteInput === deletingSection.title ? 'white' : '#ff3b3b',
                                    opacity: deleteInput === deletingSection.title ? 1 : 0.5,
                                    cursor: deleteInput === deletingSection.title ? 'pointer' : 'not-allowed',
                                    fontWeight: 600, transition: 'all 0.2s'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal/Inline Form */}
            {isCreating && (
                <div style={{
                    marginBottom: '24px', padding: '24px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <h3 style={{ marginBottom: '16px' }}>Create New Section</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <input
                            placeholder="Section Title (e.g. Our Events)"
                            value={newSection.title}
                            onChange={e => setNewSection({ ...newSection, title: e.target.value })}
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                        />
                        <input
                            placeholder="Navbar Label (e.g. EVENTS)"
                            value={newSection.label}
                            onChange={e => setNewSection({ ...newSection, label: e.target.value })}
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                        />
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem', color: '#888' }}>Select Card Template</label>
                        <TemplateSelector
                            selected={newSection.template}
                            onSelect={(template) => setNewSection({ ...newSection, template })}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button onClick={() => setIsCreating(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #555', color: '#888', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                        <button onClick={handleCreate} style={{ padding: '8px 16px', background: '#ff3b3b', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>Create Section</button>
                    </div>
                </div>
            )}

            {/* Sections List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sections.map((section) => (
                    <div
                        key={section.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, section.id)}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDrop={(e) => handleDrop(e, section.id)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            padding: isMobile ? '16px' : '16px 24px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.03)',
                            border: dragOverItem === section.id ? '2px dashed #ff3b3b' : '1px solid rgba(255,255,255,0.08)',
                            opacity: draggedItem === section.id ? 0.5 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            alignItems: isMobile ? 'flex-start' : 'center',
                            gap: isMobile ? '12px' : '16px',
                        }}>
                            {/* Drag Handle & Content Group */}
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
                                {/* Drag Handle */}
                                <div style={{ cursor: 'move', color: '#666', padding: '4px' }}>
                                    <GripVertical size={20} />
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1 }}>
                                    {isEditing === section.id ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
                                                <input
                                                    value={editForm.title || ''}
                                                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                                    style={{ flex: 1, padding: '8px', borderRadius: '4px', background: '#222', border: '1px solid #444', color: 'white' }}
                                                    placeholder="Section Title"
                                                />
                                                <input
                                                    value={editForm.label || ''}
                                                    onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                                                    style={{ width: isMobile ? '100%' : '150px', padding: '8px', borderRadius: '4px', background: '#222', border: '1px solid #444', color: 'white' }}
                                                    placeholder="Navbar Label"
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#888' }}>Change Template</label>
                                                <TemplateSelector
                                                    selected={editForm.template || 'standard'}
                                                    onSelect={(template) => setEditForm({ ...editForm, template })}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{section.title}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.8rem', color: '#888', letterSpacing: '0.05em' }}>{section.label}</span>
                                                {section.type === 'custom' && <span style={{ fontSize: '0.7rem', background: '#333', padding: '2px 6px', borderRadius: '4px', color: '#aaa' }}>CUSTOM</span>}
                                                <span style={{ fontSize: '0.7rem', background: 'rgba(255, 59, 59, 0.1)', padding: '2px 6px', borderRadius: '4px', color: '#ff3b3b' }}>
                                                    {['standard', 'media', 'leadership', 'resource'].includes(section.template as any)
                                                        ? section.template?.toUpperCase()
                                                        : 'STANDARD'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                width: isMobile ? '100%' : 'auto',
                                justifyContent: isMobile ? 'flex-end' : 'flex-start',
                                borderTop: isMobile ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                paddingTop: isMobile ? '12px' : '0'
                            }}>
                                {isEditing === section.id ? (
                                    <>
                                        <button onClick={() => handleUpdate(section.id)} style={{ padding: '8px', background: '#2eff71', border: 'none', borderRadius: '6px', color: 'black', cursor: 'pointer' }}><Check size={18} /></button>
                                        <button onClick={() => setIsEditing(null)} style={{ padding: '8px', background: '#ff3b3b', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }}><X size={18} /></button>
                                    </>
                                ) : (
                                    <>
                                        <Link to={`/admin/section/${section.id}`} style={{ padding: '8px', background: '#333', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Manage Content">
                                            <FolderOpen size={18} />
                                        </Link>
                                        <button
                                            onClick={() => handleTogglePublish(section.id, section.is_published)}
                                            title={section.is_published ? "Hide Section" : "Publish Section"}
                                            style={{ padding: '8px', background: 'transparent', border: 'none', color: section.is_published ? '#2eff71' : '#666', cursor: 'pointer' }}
                                        >
                                            {section.is_published ? <Eye size={20} /> : <EyeOff size={20} />}
                                        </button>
                                        <button
                                            onClick={() => { setIsEditing(section.id); setEditForm(section) }}
                                            style={{ padding: '8px', background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => initDelete(section)}
                                            style={{ padding: '8px', background: 'transparent', border: 'none', color: '#ff3b3b', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

