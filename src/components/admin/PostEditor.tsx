
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useContent } from '../../context/ContentContext'
import { uploadImage, uploadPdf } from '../../lib/storage'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { ArrowLeft, Save, Image as ImageIcon, Bold, Italic, Heading1, Heading2, List, Loader2, FileText, X, Plus, Trash2, MoveUp, MoveDown } from 'lucide-react'

// --- Block Types & Interfaces ---
interface EditorBlock {
    id: string
    type: 'text' | 'image'
    content: string // HTML for text, URL for image
}

// --- Helper Components ---

const EditorToolbar = ({ editor }: { editor: any }) => {
    if (!editor) return null

    return (
        <div style={{
            display: 'flex', gap: '8px', padding: '8px', borderBottom: '1px solid #333',
            background: '#1a1a1a', borderRadius: '8px 8px 0 0',
            flexWrap: 'wrap'
        }} onMouseDown={(e) => e.preventDefault()}>
            <button onClick={() => editor.chain().focus().toggleBold().run()} style={{ padding: '6px', borderRadius: '4px', background: editor.isActive('bold') ? '#444' : 'transparent', color: editor.isActive('bold') ? 'white' : '#aaa', border: 'none', cursor: 'pointer' }}><Bold size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} style={{ padding: '6px', borderRadius: '4px', background: editor.isActive('italic') ? '#444' : 'transparent', color: editor.isActive('italic') ? 'white' : '#aaa', border: 'none', cursor: 'pointer' }}><Italic size={16} /></button>
            <div style={{ width: '1px', background: '#333', margin: '0 4px' }} />
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} style={{ padding: '6px', borderRadius: '4px', background: editor.isActive('heading', { level: 1 }) ? '#444' : 'transparent', color: editor.isActive('heading', { level: 1 }) ? 'white' : '#aaa', border: 'none', cursor: 'pointer' }}><Heading1 size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={{ padding: '6px', borderRadius: '4px', background: editor.isActive('heading', { level: 2 }) ? '#444' : 'transparent', color: editor.isActive('heading', { level: 2 }) ? 'white' : '#aaa', border: 'none', cursor: 'pointer' }}><Heading2 size={16} /></button>
            <div style={{ width: '1px', background: '#333', margin: '0 4px' }} />
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} style={{ padding: '6px', borderRadius: '4px', background: editor.isActive('bulletList') ? '#444' : 'transparent', color: editor.isActive('bulletList') ? 'white' : '#aaa', border: 'none', cursor: 'pointer' }}><List size={16} /></button>
        </div>
    )
}



const AddBlockMenu = ({ onAdd }: { onAdd: (type: 'text' | 'image') => void }) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div style={{ position: 'relative', margin: '32px 0', textAlign: 'center' }}>
            {isOpen ? (
                <div style={{
                    display: 'inline-flex', gap: '12px', padding: '12px 24px',
                    background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)', alignItems: 'center'
                }}>
                    <span style={{ color: '#666', fontSize: '0.85rem', marginRight: '8px', fontWeight: 500 }}>ADD CONTENT:</span>
                    <button
                        onClick={() => { onAdd('text'); setIsOpen(false) }}
                        style={{
                            background: '#333', border: '1px solid #444', color: 'white',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 16px', borderRadius: '8px', transition: 'all 0.2s',
                            fontSize: '0.9rem', fontWeight: 500
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#666'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#444'}
                    >
                        <FileText size={16} /> Text
                    </button>
                    <button
                        onClick={() => { onAdd('image'); setIsOpen(false) }}
                        style={{
                            background: '#333', border: '1px solid #444', color: 'white',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 16px', borderRadius: '8px', transition: 'all 0.2s',
                            fontSize: '0.9rem', fontWeight: 500
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#666'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#444'}
                    >
                        <ImageIcon size={16} /> Image
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{
                            background: 'transparent', border: 'none', color: '#666',
                            padding: '8px', borderRadius: '50%', cursor: 'pointer', marginLeft: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'color 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ff3b3b'}
                        onMouseLeave={e => e.currentTarget.style.color = '#666'}
                    >
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

const TextBlockEditor = ({ content, onChange }: { content: string, onChange: (content: string) => void }) => {
    const [isFocused, setIsFocused] = useState(false)
    const editor = useEditor({
        extensions: [StarterKit],
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
        <div style={{ position: 'relative' }}>
            {editor && isFocused && (
                <div style={{ marginBottom: '8px' }}>
                    <EditorToolbar editor={editor} />
                </div>
            )}
            <EditorContent editor={editor} style={{ color: '#ddd', fontSize: '1.1rem', lineHeight: 1.8 }} />
        </div>
    )
}

const ImageBlockEditor = ({ url, onChange }: { url: string, onChange: (url: string) => void }) => {
    const [isUploading, setIsUploading] = useState(false)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const uploadedUrl = await uploadImage(file)
            onChange(uploadedUrl)
        } catch (err) {
            console.error(err)
            alert('Upload failed')
        } finally {
            setIsUploading(false)
        }
    }

    if (url) {
        return (
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333' }}>
                <img src={url} alt="Block" style={{ width: '100%', display: 'block' }} />
                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                    <label style={{
                        background: 'rgba(0,0,0,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                        padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <ImageIcon size={14} /> Replace
                        <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
                    </label>
                </div>
            </div>
        )
    }

    return (
        <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '40px', borderRadius: '12px',
            background: '#1a1a1a', border: '2px dashed #333',
            cursor: isUploading ? 'wait' : 'pointer',
            transition: 'border-color 0.2s',
        }}>
            <input type="file" accept="image/*" onChange={handleUpload} disabled={isUploading} style={{ display: 'none' }} />
            {isUploading ? (
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#666' }} />
            ) : (
                <>
                    <ImageIcon size={48} color="#444" style={{ marginBottom: '16px' }} />
                    <div style={{ color: '#888', fontSize: '1rem', fontWeight: 500 }}>Click to upload image</div>
                </>
            )}
        </label>
    )
}


export function PostEditor() {
    const { sectionId, id } = useParams()
    const { sections, getPostById, addPost, updatePost } = useContent()
    const navigate = useNavigate()
    const isEditMode = !!id
    const section = sections.find(s => s.id === sectionId)

    // Form State
    const [title, setTitle] = useState('')
    const [subtitle, setSubtitle] = useState('')
    const [images, setImages] = useState<string[]>([]) // Cover image
    const [pdfUrl, setPdfUrl] = useState('')
    const [pdfName, setPdfName] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isUploadingPdf, setIsUploadingPdf] = useState(false)

    // Blocks State
    const [blocks, setBlocks] = useState<EditorBlock[]>([])

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
                    setPdfName(post.pdfUrl.split('/').pop() || 'Document.pdf')
                }

                // Parse Content into Blocks
                // Simple parsing: check for special block markers, or default to one text block
                const tempDiv = document.createElement('div')
                tempDiv.innerHTML = post.content
                const blockElements = tempDiv.querySelectorAll('.siodel-block')

                if (blockElements.length > 0) {
                    const loadedBlocks: EditorBlock[] = []
                    blockElements.forEach(el => {
                        const type = el.classList.contains('block-image') ? 'image' : 'text'
                        let content = ''
                        if (type === 'image') {
                            const img = el.querySelector('img')
                            content = img ? img.src : ''
                        } else {
                            content = el.innerHTML
                        }
                        loadedBlocks.push({ id: crypto.randomUUID(), type, content })
                    })
                    setBlocks(loadedBlocks)
                } else {
                    // Legacy content - treat as one text block
                    setBlocks([{ id: crypto.randomUUID(), type: 'text', content: post.content }])
                }
            }
        }
    }, [isEditMode, id])

    // Handlers
    const addBlock = (type: 'text' | 'image', index?: number) => {
        const newBlock: EditorBlock = {
            id: crypto.randomUUID(),
            type,
            content: type === 'text' ? '<p></p>' : ''
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

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setIsUploadingPdf(true)
        try {
            const url = await uploadPdf(file)
            setPdfUrl(url)
            setPdfName(file.name)
            alert('PDF uploaded successfully!')
        } catch (err) { console.error(err) } finally { setIsUploadingPdf(false) }
    }


    const handleSave = () => {
        if (!title) { alert('Please enter a title'); return }
        setIsSaving(true)

        // Serialize Blocks to HTML
        let finalContent = ''
        blocks.forEach(block => {
            if (block.type === 'text') {
                finalContent += `<div class="siodel-block block-text">${block.content}</div>`
            } else if (block.type === 'image' && block.content) {
                finalContent += `<div class="siodel-block block-image" style="margin: 32px 0;"><img src="${block.content}" style="width: 100%; border-radius: 12px; display: block;" /></div>`
            }
        })

        try {
            const postData = {
                title,
                subtitle,
                content: finalContent,
                image: images[0] || '',
                pdfUrl,
                layout: 'custom',
            }

            if (isEditMode && id) {
                updatePost(id, postData)
            } else if (sectionId) {
                addPost({ sectionId, isPublished: false, ...postData })
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
                <button onClick={handleSave} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 32px', borderRadius: '100px', background: '#ff3b3b', color: 'white', border: 'none', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', opacity: isSaving ? 0.7 : 1 }}>
                    <Save size={20} /> {isSaving ? 'Saving...' : 'Save Post'}
                </button>
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
                    <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Add a subtitle..." style={{ width: '100%', background: 'transparent', border: 'none', color: '#888', fontSize: '1.5rem', fontWeight: 400, outline: 'none' }} />
                </div>

                {/* 3. PDF Block */}
                <div style={{ padding: '0 8px' }}>
                    {pdfUrl ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', maxWidth: '400px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', background: 'rgba(255,59,59,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={20} color="#ff3b3b" />
                                </div>
                                <div>
                                    <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 500 }}>{pdfName || 'Attached Document'}</div>
                                    <div style={{ color: '#666', fontSize: '0.75rem' }}>PDF Document</div>
                                </div>
                            </div>
                            <button onClick={() => { setPdfUrl(''); setPdfName('') }} style={{ padding: '8px', borderRadius: '8px', background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}>
                                <X size={18} />
                            </button>
                        </div>
                    ) : (
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '0.9rem', cursor: 'pointer', padding: '8px 16px', borderRadius: '6px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#222'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <FileText size={18} /> <span>Add PDF Document</span>
                            <div style={{ display: 'none' }}><input type="file" accept=".pdf,application/pdf" onChange={handlePdfUpload} disabled={isUploadingPdf} /></div>
                        </label>
                    )}
                </div>

                {/* 4. BLOCKS EDITOR */}
                <div style={{ marginTop: '32px' }}>
                    {blocks.map((block, index) => (
                        <div key={block.id} className="editor-block-wrapper group" style={{ position: 'relative', marginBottom: '16px' }}>

                            {/* Block Actions (Hover) */}
                            <div className="block-actions" style={{ position: 'absolute', left: '-48px', top: '0', display: 'flex', flexDirection: 'column', gap: '4px', opacity: 0, transition: 'opacity 0.2s' }}>
                                <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} style={{ padding: '4px', background: 'transparent', border: 'none', color: '#444', cursor: 'pointer' }}><MoveUp size={16} /></button>
                                <button onClick={() => removeBlock(block.id)} style={{ padding: '4px', background: 'transparent', border: 'none', color: '#444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} style={{ padding: '4px', background: 'transparent', border: 'none', color: '#444', cursor: 'pointer' }}><MoveDown size={16} /></button>
                            </div>

                            {/* Block Content */}
                            {block.type === 'text' && (
                                <TextBlockEditor content={block.content} onChange={(content) => updateBlockContent(block.id, content)} />
                            )}
                            {block.type === 'image' && (
                                <ImageBlockEditor url={block.content} onChange={(url) => updateBlockContent(block.id, url)} />
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
        </div>
    )
}
