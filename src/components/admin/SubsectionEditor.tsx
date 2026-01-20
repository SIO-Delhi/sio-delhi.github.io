import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useContent } from '../../context/ContentContext'
import { uploadImage } from '../../lib/storage'
import { ArrowLeft, Save, Image as ImageIcon, Loader2, X, Plus, FileText, Pencil, Trash2, Calendar, Eye, EyeOff } from 'lucide-react'
import { ImageCropper } from './ImageCropper'
import { validateImage, compressImage } from '../../lib/imageProcessing'


export function SubsectionEditor() {
    const { sectionId, id } = useParams()
    const { sections, getPostById, addPost, updatePost, getChildPosts, deletePost } = useContent()
    const navigate = useNavigate()
    const isEditMode = !!id
    const section = isEditMode && id ? sections.find(s => s.id === getPostById(id)?.sectionId) : sections.find(s => s.id === sectionId)
    const subsection = isEditMode && id ? getPostById(id) : undefined
    const childPosts = isEditMode && id ? getChildPosts(id) : []

    // Form State - simplified for subsection
    const [title, setTitle] = useState('')
    const [subtitle, setSubtitle] = useState('')
    const [date, setDate] = useState('') // New Date State
    const [coverImage, setCoverImage] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    // Crop State
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
    const [pendingFile, setPendingFile] = useState<File | null>(null)

    // Load existing data if editing
    useEffect(() => {
        if (isEditMode && id) {
            const post = getPostById(id)
            if (post) {
                setTitle(post.title)
                setSubtitle(post.subtitle || '')
                setCoverImage(post.image || '')
                // Set date from createdAt
                if (post.createdAt) {
                    setDate(new Date(post.createdAt).toISOString().split('T')[0])
                }
            }
        }
    }, [isEditMode, id, getPostById])

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            validateImage(file)
        } catch (err: any) {
            alert(err.message)
            return
        }

        const reader = new FileReader()
        reader.addEventListener('load', () => {
            setCropImageSrc(reader.result?.toString() || null)
        })
        reader.readAsDataURL(file)

        // Reset input so same file can be selected again if cancelled
        e.target.value = ''
    }

    const handleSkip = async () => {
        if (!pendingFile) return
        setCropImageSrc(null)
        setIsUploading(true)
        try {
            // Already validated in handleImageUpload usually, but strictly:
            validateImage(pendingFile)
            const compressed = await compressImage(pendingFile)
            const url = await uploadImage(compressed)
            setCoverImage(url)
        } catch (err: any) {
            console.error(err)
            alert(err.message || 'Upload failed')
        } finally {
            setIsUploading(false)
            setPendingFile(null)
        }
    }

    const handleCropComplete = async (blob: Blob) => {
        setCropImageSrc(null)
        setIsUploading(true)
        try {
            // blob is already webp
            const file = new File([blob], `cropped-image-${Date.now()}.webp`, { type: "image/webp" })
            const url = await uploadImage(file)
            setCoverImage(url)
        } catch (err) {
            console.error(err)
            alert('Upload failed')
        } finally {
            setIsUploading(false)
        }
    }

    const handleSave = async () => {
        if (!title) { alert('Please enter a title'); return }
        setIsSaving(true)

        try {
            const postData = {
                title,
                subtitle,
                content: '', // Subsections don't have content
                image: coverImage,
                pdfUrl: '',
                layout: 'custom',
                isSubsection: true, // This is a subsection!
                createdAt: date ? new Date(date).getTime() : undefined, // Pass date
            }

            if (isEditMode && id) {
                await updatePost(id, postData)
            } else if (sectionId) {
                await addPost({ sectionId, isPublished: true, ...postData })
            }
            navigate(-1)
        } catch (error) {
            console.error(error)
            alert('Failed to save')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteChildPost = (postId: string, postTitle: string) => {
        if (confirm(`Delete "${postTitle}"? This cannot be undone.`)) {
            deletePost(postId)
        }
    }

    // Mobile detection
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    if (!section && !isEditMode) return <div>Section not found</div>

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: isMobile ? '60px' : '100px' }}>
            {cropImageSrc && (
                <ImageCropper
                    imageSrc={cropImageSrc}
                    onCancel={() => { setCropImageSrc(null); setPendingFile(null); }}
                    onSkip={handleSkip}
                    onCropComplete={handleCropComplete}
                />
            )}

            {/* Header */}
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                marginBottom: isMobile ? '24px' : '48px',
                gap: isMobile ? '16px' : '0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px' }}>
                    <button onClick={() => navigate(-1)} style={{
                        width: isMobile ? '36px' : '40px',
                        height: isMobile ? '36px' : '40px',
                        borderRadius: '50%',
                        background: '#222',
                        border: 'none',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0
                    }}>
                        <ArrowLeft size={isMobile ? 18 : 20} />
                    </button>
                    <div>
                        <div style={{ fontSize: isMobile ? '0.75rem' : '0.9rem', color: '#888' }}>{isEditMode ? 'MANAGE SUBSECTION' : `NEW SUBSECTION IN ${section?.label}`}</div>
                        <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 700, margin: 0 }}>{isEditMode ? subsection?.title || 'Subsection' : 'Create Subsection'}</h1>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: isMobile ? '10px 20px' : '12px 32px',
                        borderRadius: '100px',
                        background: '#ff3b3b',
                        color: 'white',
                        border: 'none',
                        fontWeight: 600,
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        cursor: 'pointer',
                        opacity: isSaving ? 0.7 : 1,
                        width: isMobile ? '100%' : 'auto',
                        justifyContent: 'center'
                    }}
                >
                    <Save size={isMobile ? 16 : 20} /> {isSaving ? 'Saving...' : 'Save'}
                </button>
            </div>

            {/* Two Column Layout in Edit Mode - Stack on Mobile */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : (isEditMode ? '1fr 1fr' : '1fr'),
                gap: isMobile ? '24px' : '48px'
            }}>

                {/* Left Column: Subsection Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
                    <h2 style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 600, color: '#888', marginBottom: '8px' }}>Subsection Details</h2>

                    {/* Cover Image */}
                    <div>
                        <label style={{ display: 'block', color: '#666', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 500 }}>Cover Image</label>
                        {coverImage ? (
                            <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333' }}>
                                <img src={coverImage} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button onClick={() => setCoverImage('')} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                                    <X size={12} /> Remove
                                </button>
                            </div>
                        ) : (
                            <label style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                padding: '32px', borderRadius: '12px', background: '#1a1a1a', border: '2px dashed #333',
                                cursor: isUploading ? 'wait' : 'pointer', transition: 'border-color 0.2s'
                            }}>
                                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} style={{ display: 'none' }} />
                                {isUploading ? (
                                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#666' }} />
                                ) : (
                                    <>
                                        <ImageIcon size={32} color="#444" style={{ marginBottom: '8px' }} />
                                        <div style={{ color: '#666', fontSize: '0.85rem' }}>Upload cover</div>
                                    </>
                                )}
                            </label>
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <label style={{ display: 'block', color: '#666', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 500 }}>Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Karavan Magazine"
                            style={{
                                width: '100%', padding: '14px 16px', borderRadius: '10px',
                                background: '#1a1a1a', border: '1px solid #333', color: 'white',
                                fontSize: '1.2rem', fontWeight: 600, outline: 'none'
                            }}
                        />
                    </div>

                    {/* Subtitle */}
                    <div>
                        <label style={{ display: 'block', color: '#666', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 500 }}>Summary</label>
                        <input
                            type="text"
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            placeholder="Brief summary"
                            style={{
                                width: '100%', padding: '12px 16px', borderRadius: '10px',
                                background: '#1a1a1a', border: '1px solid #333', color: '#aaa',
                                fontSize: '0.95rem', outline: 'none'
                            }}
                        />
                    </div>

                    {/* Date Field - New */}
                    <div>
                        <label style={{ display: 'block', color: '#666', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 500 }}>Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 16px', borderRadius: '10px',
                                background: '#1a1a1a', border: '1px solid #333', color: 'white',
                                fontSize: '0.95rem', outline: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* Right Column: Child Posts (only in edit mode) */}
                {isEditMode && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#888' }}>Posts in this Subsection</h2>
                            <button
                                onClick={() => navigate(`/admin/create-post/${section?.id}?parentId=${id}`)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '10px 16px', borderRadius: '8px',
                                    background: '#22c55e', color: 'white', border: 'none',
                                    fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                                }}
                            >
                                <Plus size={16} /> Add Post
                            </button>
                        </div>

                        {childPosts.length === 0 ? (
                            <div style={{
                                padding: '48px', borderRadius: '12px', border: '2px dashed #333',
                                textAlign: 'center', color: '#555'
                            }}>
                                <FileText size={32} style={{ opacity: 0.5, marginBottom: '12px' }} />
                                <div style={{ fontSize: '0.95rem' }}>No posts yet</div>
                                <div style={{ fontSize: '0.8rem', marginTop: '4px', color: '#444' }}>Click "Add Post" to create content</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {childPosts.map(post => (
                                    <div
                                        key={post.id}
                                        onClick={() => navigate(`/admin/post/${post.id}`)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            padding: '12px', borderRadius: '10px', background: '#141414',
                                            border: '1px solid #222', cursor: 'pointer', transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1a'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#141414'}
                                    >
                                        {/* Thumbnail */}
                                        <div style={{
                                            width: '50px', height: '50px', borderRadius: '8px',
                                            overflow: 'hidden', background: '#222', flexShrink: 0
                                        }}>
                                            {(() => {
                                                const getFirstImageUrl = (imageField: string | undefined): string | undefined => {
                                                    if (!imageField) return undefined
                                                    try {
                                                        const parsed = JSON.parse(imageField)
                                                        return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : imageField
                                                    } catch { return imageField }
                                                }
                                                const imageUrl = getFirstImageUrl(post.image)
                                                return imageUrl ? (
                                                    <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
                                                        <FileText size={18} />
                                                    </div>
                                                )
                                            })()}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {post.title}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
                                                <Calendar size={10} />
                                                {new Date(post.createdAt).toLocaleDateString()}
                                                <span style={{
                                                    padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem',
                                                    background: post.isPublished ? 'rgba(34,197,94,0.15)' : 'rgba(255,165,0,0.15)',
                                                    color: post.isPublished ? '#22c55e' : '#ffa500'
                                                }}>
                                                    {post.isPublished ? 'Published' : 'Draft'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updatePost(post.id, { isPublished: !post.isPublished });
                                                }}
                                                style={{
                                                    padding: '8px', borderRadius: '6px',
                                                    background: post.isPublished ? 'rgba(255,165,0,0.1)' : 'rgba(34,197,94,0.1)',
                                                    border: 'none',
                                                    color: post.isPublished ? '#ffa500' : '#22c55e',
                                                    cursor: 'pointer'
                                                }}
                                                title={post.isPublished ? 'Unpublish' : 'Publish'}
                                            >
                                                {post.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/admin/post/${post.id}`);
                                                }}
                                                style={{ padding: '8px', borderRadius: '6px', background: '#222', border: 'none', color: '#888', cursor: 'pointer' }}
                                                title="Edit"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteChildPost(post.id, post.title);
                                                }}
                                                style={{ padding: '8px', borderRadius: '6px', background: '#222', border: 'none', color: '#666', cursor: 'pointer' }}
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
