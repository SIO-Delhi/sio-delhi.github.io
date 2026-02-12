import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Link from '@tiptap/extension-link'
import { Extension } from '@tiptap/core'
// Custom extensions defined locally

// Custom Text Direction Extension
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

// Custom Font Size Extension
export const CustomFontSize = Extension.create({
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
            setFontSize: (fontSize: string) => ({ chain }: any) => {
                return chain()
                    .setMark('textStyle', { fontSize })
                    .run()
            },
            unsetFontSize: () => ({ chain }: any) => {
                return chain()
                    .setMark('textStyle', { fontSize: null })
                    .removeEmptyTextStyle()
                    .run()
            },
        }
    },
})

export const EDITOR_EXTENSIONS = [
    StarterKit,
    Underline,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle,
    Color,
    CustomFontSize,
    TextDirection,
    Link.configure({ openOnClick: false })
]
