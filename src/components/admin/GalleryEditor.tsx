import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useContent } from '../../context/ContentContext'
import { uploadImage } from '../../lib/storage'
import { validateImage, compressImage } from '../../lib/imageProcessing'
import { ImageCropper } from './ImageCropper'
import { ArrowLeft, Save, Plus, X, Image as ImageIcon, Trash2, GripVertical, Loader2, Images } from 'lucide-react'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'
import { UndoToast } from '../ui/UndoToast'
import { useUndoableDelete } from '../../hooks/useUndoableDelete'

interface GallerySection {
    id: string
    title: string
    images: string[]
}

export function GalleryEditor() {
    const { sectionId, id } = useParams()
    const navigate = useNavigate()
    const { addPost, updatePost, getPostById } = useContent()

    const [isSaving, setIsSaving] = useState(false)

    // Post metadata
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [coverImage, setCoverImage] = useState('')

    // Gallery Data
    const [sections, setSections] = useState<GallerySection[]>([])

    // Upload State
    const [isUploading, setIsUploading] = useState(false)

    // Crop Queue
    const [cropQueue, setCropQueue] = useState<{ file: File, sectionId: string | 'cover', preview: string }[]>([])
    const [currentCropIndex, setCurrentCropIndex] = useState(0)

    // Pending Files
    const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({})

    // Delete Hook for Sections
    const {
        requestDelete,
        confirmDelete,
        undoDelete,
        cancelDelete,
        deleteState,
        pendingItem
    } = useUndoableDelete<string>({
        performDelete: async (sectionIdToDelete) => {
            setSections(prev => prev.filter(s => s.id !== sectionIdToDelete))
        }
    })

    // Load existing data
    useEffect(() => {
        if (id) {
            const post = getPostById(id)
            if (post) {
                setTitle(post.title)
                setContent(post.content || '')
                setCoverImage(post.image || '')

                // Parse gallery images
                // It might be string[] (old) or GallerySection[] (new)
                let galleryData = post.galleryImages || []

                // Check format
                if (galleryData.length > 0 && typeof galleryData[0] === 'string') {
                    // Convert old format to one default section
                    setSections([{
                        id: crypto.randomUUID(),
                        title: 'Gallery',
                        images: galleryData as unknown as string[]
                    }])
                } else {
                    setSections(galleryData as unknown as GallerySection[])
                }
            }
        } else {
            // New gallery - start with one section
            setSections([{
                id: crypto.randomUUID(),
                title: 'Main Gallery',
                images: []
            }])
        }
    }, [id, getPostById])

    const handleSave = async () => {
        if (!title.trim()) {
            alert('Please enter a title')
            return
        }

        setIsSaving(true)
        try {
            // 1. Process Cover Image
            let finalCoverImage = coverImage
            if (coverImage.startsWith('blob:') && pendingFiles[coverImage]) {
                finalCoverImage = await uploadImage(pendingFiles[coverImage])
            }

            // 2. Process Sections Images
            const processedSections = [...sections]
            for (let i = 0; i < processedSections.length; i++) {
                const section = processedSections[i]
                const processedImages = [...section.images]
                let changed = false

                for (let j = 0; j < processedImages.length; j++) {
                    const url = processedImages[j]
                    if (url.startsWith('blob:') && pendingFiles[url]) {
                        processedImages[j] = await uploadImage(pendingFiles[url])
                        changed = true
                    }
                }

                if (changed) {
                    processedSections[i] = { ...section, images: processedImages }
                }
            }

            const postData = {
                title,
                content,
                image: finalCoverImage,
                layout: 'gallery',
                galleryImages: processedSections as any,
                sectionId: sectionId,
                isPublished: true
            }

            if (id) {
                await updatePost(id, postData)
            } else {
                if (!sectionId) throw new Error('No section ID')
                await addPost({
                    ...postData,
                    sectionId,
                })
            }
            navigate(-1)
        } catch (err: any) {
            console.error('Save failed:', err)
            alert('Failed to save gallery: ' + err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleAddSection = () => {
        setSections([...sections, {
            id: crypto.randomUUID(),
            title: '',
            images: []
        }])
    }

    // handleRemoveSection replaced by requestDelete

    const handleUpdateSectionTitle = (sectionId: string, newTitle: string) => {
        setSections(sections.map(s => s.id === sectionId ? { ...s, title: newTitle } : s))
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetSectionId: string) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsUploading(true)
        try {
            const newUrls: string[] = []
            const newPendingFiles: Record<string, File> = {}

            for (const file of Array.from(files)) {
                try {
                    validateImage(file)
                    const compressed = await compressImage(file)
                    const blobUrl = URL.createObjectURL(compressed)
                    newUrls.push(blobUrl)
                    newPendingFiles[blobUrl] = compressed
                } catch (err: any) {
                    console.error(`Error processing ${file.name}:`, err)
                    alert(`Failed option for ${file.name}: ${err.message}`)
                }
            }

            if (newUrls.length > 0) {
                setPendingFiles(prev => ({ ...prev, ...newPendingFiles }))
                setSections(prev => prev.map(s => {
                    if (s.id === targetSectionId) {
                        return { ...s, images: [...s.images, ...newUrls] }
                    }
                    return s
                }))
            }

        } catch (err) {
            console.error('Batch processing error:', err)
        } finally {
            setIsUploading(false)
            e.target.value = ''
        }
    }

    const handleRemoveImage = (targetSectionId: string, imageIndex: number) => {
        setSections(prev => prev.map(s => {
            if (s.id === targetSectionId) {
                const newImages = [...s.images]
                newImages.splice(imageIndex, 1)
                return { ...s, images: newImages }
            }
            return s
        }))
    }

    // Cover Image Handler
    const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            validateImage(file)
            setCropQueue(prev => [...prev, {
                file,
                sectionId: 'cover',
                preview: URL.createObjectURL(file)
            }])
        } catch (err: any) {
            alert(err.message)
        }
        e.target.value = ''
    }

    const processCrop = async (croppedBlob: Blob) => {
        const currentItem = cropQueue[currentCropIndex]
        if (!currentItem) return

        setIsUploading(true)
        try {
            // Convert blob to File and Compress/Convert to WebP
            const file = new File([croppedBlob], currentItem.file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' })
            const compressed = await compressImage(file) // Re-compress or just use? compressImage usage is fine

            const blobUrl = URL.createObjectURL(compressed)
            setPendingFiles(prev => ({ ...prev, [blobUrl]: compressed }))

            if (currentItem.sectionId === 'cover') {
                setCoverImage(blobUrl)
            } else {
                setSections(prev => prev.map(s => {
                    if (s.id === currentItem.sectionId) {
                        return { ...s, images: [...s.images, blobUrl] }
                    }
                    return s
                }))
            }
        } catch (err: any) {
            console.error('Processing failed:', err)
            alert('Processing failed: ' + err.message)
        } finally {
            setIsUploading(false)
            // Move to next
            finishCurrentItem()
        }
    }

    const finishCurrentItem = () => {
        const currentItem = cropQueue[currentCropIndex]
        if (currentItem) {
            URL.revokeObjectURL(currentItem.preview)
        }

        // Remove current item from queue
        // Actually simpler to just remove the first item if we always process the 0th?
        // But let's use filtering based on index
        setCropQueue(prev => prev.filter((_, idx) => idx !== currentCropIndex))
        // Reset index to 0 because the array shifts
        setCurrentCropIndex(0)
    }

    // --- Render ---

    const currentCropItem = cropQueue[currentCropIndex]

    // Find the section being deleted for the modal
    const pendingSection = pendingItem ? sections.find(s => s.id === pendingItem) : null

    // Optimistic UI - filter out pending deletions
    const visibleSections = sections.filter(s => !((deleteState === 'PENDING') && pendingItem === s.id))


    return (
        <div style={{ minHeight: '100vh', background: '#09090b', color: 'white', paddingBottom: '100px' }}>
            {deleteState === 'CONFIRMING' && (
                <DeleteConfirmationModal
                    isOpen={true}
                    onClose={cancelDelete}
                    onConfirm={confirmDelete}
                    itemName={pendingSection?.title || 'Section'}
                    title="Delete Section"
                    description={`This will permanently delete the section "${pendingSection?.title || 'Untitled'}" and its images.`}
                />
            )}

            {deleteState === 'PENDING' && (
                <UndoToast
                    message="Section deleted."
                    seconds={10}
                    onUndo={undoDelete}
                />
            )}

            {/* Cropper Modal */}
            {currentCropItem && (
                <ImageCropper
                    imageSrc={currentCropItem.preview}
                    aspectRatio={currentCropItem.sectionId === 'cover' ? 16 / 9 : undefined} // Force 16/9 for cover? Maybe. Let's keep cover optional ratio? No, cover usually fixed. Let's say 16/9 is good default for cover, undefined for gallery.
                    onCancel={finishCurrentItem}
                    onCropComplete={processCrop}
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
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                        {id ? 'Edit Gallery' : 'New Gallery'}
                    </h1>
                </div>
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
                    Save Gallery
                </button>
            </div>

            <div style={{ maxWidth: '1000px', margin: '32px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                {/* Main Metadata */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <label style={{ display: 'block' }}>
                            <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Gallery Title
                            </span>
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Enter gallery title..."
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '12px',
                                    background: '#18181b', border: '1px solid #27272a',
                                    color: 'white', fontSize: '1.5rem', fontWeight: 700,
                                    outline: 'none'
                                }}
                            />
                        </label>

                        <label style={{ display: 'block' }}>
                            <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Description
                            </span>
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="Optional description..."
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '12px',
                                    background: '#18181b', border: '1px solid #27272a',
                                    color: 'white', fontSize: '1rem',
                                    outline: 'none', minHeight: '100px', resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </label>
                    </div>

                    {/* Cover Image */}
                    <div>
                        <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Cover Image
                        </span>
                        <div style={{
                            position: 'relative', width: '100%', aspectRatio: '16/9',
                            borderRadius: '12px', overflow: 'hidden',
                            background: '#18181b', border: '1px dashed #3f3f46',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {coverImage ? (
                                <>
                                    <img src={coverImage} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button
                                        onClick={() => setCoverImage('')}
                                        style={{
                                            position: 'absolute', top: 8, right: 8,
                                            background: 'rgba(0,0,0,0.6)', color: 'white',
                                            border: 'none', borderRadius: '50%',
                                            width: 32, height: 32, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                </>
                            ) : (
                                <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#71717a' }}>
                                    <ImageIcon size={32} />
                                    <span style={{ fontSize: '0.85rem' }}>Upload Cover</span>
                                    <input type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: 'none' }} />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #27272a', margin: 0 }} />

                {/* Sections */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Gallery Sections</h2>
                        <button
                            onClick={handleAddSection}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: '#27272a', color: 'white', border: 'none',
                                padding: '8px 16px', borderRadius: '8px',
                                fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer'
                            }}
                        >
                            <Plus size={16} /> Add Section
                        </button>
                    </div>

                    {visibleSections.map((section) => (
                        <div key={section.id} style={{
                            background: '#18181b', border: '1px solid #27272a', borderRadius: '16px',
                            padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px'
                        }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{ paddingTop: '12px', color: '#52525b', cursor: 'grab' }}>
                                    <GripVertical size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <input
                                        value={section.title}
                                        onChange={e => handleUpdateSectionTitle(section.id, e.target.value)}
                                        placeholder="Section Title (e.g. Day 1, Award Ceremony)"
                                        style={{
                                            width: '100%', background: 'transparent',
                                            border: 'none', borderBottom: '2px solid #27272a',
                                            padding: '8px 0', fontSize: '1.1rem', fontWeight: 600,
                                            color: 'white', outline: 'none'
                                        }}
                                        onFocus={e => e.target.style.borderColor = '#ff3b3b'}
                                        onBlur={e => e.target.style.borderColor = '#27272a'}
                                    />
                                </div>
                                <button
                                    onClick={() => requestDelete(section.id)}
                                    title="Remove Section"
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

                            {/* Images Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                gap: '12px'
                            }}>
                                {section.images.map((img, imgIdx) => (
                                    <div key={imgIdx} style={{
                                        position: 'relative', aspectRatio: '1',
                                        borderRadius: '8px', overflow: 'hidden',
                                        background: '#09090b', border: '1px solid #27272a'
                                    }}>
                                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button
                                            onClick={() => handleRemoveImage(section.id, imgIdx)}
                                            style={{
                                                position: 'absolute', top: 4, right: 4,
                                                background: 'rgba(0,0,0,0.6)', color: 'white',
                                                border: 'none', borderRadius: '50%',
                                                width: 24, height: 24, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}

                                {/* Upload Button */}
                                <label style={{
                                    aspectRatio: '1', borderRadius: '8px',
                                    border: '2px dashed #27272a', background: 'transparent',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#52525b', transition: 'all 0.2s'
                                }}>
                                    <>
                                        <Images size={24} />
                                        <span style={{ fontSize: '0.75rem', marginTop: '8px', fontWeight: 500 }}>Add Photos</span>
                                    </>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => handleImageUpload(e, section.id)}
                                        disabled={isUploading}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>

                            <div style={{ fontSize: '0.8rem', color: '#52525b' }}>
                                {section.images.length} images
                            </div>
                        </div>
                    ))}

                    {visibleSections.length === 0 && (
                        <div style={{
                            padding: '48px', border: '2px dashed #27272a', borderRadius: '16px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                            color: '#52525b'
                        }}>
                            <Images size={48} />
                            <p>No sections yet. Add a section to start uploading photos.</p>
                            <button
                                onClick={handleAddSection}
                                style={{
                                    background: '#27272a', color: 'white', border: 'none',
                                    padding: '10px 20px', borderRadius: '100px',
                                    fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                Create First Section
                            </button>
                        </div>
                    )}
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
