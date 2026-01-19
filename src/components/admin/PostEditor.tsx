
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useContent } from '../../context/ContentContext'
import { uploadImage, uploadPdf } from '../../lib/storage'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'

import { ArrowLeft, Eye, Save, X, Plus, ImageIcon, FileText, AlignLeft, AlignCenter, AlignRight, AlignJustify, Trash2, Mail, Instagram, Loader2, ChevronLeft, ChevronRight, Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3, List, Volume2, MoveUp, MoveDown, Images, GripVertical, Palette } from 'lucide-react'

import { ImageCropper } from './ImageCropper'
import gsap from 'gsap'

// --- Block Types & Interfaces ---
interface EditorBlock {
    id: string
    type: 'text' | 'image' | 'pdf' | 'composite' | 'video'
    content: string // HTML for text, URL for image/pdf
    // Enhanced fields
    caption?: string          // For images
    subtitle?: string         // For text blocks (optional heading)
    alignment?: 'left' | 'center' | 'right' | 'justify'
    isCarousel?: boolean      // For image blocks
    carouselImages?: string[] // Multiple images for carousel
    // Composite block fields
    layout?: 'image-left' | 'image-right' | 'image-top' | 'stacked'
    imageUrl?: string         // Image URL for composite blocks
    textContent?: string      // HTML text content for composite blocks
}

// --- Helper Components ---

import { Extension } from '@tiptap/core'

export const FontSize = Extension.create({
    name: 'fontSize',
    addOptions() {
        return {
            types: ['textStyle'],
        }
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
                        renderHTML: attributes => {
                            if (!attributes.fontSize) {
                                return {}
                            }
                            return {
                                style: `font-size: ${attributes.fontSize}`,
                            }
                        },
                    },
                },
            },
        ]
    },
    addCommands() {
        return {
            setFontSize: (fontSize: string) => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize })
                    .run()
            },
            unsetFontSize: () => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize: null })
                    .removeEmptyTextStyle()
                    .run()
            },
        }
    },
})

const EditorToolbar = ({ editor }: { editor: any }) => {
    if (!editor) return null

    const buttonStyle = (isActive: boolean) => ({
        padding: '6px 8px',
        borderRadius: '4px',
        background: isActive ? '#444' : 'transparent',
        color: isActive ? 'white' : '#aaa',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.75rem',
        fontWeight: 600
    })

    const setFontSize = (size: string) => {
        if (size === 'default') {
            editor.chain().focus().unsetFontSize().run()
        } else {
            editor.chain().focus().setFontSize(size).run()
        }
    }

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        e.stopPropagation()
        editor.chain().focus().setColor(e.target.value).run()
    }

    return (
        <div style={{
            display: 'flex', gap: '4px', padding: '8px', borderBottom: '1px solid #333',
            background: '#1a1a1a', borderRadius: '8px 8px 0 0',
            flexWrap: 'wrap', alignItems: 'center'
        }}>
            {/* Text Formatting */}
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }} style={buttonStyle(editor.isActive('bold'))}><Bold size={16} /></button>
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }} style={buttonStyle(editor.isActive('italic'))}><Italic size={16} /></button>
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run() }} style={buttonStyle(editor.isActive('underline'))}><UnderlineIcon size={16} /></button>

            <div style={{ width: '1px', background: '#333', margin: '0 6px', height: '20px' }} />

            {/* Font Size */}
            <select
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => { e.preventDefault(); setFontSize(e.target.value) }}
                value={editor.getAttributes('textStyle').fontSize || 'default'}
                style={{
                    background: '#333', color: '#fff', border: '1px solid #444',
                    borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer'
                }}
            >
                <option value="default">Size</option>
                <option value="0.875rem">Small</option>
                <option value="1rem">Normal</option>
                <option value="1.25rem">Large</option>
                <option value="1.5rem">X-Large</option>
                <option value="1.875rem">XX-Large</option>
            </select>

            <div style={{ width: '1px', background: '#333', margin: '0 6px', height: '20px' }} />

            {/* Colors */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                    type="color"
                    onChange={handleColorChange}
                    value={editor.getAttributes('textStyle').color || '#ffffff'}
                    style={{
                        width: '28px', height: '28px', padding: 0, border: '2px solid #444',
                        borderRadius: '4px', cursor: 'pointer', background: 'transparent'
                    }}
                    title="Text Color"
                />
            </div>

            <div style={{ width: '1px', background: '#333', margin: '0 6px', height: '20px' }} />

            {/* Alignment */}
            <button onClick={() => editor.chain().focus().setTextAlign('left').run()} style={buttonStyle(editor.isActive({ textAlign: 'left' }))}><AlignLeft size={16} /></button>
            <button onClick={() => editor.chain().focus().setTextAlign('center').run()} style={buttonStyle(editor.isActive({ textAlign: 'center' }))}><AlignCenter size={16} /></button>
            <button onClick={() => editor.chain().focus().setTextAlign('right').run()} style={buttonStyle(editor.isActive({ textAlign: 'right' }))}><AlignRight size={16} /></button>
            <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} style={buttonStyle(editor.isActive({ textAlign: 'justify' }))}><AlignJustify size={16} /></button>

            <div style={{ width: '1px', background: '#333', margin: '0 6px', height: '20px' }} />

            {/* Headings - Kept for structure */}
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} style={buttonStyle(editor.isActive('heading', { level: 1 }))}>
                <Heading1 size={16} />
            </button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={buttonStyle(editor.isActive('heading', { level: 2 }))}>
                <Heading2 size={16} />
            </button>

            <div style={{ width: '1px', background: '#333', margin: '0 6px', height: '20px' }} />

            {/* Lists */}
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} style={buttonStyle(editor.isActive('bulletList'))}><List size={16} /></button>
        </div>
    )
}



const AddBlockMenu = ({ onAdd }: { onAdd: (type: 'text' | 'image' | 'pdf' | 'composite' | 'video') => void }) => {
    const [isOpen, setIsOpen] = useState(false)

    const buttonStyle = {
        background: '#333', border: '1px solid #444', color: 'white',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 16px', borderRadius: '8px', transition: 'all 0.2s',
        fontSize: '0.9rem', fontWeight: 500
    } as React.CSSProperties

    return (
        <div style={{ position: 'relative', margin: '32px 0', textAlign: 'center' }}>
            {isOpen ? (
                <div style={{
                    display: 'inline-flex', gap: '12px', padding: '12px 24px',
                    background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)', alignItems: 'center', flexWrap: 'wrap',
                    justifyContent: 'center'
                }}>
                    <span style={{ color: '#666', fontSize: '0.85rem', marginRight: '8px', fontWeight: 500 }}>ADD:</span>
                    <button onClick={() => { onAdd('text'); setIsOpen(false) }} style={buttonStyle}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#666'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#444'}>
                        <FileText size={16} /> Text
                    </button>
                    <button onClick={() => { onAdd('image'); setIsOpen(false) }} style={buttonStyle}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#666'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#444'}>
                        <ImageIcon size={16} /> Image
                    </button>
                    <button onClick={() => { onAdd('composite'); setIsOpen(false) }}
                        style={{ ...buttonStyle, border: '1px solid #4ade8040', color: '#4ade80' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#4ade80'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#4ade8040'}>
                        <ImageIcon size={16} /> Layout
                    </button>
                    <button onClick={() => { onAdd('pdf'); setIsOpen(false) }}
                        style={{ ...buttonStyle, border: '1px solid #ff3b3b40', color: '#ff8080' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#ff3b3b'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#ff3b3b40'}>
                        <FileText size={16} /> PDF
                    </button>
                    <button onClick={() => { onAdd('video'); setIsOpen(false) }}
                        style={{ ...buttonStyle, border: '1px solid #ff3b3b40', color: '#ff8080' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#ff3b3b'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#ff3b3b40'}>
                        <Volume2 size={16} /> Video
                    </button>
                    <button onClick={() => setIsOpen(false)}
                        style={{ background: 'transparent', border: 'none', color: '#666', padding: '8px', borderRadius: '50%', cursor: 'pointer', marginLeft: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ff3b3b'}
                        onMouseLeave={e => e.currentTarget.style.color = '#666'}>
                        <X size={20} />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        background: 'transparent', border: '1px dashed #444', color: '#666',
                        padding: '12px 24px', borderRadius: '8px',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        cursor: 'pointer', transition: 'all 0.2s', width: '100%', maxWidth: '300px',
                        fontSize: '0.9rem', fontWeight: 500
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#666';
                        e.currentTarget.style.color = '#888';
                        e.currentTarget.style.background = '#1a1a1a';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#444';
                        e.currentTarget.style.color = '#666';
                        e.currentTarget.style.background = 'transparent';
                    }}
                >
                    <Plus size={18} /> Add Content Block
                </button>
            )}
        </div>
    )
}

const TextBlockEditor = ({ initialContent, onChange, subtitle, onSubtitleChange, subtitleColor, onSubtitleColorChange }: {
    initialContent: string
    onChange: (content: string) => void
    subtitle?: string
    onSubtitleChange?: (subtitle: string) => void
    subtitleColor?: string
    onSubtitleColorChange?: (color: string) => void
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Color,
            FontSize
        ],
        content: initialContent,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[100px]',
            },
        },
    })

    return (
        <div style={{ position: 'relative', background: '#111', borderRadius: '12px', padding: '16px', border: '1px solid #333' }}>
            {/* Block Controls Bar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Toolbar always visible */}
                {editor && <EditorToolbar editor={editor} />}
            </div>

            {/* Optional Subtitle/Heading for this text block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', borderBottom: '1px solid #333' }}>
                <input
                    type="text"
                    value={subtitle || ''}
                    onChange={(e) => onSubtitleChange?.(e.target.value)}
                    placeholder="Block heading (optional)..."
                    style={{
                        flex: 1, padding: '8px 0',
                        background: 'transparent', border: 'none',
                        color: subtitleColor || '#ff8080',
                        fontSize: '1.1rem', fontWeight: 600, outline: 'none'
                    }}
                    className="subtitle-input"
                />
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Palette size={16} color={subtitleColor || '#ff8080'} style={{ cursor: 'pointer' }} />
                    <input
                        type="color"
                        value={subtitleColor || '#ff8080'}
                        onChange={(e) => onSubtitleColorChange?.(e.target.value)}
                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                    />
                </div>
            </div>

            {/* Rich Text Content */}
            <EditorContent editor={editor} style={{ color: '#ddd', fontSize: '1.1rem', lineHeight: 1.8 }} />
        </div>
    )
}

const ImageBlockEditor = ({
    url,
    caption,
    alignment,
    isCarousel,
    carouselImages,
    onChange,
    onCaptionChange,
    onAlignmentChange,
    onCarouselToggle,
    onCarouselImagesChange
}: {
    url: string,
    caption?: string,
    alignment?: 'left' | 'center' | 'right' | 'justify',
    isCarousel?: boolean,
    carouselImages?: string[],
    onChange: (url: string) => void,
    onCaptionChange?: (caption: string) => void,
    onAlignmentChange?: (alignment: 'left' | 'center' | 'right' | 'justify') => void,
    onCarouselToggle?: (isCarousel: boolean) => void,
    onCarouselImagesChange?: (images: string[]) => void
}) => {
    const [isUploading, setIsUploading] = useState(false)
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
    const [pendingFile, setPendingFile] = useState<File | null>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        // If single file, use cropper
        if (!isCarousel && files.length === 1) {
            const reader = new FileReader()
            reader.onload = () => setCropImageSrc(reader.result as string)
            reader.readAsDataURL(files[0])
            e.target.value = ''
            return
        }

        // Bulk upload or carousel logic (skipping crop for simplicity/UX)
        setIsUploading(true)
        try {
            if (isCarousel && files.length > 1) {
                // Multiple images for carousel
                const urls: string[] = [...(carouselImages || [])]
                for (const file of Array.from(files)) {
                    const uploadedUrl = await uploadImage(file)
                    urls.push(uploadedUrl)
                }
                onCarouselImagesChange?.(urls)
                if (!url && urls.length > 0) onChange(urls[0]) // Set first as main
            } else {
                // Single image fallback (direct)
                const uploadedUrl = await uploadImage(files[0])
                onChange(uploadedUrl)
            }
        } catch (err) {
            console.error(err)
            alert('Upload failed')
        } finally {
            setIsUploading(false)
        }
    }

    const handleSkip = async () => {
        if (!pendingFile) return
        setCropImageSrc(null)
        setIsUploading(true)
        try {
            const url = await uploadImage(pendingFile)
            if (isCarousel) {
                const newImages = [...(carouselImages || []), url]
                onCarouselImagesChange?.(newImages)
                if (!url) onChange(url)
            } else {
                onChange(url)
            }
        } catch (err) { console.error(err); alert('Upload failed') }
        finally { setIsUploading(false); setPendingFile(null) }
    }

    const handleCropComplete = async (blob: Blob) => {
        setCropImageSrc(null)
        setIsUploading(true)
        try {
            const file = new File([blob], `cropped-block-${Date.now()}.jpg`, { type: "image/jpeg" })
            const uploadedUrl = await uploadImage(file)
            if (isCarousel) {
                const newImages = [...(carouselImages || []), uploadedUrl]
                onCarouselImagesChange?.(newImages)
                if (!url) onChange(uploadedUrl)
            } else {
                onChange(uploadedUrl)
            }
        } catch (err) { console.error(err) } finally { setIsUploading(false) }
    }

    const displayImages = isCarousel && carouselImages && carouselImages.length > 0 ? carouselImages : (url ? [url] : [])

    if (displayImages.length > 0) {
        return (
            <div style={{ background: '#111', borderRadius: '12px', padding: '16px', border: '1px solid #333' }}>
                {/* Block Controls Bar */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Alignment Selector */}
                    <div style={{ display: 'flex', gap: '4px', background: '#1a1a1a', borderRadius: '8px', padding: '4px' }}>
                        {(['left', 'center', 'right'] as const).map(align => {
                            const isActive = (alignment || 'left') === align
                            return (
                                <button
                                    key={align}
                                    onClick={() => onAlignmentChange?.(align)}
                                    style={{
                                        padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                        background: isActive ? '#333' : 'transparent',
                                        color: isActive ? 'white' : '#666',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    {align === 'left' && <AlignLeft size={16} />}
                                    {align === 'center' && <AlignCenter size={16} />}
                                    {align === 'right' && <AlignRight size={16} />}
                                </button>
                            )
                        })}
                    </div>

                    {/* Single / Carousel Toggle */}
                    <button
                        onClick={() => onCarouselToggle?.(!isCarousel)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: isCarousel ? '#ff3b3b30' : '#1a1a1a',
                            color: isCarousel ? '#ff8080' : '#888',
                            fontSize: '0.85rem', fontWeight: 500
                        }}
                    >
                        <Images size={16} />
                        {isCarousel ? 'Carousel' : 'Single'}
                    </button>

                    {/* Add more images (carousel mode) */}
                    {isCarousel && (
                        <label style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                            background: '#1a1a1a', color: '#888', fontSize: '0.85rem'
                        }}>
                            <Plus size={14} /> Add Images
                            <input type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: 'none' }} />
                        </label>
                    )}
                </div>

                {/* Image Preview */}
                <div style={{
                    display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px',
                    scrollSnapType: 'x mandatory'
                }}>
                    {displayImages.map((imgUrl, idx) => (
                        <div key={idx} style={{
                            position: 'relative', flexShrink: 0,
                            width: isCarousel ? '200px' : '100%',
                            scrollSnapAlign: 'start'
                        }}>
                            <img src={imgUrl} alt={`Image ${idx + 1}`} style={{
                                width: '100%', borderRadius: '8px', display: 'block',
                                height: isCarousel ? '150px' : 'auto', objectFit: 'cover'
                            }} />
                            {isCarousel && (
                                <button
                                    onClick={() => {
                                        const newImages = carouselImages?.filter((_, i) => i !== idx) || []
                                        onCarouselImagesChange?.(newImages)
                                        if (newImages.length === 0) onChange('')
                                    }}
                                    style={{
                                        position: 'absolute', top: '4px', right: '4px',
                                        background: 'rgba(0,0,0,0.6)', border: 'none',
                                        borderRadius: '50%', width: '24px', height: '24px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', color: 'white'
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Replace button for single mode */}
                {!isCarousel && (
                    <div style={{ marginTop: '12px' }}>
                        <label style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                            background: '#1a1a1a', color: '#888', fontSize: '0.85rem'
                        }}>
                            <ImageIcon size={14} /> Replace Image
                            <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
                        </label>
                    </div>
                )}

                {/* Caption Input */}
                <input
                    type="text"
                    value={caption || ''}
                    onChange={(e) => onCaptionChange?.(e.target.value)}
                    placeholder="Add a caption..."
                    style={{
                        width: '100%', padding: '10px 0', marginTop: '12px',
                        background: 'transparent', border: 'none', borderTop: '1px solid #333',
                        color: '#aaa', fontSize: '0.95rem', fontStyle: 'italic', outline: 'none'
                    }}
                />
            </div>
        )
    }

    return (
        <div style={{ background: '#111', borderRadius: '12px', padding: '16px', border: '1px solid #333' }}>
            {/* Mode Toggle before upload */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', justifyContent: 'center' }}>
                <button
                    onClick={() => onCarouselToggle?.(false)}
                    style={{
                        padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        background: !isCarousel ? '#333' : '#1a1a1a',
                        color: !isCarousel ? 'white' : '#666',
                        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem'
                    }}
                >
                    <ImageIcon size={16} /> Single Image
                </button>
                <button
                    onClick={() => onCarouselToggle?.(true)}
                    style={{
                        padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        background: isCarousel ? '#ff3b3b30' : '#1a1a1a',
                        color: isCarousel ? '#ff8080' : '#666',
                        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem'
                    }}
                >
                    <Images size={16} /> Carousel
                </button>
            </div>

            <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '40px', borderRadius: '12px',
                background: '#1a1a1a', border: '2px dashed #333',
                cursor: isUploading ? 'wait' : 'pointer',
                transition: 'border-color 0.2s',
            }}>
                <input
                    type="file"
                    accept="image/*"
                    multiple={isCarousel}
                    onChange={handleUpload}
                    disabled={isUploading}
                    style={{ display: 'none' }}
                />
                {isUploading ? (
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#666' }} />
                ) : (
                    <>
                        {isCarousel ? <Images size={48} color="#ff8080" style={{ marginBottom: '16px' }} /> : <ImageIcon size={48} color="#444" style={{ marginBottom: '16px' }} />}
                        <div style={{ color: '#888', fontSize: '1rem', fontWeight: 500 }}>
                            {isCarousel ? 'Click to upload multiple images' : 'Click to upload image'}
                        </div>
                    </>
                )}
            </label>
            {cropImageSrc && <ImageCropper imageSrc={cropImageSrc} onCancel={() => { setCropImageSrc(null); setPendingFile(null); }} onSkip={handleSkip} onCropComplete={handleCropComplete} />}
        </div>
    )
}

const PdfBlockEditor = ({ url, onChange }: { url: string, onChange: (url: string) => void }) => {
    const [isUploading, setIsUploading] = useState(false)




    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const uploadedUrl = await uploadPdf(file)
            onChange(uploadedUrl)
        } catch (err) {
            console.error(err)
            alert('Upload failed')
        } finally {
            setIsUploading(false)
        }
    }

    if (url) {
        // Decode URL-encoded filename and truncate if too long
        const rawFileName = url.split('/').pop() || 'Document.pdf'
        const decodedFileName = decodeURIComponent(rawFileName)
        const displayName = decodedFileName.length > 40
            ? decodedFileName.substring(0, 37) + '...'
            : decodedFileName
        return (
            <div style={{
                padding: '20px', borderRadius: '12px', background: '#1a1a1a',
                border: '1px solid #ff3b3b40', display: 'flex', alignItems: 'center', gap: '16px',
                overflow: 'hidden'
            }}>
                <FileText size={32} color="#ff8080" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ color: '#ff8080', fontWeight: 600 }}>PDF Document</div>
                    <div style={{
                        color: '#666', fontSize: '0.85rem',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }} title={decodedFileName}>
                        {displayName}
                    </div>
                </div>
                <label style={{
                    background: '#333', color: 'white', padding: '8px 16px',
                    borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0
                }}>
                    Replace
                    <input type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} />
                </label>
            </div>
        )
    }

    return (
        <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '40px', borderRadius: '12px',
            background: '#1a1a1a', border: '2px dashed #ff3b3b40',
            cursor: isUploading ? 'wait' : 'pointer',
            transition: 'border-color 0.2s',
        }}>
            <input type="file" accept=".pdf" onChange={handleUpload} disabled={isUploading} style={{ display: 'none' }} />
            {isUploading ? (
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#ff8080' }} />
            ) : (
                <>
                    <FileText size={48} color="#ff8080" style={{ marginBottom: '16px' }} />
                    <div style={{ color: '#ff8080', fontSize: '1rem', fontWeight: 500 }}>Click to upload PDF</div>
                </>
            )}
        </label>
    )
}

const VideoBlockEditor = ({
    url,
    subtitle,
    textContent,
    onChange,
    onSubtitleChange,
    onTextChange
}: {
    url: string,
    subtitle?: string,
    textContent?: string,
    onChange: (url: string) => void,
    onSubtitleChange?: (val: string) => void,
    onTextChange?: (val: string) => void
}) => {
    return (
        <div style={{ background: '#111', borderRadius: '12px', padding: '16px', border: '1px solid #333' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <Volume2 size={24} color="#ff3b3b" />
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#eee' }}>Video Embed</span>
            </div>

            <input
                type="text"
                value={url}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Paste YouTube or Vimeo link here..."
                style={{
                    width: '100%',
                    padding: '12px',
                    background: '#222',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '1rem',
                    marginBottom: '12px'
                }}
            />

            <input
                type="text"
                value={subtitle || ''}
                onChange={(e) => onSubtitleChange?.(e.target.value)}
                placeholder="Video Title (Optional)"
                style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    borderBottom: '1px solid #333',
                    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                    color: '#ff8080',
                    fontSize: '1rem',
                    fontWeight: 600,
                    marginBottom: '8px',
                    outline: 'none'
                }}
            />

            <textarea
                value={textContent || ''}
                onChange={(e) => onTextChange?.(e.target.value)}
                placeholder="Description..."
                rows={2}
                style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#151515',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#aaa',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    outline: 'none'
                }}
            />

            {url && (
                <div style={{ marginTop: '16px', borderRadius: '8px', overflow: 'hidden', position: 'relative', paddingTop: '56.25%', background: '#000' }}>
                    <iframe
                        src={url.replace('watch?v=', 'embed/').split('&')[0]}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            )}
        </div>
    )
}

// --- Composite Block Editor: Image + Text with Layout Options ---
const CompositeBlockEditor = ({
    layout,
    imageUrl,
    carouselImages,
    textContent,
    subtitle,
    subtitleColor,
    alignment,
    onLayoutChange,
    onImageChange,
    onImagesChange,
    onTextChange,
    onSubtitleChange,
    onSubtitleColorChange,
    onAlignmentChange
}: {
    layout?: 'image-left' | 'image-right' | 'image-top' | 'stacked'
    imageUrl?: string
    carouselImages?: string[]
    textContent?: string
    subtitle?: string
    subtitleColor?: string
    alignment?: 'left' | 'center' | 'right' | 'justify'
    onLayoutChange?: (layout: 'image-left' | 'image-right' | 'image-top' | 'stacked') => void
    onImageChange?: (url: string) => void
    onImagesChange?: (urls: string[]) => void
    onTextChange?: (content: string) => void
    onSubtitleChange?: (subtitle: string) => void
    onSubtitleColorChange?: (color: string) => void
    onAlignmentChange?: (alignment: 'left' | 'center' | 'right' | 'justify') => void
}) => {
    const [isUploading, setIsUploading] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
    const [pendingFile, setPendingFile] = useState<File | null>(null)
    const currentLayout = layout || 'image-left'

    // Derived images list (prefer carouselImages, fallback to legacy imageUrl)
    const images = carouselImages && carouselImages.length > 0 ? carouselImages : (imageUrl ? [imageUrl] : [])

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextStyle,
            Color,
            FontSize
        ],
        content: textContent || '<p>Add your text here...</p>',
        onUpdate: ({ editor }) => {
            onTextChange?.(editor.getHTML())
        },
        onFocus: () => setIsFocused(true),
        onBlur: () => setIsFocused(false),
    })

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = () => setCropImageSrc(reader.result as string)
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    const handleSkip = async () => {
        if (!pendingFile) return
        setCropImageSrc(null)
        setIsUploading(true)
        try {
            const url = await uploadImage(pendingFile)
            const newImages = [...images, url]
            onImagesChange?.(newImages)
            if (newImages.length === 1) onImageChange?.(url)
        } catch (err) { console.error(err); alert('Upload failed') }
        finally { setIsUploading(false); setPendingFile(null) }
    }

    const handleCropComplete = async (blob: Blob) => {
        setCropImageSrc(null)
        setIsUploading(true)
        try {
            const file = new File([blob], `cropped-composite-${Date.now()}.jpg`, { type: "image/jpeg" })
            const url = await uploadImage(file)
            const newImages = [...images, url]
            onImagesChange?.(newImages)
            if (newImages.length === 1) onImageChange?.(url)
        } catch (err) { console.error(err) }
        finally { setIsUploading(false) }
    }

    const handleRemoveImage = (index: number) => {
        const newImages = [...images]
        newImages.splice(index, 1)
        onImagesChange?.(newImages)
        // Update legacy imageUrl if needed
        if (newImages.length > 0) onImageChange?.(newImages[0])
        else onImageChange?.('')
    }

    const layoutOptions = [
        { value: 'image-left', label: 'Image Left' },
        { value: 'image-right', label: 'Image Right' },
        { value: 'image-top', label: 'Image Top' },
        { value: 'stacked', label: 'Stacked' }
    ] as const

    return (
        <div style={{ background: '#0a1a0a', borderRadius: '12px', padding: '16px', border: '1px solid #4ade8040' }}>
            {/* Layout Selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {layoutOptions.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => onLayoutChange?.(opt.value)}
                        style={{
                            padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                            background: currentLayout === opt.value ? '#4ade80' : '#1a1a1a',
                            color: currentLayout === opt.value ? '#000' : '#888',
                            border: 'none', fontSize: '0.8rem', fontWeight: 600
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Preview Layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: currentLayout === 'image-top' || currentLayout === 'stacked' ? '1fr' : '1fr 1fr',
                gap: '16px',
                gridTemplateAreas:
                    currentLayout === 'image-left' ? '"image text"' :
                        currentLayout === 'image-right' ? '"text image"' :
                            currentLayout === 'image-top' ? '"image" "text"' : '"image" "text"'
            }}>
                {/* Image Area */}
                <div style={{ gridArea: 'image', display: 'flex', flexDirection: 'column', gap: '8px' }}>

                    {/* Carousel Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <button
                            onClick={() => {
                                // Toggle between single and carousel
                                if (carouselImages && carouselImages.length > 0) {
                                    // Switch to single: keep first image
                                    onImageChange?.(carouselImages[0])
                                    onImagesChange?.([]) // clear carousel
                                } else {
                                    // Switch to carousel: start with current image
                                    if (imageUrl) onImagesChange?.([imageUrl])
                                    else onImagesChange?.([])
                                }
                            }}
                            style={{
                                padding: '4px 10px', borderRadius: '4px', border: '1px solid #333',
                                background: (carouselImages && carouselImages.length > 0) ? '#4ade80' : 'transparent',
                                color: (carouselImages && carouselImages.length > 0) ? '#000' : '#888',
                                fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600
                            }}
                        >
                            {(carouselImages && carouselImages.length > 0) ? 'Carousel Mode On' : 'Single Image'}
                        </button>
                    </div>

                    {images.map((img, idx) => (
                        <div key={idx} style={{ position: 'relative' }}>
                            <img src={img} alt="" style={{
                                width: '100%',
                                height: currentLayout === 'image-left' || currentLayout === 'image-right' ? '200px' : 'auto',
                                objectFit: 'cover',
                                borderRadius: '8px'
                            }} />
                            <button
                                onClick={() => handleRemoveImage(idx)}
                                style={{
                                    position: 'absolute', top: '8px', right: '8px',
                                    background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none',
                                    padding: '4px', borderRadius: '4px', cursor: 'pointer'
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}

                    <label style={{
                        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        height: images.length > 0 ? '60px' : '150px',
                        borderRadius: '8px', background: '#1a1a1a', border: '2px dashed #333',
                        cursor: isUploading ? 'wait' : 'pointer',
                        // Hide add button if single mode and already has image
                        display: (!carouselImages?.length && images.length > 0) ? 'none' : 'flex'
                    }}>
                        <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} style={{ display: 'none' }} />
                        {isUploading ? (
                            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#4ade80' }} />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Plus size={20} color="#4ade80" />
                                <span style={{ color: '#666', fontSize: '0.8rem' }}>
                                    {(carouselImages && carouselImages.length > 0) ? 'Add Slide' : 'Add Image'}
                                </span>
                            </div>
                        )}
                    </label>
                </div>

                {/* Text Area */}
                <div style={{ gridArea: 'text' }}>
                    {/* Controls Bar */}
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' }}>
                        {/* Alignment Selector */}
                        <div style={{ display: 'flex', gap: '4px', background: '#1a1a1a', borderRadius: '8px', padding: '4px' }}>
                            {(['left', 'center', 'right', 'justify'] as const).map(align => {
                                const isActive = (alignment || 'left') === align
                                return (
                                    <button
                                        key={align}
                                        onClick={() => onAlignmentChange?.(align)}
                                        style={{
                                            padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                            background: isActive ? '#333' : 'transparent',
                                            color: isActive ? 'white' : '#666',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                        title={align.charAt(0).toUpperCase() + align.slice(1)}
                                    >
                                        {align === 'left' && <AlignLeft size={16} />}
                                        {align === 'center' && <AlignCenter size={16} />}
                                        {align === 'right' && <AlignRight size={16} />}
                                        {align === 'justify' && <AlignJustify size={16} />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Subtitle Input with Color Picker */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', borderBottom: '1px solid #333' }}>
                        <input
                            type="text"
                            value={subtitle || ''}
                            onChange={(e) => onSubtitleChange?.(e.target.value)}
                            placeholder="Block heading (optional)..."
                            style={{
                                flex: 1, padding: '8px 0',
                                background: 'transparent', border: 'none',
                                color: subtitleColor || '#4ade80', // Default green-ish for composite
                                fontSize: '1rem', fontWeight: 600, outline: 'none'
                            }}
                        />
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Palette size={14} color={subtitleColor || '#4ade80'} style={{ cursor: 'pointer' }} />
                            <input
                                type="color"
                                value={subtitleColor || '#4ade80'}
                                onChange={(e) => onSubtitleColorChange?.(e.target.value)}
                                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                            />
                        </div>
                    </div>

                    {editor && isFocused && <EditorToolbar editor={editor} />}
                    <div style={{ textAlign: (alignment as any) || 'left' }}>
                        <EditorContent
                            editor={editor}
                            style={{
                                background: '#111', borderRadius: '8px', padding: '12px',
                                color: '#ddd', fontSize: '0.95rem', lineHeight: 1.6,
                                minHeight: '100px',
                                textAlign: (alignment as any) || 'left'
                            }}
                        />
                    </div>
                </div>
            </div>
            {cropImageSrc && <ImageCropper imageSrc={cropImageSrc} onCancel={() => { setCropImageSrc(null); setPendingFile(null); }} onSkip={handleSkip} onCropComplete={handleCropComplete} />}
        </div>
    )
}

export function PostEditor() {
    const { sectionId, id } = useParams()
    const [searchParams] = useSearchParams()
    const { sections, getPostById, addPost, updatePost, getSubsectionsBySection } = useContent()
    const navigate = useNavigate()
    const isEditMode = !!id

    // Determine section ID (from URL param in create mode, or from post data in edit mode)
    const post = isEditMode && id ? getPostById(id) : undefined
    const effectiveSectionId = sectionId || post?.sectionId
    const section = sections.find(s => s.id === effectiveSectionId)

    // Get parentId from URL query (when creating from SubsectionEditor)
    const urlParentId = searchParams.get('parentId') || ''

    // Form State
    const [title, setTitle] = useState('')
    const [subtitle, setSubtitle] = useState('')
    const [date, setDate] = useState('') // New Date State
    const [order, setOrder] = useState<number>(0) // Order for Leadership/etc
    const [images, setImages] = useState<string[]>([]) // Cover image
    const [pdfUrl, setPdfUrl] = useState('')
    const [enableAudio, setEnableAudio] = useState(false)
    const [email, setEmail] = useState('')
    const [instagram, setInstagram] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isSubsection, setIsSubsection] = useState(false)
    const [parentId, setParentId] = useState<string>(urlParentId)
    const [isMobile, setIsMobile] = useState(false)

    // Screen size detection for responsive layout
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Crop State
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
    const [pendingFile, setPendingFile] = useState<File | null>(null)

    // Blocks State
    const [blocks, setBlocks] = useState<EditorBlock[]>([])

    // Cover Carousel State
    const [currentCoverIndex, setCurrentCoverIndex] = useState(0)

    // Preview & Drag State

    const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
    const blocksContainerRef = useRef<HTMLDivElement>(null)

    // Initialize with one text block if empty
    // REMOVED - Start empty as per user request
    // useEffect(() => {
    //     if (!id && blocks.length === 0) {
    //         setBlocks([{ id: crypto.randomUUID(), type: 'text', content: '<p>Start writing your story...</p>' }])
    //     }
    // }, [id])

    // Load Data
    useEffect(() => {
        if (isEditMode && id) {
            const post = getPostById(id)
            if (post) {
                setTitle(post.title)
                setSubtitle(post.subtitle || '')
                if (post.image) {
                    try {
                        const parsed = JSON.parse(post.image)
                        if (Array.isArray(parsed)) setImages(parsed)
                        else setImages([post.image])
                    } catch {
                        setImages([post.image])
                    }
                }
                if (post.pdfUrl) {
                    setPdfUrl(post.pdfUrl)
                }
                if (post.enableAudio !== undefined) {
                    setEnableAudio(post.enableAudio)
                }
                // Load social links
                setEmail(post.email || '')
                setInstagram(post.instagram || '')

                setIsSubsection(post.isSubsection || false)
                setParentId(post.parentId || '')
                if (post.order) setOrder(post.order)
                // Set date from createdAt
                if (post.createdAt) {
                    setDate(new Date(post.createdAt).toISOString().split('T')[0])
                }

                // Parse Content into Blocks
                // Simple parsing: check for special block markers, or default to one text block
                const tempDiv = document.createElement('div')
                tempDiv.innerHTML = post.content
                const blockElements = tempDiv.querySelectorAll('.siodel-block')

                if (blockElements.length > 0) {
                    const loadedBlocks: EditorBlock[] = []
                    Array.from(blockElements).forEach(el => {
                        let type: EditorBlock['type'] = 'text'
                        if (el.classList.contains('block-image')) type = 'image'
                        else if (el.classList.contains('block-pdf')) type = 'pdf'
                        else if (el.classList.contains('block-composite')) type = 'composite'
                        else if (el.classList.contains('block-video')) type = 'video'

                        let content = ''
                        let enhancedFields: Partial<EditorBlock> = {}

                        // Parse subtitle color
                        const subtitleColor = el.getAttribute('data-subtitle-color') || undefined
                        if (subtitleColor) enhancedFields.subtitleColor = subtitleColor

                        if (type === 'composite') {
                            enhancedFields = {
                                layout: (el.getAttribute('data-layout') as any) || 'image-left',
                                imageUrl: decodeURIComponent(el.getAttribute('data-image-url') || ''),
                                textContent: decodeURIComponent(el.getAttribute('data-text-content') || ''),
                                subtitle: decodeURIComponent(el.getAttribute('data-subtitle') || ''),
                                alignment: (el.getAttribute('data-align') as any) || 'left',
                                subtitleColor, // Add subtitleColor to enhancedFields
                                isCarousel: false,
                                carouselImages: []
                            }
                            // Carousel support for Composite
                            try {
                                const imagesAttr = el.getAttribute('data-images')
                                if (imagesAttr) {
                                    enhancedFields.carouselImages = JSON.parse(decodeURIComponent(imagesAttr))
                                    if (enhancedFields.carouselImages && enhancedFields.carouselImages.length > 0) {
                                        enhancedFields.isCarousel = true
                                    }
                                }
                            } catch (e) { console.error('Error parsing composite carousel images', e) }

                        } else if (type === 'image') {
                            content = el.querySelector('img')?.src || ''
                            enhancedFields = {
                                caption: decodeURIComponent(el.getAttribute('data-caption') || ''),
                                alignment: (el.getAttribute('data-align') as any) || 'center',
                                isCarousel: el.getAttribute('data-carousel') === 'true',
                                carouselImages: el.getAttribute('data-images') ? JSON.parse(decodeURIComponent(el.getAttribute('data-images')!)) : []
                            }
                        } else if (type === 'video') {
                            // Extract original video URL if possible (fallback to empty or iframe src)
                            // Ideally we should have stored the original URL in a data attribute but for now we might need to parse it back or just start blank if not found content attribute
                            const iframe = el.querySelector('iframe')
                            // We heavily rely on the dangerouslySetInnerHTML content for now which contains the iframe
                            // But for editing we need the url.
                            // The handleSave didn't strictly store the raw URL in a data attribute (it embedded it).
                            // Let's try to extract src from iframe if we can
                            content = iframe ? iframe.src : ''

                            // Video handling improvement: 
                            // To fix the "refreshing" issue completely in editor, we used to rely on data- attributes
                            enhancedFields = {
                                subtitle: decodeURIComponent(el.getAttribute('data-subtitle') || ''),
                                textContent: decodeURIComponent(el.getAttribute('data-text-content') || ''),
                                subtitleColor // Add subtitleColor
                            }
                        } else if (type === 'pdf') {
                            content = el.getAttribute('data-pdf-url') || ''
                        } else {
                            content = el.innerHTML
                            enhancedFields = {
                                subtitle: decodeURIComponent(el.getAttribute('data-subtitle') || ''),
                                alignment: (el.getAttribute('data-align') as any) || 'left',
                                subtitleColor // Add subtitleColor
                            }
                        }
                        loadedBlocks.push({ id: crypto.randomUUID(), type, content, ...enhancedFields })
                    })
                    setBlocks(loadedBlocks)
                } else {
                    // Legacy content - treat as one text block
                    setBlocks([{ id: crypto.randomUUID(), type: 'text', content: post.content }])
                }
            }
        }
    }, [isEditMode, id, sections])

    // Handlers
    const addBlock = (type: 'text' | 'image' | 'pdf' | 'composite' | 'video', index?: number) => {
        const newBlock: EditorBlock = {
            id: crypto.randomUUID(),
            type,
            content: type === 'text' ? '<p></p>' : '',
            ...(type === 'composite' && { layout: 'image-left' as const, imageUrl: '', textContent: '<p>Add your text here...</p>' })
        }
        setBlocks(prev => {
            const newBlocks = [...prev]
            if (index !== undefined) {
                newBlocks.splice(index + 1, 0, newBlock)
            } else {
                newBlocks.push(newBlock)
            }
            return newBlocks
        })
    }

    const removeBlock = (id: string) => {
        // Allow removing the last block so editor can be empty
        setBlocks(prev => prev.filter(b => b.id !== id))
    }

    const updateBlockContent = (id: string, content: string) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b))
    }

    const updateBlockField = (id: string, field: keyof EditorBlock, value: any) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b))
    }

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === blocks.length - 1) return

        setBlocks(prev => {
            const newBlocks = [...prev]
            const targetIndex = direction === 'up' ? index - 1 : index + 1
            const temp = newBlocks[targetIndex]
            newBlocks[targetIndex] = newBlocks[index]
            newBlocks[index] = temp
            return newBlocks
        })
    }

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, blockId: string) => {
        setDraggedBlockId(blockId)
        e.dataTransfer.effectAllowed = 'move'
        // Add visual feedback to the wrapper, not just the handle
        const target = (e.currentTarget as HTMLElement).closest('.editor-block-wrapper') as HTMLElement
        if (target) {
            gsap.to(target, { opacity: 0.5, scale: 0.98, duration: 0.2 })
        }
    }

    const handleDragEnd = (e: React.DragEvent) => {
        setDraggedBlockId(null)
        const target = (e.currentTarget as HTMLElement).closest('.editor-block-wrapper') as HTMLElement
        if (target) {
            gsap.to(target, { opacity: 1, scale: 1, duration: 0.2 })
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault()
        if (!draggedBlockId || draggedBlockId === targetId) return

        setBlocks(prev => {
            const newBlocks = [...prev]
            const draggedIndex = newBlocks.findIndex(b => b.id === draggedBlockId)
            const targetIndex = newBlocks.findIndex(b => b.id === targetId)

            if (draggedIndex === -1 || targetIndex === -1) return prev

            // Remove dragged block and insert at target position
            const [draggedBlock] = newBlocks.splice(draggedIndex, 1)
            newBlocks.splice(targetIndex, 0, draggedBlock)

            return newBlocks
        })
        setDraggedBlockId(null)
    }

    // Reuse existing upload handlers for Header
    // Reuse existing upload handlers for Header
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setPendingFile(file) // Store file for Skip
        const reader = new FileReader()
        reader.onload = () => setCropImageSrc(reader.result as string)
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    const handleSkip = async () => {
        if (!pendingFile) return
        setCropImageSrc(null)
        setIsUploading(true)
        try {
            const url = await uploadImage(pendingFile)
            setImages(prev => [...prev, url])
            // If first image, reset index
            if (images.length === 0) setCurrentCoverIndex(0)
        } catch (err) { console.error(err); alert('Upload failed') }
        finally { setIsUploading(false); setPendingFile(null) }
    }

    const handleCoverCropComplete = async (blob: Blob) => {
        setCropImageSrc(null)
        setIsUploading(true)
        try {
            const file = new File([blob], `cropped-cover-${Date.now()}.jpg`, { type: "image/jpeg" })
            const url = await uploadImage(file)
            setImages(prev => [...prev, url])
            // If first image, reset index
            if (images.length === 0) setCurrentCoverIndex(0)
        } catch (err) { console.error(err) } finally { setIsUploading(false) }
    }



    const handleSave = () => {
        if (!title) { alert('Please enter a title'); return }
        setIsSaving(true)

        // Serialize Blocks to HTML
        let finalContent = ''
        let extractedPdfUrl = '' // For backward compatibility
        blocks.forEach(block => {
            const alignAttr = block.alignment ? ` data-align="${block.alignment}"` : ''
            const subtitleColorAttr = block.subtitleColor ? ` data-subtitle-color="${block.subtitleColor}"` : ''

            if (block.type === 'text') {
                const subtitleAttr = block.subtitle ? ` data-subtitle="${encodeURIComponent(block.subtitle)}"` : ''
                finalContent += `<div class="siodel-block block-text"${alignAttr}${subtitleAttr}${subtitleColorAttr}>${block.content}</div>`
            } else if (block.type === 'image' && block.content) {
                const captionAttr = block.caption ? ` data-caption="${encodeURIComponent(block.caption)}"` : ''
                const carouselAttr = block.isCarousel ? ` data-carousel="true"` : ''
                const imagesAttr = block.carouselImages?.length ? ` data-images="${encodeURIComponent(JSON.stringify(block.carouselImages))}"` : ''
                finalContent += `<div class="siodel-block block-image"${alignAttr}${captionAttr}${carouselAttr}${imagesAttr} style="margin: 32px 0;"><img src="${block.content}" style="width: 100%; border-radius: 12px; display: block;" /></div>`
            } else if (block.type === 'pdf' && block.content) {
                // Store first PDF URL for backward compatibility with pdfUrl field
                if (!extractedPdfUrl) extractedPdfUrl = block.content
                finalContent += `<div class="siodel-block block-pdf" data-pdf-url="${block.content}"${alignAttr}></div>`
            } else if (block.type === 'composite') {
                const layoutAttr = block.layout ? ` data-layout="${block.layout}"` : ' data-layout="image-left"'
                const imageAttr = block.imageUrl ? ` data-image-url="${encodeURIComponent(block.imageUrl)}"` : ''
                const textAttr = block.textContent ? ` data-text-content="${encodeURIComponent(block.textContent)}"` : ''
                const subtitleAttr = block.subtitle ? ` data-subtitle="${encodeURIComponent(block.subtitle)}"` : ''
                const alignAttr = block.alignment ? ` data-align="${block.alignment}"` : ''
                const imagesAttr = block.carouselImages && block.carouselImages.length > 0 ? ` data-images='${JSON.stringify(block.carouselImages)}'` : ''
                finalContent += `<div class="siodel-block block-composite"${layoutAttr}${imageAttr}${textAttr}${subtitleAttr}${subtitleColorAttr}${alignAttr}${imagesAttr}></div>`
            } else if (block.type === 'video' && block.content) {
                const embedUrl = block.content.replace('watch?v=', 'embed/').split('&')[0]
                const subtitleAttr = block.subtitle ? ` data-subtitle="${encodeURIComponent(block.subtitle)}"` : ''
                const textAttr = block.textContent ? ` data-text-content="${encodeURIComponent(block.textContent)}"` : ''

                let innerContent = ''
                if (block.subtitle) innerContent += `<h3 style="margin: 0 0 12px 0; color: #ff3b3b; font-size: 1.1rem; font-weight: 600;">${block.subtitle}</h3>`
                innerContent += `<div style="border-radius: 12px; overflow: hidden; position: relative; width: 100%; height: 0; padding-bottom: 56.25%; background: #000;"><iframe src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
                if (block.textContent) innerContent += `<p style="margin: 16px 0 0 0; color: rgba(255,255,255,0.8); font-size: 0.95rem; line-height: 1.6;">${block.textContent}</p>`

                finalContent += `<div class="siodel-block block-video"${subtitleAttr}${textAttr} style="margin: 32px 0; padding: 20px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 4px 6px rgba(0,0,0,0.1);">${innerContent}</div>`
            }
        })

        try {
            // Construct Post Data
            const postData = {
                title,
                subtitle,
                content: finalContent,
                image: images.length > 1 ? JSON.stringify(images) : (images[0] || undefined),
                pdfUrl: pdfUrl || extractedPdfUrl,
                enableAudio,
                email,
                instagram,
                layout: 'default',
                order,
                createdAt: date ? new Date(date).getTime() : (post?.createdAt || Date.now()) // Use selected date or existing/current
            }
            if (isEditMode && id) {
                updatePost(id, { ...postData, isSubsection, parentId: parentId || undefined })
            } else if (effectiveSectionId) {
                addPost({ sectionId: effectiveSectionId, isPublished: false, isSubsection, parentId: parentId || undefined, ...postData })
            }
            navigate(-1)
        } catch (error) { console.error(error); alert('Failed to save') } finally { setIsSaving(false) }
    }

    if (!section && !isEditMode) return <div>Section not found</div>

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: isMobile ? '60px' : '100px' }}>
            {cropImageSrc && <ImageCropper imageSrc={cropImageSrc} onCancel={() => { setCropImageSrc(null); setPendingFile(null); }} onSkip={handleSkip} onCropComplete={handleCoverCropComplete} />}
            {/* Header */}
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                marginBottom: isMobile ? '20px' : '32px',
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
                        <div style={{ fontSize: isMobile ? '0.75rem' : '0.9rem', color: '#888' }}>{isEditMode ? 'EDIT POST' : `NEW POST IN ${section?.label}`}</div>
                        <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 700, margin: 0 }}>{isEditMode ? 'Edit Post' : 'Create Post'}</h1>
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
                    <Save size={isMobile ? 16 : 20} /> {isSaving ? 'Saving...' : 'Save Post'}
                </button>
            </div>

            {/* Document Area */}
            <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: isMobile ? '20px' : '32px' }}>

                {/* 1. Cover Image / Carousel */}
                <div style={{ position: 'relative' }}>
                    {images.length > 0 ? (
                        <div style={{ position: 'relative', width: '100%', height: isMobile ? '200px' : '350px', borderRadius: isMobile ? '12px' : '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                            <img
                                src={images[currentCoverIndex] || images[0]}
                                alt="Cover"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />

                            {/* Carousel Controls */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setCurrentCoverIndex(prev => (prev - 1 + images.length) % images.length)}
                                        style={{
                                            position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                                            width: '40px', height: '40px', borderRadius: '50%',
                                            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
                                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10
                                        }}
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentCoverIndex(prev => (prev + 1) % images.length)}
                                        style={{
                                            position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                                            width: '40px', height: '40px', borderRadius: '50%',
                                            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
                                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10
                                        }}
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                    <div style={{
                                        position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
                                        background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: '12px',
                                        color: 'white', fontSize: '0.8rem', pointerEvents: 'none', border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        {currentCoverIndex + 1} / {images.length}
                                    </div>
                                </>
                            )}

                            <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => {
                                        const newImages = images.filter((_, i) => i !== currentCoverIndex)
                                        setImages(newImages)
                                        if (currentCoverIndex >= newImages.length) setCurrentCoverIndex(Math.max(0, newImages.length - 1))
                                    }}
                                    style={{ background: 'rgba(0,0,0,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', backdropFilter: 'blur(4px)' }}
                                >
                                    <X size={14} /> Remove Slide
                                </button>
                                <label style={{ background: 'rgba(0,0,0,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', backdropFilter: 'blur(4px)' }}>
                                    {isUploading ? 'Uploading...' : <> <Plus size={14} /> Add Slide </>}
                                    <input type="file" accept="image/*" onChange={handleFileUpload} disabled={isUploading} style={{ display: 'none' }} />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <label style={{
                            width: '100%', height: '200px',
                            background: '#1a1a1a', border: '2px dashed #333', borderRadius: '16px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                            color: '#666', cursor: 'pointer', transition: 'all 0.2s'
                        }}>
                            {isUploading ? (
                                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#666' }} />
                            ) : (
                                <>
                                    <ImageIcon size={32} />
                                    <span style={{ fontWeight: 500 }}>
                                        {effectiveSectionId === 'leadership' ? 'Upload Profile Photo' : 'Upload Cover Image / Carousel'}
                                    </span>
                                </>
                            )}
                            <input type="file" accept="image/*" onChange={handleFileUpload} disabled={isUploading} style={{ display: 'none' }} />
                        </label>
                    )}
                </div>

                {/* 2. Title & Subtitle */}
                <div>
                    <label style={{ display: 'block', color: '#666', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 600 }}>
                        {effectiveSectionId === 'leadership' ? 'NAME' : 'TITLE'}
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={effectiveSectionId === 'leadership' ? "Leader Name" : "Post Title"}
                        style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontSize: '3.5rem', fontWeight: 800, outline: 'none', lineHeight: 1.1, marginBottom: '16px' }}
                    />

                    <label style={{ display: 'block', color: '#666', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 600 }}>
                        {effectiveSectionId === 'leadership' ? 'POSITION' : 'SUBTITLE'}
                    </label>
                    <input
                        type="text"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder={effectiveSectionId === 'leadership' ? "Position / Role" : "Summary (shows on card)..."}
                        style={{ width: '100%', background: 'transparent', border: 'none', color: '#888', fontSize: '1.5rem', fontWeight: 400, outline: 'none', marginBottom: '16px' }}
                    />

                    {/* Social Links (Leadership only) */}
                    {effectiveSectionId === 'leadership' && (
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Mail size={16} color="#666" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email Address"
                                    style={{
                                        width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px',
                                        background: '#1a1a1a', border: '1px solid #333', color: 'white',
                                        fontSize: '0.9rem', outline: 'none'
                                    }}
                                />
                            </div>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Instagram size={16} color="#666" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text"
                                    value={instagram}
                                    onChange={(e) => setInstagram(e.target.value)}
                                    placeholder="Instagram Handle/URL"
                                    style={{
                                        width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px',
                                        background: '#1a1a1a', border: '1px solid #333', color: 'white',
                                        fontSize: '0.9rem', outline: 'none'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Date and Order Fields */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <label style={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>Publish Date:</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                style={{
                                    padding: '8px 12px', borderRadius: '8px',
                                    background: '#1a1a1a', border: '1px solid #333', color: 'white',
                                    fontSize: '0.9rem', outline: 'none', colorScheme: 'dark'
                                }}
                            />
                        </div>
                        {effectiveSectionId === 'leadership' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <label style={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>Card Order:</label>
                                <input
                                    type="number"
                                    value={order}
                                    onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                                    placeholder="0"
                                    style={{
                                        width: '80px', padding: '8px 12px', borderRadius: '8px',
                                        background: '#1a1a1a', border: '1px solid #333', color: 'white',
                                        fontSize: '0.9rem', outline: 'none'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Audio Toggle Section */}
                <div style={{
                    padding: '16px 20px',
                    background: '#1a1a1a',
                    borderRadius: '12px',
                    border: '1px solid #333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Volume2 size={20} color={enableAudio ? '#ff8080' : '#666'} />
                        <div>
                            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>
                                Enable Audio Player
                            </div>
                            <div style={{ color: '#666', fontSize: '0.8rem' }}>
                                Show text-to-speech audio player on this page
                            </div>
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                        onClick={() => setEnableAudio(!enableAudio)}
                        style={{
                            width: '52px',
                            height: '28px',
                            borderRadius: '14px',
                            border: 'none',
                            background: enableAudio ? '#ff3b3b' : '#444',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                    >
                        <div style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: 'white',
                            position: 'absolute',
                            top: '3px',
                            left: enableAudio ? '27px' : '3px',
                            transition: 'left 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                    </button>
                </div>

                {/* Parent Subsection Selector - only show when:
                    1. No parentId preset from URL (not creating from SubsectionEditor)
                    2. Subsections exist in this section
                    3. Creating a new post (not editing an existing one) 
                */}
                {!urlParentId && effectiveSectionId && getSubsectionsBySection(effectiveSectionId).length > 0 && !isEditMode && (
                    <div style={{ padding: '16px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' }}>
                        <div style={{ color: 'white', fontWeight: 600, marginBottom: '8px' }}>Parent Subsection (optional)</div>
                        <div style={{ color: '#666', fontSize: '0.85rem', marginBottom: '12px' }}>Nest this post inside a subsection</div>
                        <select
                            value={parentId}
                            onChange={(e) => setParentId(e.target.value)}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px',
                                background: '#222', border: '1px solid #333', color: 'white',
                                fontSize: '0.95rem', cursor: 'pointer'
                            }}
                        >
                            <option value="">No parent (top-level post)</option>
                            {getSubsectionsBySection(effectiveSectionId).map(sub => (
                                <option key={sub.id} value={sub.id}>{sub.title}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Info when creating child post from SubsectionEditor */}
                {urlParentId && getPostById(urlParentId) && (
                    <div style={{ padding: '16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                        <div style={{ color: '#a78bfa', fontWeight: 600, fontSize: '0.9rem' }}>
                            📁 Adding to: {getPostById(urlParentId)?.title}
                        </div>
                    </div>
                )}

                {/* PDF is now part of content blocks, no separate section */}

                {/* 4. BLOCKS EDITOR */}
                <div style={{ marginTop: '32px' }} ref={blocksContainerRef}>
                    {blocks.map((block, index) => (
                        <div
                            key={block.id}
                            className="editor-block-wrapper group"
                            style={{
                                position: 'relative',
                                marginBottom: '16px',
                                border: draggedBlockId === block.id ? '2px dashed #ff3b3b' : '2px dashed transparent',
                                borderRadius: '12px',
                                transition: 'border-color 0.2s'
                            }}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, block.id)}
                        >
                            {/* Drag Handle & Block Actions (Hover) */}
                            <div className="block-actions" style={{ position: 'absolute', left: '-48px', top: '0', display: 'flex', flexDirection: 'column', gap: '4px', opacity: 0, transition: 'opacity 0.2s' }}>
                                <div
                                    style={{ padding: '4px', color: '#666', cursor: 'grab' }}
                                    title="Drag to reorder"
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, block.id)}
                                    onDragEnd={handleDragEnd}
                                >
                                    <GripVertical size={16} />
                                </div>
                                <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} style={{ padding: '4px', background: 'transparent', border: 'none', color: '#444', cursor: 'pointer' }}><MoveUp size={16} /></button>
                                <button onClick={() => removeBlock(block.id)} style={{ padding: '4px', background: 'transparent', border: 'none', color: '#444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} style={{ padding: '4px', background: 'transparent', border: 'none', color: '#444', cursor: 'pointer' }}><MoveDown size={16} /></button>
                            </div>

                            {/* Block Content */}
                            {block.type === 'text' && (
                                <TextBlockEditor
                                    initialContent={block.content}
                                    subtitle={block.subtitle}
                                    subtitleColor={block.subtitleColor}
                                    onChange={(content) => updateBlockContent(block.id, content)}
                                    onSubtitleChange={(subtitle) => updateBlockField(block.id, 'subtitle', subtitle)}
                                    onSubtitleColorChange={(color) => updateBlockField(block.id, 'subtitleColor', color)}
                                />
                            )}
                            {block.type === 'image' && (
                                <ImageBlockEditor
                                    url={block.content}
                                    caption={block.caption}
                                    alignment={block.alignment}
                                    isCarousel={block.isCarousel}
                                    carouselImages={block.carouselImages}
                                    onChange={(url) => updateBlockContent(block.id, url)}
                                    onCaptionChange={(caption) => updateBlockField(block.id, 'caption', caption)}
                                    onAlignmentChange={(alignment) => updateBlockField(block.id, 'alignment', alignment)}
                                    onCarouselToggle={(isCarousel) => updateBlockField(block.id, 'isCarousel', isCarousel)}
                                    onCarouselImagesChange={(images) => updateBlockField(block.id, 'carouselImages', images)}
                                />
                            )}
                            {block.type === 'pdf' && (
                                <PdfBlockEditor url={block.content} onChange={(url) => updateBlockContent(block.id, url)} />
                            )}
                            {block.type === 'composite' && (
                                <CompositeBlockEditor
                                    layout={block.layout}
                                    imageUrl={block.imageUrl}
                                    carouselImages={block.carouselImages}
                                    textContent={block.textContent}
                                    subtitle={block.subtitle}
                                    subtitleColor={block.subtitleColor}
                                    alignment={block.alignment}
                                    onLayoutChange={(layout) => updateBlockField(block.id, 'layout', layout)}
                                    onImageChange={(url) => updateBlockField(block.id, 'imageUrl', url)}
                                    onImagesChange={(urls) => updateBlockField(block.id, 'carouselImages', urls)}
                                    onTextChange={(content) => updateBlockField(block.id, 'textContent', content)}
                                    onSubtitleChange={(subtitle) => updateBlockField(block.id, 'subtitle', subtitle)}
                                    onSubtitleColorChange={(color) => updateBlockField(block.id, 'subtitleColor', color)}
                                    onAlignmentChange={(alignment) => updateBlockField(block.id, 'alignment', alignment)}
                                />
                            )}
                            {block.type === 'video' && (
                                <VideoBlockEditor
                                    url={block.content}
                                    subtitle={block.subtitle}
                                    textContent={block.textContent}
                                    onChange={(url) => updateBlockContent(block.id, url)}
                                    onSubtitleChange={(subtitle) => updateBlockField(block.id, 'subtitle', subtitle)}
                                    onTextChange={(content) => updateBlockField(block.id, 'textContent', content)}
                                />
                            )}

                            {/* Add Button Below */}
                            <AddBlockMenu onAdd={(type) => addBlock(type, index)} />
                        </div>
                    ))}

                    <style>{`
                        .editor-block-wrapper:hover .block-actions {
                            opacity: 1 !important;
                        }
                    `}</style>

                    {/* Fallback Add Button if empty (rare) */}
                    {blocks.length === 0 && <AddBlockMenu onAdd={(type) => addBlock(type)} />}
                </div>

            </div>

            {/* PREVIEW MODAL */}

        </div>
    )
}
