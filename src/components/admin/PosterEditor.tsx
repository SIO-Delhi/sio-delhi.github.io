import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useContent } from '../../context/ContentContext'
import { uploadImage } from '../../lib/storage'
import { validateImage, compressImage } from '../../lib/imageProcessing'
import { ArrowLeft, Save, Image as ImageIcon, Loader2, X, Eye } from 'lucide-react'

export function PosterEditor() {
    const { sectionId, id } = useParams()
    const [searchParams] = useSearchParams()
    const urlParentId = searchParams.get('parentId') || ''
    const navigate = useNavigate()
    const { addPost, updatePost, getPostById } = useContent()

    const [isSaving, setIsSaving] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [posterImage, setPosterImage] = useState('')
    const [pendingFile, setPendingFile] = useState<File | null>(null)
    // Whether to display the title text in the lightbox (default off — image speaks for itself)
    const [showTitleInLightbox, setShowTitleInLightbox] = useState(false)

    useEffect(() => {
        if (id) {
            const post = getPostById(id)
            if (post) {
                setTitle(post.title || '')
                setDescription(post.subtitle || '')
                setPosterImage(post.image || '')
                setShowTitleInLightbox(post.content === 'show-title')
            }
        }
    }, [id, getPostById])

    // Posters are finished designs — no cropping, use the full image as-is
    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            validateImage(file)
        } catch (err: any) {
            alert(err.message)
            return
        }
        const compressed = await compressImage(file)
        const previewUrl = URL.createObjectURL(compressed)
        setPendingFile(compressed as File)
        setPosterImage(previewUrl)
        e.target.value = ''
    }

    const handleSave = async () => {
        if (!title.trim()) {
            alert('Please enter a title for the poster (used to generate the URL)')
            return
        }
        if (!posterImage) {
            alert('Please upload a poster image')
            return
        }
        setIsSaving(true)
        try {
            let finalImage = posterImage
            if (posterImage.startsWith('blob:') && pendingFile) {
                finalImage = await uploadImage(pendingFile)
            }

            const postData = {
                title: title.trim(),
                subtitle: description.trim(),
                // 'show-title' signals the lightbox to display the title; otherwise image-only
                content: showTitleInLightbox ? 'show-title' : '',
                image: finalImage,
                layout: 'poster',
                isPublished: true,
            }

            if (id) {
                await updatePost(id, postData)
            } else {
                if (!sectionId) throw new Error('No section ID')
                await addPost({
                    ...postData,
                    sectionId,
                    parentId: urlParentId || undefined,
                })
            }
            navigate(-1)
        } catch (err: any) {
            console.error('Save failed:', err)
            alert('Failed to save poster: ' + err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '8px',
        background: '#1a1a1a',
        border: '1px solid #333',
        color: 'white',
        fontSize: '1rem',
        fontFamily: '"DM Sans", sans-serif',
        outline: 'none',
        boxSizing: 'border-box',
    }

    const canSave = !isSaving && !!posterImage && !!title.trim()

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', borderRadius: '8px',
                        background: '#1a1a1a', border: '1px solid #333',
                        color: 'white', cursor: 'pointer', fontSize: '0.9rem'
                    }}
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>
                    {id ? 'Edit Poster' : 'Create Poster'}
                </h1>
            </div>

            {/* Poster Image Upload */}
            <div style={{ marginBottom: '28px' }}>
                <label style={{
                    display: 'block', marginBottom: '8px',
                    fontSize: '0.85rem', fontWeight: 600, color: '#888',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                    Poster Image <span style={{ color: '#ff3b3b' }}>*</span>
                </label>

                {posterImage ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img
                            src={posterImage}
                            alt="Poster preview"
                            style={{
                                maxWidth: '260px',
                                maxHeight: '420px',
                                width: 'auto',
                                height: 'auto',
                                borderRadius: '12px',
                                border: '1px solid #333',
                                display: 'block'
                            }}
                        />
                        <button
                            onClick={() => { setPosterImage(''); setPendingFile(null) }}
                            style={{
                                position: 'absolute', top: '8px', right: '8px',
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: 'rgba(0,0,0,0.75)', border: 'none',
                                color: 'white', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <X size={14} />
                        </button>
                        <label style={{
                            position: 'absolute', bottom: '8px', left: '50%',
                            transform: 'translateX(-50%)',
                            padding: '6px 12px', borderRadius: '6px',
                            background: 'rgba(0,0,0,0.75)', color: 'white',
                            fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap'
                        }}>
                            Change Image
                            <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                        </label>
                    </div>
                ) : (
                    <label style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        width: '220px', aspectRatio: '2/3',
                        border: '2px dashed #333', borderRadius: '12px',
                        cursor: 'pointer', color: '#666', gap: '12px',
                        transition: 'border-color 0.2s'
                    }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#ff3b3b'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#333'}
                    >
                        <ImageIcon size={36} />
                        <span style={{ fontSize: '0.85rem', textAlign: 'center', padding: '0 16px' }}>
                            Click to upload poster image
                        </span>
                        <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                    </label>
                )}
            </div>

            {/* Title — required, used for URL slug */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{
                    display: 'block', marginBottom: '8px',
                    fontSize: '0.85rem', fontWeight: 600, color: '#888',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                    Title <span style={{ color: '#ff3b3b' }}>*</span>
                </label>
                <input
                    type="text"
                    placeholder="Poster title..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    style={inputStyle}
                    onFocus={e => e.currentTarget.style.borderColor = '#ff3b3b'}
                    onBlur={e => e.currentTarget.style.borderColor = '#333'}
                />
                <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#555' }}>
                    Used to generate the shareable URL. Not shown in the lightbox unless you enable it below.
                </p>
            </div>

            {/* Show title in lightbox toggle */}
            <div style={{ marginBottom: '28px' }}>
                <div
                    onClick={() => setShowTitleInLightbox(v => !v)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        cursor: 'pointer', userSelect: 'none',
                        padding: '14px 16px', borderRadius: '10px',
                        background: showTitleInLightbox ? 'rgba(255,59,59,0.08)' : '#111',
                        border: `1px solid ${showTitleInLightbox ? 'rgba(255,59,59,0.3)' : '#222'}`,
                        transition: 'all 0.2s',
                    }}
                >
                    {/* Custom toggle pill */}
                    <div style={{
                        width: '40px', height: '22px', borderRadius: '11px',
                        background: showTitleInLightbox ? '#ff3b3b' : '#333',
                        position: 'relative', flexShrink: 0,
                        transition: 'background 0.2s',
                    }}>
                        <div style={{
                            position: 'absolute', top: '3px',
                            left: showTitleInLightbox ? '21px' : '3px',
                            width: '16px', height: '16px', borderRadius: '50%',
                            background: 'white', transition: 'left 0.2s',
                        }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Eye size={14} style={{ color: showTitleInLightbox ? '#ff3b3b' : '#666' }} />
                            Show title in lightbox
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '2px' }}>
                            {showTitleInLightbox ? 'Title will appear below the poster image' : 'Image only — title stays hidden'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Optional Description */}
            <div style={{ marginBottom: '32px' }}>
                <label style={{
                    display: 'block', marginBottom: '8px',
                    fontSize: '0.85rem', fontWeight: 600, color: '#888',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                    Description{' '}
                    <span style={{ color: '#555', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                        (optional)
                    </span>
                </label>
                <textarea
                    placeholder="Short description shown in the lightbox..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                    onFocus={e => e.currentTarget.style.borderColor = '#ff3b3b'}
                    onBlur={e => e.currentTarget.style.borderColor = '#333'}
                />
                <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#555' }}>
                    Always shown in the lightbox when set.
                </p>
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={!canSave}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '14px 28px', borderRadius: '100px',
                    background: canSave ? '#ff3b3b' : '#333',
                    border: 'none', color: 'white', fontWeight: 600,
                    fontSize: '1rem', cursor: canSave ? 'pointer' : 'not-allowed',
                    fontFamily: '"DM Sans", sans-serif',
                    transition: 'all 0.2s'
                }}
            >
                {isSaving
                    ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Save size={18} />
                }
                {isSaving ? 'Saving...' : id ? 'Update Poster' : 'Save Poster'}
            </button>
        </div>
    )
}
