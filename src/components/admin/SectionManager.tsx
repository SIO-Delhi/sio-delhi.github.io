
import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useContent } from '../../context/ContentContext'
import { Plus, Edit2, Trash2, Calendar, Layout, Layers, Eye, EyeOff, FolderOpen, ChevronDown, FileText, GripVertical } from 'lucide-react'

export function SectionManager() {
    const { sectionId } = useParams()
    const { sections, getPostsBySection, deletePost, updatePost } = useContent()
    const navigate = useNavigate()
    const [showCreateMenu, setShowCreateMenu] = useState(false)

    // Drag and drop state
    const [draggedItem, setDraggedItem] = useState<string | null>(null)
    const [dragOverItem, setDragOverItem] = useState<string | null>(null)
    const [isUpdatingOrder, setIsUpdatingOrder] = useState(false)

    const section = sections.find(s => s.id === sectionId)
    // Get posts and ensure they are sorted by order
    const posts = sectionId ? getPostsBySection(sectionId) : []

    const togglePublish = async (postId: string, currentStatus: boolean) => {
        try {
            await updatePost(postId, { isPublished: !currentStatus })
        } catch (err) {
            console.error('Failed to toggle publish status:', err)
            alert('Failed to update publish status')
        }
    }

    // Handle Drag Start
    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedItem(id)
        e.dataTransfer.effectAllowed = 'move'
        // Create ghost image if needed, or browser default
    }

    // Handle Drag Over
    const handleDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault()
        if (draggedItem === id) return
        setDragOverItem(id)
    }

    // Handle Drop
    const handleDrop = async (e: React.DragEvent, targetId: string) => {
        e.preventDefault()
        const sourceId = draggedItem

        if (!sourceId || sourceId === targetId) {
            setDraggedItem(null)
            setDragOverItem(null)
            return
        }

        // Reorder locally first for UI snap
        const sourceIndex = posts.findIndex(p => p.id === sourceId)
        const targetIndex = posts.findIndex(p => p.id === targetId)

        if (sourceIndex === -1 || targetIndex === -1) return

        const newPosts = [...posts]
        const [movedItem] = newPosts.splice(sourceIndex, 1)
        newPosts.splice(targetIndex, 0, movedItem)

        // Optimistic UI update could happen here if local state was used for rendering

        setIsUpdatingOrder(true)
        setDraggedItem(null)
        setDragOverItem(null)

        try {
            // Update all affected posts with new order index
            // We update ALL because simple swap isn't enough for clean ordering
            const updates = newPosts.map((post, index) => ({
                id: post.id,
                order: index
            }))

            await Promise.all(updates.map(update =>
                updatePost(update.id, { order: update.order })
            ))

        } catch (err) {
            console.error('Failed to update order:', err)
            alert('Failed to save new order')
        } finally {
            setIsUpdatingOrder(false)
        }
    }

    if (!section) return <div>Section not found</div>

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '4px' }}>MANAGE SECTION</div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>{section.title}</h1>
                </div>

                {/* Create New Dropdown */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowCreateMenu(!showCreateMenu)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '12px 24px', borderRadius: '100px',
                            background: '#ff3b3b', color: 'white', border: 'none',
                            fontWeight: 600, cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(255, 59, 59, 0.3)'
                        }}
                    >
                        <Plus size={20} />
                        Create New
                        <ChevronDown size={16} style={{ marginLeft: '4px', transition: 'transform 0.2s', transform: showCreateMenu ? 'rotate(180deg)' : 'rotate(0)' }} />
                    </button>

                    {showCreateMenu && (
                        <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                            background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px',
                            overflow: 'hidden', minWidth: '200px', zIndex: 100,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                        }}>
                            <Link
                                to={`/admin/create/${section.id}`}
                                onClick={() => setShowCreateMenu(false)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '14px 20px', textDecoration: 'none', color: 'white',
                                    borderBottom: '1px solid #333', transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#222'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <FileText size={18} color="#888" />
                                <div>
                                    <div style={{ fontWeight: 600 }}>Post</div>
                                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Regular content page</div>
                                </div>
                            </Link>
                            <Link
                                to={`/admin/create-subsection/${section.id}`}
                                onClick={() => setShowCreateMenu(false)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '14px 20px', textDecoration: 'none', color: 'white',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#222'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <FolderOpen size={18} color="#ff3b3b" />
                                <div>
                                    <div style={{ fontWeight: 600 }}>Subsection</div>
                                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Container for posts</div>
                                </div>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Posts List */}
            {posts.length === 0 ? (
                <div style={{
                    padding: '64px', borderRadius: '16px', border: '2px dashed #333',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                    color: '#666'
                }}>
                    <Layers size={48} style={{ opacity: 0.5 }} />
                    <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>No posts yet</div>
                    <p>Create your first post to get started.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', opacity: isUpdatingOrder ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                    {posts.map(post => {
                        // Helper: extract first image from potentially JSON-stringified array
                        const getFirstImageUrl = (imageString: string | undefined): string | null => {
                            if (!imageString) return null;
                            try {
                                // Check if it looks like a JSON array
                                if (imageString.trim().startsWith('[') && imageString.trim().endsWith(']')) {
                                    const parsed = JSON.parse(imageString);
                                    if (Array.isArray(parsed) && parsed.length > 0) {
                                        return parsed[0];
                                    }
                                    return null;
                                }
                                // Not JSON, return as is
                                return imageString;
                            } catch (e) {
                                // Parse error, return original string (likely a direct URL)
                                return imageString;
                            }
                        };

                        const displayImage = getFirstImageUrl(post.image);

                        return (
                            <div
                                key={post.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, post.id)}
                                onDragOver={(e) => handleDragOver(e, post.id)}
                                onDrop={(e) => handleDrop(e, post.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '24px', borderRadius: '12px',
                                    background: dragOverItem === post.id ? '#1a1a1a' : '#141414',
                                    border: dragOverItem === post.id ? '1px dashed #666' : '1px solid #222',
                                    transition: 'all 0.2s',
                                    cursor: 'grab',
                                    transform: draggedItem === post.id ? 'scale(0.99)' : 'scale(1)',
                                    boxShadow: draggedItem === post.id ? '0 8px 24px rgba(0,0,0,0.5)' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                    {/* Drag Handle */}
                                    <div style={{ color: '#444', cursor: 'grab' }} title="Drag to reorder">
                                        <GripVertical size={20} />
                                    </div>

                                    {/* Thumbnail */}
                                    <div style={{
                                        width: '80px', height: '60px', borderRadius: '8px', overflow: 'hidden',
                                        background: '#222', flexShrink: 0
                                    }}>
                                        {displayImage ? (
                                            <img src={displayImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
                                                <Layout size={20} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{post.title}</h3>
                                            {/* Subsection Badge */}
                                            {post.isSubsection && (
                                                <span style={{
                                                    padding: '2px 10px',
                                                    borderRadius: '100px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600,
                                                    textTransform: 'uppercase',
                                                    background: 'rgba(139, 92, 246, 0.15)',
                                                    color: '#a78bfa',
                                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <FolderOpen size={10} /> Subsection
                                                </span>
                                            )}
                                            {/* Status Badge */}
                                            <span style={{
                                                padding: '2px 10px',
                                                borderRadius: '100px',
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                background: post.isPublished ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 165, 0, 0.15)',
                                                color: post.isPublished ? '#22c55e' : '#ffa500',
                                                border: `1px solid ${post.isPublished ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 165, 0, 0.3)'}`
                                            }}>
                                                {post.isPublished ? 'Published' : 'Draft'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#888' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={14} />
                                                {new Date(post.createdAt).toLocaleDateString()}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'capitalize' }}>
                                                <Layout size={14} />
                                                {post.layout.replace('-', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {/* Publish/Unpublish Toggle */}
                                    <button
                                        onClick={() => togglePublish(post.id, post.isPublished)}
                                        title={post.isPublished ? "Unpublish" : "Publish"}
                                        style={{
                                            padding: '10px 16px', borderRadius: '8px',
                                            background: post.isPublished ? 'rgba(255, 165, 0, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                            border: 'none',
                                            color: post.isPublished ? '#ffa500' : '#22c55e',
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            fontSize: '0.85rem', fontWeight: 600
                                        }}
                                    >
                                        {post.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                                        {post.isPublished ? 'Unpublish' : 'Publish'}
                                    </button>
                                    <button
                                        onClick={() => navigate(post.isSubsection ? `/admin/subsection/${post.id}` : `/admin/post/${post.id}`)}
                                        title={post.isSubsection ? "Manage Subsection" : "Edit Post"}
                                        style={{
                                            padding: '10px', borderRadius: '8px',
                                            background: '#222', border: 'none', color: '#fff',
                                            cursor: 'pointer', transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#222'}
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={async (e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                                                try {
                                                    await deletePost(post.id)
                                                } catch (err) {
                                                    console.error('Delete error:', err)
                                                    alert('Failed to delete post.')
                                                }
                                            }
                                        }}
                                        title="Delete Post"
                                        style={{
                                            padding: '10px', borderRadius: '8px',
                                            background: 'rgba(255, 59, 59, 0.1)', border: 'none', color: '#ff3b3b',
                                            cursor: 'pointer', transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 59, 59, 0.2)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 59, 59, 0.1)'}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    )
}
