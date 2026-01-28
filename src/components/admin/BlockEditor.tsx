import React, { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Extension } from '@tiptap/core'
import Link from '@tiptap/extension-link'
import { uploadImage, uploadPdf } from '../../lib/storage'
import { validateImage, compressImage } from '../../lib/imageProcessing'
import { ImageCropper } from './ImageCropper'
import {
    Plus, X, FileText, Trash2, Loader2, Bold, Italic, Underline as UnderlineIcon,
    Heading1, Heading2, List, MoveUp, MoveDown, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    ImageIcon, Volume2, Palette, Layout, PilcrowLeft, PilcrowRight, Link as LinkIcon
} from 'lucide-react'

// --- Block Types & Interfaces ---
export type EditorBlockType = 'text' | 'image' | 'pdf' | 'composite' | 'video'

export interface EditorBlock {
    id: string
    type: EditorBlockType
    content: string
    caption?: string
    subtitle?: string
    alignment?: 'left' | 'center' | 'right' | 'justify'
    isCarousel?: boolean
    carouselImages?: string[]
    layout?: 'image-left' | 'image-right' | 'image-top' | 'stacked'
    imageUrl?: string
    textContent?: string
    subtitleColor?: string
}

// Re-export for verbatimModuleSyntax compatibility
export type { EditorBlock as EditorBlockInterface }

// --- Custom Text Direction Extension ---
export const TextDirection = Extension.create({
    name: 'textDirection',
    addOptions() {
        return {
            types: ['heading', 'paragraph'],
        }
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    dir: {
                        default: null,
                        parseHTML: element => element.getAttribute('dir'),
                        renderHTML: attributes => {
                            if (!attributes.dir) {
                                return {}
                            }
                            return {
                                dir: attributes.dir,
                            }
                        },
                    },
                },
            },
        ]
    },
    addCommands() {
        return {
            setTextDirection: (direction: 'ltr' | 'rtl' | 'auto') => ({ commands }: any) => {
                return this.options.types.every((type: string) => commands.updateAttributes(type, { dir: direction }))
            },
            unsetTextDirection: () => ({ commands }: any) => {
                return this.options.types.every((type: string) => commands.resetAttributes(type, 'dir'))
            },
        }
    },
})

// FontSize Extension
export const FontSize = Extension.create({
    name: 'fontSize',
    addOptions() {
        return { types: ['textStyle'] }
    },
    addGlobalAttributes() {
        return [{
            types: this.options.types,
            attributes: {
                fontSize: {
                    default: null,
                    parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
                    renderHTML: attributes => {
                        if (!attributes.fontSize) return {}
                        return { style: `font-size: ${attributes.fontSize}` }
                    },
                },
            },
        }]
    },
    addCommands() {
        return {
            setFontSize: (fontSize: string) => ({ chain }: any) => {
                return chain().setMark('textStyle', { fontSize }).run()
            },
            unsetFontSize: () => ({ chain }: any) => {
                return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
            },
        }
    },
})

// --- Toolbar Component ---
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
    } as React.CSSProperties)

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
            display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '8px 12px',
            background: '#1a1a1a', borderRadius: '8px 8px 0 0', borderBottom: '1px solid #333',
            alignItems: 'center'
        }}>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }} style={buttonStyle(editor.isActive('bold'))} title="Bold">
                <Bold size={14} />
            </button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }} style={buttonStyle(editor.isActive('italic'))} title="Italic">
                <Italic size={14} />
            </button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run() }} style={buttonStyle(editor.isActive('underline'))} title="Underline">
                <UnderlineIcon size={14} />
            </button>
            <div style={{ width: '1px', background: '#333', margin: '0 4px', height: '20px' }} />

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

            <div style={{ width: '1px', background: '#333', margin: '0 4px', height: '20px' }} />

            {/* Text Color */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                    type="color"
                    onChange={handleColorChange}
                    value={editor.getAttributes('textStyle').color || '#fdedcb'}
                    style={{
                        width: '28px', height: '28px', padding: 0, border: '2px solid #444',
                        borderRadius: '4px', cursor: 'pointer', background: 'transparent'
                    }}
                    title="Text Color"
                />
            </div>

            <div style={{ width: '1px', background: '#333', margin: '0 4px', height: '20px' }} />

            {/* Link */}
            <button type="button" onMouseDown={(e) => {
                e.preventDefault()
                const previousUrl = editor.getAttributes('link').href
                const url = window.prompt('URL', previousUrl)

                if (url === null) return
                if (url === '') {
                    editor.chain().focus().extendMarkRange('link').unsetLink().run()
                    return
                }

                let finalUrl = url
                // If it doesn't start with http/https/mailto and is not a relative path (/ or #), prepend https://
                if (!/^https?:\/\//i.test(url) && !/^\//.test(url) && !/^#/.test(url) && !/^mailto:/i.test(url)) {
                    finalUrl = 'https://' + url
                }

                editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run()
            }} style={buttonStyle(editor.isActive('link'))} title="Link">
                <LinkIcon size={14} />
            </button>

            <div style={{ width: '1px', background: '#333', margin: '0 4px', height: '20px' }} />

            <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run() }} style={buttonStyle(editor.isActive('heading', { level: 1 }))} title="H1">
                <Heading1 size={14} />
            </button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() }} style={buttonStyle(editor.isActive('heading', { level: 2 }))} title="H2">
                <Heading2 size={14} />
            </button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }} style={buttonStyle(editor.isActive('bulletList'))} title="Bullet List">
                <List size={14} />
            </button>
            <div style={{ width: '1px', background: '#333', margin: '0 4px', height: '20px' }} />
            <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('left').run() }} style={buttonStyle(editor.isActive({ textAlign: 'left' }))} title="Align Left">
                <AlignLeft size={14} />
            </button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('center').run() }} style={buttonStyle(editor.isActive({ textAlign: 'center' }))} title="Align Center">
                <AlignCenter size={14} />
            </button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('right').run() }} style={buttonStyle(editor.isActive({ textAlign: 'right' }))} title="Align Right">
                <AlignRight size={14} />
            </button>

            <div style={{ width: '1px', background: '#333', margin: '0 4px', height: '20px' }} />

            {/* Text Direction */}
            <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextDirection('ltr').run() }}
                style={buttonStyle(editor.isActive({ dir: 'ltr' }))}
                title="Left-to-Right"
            >
                <PilcrowLeft size={14} />
            </button>
            <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextDirection('rtl').run() }}
                style={buttonStyle(editor.isActive({ dir: 'rtl' }))}
                title="Right-to-Left"
            >
                <PilcrowRight size={14} />
            </button>
        </div>
    )
}

// --- Text Block Editor ---
const TextBlockEditor = ({ initialContent, onChange, subtitle, onSubtitleChange }: {
    initialContent: string
    onChange: (content: string) => void
    subtitle?: string
    onSubtitleChange?: (subtitle: string) => void
}) => {
    const editor = useEditor({
        extensions: [StarterKit, Underline, TextAlign.configure({ types: ['heading', 'paragraph'] }), TextStyle, Color, FontSize, TextDirection, Link.configure({ openOnClick: false })],
        content: initialContent,
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
        editorProps: { attributes: { class: 'prose prose-invert max-w-none focus:outline-none min-h-[100px]' } },
    })

    return (
        <div style={{ background: '#111', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333' }}>
            {onSubtitleChange && (
                <input
                    type="text"
                    value={subtitle || ''}
                    onChange={(e) => onSubtitleChange(e.target.value)}
                    placeholder="Section heading (optional)"
                    style={{
                        width: '100%', padding: '12px 16px', background: '#0a0a0a', border: 'none',
                        borderBottom: '1px solid #222', color: '#ff3b3b', fontSize: '1rem',
                        fontWeight: 600, outline: 'none'
                    }}
                />
            )}
            <EditorToolbar editor={editor} />
            <div style={{ padding: '16px', minHeight: '120px', color: 'white' }}>
                <EditorContent editor={editor} />
            </div>
        </div>
    )
}

// --- Image Block Editor ---
const ImageBlockEditor = ({ url, caption, isCarousel, carouselImages, onChange, onCaptionChange, onCarouselToggle, onCarouselImagesChange }: {
    url: string
    caption?: string
    isCarousel?: boolean
    carouselImages?: string[]
    onChange: (url: string) => void
    onCaptionChange?: (caption: string) => void
    onCarouselToggle?: (isCarousel: boolean) => void
    onCarouselImagesChange?: (images: string[]) => void
}) => {
    const [isUploading, setIsUploading] = useState(false)
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
    const [pendingFile, setPendingFile] = useState<File | null>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            validateImage(file)
            setPendingFile(file)
            const reader = new FileReader()
            reader.addEventListener('load', () => setCropImageSrc(reader.result?.toString() || null))
            reader.readAsDataURL(file)
        } catch (err: any) {
            alert(err.message)
        }
        e.target.value = ''
    }

    const handleSkip = async () => {
        if (!pendingFile) return
        setCropImageSrc(null)
        setIsUploading(true)
        try {
            const compressed = await compressImage(pendingFile)
            const uploadedUrl = await uploadImage(compressed)
            if (isCarousel && onCarouselImagesChange) {
                onCarouselImagesChange([...(carouselImages || []), uploadedUrl])
            } else {
                onChange(uploadedUrl)
            }
        } catch (err: any) {
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
            const file = new File([blob], `cropped-${Date.now()}.webp`, { type: 'image/webp' })
            const uploadedUrl = await uploadImage(file)
            if (isCarousel && onCarouselImagesChange) {
                onCarouselImagesChange([...(carouselImages || []), uploadedUrl])
            } else {
                onChange(uploadedUrl)
            }
        } catch (err) {
            alert('Upload failed')
        } finally {
            setIsUploading(false)
        }
    }

    const displayImages = isCarousel && carouselImages && carouselImages.length > 0 ? carouselImages : (url ? [url] : [])

    return (
        <div style={{ background: '#111', borderRadius: '12px', padding: '16px', border: '1px solid #333' }}>
            {cropImageSrc && (
                <ImageCropper
                    imageSrc={cropImageSrc}
                    onCancel={() => { setCropImageSrc(null); setPendingFile(null) }}
                    onSkip={handleSkip}
                    onCropComplete={handleCropComplete}
                />
            )}

            {/* Carousel Toggle */}
            {onCarouselToggle && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer', color: '#888', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={isCarousel || false} onChange={(e) => onCarouselToggle(e.target.checked)} />
                    Enable Carousel (multiple images)
                </label>
            )}

            {/* Image Preview */}
            {displayImages.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {displayImages.map((img, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '100px', height: '100px' }}>
                            <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} alt="" />
                            <button
                                onClick={() => {
                                    if (isCarousel && onCarouselImagesChange) {
                                        onCarouselImagesChange(carouselImages?.filter((_, i) => i !== idx) || [])
                                    } else {
                                        onChange('')
                                    }
                                }}
                                style={{
                                    position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)',
                                    color: 'white', border: 'none', width: '20px', height: '20px', borderRadius: '50%',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    {isCarousel && (
                        <label style={{
                            width: '100px', height: '100px', background: '#1a1a1a', border: '2px dashed #333',
                            borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', cursor: isUploading ? 'wait' : 'pointer', color: '#555'
                        }}>
                            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                            <input type="file" accept="image/*" onChange={handleUpload} disabled={isUploading} style={{ display: 'none' }} />
                        </label>
                    )}
                </div>
            ) : (
                <label style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '32px', background: '#1a1a1a', border: '2px dashed #333', borderRadius: '8px',
                    cursor: isUploading ? 'wait' : 'pointer', marginBottom: '12px'
                }}>
                    {isUploading ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={32} color="#444" />}
                    <span style={{ color: '#666', fontSize: '0.85rem', marginTop: '8px' }}>Click to upload image</span>
                    <input type="file" accept="image/*" onChange={handleUpload} disabled={isUploading} style={{ display: 'none' }} />
                </label>
            )}

            {/* Caption */}
            {onCaptionChange && (
                <input
                    type="text"
                    value={caption || ''}
                    onChange={(e) => onCaptionChange(e.target.value)}
                    placeholder="Image caption (optional)"
                    style={{
                        width: '100%', padding: '10px 12px', background: '#1a1a1a', border: '1px solid #333',
                        borderRadius: '6px', color: '#aaa', fontSize: '0.85rem', outline: 'none'
                    }}
                />
            )}
        </div>
    )
}

// --- PDF Block Editor ---
const PdfBlockEditor = ({ url, onChange }: { url: string, onChange: (url: string) => void }) => {
    const [isUploading, setIsUploading] = useState(false)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.includes('pdf')) { alert('Please upload a PDF file'); return }
        setIsUploading(true)
        try {
            const uploadedUrl = await uploadPdf(file)
            onChange(uploadedUrl)
        } catch (err) {
            alert('Upload failed')
        } finally {
            setIsUploading(false)
            e.target.value = ''
        }
    }

    if (url) {
        return (
            <div style={{ background: '#111', borderRadius: '12px', padding: '16px', border: '1px solid #333' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={24} color="#ff3b3b" />
                        <span style={{ color: '#ccc', fontSize: '0.9rem' }}>PDF uploaded</span>
                    </div>
                    <button onClick={() => onChange('')} style={{ background: '#222', border: 'none', color: '#888', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                        Remove
                    </button>
                </div>
            </div>
        )
    }

    return (
        <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '32px', background: '#111', border: '2px dashed #333', borderRadius: '12px',
            cursor: isUploading ? 'wait' : 'pointer'
        }}>
            {isUploading ? <Loader2 size={24} className="animate-spin" /> : <FileText size={32} color="#ff3b3b" />}
            <span style={{ color: '#666', fontSize: '0.85rem', marginTop: '8px' }}>Click to upload PDF</span>
            <input type="file" accept=".pdf" onChange={handleUpload} disabled={isUploading} style={{ display: 'none' }} />
        </label>
    )
}

// --- Video Block Editor ---
const VideoBlockEditor = ({ url, subtitle, onChange, onSubtitleChange }: {
    url: string
    subtitle?: string
    onChange: (url: string) => void
    onSubtitleChange?: (val: string) => void
}) => {
    return (
        <div style={{ background: '#111', borderRadius: '12px', padding: '16px', border: '1px solid #333' }}>
            <input
                type="text"
                value={url}
                onChange={(e) => onChange(e.target.value)}
                placeholder="YouTube URL (e.g., https://youtube.com/watch?v=...)"
                style={{
                    width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333',
                    borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none', marginBottom: '12px'
                }}
            />
            {onSubtitleChange && (
                <input
                    type="text"
                    value={subtitle || ''}
                    onChange={(e) => onSubtitleChange(e.target.value)}
                    placeholder="Video title (optional)"
                    style={{
                        width: '100%', padding: '10px', background: '#1a1a1a', border: '1px solid #333',
                        borderRadius: '6px', color: '#aaa', fontSize: '0.85rem', outline: 'none'
                    }}
                />
            )}
            {url && (
                <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden', position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
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
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
    const [pendingFile, setPendingFile] = useState<File | null>(null)
    const currentLayout = layout || 'image-left'

    // Derived images list (prefer carouselImages, fallback to legacy imageUrl)
    const images = carouselImages && carouselImages.length > 0 ? carouselImages : (imageUrl ? [imageUrl] : [])

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Color,
            FontSize,
            TextDirection,
            Link.configure({ openOnClick: false })
        ],
        content: textContent || '<p>Add your text here...</p>',
        onUpdate: ({ editor }) => {
            onTextChange?.(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none',
            },
        },
    })

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            validateImage(file)
        } catch (err: any) {
            alert(err.message)
            e.target.value = ''
            return
        }

        setPendingFile(file)
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
            validateImage(pendingFile)
            const compressed = await compressImage(pendingFile)
            const url = await uploadImage(compressed)
            const newImages = [...images, url]
            onImagesChange?.(newImages)
            if (newImages.length === 1) onImageChange?.(url)
        } catch (err: any) { console.error(err); alert(err.message || 'Upload failed') }
        finally { setIsUploading(false); setPendingFile(null) }
    }

    const handleCropComplete = async (blob: Blob) => {
        setCropImageSrc(null)
        setIsUploading(true)
        try {
            const file = new File([blob], `cropped-composite-${Date.now()}.webp`, { type: "image/webp" })
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
                                if (carouselImages && carouselImages.length > 0) {
                                    onImageChange?.(carouselImages[0])
                                    onImagesChange?.([])
                                } else {
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
                                color: subtitleColor || '#4ade80',
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

                    {editor && <EditorToolbar editor={editor} />}
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

// --- Add Block Menu ---
const AddBlockMenu = ({ onAdd }: { onAdd: (type: EditorBlock['type']) => void }) => {
    const [isOpen, setIsOpen] = useState(false)

    const buttonStyle = {
        background: '#333', border: '1px solid #444', color: 'white',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 16px', borderRadius: '8px', transition: 'all 0.2s',
        fontSize: '0.9rem', fontWeight: 500
    } as React.CSSProperties

    return (
        <div style={{ position: 'relative', margin: '24px 0', textAlign: 'center' }}>
            {isOpen ? (
                <div style={{
                    display: 'inline-flex', gap: '12px', padding: '12px 24px',
                    background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)', alignItems: 'center', flexWrap: 'wrap',
                    justifyContent: 'center'
                }}>
                    <span style={{ color: '#666', fontSize: '0.85rem', marginRight: '8px', fontWeight: 500 }}>ADD:</span>
                    <button onClick={() => { onAdd('text'); setIsOpen(false) }} style={buttonStyle}>
                        <FileText size={16} /> Text
                    </button>
                    <button onClick={() => { onAdd('image'); setIsOpen(false) }} style={buttonStyle}>
                        <ImageIcon size={16} /> Image
                    </button>
                    <button onClick={() => { onAdd('composite'); setIsOpen(false) }} style={{ ...buttonStyle, border: '1px solid #4ade8040', color: '#4ade80' }}>
                        <Layout size={16} /> Layout
                    </button>
                    <button onClick={() => { onAdd('pdf'); setIsOpen(false) }} style={{ ...buttonStyle, border: '1px solid #ff3b3b40', color: '#ff8080' }}>
                        <FileText size={16} /> PDF
                    </button>
                    <button onClick={() => { onAdd('video'); setIsOpen(false) }} style={{ ...buttonStyle, border: '1px solid #3b82f640', color: '#60a5fa' }}>
                        <Volume2 size={16} /> Video
                    </button>
                    <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#666', padding: '8px', cursor: 'pointer' }}>
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
                >
                    <Plus size={18} /> Add Content Block
                </button>
            )}
        </div>
    )
}

// --- Main BlockEditor Component ---
interface BlockEditorProps {
    blocks: EditorBlock[]
    onChange: (blocks: EditorBlock[]) => void
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
    const addBlock = (type: EditorBlock['type']) => {
        const newBlock: EditorBlock = {
            id: crypto.randomUUID(),
            type,
            content: type === 'text' ? '<p></p>' : ''
        }
        onChange([...blocks, newBlock])
    }

    const removeBlock = (id: string) => {
        onChange(blocks.filter(b => b.id !== id))
    }

    const updateBlock = (id: string, updates: Partial<EditorBlock>) => {
        onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b))
    }

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        const newBlocks = [...blocks]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        if (targetIndex < 0 || targetIndex >= blocks.length) return
            ;[newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]]
        onChange(newBlocks)
    }

    return (
        <div>
            {blocks.map((block, index) => (
                <div key={block.id} style={{ position: 'relative', marginBottom: '16px' }}>
                    {/* Block Controls */}
                    <div style={{
                        position: 'absolute', top: '8px', right: '8px', zIndex: 10,
                        display: 'flex', gap: '4px', background: '#000', borderRadius: '6px', padding: '4px'
                    }}>
                        <button onClick={() => moveBlock(index, 'up')} disabled={index === 0}
                            style={{ background: '#222', border: 'none', color: index === 0 ? '#444' : '#888', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}>
                            <MoveUp size={14} />
                        </button>
                        <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1}
                            style={{ background: '#222', border: 'none', color: index === blocks.length - 1 ? '#444' : '#888', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}>
                            <MoveDown size={14} />
                        </button>
                        <button onClick={() => removeBlock(block.id)}
                            style={{ background: '#222', border: 'none', color: '#ff4444', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                        </button>
                    </div>

                    {/* Block Type Badge */}
                    <div style={{
                        position: 'absolute', top: '8px', left: '8px', zIndex: 10,
                        background: block.type === 'text' ? '#333' : block.type === 'image' ? '#22c55e20' : block.type === 'pdf' ? '#ff3b3b20' : block.type === 'composite' ? '#4ade8020' : '#3b82f620',
                        color: block.type === 'text' ? '#888' : block.type === 'image' ? '#22c55e' : block.type === 'pdf' ? '#ff8080' : block.type === 'composite' ? '#4ade80' : '#60a5fa',
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase'
                    }}>
                        {block.type === 'composite' ? 'layout' : block.type}
                    </div>

                    {/* Block Content */}
                    <div style={{ paddingTop: '40px' }}>
                        {block.type === 'text' && (
                            <TextBlockEditor
                                initialContent={block.content}
                                onChange={(content) => updateBlock(block.id, { content })}
                                subtitle={block.subtitle}
                                onSubtitleChange={(subtitle) => updateBlock(block.id, { subtitle })}
                            />
                        )}
                        {block.type === 'image' && (
                            <ImageBlockEditor
                                url={block.content}
                                caption={block.caption}
                                isCarousel={block.isCarousel}
                                carouselImages={block.carouselImages}
                                onChange={(content) => updateBlock(block.id, { content })}
                                onCaptionChange={(caption) => updateBlock(block.id, { caption })}
                                onCarouselToggle={(isCarousel) => updateBlock(block.id, { isCarousel })}
                                onCarouselImagesChange={(carouselImages) => updateBlock(block.id, { carouselImages })}
                            />
                        )}
                        {block.type === 'pdf' && (
                            <PdfBlockEditor
                                url={block.content}
                                onChange={(content) => updateBlock(block.id, { content })}
                            />
                        )}
                        {block.type === 'video' && (
                            <VideoBlockEditor
                                url={block.content}
                                subtitle={block.subtitle}
                                onChange={(content) => updateBlock(block.id, { content })}
                                onSubtitleChange={(subtitle) => updateBlock(block.id, { subtitle })}
                            />
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
                                onLayoutChange={(layout) => updateBlock(block.id, { layout })}
                                onImageChange={(url) => updateBlock(block.id, { imageUrl: url })}
                                onImagesChange={(urls) => updateBlock(block.id, { carouselImages: urls })}
                                onTextChange={(content) => updateBlock(block.id, { textContent: content })}
                                onSubtitleChange={(subtitle) => updateBlock(block.id, { subtitle })}
                                onSubtitleColorChange={(color) => updateBlock(block.id, { subtitleColor: color })}
                                onAlignmentChange={(alignment) => updateBlock(block.id, { alignment })}
                            />
                        )}
                    </div>
                </div>
            ))}

            <AddBlockMenu onAdd={addBlock} />
        </div>
    )
}

// --- Utility Functions ---
export function blocksToHtml(blocks: EditorBlock[]): string {
    let html = ''
    blocks.forEach(block => {
        const alignAttr = block.alignment ? ` data-align="${block.alignment}"` : ''
        const subtitleColorAttr = block.subtitleColor ? ` data-subtitle-color="${block.subtitleColor}"` : ''

        if (block.type === 'text') {
            const subtitleAttr = block.subtitle ? ` data-subtitle="${encodeURIComponent(block.subtitle)}"` : ''
            html += `<div class="siodel-block block-text"${alignAttr}${subtitleAttr}${subtitleColorAttr}>${block.content}</div>`
        } else if (block.type === 'image' && block.content) {
            const captionAttr = block.caption ? ` data-caption="${encodeURIComponent(block.caption)}"` : ''
            const carouselAttr = block.isCarousel ? ` data-carousel="true"` : ''
            const imagesAttr = block.carouselImages?.length ? ` data-images="${encodeURIComponent(JSON.stringify(block.carouselImages))}"` : ''
            html += `<div class="siodel-block block-image"${alignAttr}${captionAttr}${carouselAttr}${imagesAttr} style="margin: 32px 0;"><img src="${block.content}" style="width: 100%; border-radius: 12px; display: block;" /></div>`
        } else if (block.type === 'pdf' && block.content) {
            html += `<div class="siodel-block block-pdf" data-pdf-url="${encodeURIComponent(block.content)}"${alignAttr}></div>`
        } else if (block.type === 'video' && block.content) {
            const embedUrl = block.content.replace('watch?v=', 'embed/').split('&')[0]
            const subtitleAttr = block.subtitle ? ` data-subtitle="${encodeURIComponent(block.subtitle)}"` : ''
            let innerContent = ''
            if (block.subtitle) innerContent += `<h3 style="margin: 0 0 12px 0; color: #ff3b3b; font-size: 1.1rem; font-weight: 600;">${block.subtitle}</h3>`
            innerContent += `<div style="border-radius: 12px; overflow: hidden; position: relative; width: 100%; height: 0; padding-bottom: 56.25%; background: #000;"><iframe src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
            html += `<div class="siodel-block block-video"${subtitleAttr} style="margin: 32px 0; padding: 20px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05);">${innerContent}</div>`
        } else if (block.type === 'composite') {
            const layoutAttr = block.layout ? ` data-layout="${block.layout}"` : ' data-layout="image-left"'
            const imageAttr = block.imageUrl ? ` data-image-url="${encodeURIComponent(block.imageUrl)}"` : ''
            const textAttr = block.textContent ? ` data-text-content="${encodeURIComponent(block.textContent)}"` : ''
            const subtitleAttr = block.subtitle ? ` data-subtitle="${encodeURIComponent(block.subtitle)}"` : ''
            const imagesAttr = block.carouselImages && block.carouselImages.length > 0 ? ` data-images='${JSON.stringify(block.carouselImages)}'` : ''
            html += `<div class="siodel-block block-composite"${layoutAttr}${imageAttr}${textAttr}${subtitleAttr}${subtitleColorAttr}${alignAttr}${imagesAttr}></div>`
        }
    })
    return html
}

export function htmlToBlocks(html: string): EditorBlock[] {
    if (!html) return []
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    const blockElements = tempDiv.querySelectorAll('.siodel-block')

    if (blockElements.length === 0) {
        // Legacy content - return as single text block
        if (html.trim()) {
            return [{ id: crypto.randomUUID(), type: 'text', content: html }]
        }
        return []
    }

    return Array.from(blockElements).map(el => {
        let type: EditorBlock['type'] = 'text'
        if (el.classList.contains('block-image')) type = 'image'
        else if (el.classList.contains('block-pdf')) type = 'pdf'
        else if (el.classList.contains('block-video')) type = 'video'
        else if (el.classList.contains('block-composite')) type = 'composite'

        const block: EditorBlock = {
            id: crypto.randomUUID(),
            type,
            content: ''
        }

        if (type === 'text') {
            block.content = el.innerHTML
            block.subtitle = decodeURIComponent(el.getAttribute('data-subtitle') || '')
        } else if (type === 'image') {
            const img = el.querySelector('img')
            block.content = img?.src || ''
            block.caption = decodeURIComponent(el.getAttribute('data-caption') || '')
            block.isCarousel = el.getAttribute('data-carousel') === 'true'
            try {
                const imagesAttr = el.getAttribute('data-images')
                if (imagesAttr) block.carouselImages = JSON.parse(decodeURIComponent(imagesAttr))
            } catch { }
        } else if (type === 'pdf') {
            block.content = decodeURIComponent(el.getAttribute('data-pdf-url') || '')
        } else if (type === 'video') {
            const iframe = el.querySelector('iframe')
            block.content = iframe?.src?.replace('embed/', 'watch?v=') || ''
            block.subtitle = decodeURIComponent(el.getAttribute('data-subtitle') || '')
        } else if (type === 'composite') {
            block.layout = (el.getAttribute('data-layout') as any) || 'image-left'
            block.imageUrl = decodeURIComponent(el.getAttribute('data-image-url') || '')
            block.textContent = decodeURIComponent(el.getAttribute('data-text-content') || '')
            block.subtitle = decodeURIComponent(el.getAttribute('data-subtitle') || '')
            try {
                const imagesAttr = el.getAttribute('data-images')
                if (imagesAttr) block.carouselImages = JSON.parse(imagesAttr)
            } catch { }
        }

        block.alignment = (el.getAttribute('data-align') as any) || undefined
        block.subtitleColor = el.getAttribute('data-subtitle-color') || undefined

        return block
    })
}
