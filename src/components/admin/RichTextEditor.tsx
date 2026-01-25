
import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import { Extension } from '@tiptap/core'
import { Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify, Heading1, Heading2, List, Highlighter } from 'lucide-react'

// --- Custom Font Size Extension ---
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
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHighlight().run() }} style={buttonStyle(editor.isActive('highlight'))}><Highlighter size={16} /></button>

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
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('left').run() }} style={buttonStyle(editor.isActive({ textAlign: 'left' }))}><AlignLeft size={16} /></button>
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('center').run() }} style={buttonStyle(editor.isActive({ textAlign: 'center' }))}><AlignCenter size={16} /></button>
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('right').run() }} style={buttonStyle(editor.isActive({ textAlign: 'right' }))}><AlignRight size={16} /></button>
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign('justify').run() }} style={buttonStyle(editor.isActive({ textAlign: 'justify' }))}><AlignJustify size={16} /></button>

            <div style={{ width: '1px', background: '#333', margin: '0 6px', height: '20px' }} />

            {/* Headings */}
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run() }} style={buttonStyle(editor.isActive('heading', { level: 1 }))}>
                <Heading1 size={16} />
            </button>
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() }} style={buttonStyle(editor.isActive('heading', { level: 2 }))}>
                <Heading2 size={16} />
            </button>

            <div style={{ width: '1px', background: '#333', margin: '0 6px', height: '20px' }} />

            {/* Lists */}
            <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }} style={buttonStyle(editor.isActive('bulletList'))}><List size={16} /></button>
        </div>
    )
}

interface RichTextEditorProps {
    value: string
    onChange: (content: string) => void
    placeholder?: string
    minHeight?: string
}

export function RichTextEditor({ value, onChange, placeholder, minHeight = '150px' }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Color,
            Highlight.configure({
                multicolor: true,
            }),
            FontSize
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none',
                style: `min-height: ${minHeight}; padding: 16px; color: #ddd; font-size: 1rem; line-height: 1.6;`,
            },
        },
    })

    // Update content if value changes externally (optional, but good for initial load)
    React.useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            // Only update if difference is significant to avoid cursor jumps
            // For simple cases, we can verify content length or structure.
            // But often direct strict equality check is enough if we aren't typing fast.
            // A common pattern is to only set content if editor is empty or completely different.
            // For now, we trust the parent to manage state. To be safe, we only set on mount via initial content usually.
            // But if we need reactive updates:
            if (editor.getHTML() !== value) {
                // Checking overlap is tricky. Let's just assume parent controls initial state mostly.
                // We will skip auto-updating from props to avoid loops/cursor jumping unless we implement more complex logic.
                // BUT for initial hydration it's needed.
                // Let's rely on useEditor `content` option for initial.
            }
        }
    }, [value, editor])

    return (
        <div style={{ background: '#111', borderRadius: '12px', border: '1px solid #27272a', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <EditorToolbar editor={editor} />
            <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <EditorContent editor={editor} style={{ flex: 1, display: 'flex', flexDirection: 'column' }} />
                {editor && editor.isEmpty && placeholder && (
                    <div style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        color: '#555',
                        pointerEvents: 'none',
                        fontStyle: 'italic'
                    }}>
                        {placeholder}
                    </div>
                )}
            </div>
        </div>
    )
}
