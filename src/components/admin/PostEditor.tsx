
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useContent } from '../../context/ContentContext'
import { uploadImage, uploadPdf } from '../../lib/storage'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { toast } from 'sonner'
import { ArrowLeft, Save, Image as ImageIcon, Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3, List, Loader2, FileText, X, Plus, Trash2, MoveUp, MoveDown, AlignLeft, AlignCenter, AlignRight, AlignJustify, Images, Eye, GripVertical } from 'lucide-react'
import gsap from 'gsap'

// --- Block Types & Interfaces ---
interface EditorBlock {
    id: string
    type: 'text' | 'image' | 'pdf' | 'composite'
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

    return (
        <div style={{
            display: 'flex', gap: '4px', padding: '8px', borderBottom: '1px solid #333',
            background: '#1a1a1a', borderRadius: '8px 8px 0 0',
            flexWrap: 'wrap', alignItems: 'center'
        }} onMouseDown={(e) => e.preventDefault()}>
            {/* Text Formatting */}
            <button onClick={() => editor.chain().focus().toggleBold().run()} style={buttonStyle(editor.isActive('bold'))}><Bold size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} style={buttonStyle(editor.isActive('italic'))}><Italic size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} style={buttonStyle(editor.isActive('underline'))}><UnderlineIcon size={16} /></button>

            <div style={{ width: '1px', background: '#333', margin: '0 6px', height: '20px' }} />

            {/* Headings */}
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} style={buttonStyle(editor.isActive('heading', { level: 1 }))}>
                <Heading1 size={16} /> <span>H1</span>
            </button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={buttonStyle(editor.isActive('heading', { level: 2 }))}>
                <Heading2 size={16} /> <span>H2</span>
            </button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} style={buttonStyle(editor.isActive('heading', { level: 3 }))}>
                <Heading3 size={16} /> <span>H3</span>
            </button>

            <div style={{ width: '1px', background: '#333', margin: '0 6px', height: '20px' }} />

            {/* Lists */}
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} style={buttonStyle(editor.isActive('bulletList'))}><List size={16} /></button>
        </div>
    )
}



const AddBlockMenu = ({ onAdd }: { onAdd: (type: 'text' | 'image' | 'pdf' | 'composite') => void }) => {
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

const TextBlockEditor = ({ content, subtitle, alignment, onChange, onSubtitleChange, onAlignmentChange }: {
    content: string,
    subtitle?: string,
    alignment?: 'left' | 'center' | 'right' | 'justify',
    onChange: (content: string) => void,
    onSubtitleChange?: (subtitle: string) => void,
    onAlignmentChange?: (alignment: 'left' | 'center' | 'right' | 'justify') => void
}) => {
    const [isFocused, setIsFocused] = useState(false)
    const editor = useEditor({
        extensions: [StarterKit, Underline],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        onFocus: () => setIsFocused(true),
        onBlur: () => setIsFocused(false),
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

                {/* Toolbar when focused */}
                {editor && isFocused && <EditorToolbar editor={editor} />}
            </div>

            {/* Optional Subtitle/Heading for this text block */}
            <input
                type="text"
                value={subtitle || ''}
                onChange={(e) => onSubtitleChange?.(e.target.value)}
                placeholder="Block heading (optional)..."
                style={{
                    width: '100%', padding: '8px 0', marginBottom: '8px',
                    background: 'transparent', border: 'none', borderBottom: '1px solid #333',
                    color: '#ff8080', fontSize: '1.1rem', fontWeight: 600, outline: 'none'
                }}
            />

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

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

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
                // Single image
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

// --- Composite Block Editor: Image + Text with Layout Options ---
const CompositeBlockEditor = ({
    layout,
    imageUrl,
    carouselImages,
    textContent,
    subtitle,
    alignment,
    onLayoutChange,
    onImageChange,
    onImagesChange,
    onTextChange,
    onSubtitleChange,
    onAlignmentChange
}: {
    layout?: 'image-left' | 'image-right' | 'image-top' | 'stacked'
    imageUrl?: string
    carouselImages?: string[]
    textContent?: string
    subtitle?: string
    alignment?: 'left' | 'center' | 'right' | 'justify'
    onLayoutChange?: (layout: 'image-left' | 'image-right' | 'image-top' | 'stacked') => void
    onImageChange?: (url: string) => void
    onImagesChange?: (urls: string[]) => void
    onTextChange?: (content: string) => void
    onSubtitleChange?: (subtitle: string) => void
    onAlignmentChange?: (alignment: 'left' | 'center' | 'right' | 'justify') => void
}) => {
    const [isUploading, setIsUploading] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const currentLayout = layout || 'image-left'

    // Derived images list (prefer carouselImages, fallback to legacy imageUrl)
    const images = carouselImages && carouselImages.length > 0 ? carouselImages : (imageUrl ? [imageUrl] : [])

    const editor = useEditor({
        extensions: [StarterKit, Underline],
        content: textContent || '<p>Add your text here...</p>',
        onUpdate: ({ editor }) => {
            onTextChange?.(editor.getHTML())
        },
        onFocus: () => setIsFocused(true),
        onBlur: () => setIsFocused(false),
    })

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setIsUploading(true)
        try {
            const url = await uploadImage(file)
            // Add to list
            const newImages = [...images, url]
            onImagesChange?.(newImages)
            // Also update legacy for backward compat if it's the first one
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
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        height: images.length > 0 ? '60px' : '150px',
                        borderRadius: '8px', background: '#1a1a1a', border: '2px dashed #333',
                        cursor: isUploading ? 'wait' : 'pointer'
                    }}>
                        <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} style={{ display: 'none' }} />
                        {isUploading ? (
                            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#4ade80' }} />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Plus size={20} color="#4ade80" />
                                <span style={{ color: '#666', fontSize: '0.8rem' }}>Add Image</span>
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

                    {/* Subtitle Input */}
                    <input
                        type="text"
                        value={subtitle || ''}
                        onChange={(e) => onSubtitleChange?.(e.target.value)}
                        placeholder="Block heading (optional)..."
                        style={{
                            width: '100%', background: 'transparent', border: 'none',
                            borderBottom: '1px solid #333', color: '#ff8080', fontSize: '1rem',
                            fontWeight: 600, padding: '8px 0', marginBottom: '12px', outline: 'none',
                            textAlign: (alignment as any) || 'left'
                        }}
                    />

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
        </div>
    )
}

export function PostEditor() {
    const { sectionId, id } = useParams()
    const [searchParams] = useSearchParams()
    const { sections, getPostById, addPost, updatePost, getSubsectionsBySection } = useContent()
    const navigate = useNavigate()
    const isEditMode = !!id
    const section = sections.find(s => s.id === sectionId)

    // Get parentId from URL query (when creating from SubsectionEditor)
    const urlParentId = searchParams.get('parentId') || ''

    // Form State
    const [title, setTitle] = useState('')
    const [subtitle, setSubtitle] = useState('')
    const [date, setDate] = useState('') // New Date State
    const [images, setImages] = useState<string[]>([]) // Cover image
    const [pdfUrl, setPdfUrl] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isSubsection, setIsSubsection] = useState(false)
    const [parentId, setParentId] = useState<string>(urlParentId)

    // Blocks State
    const [blocks, setBlocks] = useState<EditorBlock[]>([])

    // Preview & Drag State
    const [showPreview, setShowPreview] = useState(false)
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
                if (post.image) setImages(Array.isArray(post.image) ? post.image : [post.image])
                if (post.pdfUrl) {
                    setPdfUrl(post.pdfUrl)
                }
                setIsSubsection(post.isSubsection || false)
                setParentId(post.parentId || '')
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
                    blockElements.forEach(el => {
                        const isComposite = el.classList.contains('block-composite')
                        const isPdf = el.classList.contains('block-pdf')
                        const isImage = el.classList.contains('block-image')

                        let type: 'text' | 'image' | 'pdf' | 'composite' = 'text'
                        if (isComposite) type = 'composite'
                        else if (isPdf) type = 'pdf'
                        else if (isImage) type = 'image'

                        let content = ''
                        let enhancedFields: Partial<EditorBlock> = {}

                        if (type === 'composite') {
                            enhancedFields = {
                                layout: (el.getAttribute('data-layout') || 'image-left') as any,
                                imageUrl: decodeURIComponent(el.getAttribute('data-image-url') || ''),
                                textContent: decodeURIComponent(el.getAttribute('data-text-content') || ''),
                                subtitle: decodeURIComponent(el.getAttribute('data-subtitle') || ''),
                                alignment: (el.getAttribute('data-align') as any) || 'left',
                                carouselImages: el.getAttribute('data-images') ? JSON.parse(el.getAttribute('data-images')!) : []
                            }
                        } else if (type === 'image') {
                            const img = el.querySelector('img')
                            content = img ? img.src : ''
                            enhancedFields = {
                                caption: decodeURIComponent(el.getAttribute('data-caption') || ''),
                                alignment: (el.getAttribute('data-align') as any) || 'left',
                                isCarousel: el.getAttribute('data-carousel') === 'true',
                                carouselImages: el.getAttribute('data-images') ? JSON.parse(decodeURIComponent(el.getAttribute('data-images')!)) : []
                            }
                        } else if (type === 'pdf') {
                            content = el.getAttribute('data-pdf-url') || ''
                        } else {
                            content = el.innerHTML
                            enhancedFields = {
                                subtitle: decodeURIComponent(el.getAttribute('data-subtitle') || ''),
                                alignment: (el.getAttribute('data-align') as any) || 'left'
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
    const addBlock = (type: 'text' | 'image' | 'pdf' | 'composite', index?: number) => {
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
        // Add visual feedback
        const target = e.currentTarget as HTMLElement
        gsap.to(target, { opacity: 0.5, scale: 0.98, duration: 0.2 })
    }

    const handleDragEnd = (e: React.DragEvent) => {
        setDraggedBlockId(null)
        const target = e.currentTarget as HTMLElement
        gsap.to(target, { opacity: 1, scale: 1, duration: 0.2 })
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
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return
        setIsUploading(true)
        try {
            for (const file of Array.from(files)) {
                if (file.size > 5 * 1024 * 1024) continue
                const url = await uploadImage(file)
                setImages(prev => [...prev, url])
            }
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

            if (block.type === 'text') {
                const subtitleAttr = block.subtitle ? ` data-subtitle="${encodeURIComponent(block.subtitle)}"` : ''
                finalContent += `<div class="siodel-block block-text"${alignAttr}${subtitleAttr}>${block.content}</div>`
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
                finalContent += `<div class="siodel-block block-composite"${layoutAttr}${imageAttr}${textAttr}${subtitleAttr}${alignAttr}${imagesAttr}></div>`
            }
        })

        try {
            const postData = {
                title,
                subtitle,
                content: finalContent,
                image: images[0] || '',
                pdfUrl: extractedPdfUrl || pdfUrl, // Use extracted or existing
                layout: 'custom',
                createdAt: date ? new Date(date).getTime() : undefined, // Pass date
            }

            if (isEditMode && id) {
                updatePost(id, { ...postData, isSubsection, parentId: parentId || undefined })
            } else if (sectionId) {
                addPost({ sectionId, isPublished: false, isSubsection, parentId: parentId || undefined, ...postData })
            }
            navigate(-1)
        } catch (error) { console.error(error); alert('Failed to save') } finally { setIsSaving(false) }
    }

    if (!section && !isEditMode) return <div>Section not found</div>

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '100px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={() => navigate(-1)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#222', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div style={{ fontSize: '0.9rem', color: '#888' }}>{isEditMode ? 'EDIT POST' : `NEW POST IN ${section?.label}`}</div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>{isEditMode ? 'Edit Post' : 'Create Post'}</h1>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => setShowPreview(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '12px 24px', borderRadius: '100px',
                            background: '#222', color: 'white',
                            border: '1px solid #444', fontWeight: 600,
                            fontSize: '1rem', cursor: 'pointer'
                        }}
                    >
                        <Eye size={20} /> Preview
                    </button>
                    <button onClick={handleSave} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 32px', borderRadius: '100px', background: '#ff3b3b', color: 'white', border: 'none', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', opacity: isSaving ? 0.7 : 1 }}>
                        <Save size={20} /> {isSaving ? 'Saving...' : 'Save Post'}
                    </button>
                </div>
            </div>

            {/* Document Area */}
            <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>

                {/* 1. Cover Image */}
                <div style={{ position: 'relative' }}>
                    {images.length > 0 ? (
                        <div style={{ position: 'relative', width: '100%', height: '350px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                            <img src={images[0]} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                                <button onClick={() => setImages([])} style={{ background: 'rgba(0,0,0,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', backdropFilter: 'blur(4px)' }}>
                                    <X size={14} /> Remove Cover
                                </button>
                                <label style={{ background: 'rgba(0,0,0,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', backdropFilter: 'blur(4px)' }}>
                                    {isUploading ? 'Uploading...' : <> <ImageIcon size={14} /> Change </>}
                                    <input type="file" accept="image/*" onChange={handleFileUpload} disabled={isUploading} style={{ display: 'none' }} />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div style={{ width: '100%', borderBottom: '1px solid #333', paddingBottom: '24px' }}>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '0.9rem', cursor: 'pointer', padding: '8px 16px', borderRadius: '6px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#222'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <ImageIcon size={18} /> <span>{isUploading ? 'Uploading...' : 'Add Cover Image'}</span>
                                <input type="file" accept="image/*" onChange={handleFileUpload} disabled={isUploading} style={{ display: 'none' }} />
                            </label>
                        </div>
                    )}
                </div>

                {/* 2. Title & Subtitle */}
                <div>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post Title" style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontSize: '3.5rem', fontWeight: 800, outline: 'none', lineHeight: 1.1, marginBottom: '16px' }} />
                    <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Summary (shows on card)..." style={{ width: '100%', background: 'transparent', border: 'none', color: '#888', fontSize: '1.5rem', fontWeight: 400, outline: 'none', marginBottom: '16px' }} />

                    {/* Date Field */}
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
                </div>

                {/* Parent Subsection Selector - only show when:
                    1. No parentId preset from URL (not creating from SubsectionEditor)
                    2. Subsections exist in this section
                    3. Creating a new post (not editing an existing one) 
                */}
                {!urlParentId && sectionId && getSubsectionsBySection(sectionId).length > 0 && !isEditMode && (
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
                            {getSubsectionsBySection(sectionId).map(sub => (
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
                            draggable
                            onDragStart={(e) => handleDragStart(e, block.id)}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, block.id)}
                        >
                            {/* Drag Handle & Block Actions (Hover) */}
                            <div className="block-actions" style={{ position: 'absolute', left: '-48px', top: '0', display: 'flex', flexDirection: 'column', gap: '4px', opacity: 0, transition: 'opacity 0.2s' }}>
                                <div style={{ padding: '4px', color: '#666', cursor: 'grab' }} title="Drag to reorder"><GripVertical size={16} /></div>
                                <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} style={{ padding: '4px', background: 'transparent', border: 'none', color: '#444', cursor: 'pointer' }}><MoveUp size={16} /></button>
                                <button onClick={() => removeBlock(block.id)} style={{ padding: '4px', background: 'transparent', border: 'none', color: '#444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} style={{ padding: '4px', background: 'transparent', border: 'none', color: '#444', cursor: 'pointer' }}><MoveDown size={16} /></button>
                            </div>

                            {/* Block Content */}
                            {block.type === 'text' && (
                                <TextBlockEditor
                                    content={block.content}
                                    subtitle={block.subtitle}
                                    alignment={block.alignment}
                                    onChange={(content) => updateBlockContent(block.id, content)}
                                    onSubtitleChange={(subtitle) => updateBlockField(block.id, 'subtitle', subtitle)}
                                    onAlignmentChange={(alignment) => updateBlockField(block.id, 'alignment', alignment)}
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
                                    alignment={block.alignment}
                                    onLayoutChange={(layout) => updateBlockField(block.id, 'layout', layout)}
                                    onImageChange={(url) => updateBlockField(block.id, 'imageUrl', url)}
                                    onImagesChange={(urls) => updateBlockField(block.id, 'carouselImages', urls)}
                                    onTextChange={(content) => updateBlockField(block.id, 'textContent', content)}
                                    onSubtitleChange={(subtitle) => updateBlockField(block.id, 'subtitle', subtitle)}
                                    onAlignmentChange={(alignment) => updateBlockField(block.id, 'alignment', alignment)}
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
            {showPreview && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.95)',
                        zIndex: 10000,
                        overflowY: 'auto',
                        padding: '40px 20px'
                    }}
                >
                    {/* Close Button */}
                    <button
                        onClick={() => setShowPreview(false)}
                        style={{
                            position: 'fixed',
                            top: '20px',
                            right: '20px',
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'rgba(255,59,59,0.2)',
                            border: '1px solid rgba(255,59,59,0.4)',
                            color: '#ff3b3b',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10001
                        }}
                    >
                        <X size={24} />
                    </button>

                    {/* Preview Content */}
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        {/* Title */}
                        <h1 style={{
                            color: 'white',
                            fontSize: 'clamp(2rem, 4vw, 3rem)',
                            fontWeight: 700,
                            marginBottom: '16px'
                        }}>
                            {title || 'Untitled Post'}
                        </h1>

                        {/* Subtitle */}
                        {subtitle && (
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem', marginBottom: '32px' }}>
                                {subtitle}
                            </p>
                        )}

                        {/* Cover Image */}
                        {images[0] && (
                            <div style={{ marginBottom: '40px', borderRadius: '16px', overflow: 'hidden' }}>
                                <img src={images[0]} alt="Cover" style={{ width: '100%', display: 'block' }} />
                            </div>
                        )}

                        {/* Content Blocks */}
                        {blocks.map((block, index) => {
                            const alignStyle: React.CSSProperties = {
                                textAlign: (block.alignment as 'left' | 'center' | 'right') || 'left'
                            }

                            if (block.type === 'text') {
                                return (
                                    <div
                                        key={index}
                                        style={{
                                            margin: '24px 0',
                                            padding: '24px 28px',
                                            borderRadius: '16px',
                                            background: 'linear-gradient(135deg, rgba(255,59,59,0.08) 0%, rgba(20,20,20,0.95) 100%)',
                                            backdropFilter: 'blur(12px)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            ...alignStyle
                                        }}
                                    >
                                        {block.subtitle && (
                                            <h3 style={{ color: '#ff3b3b', fontSize: '1.2rem', fontWeight: 600, marginBottom: '12px' }}>
                                                {block.subtitle}
                                            </h3>
                                        )}
                                        <div
                                            dangerouslySetInnerHTML={{ __html: block.content }}
                                            style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.8 }}
                                        />
                                    </div>
                                )
                            }

                            if (block.type === 'image' && block.content) {
                                const displayImages = block.isCarousel && block.carouselImages?.length
                                    ? block.carouselImages
                                    : [block.content]
                                return (
                                    <div key={index} style={{
                                        margin: '32px 0',
                                        clear: 'both',
                                        display: 'block',
                                        width: '100%',
                                        position: 'relative',
                                        ...alignStyle
                                    }}>
                                        {displayImages.length > 1 ? (
                                            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                                                {displayImages.map((img, i) => (
                                                    <img key={i} src={img} alt={`Image ${i + 1}`} style={{ height: '200px', borderRadius: '12px', flexShrink: 0 }} />
                                                ))}
                                            </div>
                                        ) : (
                                            <img src={block.content} alt="Content" style={{ width: '100%', borderRadius: '12px', display: 'block' }} />
                                        )}
                                        {block.caption && (
                                            <p style={{ marginTop: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                                {block.caption}
                                            </p>
                                        )}
                                    </div>
                                )
                            }

                            if (block.type === 'pdf' && block.content) {
                                return (
                                    <div key={index} style={{ margin: '40px 0', padding: '24px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #ff3b3b40' }}>
                                        <FileText size={32} color="#ff8080" />
                                        <p style={{ color: '#ff8080', marginTop: '12px' }}>PDF Document (will display as flipbook when published)</p>
                                    </div>
                                )
                            }

                            if (block.type === 'composite') {
                                const layout = block.layout || 'image-left'
                                const isVertical = layout === 'image-top' || layout === 'stacked'

                                // Alignment handled in inner elements or by flex/grid properties explicitly below
                                const images = block.carouselImages && block.carouselImages.length > 0 ? block.carouselImages : (block.imageUrl ? [block.imageUrl] : [])

                                return (
                                    <div key={index} style={{
                                        margin: '40px 0',
                                        padding: '32px',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, rgba(255,59,59,0.08) 0%, rgba(20,20,20,0.95) 100%)',
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                        display: 'grid',
                                        gridTemplateColumns: isVertical ? '1fr' : '1fr 1fr',
                                        gap: '32px',
                                        alignItems: 'stretch'
                                    }}>
                                        <div style={{ order: layout === 'image-right' ? 2 : 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {images.map((img, i) => (
                                                <img key={i} src={img} alt="" style={{ width: '100%', height: '100%', minHeight: images.length > 1 ? 'auto' : '100%', objectFit: 'cover', borderRadius: '12px', display: 'block' }} />
                                            ))}
                                        </div>
                                        <div style={{
                                            order: layout === 'image-right' ? 1 : 2,
                                            maxWidth: '100%'
                                        }}>
                                            {block.subtitle && (
                                                <h3 style={{
                                                    color: '#ff8080',
                                                    fontSize: '1.25rem',
                                                    fontWeight: 700,
                                                    marginBottom: '16px',
                                                    marginTop: 0,
                                                    textAlign: (block.alignment as any) || (layout === 'image-top' ? 'center' : 'left'),
                                                    fontFamily: '"Outfit", sans-serif'
                                                }}>
                                                    {block.subtitle}
                                                </h3>
                                            )}
                                            <div style={{
                                                color: 'rgba(255,255,255,0.85)',
                                                lineHeight: 1.8,
                                                textAlign: (block.alignment as any) || (layout === 'image-top' ? 'center' : 'left'),
                                                fontSize: '1.05rem'
                                            }}
                                                dangerouslySetInnerHTML={{ __html: block.textContent || '' }}
                                            />
                                        </div>
                                    </div>
                                )
                            }

                            return null
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
