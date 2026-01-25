
export type LayoutType = string

export interface Post {
    id: string
    sectionId: string
    parentId?: string // For nested posts (subsection children)
    isSubsection?: boolean // True if this post contains other posts
    title: string
    subtitle?: string
    content: string // HTML from Tiptap
    image?: string
    pdfUrl?: string // PDF document URL
    enableAudio?: boolean // Whether to show audio player (TTS) on frontend
    layout: LayoutType
    order?: number // Display order for sorting (e.g., Leadership cards)
    isPublished: boolean // Whether post shows on frontend
    createdAt: number
    updatedAt: number
    author?: string
    email?: string // Contact email for Leadership
    instagram?: string // Instagram handle/url for Leadership
    tags?: string[] // Dynamic tags for Media/News
    icon?: string // Icon name for Resources/More section
    galleryImages?: string[] // Array of image URLs for the post gallery
}

export interface Section {
    id: string
    label: string // e.g., "INITIATIVES"
    title: string // e.g., "Our Initiatives"
    description?: string
    // Dynamic fields
    display_order: number // mapped from display_order
    is_published: boolean // mapped from is_published
    type: 'custom' | 'generic'
    template?: SectionTemplate
}

export type SectionTemplate = 'standard' | 'media' | 'leadership' | 'resource'

export interface Leader {
    id: string
    name: string
    role: string
    image: string
    bio?: string
}

export interface Popup {
    id: string
    image: string
    isActive: boolean
    buttonText?: string
    buttonLink?: string
    createdAt: number
    updatedAt: number
}
