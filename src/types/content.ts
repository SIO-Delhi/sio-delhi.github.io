
export type LayoutType = string

export interface Post {
    id: string
    sectionId: string
    title: string
    subtitle?: string
    content: string // HTML from Tiptap
    image?: string
    pdfUrl?: string // PDF document URL
    layout: LayoutType
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
