
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
    layout: LayoutType
    order?: number // Display order for sorting (e.g., Leadership cards)
    isPublished: boolean // Whether post shows on frontend
    createdAt: number
    updatedAt: number
    author?: string
}

export interface Section {
    id: string
    label: string // e.g., "INITIATIVES"
    title: string // e.g., "Our Initiatives"
    description?: string
}

export interface Leader {
    id: string
    name: string
    role: string
    image: string
    bio?: string
}
