const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface ApiResponse<T> {
    data?: T
    error?: string
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        return { error: errorData.error || `HTTP ${response.status}` }
    }
    const data = await response.json()
    return { data }
}

export const api = {
    // Generic methods
    async get<T>(path: string): Promise<ApiResponse<T>> {
        const response = await fetch(`${API_BASE}${path}`)
        return handleResponse<T>(response)
    },

    async post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
        const response = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        return handleResponse<T>(response)
    },

    async put<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
        const response = await fetch(`${API_BASE}${path}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        return handleResponse<T>(response)
    },

    async delete<T>(path: string): Promise<ApiResponse<T>> {
        const response = await fetch(`${API_BASE}${path}`, {
            method: 'DELETE'
        })
        return handleResponse<T>(response)
    },

    // File upload (multipart/form-data)
    async uploadFile(path: string, file: File | Blob, fieldName = 'file'): Promise<ApiResponse<{ url: string; filename: string }>> {
        const formData = new FormData()
        formData.append(fieldName, file)

        const response = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            body: formData
        })
        return handleResponse<{ url: string; filename: string }>(response)
    },

    // Sections
    sections: {
        async getAll() {
            return api.get<SectionDTO[]>('/api/sections')
        },
        async get(id: string) {
            return api.get<SectionDTO>(`/api/sections/${id}`)
        },
        async create(data: Partial<SectionDTO>) {
            return api.post<SectionDTO>('/api/sections', data)
        },
        async update(id: string, data: Partial<SectionDTO>) {
            return api.put<SectionDTO>(`/api/sections/${id}`, data)
        },
        async delete(id: string) {
            return api.delete(`/api/sections/${id}`)
        },
        async reorder(items: { id: string; displayOrder: number }[]) {
            return api.put('/api/sections/reorder', items)
        }
    },

    // Posts
    posts: {
        async getAll(params?: { sectionId?: string; parentId?: string; publishedOnly?: boolean }) {
            const searchParams = new URLSearchParams()
            if (params?.sectionId) searchParams.append('sectionId', params.sectionId)
            if (params?.parentId) searchParams.append('parentId', params.parentId)
            if (params?.publishedOnly) searchParams.append('publishedOnly', 'true')
            const query = searchParams.toString()
            return api.get<PostDTO[]>(`/api/posts${query ? `?${query}` : ''}`)
        },
        async get(id: string) {
            return api.get<PostDTO>(`/api/posts/${id}`)
        },
        async create(data: Partial<PostDTO>) {
            return api.post<PostDTO>('/api/posts', data)
        },
        async update(id: string, data: Partial<PostDTO>) {
            return api.put<PostDTO>(`/api/posts/${id}`, data)
        },
        async delete(id: string) {
            return api.delete(`/api/posts/${id}`)
        },
        async reorder(items: { id: string; order: number }[]) {
            return api.put('/api/posts/reorder', items)
        }
    },

    // Popups
    popups: {
        async getActive() {
            return api.get<PopupDTO | null>('/api/popups/active')
        },
        async getAll() {
            return api.get<PopupDTO[]>('/api/popups')
        },
        async create(data: { image: string; isActive?: boolean }) {
            return api.post<PopupDTO>('/api/popups', data)
        },
        async update(id: string, data: Partial<PopupDTO>) {
            return api.put<PopupDTO>(`/api/popups/${id}`, data)
        },
        async delete(id: string) {
            return api.delete(`/api/popups/${id}`)
        },
        async clear() {
            return api.delete('/api/popups/clear')
        }
    },

    // Upload
    upload: {
        async image(file: File | Blob) {
            return api.uploadFile('/api/upload/image', file)
        },
        async pdf(file: File) {
            return api.uploadFile('/api/upload/pdf', file)
        },
        async audio(file: File | Blob) {
            return api.uploadFile('/api/upload/audio', file)
        },
        async deleteFile(type: 'images' | 'pdfs' | 'audio', filename: string) {
            return api.delete(`/api/upload/${type}/${filename}`)
        }
    }
}

// DTO types matching Flask API response format
export interface SectionDTO {
    id: string
    title: string
    label: string
    type?: string
    displayOrder?: number
    isPublished?: boolean
    description?: string
    template?: string
    createdAt?: number
    updatedAt?: number
}

export interface PostDTO {
    id: string
    sectionId?: string
    parentId?: string
    isSubsection?: boolean
    title: string
    subtitle?: string
    content?: string
    image?: string
    pdfUrl?: string
    enableAudio?: boolean
    email?: string
    instagram?: string
    layout?: string
    order?: number
    isPublished?: boolean
    tags?: string[]
    icon?: string
    galleryImages?: string[]
    createdAt?: number
    updatedAt?: number
}

export interface PopupDTO {
    id: string
    image: string
    isActive?: boolean
    createdAt?: number
    updatedAt?: number
}
