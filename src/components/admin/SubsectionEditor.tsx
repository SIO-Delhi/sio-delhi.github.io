import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useContent } from '../../context/ContentContext'
import { uploadImage, uploadPdf } from '../../lib/storage'
import { ArrowLeft, Save, Image as ImageIcon, Loader2, X, Plus, FileText, Pencil, Trash2, Calendar, Eye, EyeOff, GripVertical, Images } from 'lucide-react'
import { ImageCropper } from './ImageCropper'
import { validateImage, compressImage } from '../../lib/imageProcessing'
import { BlockEditor, blocksToHtml, htmlToBlocks } from './BlockEditor'
import type { EditorBlock } from './BlockEditor'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'
import { UndoToast } from '../ui/UndoToast'
import { useUndoableDelete } from '../../hooks/useUndoableDelete'


export function SubsectionEditor() {
    const { sectionId, id } = useParams()
    const { sections, getPostById, addPost, updatePost, getChildPosts, deletePost } = useContent()
    const navigate = useNavigate()
    const isEditMode = !!id
    const section = isEditMode && id ? sections.find(s => s.id === getPostById(id)?.sectionId) : sections.find(s => s.id === sectionId)
    const subsection = isEditMode && id ? getPostById(id) : undefined
    const childPostsFromContext = isEditMode && id ? getChildPosts(id) : []

    // Local state for sorting to allow immediate UI feedback
    const [localChildPosts, setLocalChildPosts] = useState(childPostsFromContext)
    const [draggedPostId, setDraggedPostId] = useState<string | null>(null)

    // Delete Hook
    const {
        requestDelete,
        confirmDelete,
        undoDelete,
        cancelDelete,
        deleteState,
        pendingItem
    } = useUndoableDelete<any>({
        performDelete: async (postId) => {
            await deletePost(postId)
        }
    })

    // Sync local state when context changes
    useEffect(() => {
        setLocalChildPosts(childPostsFromContext)
    }, [childPostsFromContext.length, childPostsFromContext.map(p => p.id).join(',')])

    // Filter out pending deleted items
    const visibleChildPosts = localChildPosts.filter(p => !((deleteState === 'PENDING') && pendingItem === p.id))

    // Form State - simplified for subsection
    const [title, setTitle] = useState('')
    const [subtitle, setSubtitle] = useState('')
    const [date, setDate] = useState('') // New Date State
    const [coverImage, setCoverImage] = useState('')
    const [galleryImages, setGalleryImages] = useState<string[]>([]) // Gallery images
    const [blocks, setBlocks] = useState<EditorBlock[]>([]) // Content blocks
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isGalleryUploading, setIsGalleryUploading] = useState(false)

    // Crop State
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
    const [pendingFile, setPendingFile] = useState<File | null>(null)
    const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null)
    const [pendingGalleryFiles, setPendingGalleryFiles] = useState<Record<string, File>>({})
    const [pendingBlockAssets, setPendingBlockAssets] = useState<Record<string, { url: string, file: File }[]>>({})

    // Load existing data if editing
    useEffect(() => {
        if (isEditMode && id) {
            const post = getPostById(id)
            if (post) {
                setTitle(post.title)
                setSubtitle(post.subtitle || '')
                setCoverImage(post.image || '')
                setGalleryImages(post.galleryImages || [])
                // Parse content into blocks
                setBlocks(htmlToBlocks(post.content || ''))
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
        setPendingFile(file)
        e.target.value = ''
    }

    const handleSkip = async () => {
        if (!pendingFile) return
        setCropImageSrc(null)
        setIsUploading(true)
        try {
            validateImage(pendingFile)
            const compressed = await compressImage(pendingFile)
            const blobUrl = URL.createObjectURL(compressed)
            setCoverImage(blobUrl)
            setPendingCoverFile(compressed)
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
            const blobUrl = URL.createObjectURL(file)
            setCoverImage(blobUrl)
            setPendingCoverFile(file)
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

        // Helper to upload a single file (image or PDF)
        const uploadPendingFile = async (file: File) => {
            if (file.type.includes('pdf')) return await uploadPdf(file)
            return await uploadImage(file)
        }

        try {
            // 1. Upload Cover Image if pending
            let finalCoverImage = coverImage
            if (pendingCoverFile && coverImage.startsWith('blob:')) {
                finalCoverImage = await uploadPendingFile(pendingCoverFile)
            }

            // 2. Upload Gallery Images
            const processedGalleryImages = [...galleryImages]
            for (let i = 0; i < processedGalleryImages.length; i++) {
                const url = processedGalleryImages[i]
                if (pendingGalleryFiles[url]) {
                    const realUrl = await uploadPendingFile(pendingGalleryFiles[url])
                    processedGalleryImages[i] = realUrl
                }
            }

            // 3. Process Blocks (Upload pending assets and replace URLs)
            const processedBlocks = JSON.parse(JSON.stringify(blocks)) as EditorBlock[]

            for (const block of processedBlocks) {
                const assets = pendingBlockAssets[block.id]
                if (assets && assets.length > 0) {
                    for (const asset of assets) {
                        const realUrl = await uploadPendingFile(asset.file)

                        // Update Block Content/Props
                        if (block.content === asset.url) block.content = realUrl
                        if (block.imageUrl === asset.url) block.imageUrl = realUrl

                        // Update Carousel Images
                        if (block.carouselImages) {
                            block.carouselImages = block.carouselImages.map(u => u === asset.url ? realUrl : u)
                        }
                    }
                }
            }

            // Serialize blocks to HTML
            const finalContent = blocksToHtml(processedBlocks)

            const postData = {
                title,
                subtitle,
                content: finalContent,
                image: finalCoverImage,
                pdfUrl: '',
                layout: 'custom',
                isSubsection: true,
                galleryImages: processedGalleryImages,
                createdAt: date ? new Date(date).getTime() : undefined,
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

    // Gallery upload handler
    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return
        setIsGalleryUploading(true)
        try {
            const newUrls: string[] = []
            const newPendingFiles: Record<string, File> = {}

            for (const file of Array.from(files)) {
                validateImage(file)
                const compressed = await compressImage(file)
                const blobUrl = URL.createObjectURL(compressed)
                newUrls.push(blobUrl)
                newPendingFiles[blobUrl] = compressed
            }

            setGalleryImages(prev => [...prev, ...newUrls])
            setPendingGalleryFiles(prev => ({ ...prev, ...newPendingFiles }))
        } catch (err: any) {
            alert(err.message || 'Upload failed')
        } finally {
            setIsGalleryUploading(false)
            e.target.value = ''
        }
    }


    // Drag and Drop Logic
    const handleDragStart = (e: React.DragEvent, postId: string) => {
        setDraggedPostId(postId)
        e.dataTransfer.effectAllowed = 'move'
        // Styling for drag
        const target = e.currentTarget as HTMLElement
        target.style.opacity = '0.5'
    }

    const handleDragEnd = (e: React.DragEvent) => {
        setDraggedPostId(null)
        const target = e.currentTarget as HTMLElement
        target.style.opacity = '1'
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault() // Essential to allow dropping
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = async (e: React.DragEvent, targetPostId: string) => {
        e.preventDefault()
        if (!draggedPostId || draggedPostId === targetPostId) return

        // Calculate new order locally
        const newPosts = [...localChildPosts]
        const draggedIndex = newPosts.findIndex(p => p.id === draggedPostId)
        const targetIndex = newPosts.findIndex(p => p.id === targetPostId)

        if (draggedIndex === -1 || targetIndex === -1) return

        // Move item
        const [movedItem] = newPosts.splice(draggedIndex, 1)
        newPosts.splice(targetIndex, 0, movedItem)

        // Optimistically update UI
        setLocalChildPosts(newPosts)

        // Persist order to DB
        // We update all posts with their new index as order
        try {
            const updates = newPosts.map((post, index) => updatePost(post.id, { order: index }))
            await Promise.all(updates)
        } catch (err) {
            console.error('Failed to save order', err)
            alert('Failed to save new order')
        }
    }

    // Deleted handleDeleteChildPost function in favor of requestDelete

    // Mobile detection
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    if (!section && !isEditMode) return <div>Section not found</div>

    // Need to find the object for the pending ID to show name in modal
    const pendingChildPost = pendingItem ? localChildPosts.find(p => p.id === pendingItem) : null

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: isMobile ? '60px' : '100px' }}>
            {deleteState === 'CONFIRMING' && (
                <DeleteConfirmationModal
                    isOpen={true}
                    onClose={cancelDelete}
                    onConfirm={confirmDelete}
                    itemName={pendingChildPost?.title || ''}
                    title="Delete Post"
                    description={`This will permanently delete "${pendingChildPost?.title}".`}
                />
            )}

            {deleteState === 'PENDING' && (
                <UndoToast
                    message="Child post deleted."
                    seconds={10}
                    onUndo={undoDelete}
                />
            )}

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

                    {/* Gallery Images */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 500 }}>
                            <Images size={14} /> Gallery Images
                            {galleryImages.length > 0 && (
                                <span style={{ background: '#ff3b3b', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem' }}>
                                    {galleryImages.length}
                                </span>
                            )}
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {galleryImages.map((img, idx) => (
                                <div key={idx} style={{ position: 'relative', width: '80px', height: '80px' }}>
                                    <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} alt={`Gallery ${idx + 1}`} />
                                    <button
                                        onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== idx))}
                                        style={{
                                            position: 'absolute', top: '4px', right: '4px',
                                            background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none',
                                            width: '20px', height: '20px', borderRadius: '50%',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '12px'
                                        }}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            <label style={{
                                width: '80px', height: '80px',
                                background: '#1a1a1a', border: '2px dashed #333', borderRadius: '8px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                cursor: isGalleryUploading ? 'wait' : 'pointer', color: '#555'
                            }}>
                                {isGalleryUploading ? (
                                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                                ) : (
                                    <>
                                        <Plus size={20} />
                                        <span style={{ fontSize: '0.6rem', marginTop: '2px' }}>Add</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleGalleryUpload}
                                    disabled={isGalleryUploading}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Content Blocks */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '0.8rem', marginBottom: '12px', fontWeight: 500 }}>
                            <FileText size={14} /> Content Blocks
                        </label>
                        <BlockEditor
                            blocks={blocks}
                            onChange={setBlocks}
                            onBlockAssetsChange={(blockId, assets) => {
                                setPendingBlockAssets(prev => ({ ...prev, [blockId]: assets }))
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

                        {visibleChildPosts.length === 0 ? (
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
                                {visibleChildPosts.map(post => (
                                    <div
                                        key={post.id}
                                        onClick={() => navigate(`/admin/post/${post.id}`)}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, post.id)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, post.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            padding: '12px 12px 12px 6px', // Left padding reduced for Grip
                                            borderRadius: '10px', background: '#141414',
                                            border: '1px solid #222', cursor: 'grab', transition: 'background 0.2s',
                                            transform: draggedPostId === post.id ? 'scale(0.98)' : 'none'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#1a1a1a'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#141414'}
                                    >
                                        {/* Drag Handle */}
                                        <div style={{ padding: '8px 4px', cursor: 'grab', color: '#444', display: 'flex', alignItems: 'center' }}>
                                            <GripVertical size={16} />
                                        </div>

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
                                                    requestDelete(post.id);
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
