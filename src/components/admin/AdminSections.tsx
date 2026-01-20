import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useContent } from '../../context/ContentContext'
import { Plus, Edit2, Trash2, Eye, EyeOff, GripVertical, Check, X, FolderOpen } from 'lucide-react'
import type { Section } from '../../types/content'

export function AdminSections() {
    const { sections, createSection, updateSection, deleteSection } = useContent()
    const [isEditing, setIsEditing] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<Section>>({})
    const [isCreating, setIsCreating] = useState(false)
    const [newSection, setNewSection] = useState({ title: '', label: '' })

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
                description: ''
            })
            setIsCreating(false)
            setNewSection({ title: '', label: '' })
        } catch (err: any) {
            console.error('Create failed:', err)
            alert('Failed to create section: ' + (err.message || 'Unknown error'))
        }
    }

    const handleUpdate = async (id: string) => {
        try {
            await updateSection(id, editForm)
            setIsEditing(null)
        } catch (err: any) {
            console.error('Update failed:', err)
            alert('Failed to update section: ' + (err.message || 'Unknown error'))
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to PERMANENTLY DELETE this section? This action cannot be undone.')) {
            try {
                await deleteSection(id)
            } catch (err: any) {
                console.error('Delete failed:', err)
                alert('Failed to delete section: ' + (err.message || 'Unknown error'))
            }
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
                <h1 style={{ fontSize: isMobile ? '1.75rem' : '2rem', fontWeight: 700 }}>Manage Sections</h1>
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
                            placeholder="Label (e.g. EVENTS)"
                            value={newSection.label}
                            onChange={e => setNewSection({ ...newSection, label: e.target.value })}
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: 'rgba(0,0,0,0.2)', color: 'white' }}
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
                            flexDirection: isMobile ? 'column' : 'row',
                            alignItems: isMobile ? 'flex-start' : 'center',
                            gap: isMobile ? '12px' : '16px',
                            padding: isMobile ? '16px' : '16px 24px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.03)',
                            border: dragOverItem === section.id ? '2px dashed #ff3b3b' : '1px solid rgba(255,255,255,0.08)',
                            opacity: draggedItem === section.id ? 0.5 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        {/* Drag Handle & Content Group */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
                            {/* Drag Handle */}
                            <div style={{ cursor: 'move', color: '#666', padding: '4px' }}>
                                <GripVertical size={20} />
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1 }}>
                                {isEditing === section.id ? (
                                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
                                        <input
                                            value={editForm.title || ''}
                                            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                            style={{ flex: 1, padding: '8px', borderRadius: '4px', background: '#222', border: '1px solid #444', color: 'white' }}
                                        />
                                        <input
                                            value={editForm.label || ''}
                                            onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                                            style={{ width: isMobile ? '100%' : '150px', padding: '8px', borderRadius: '4px', background: '#222', border: '1px solid #444', color: 'white' }}
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{section.title}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#888', letterSpacing: '0.05em' }}>{section.label}</span>
                                            {section.type === 'custom' && <span style={{ fontSize: '0.7rem', background: '#333', padding: '2px 6px', borderRadius: '4px', color: '#aaa' }}>CUSTOM</span>}
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
                                        onClick={() => handleDelete(section.id)}
                                        style={{ padding: '8px', background: 'transparent', border: 'none', color: '#ff3b3b', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
