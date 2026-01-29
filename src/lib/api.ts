export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// DTO types matching API response format
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
    buttonText?: string
    buttonLink?: string
    createdAt?: number
    updatedAt?: number
}

// Form types
export type FormFieldType =
    | 'text'
    | 'textarea'
    | 'number'
    | 'email'
    | 'dropdown'
    | 'checkbox'
    | 'radio'
    | 'date'
    | 'file'
    | 'rating'
    | 'phone'

export interface FormFieldValidation {
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    pattern?: string
    accept?: string
}

export interface FormFieldDTO {
    id: string
    formId?: string
    pageId?: string
    type: FormFieldType
    label: string
    placeholder?: string
    helpText?: string
    isRequired: boolean
    options?: string[]
    validationRules?: FormFieldValidation
    displayOrder: number
}

export interface FormPageRoutingRule {
    condition: {
        fieldId: string
        operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
        value: any
    }
    action: 'jump_to_page'
    targetPageId: string
}

export interface FormPageDTO {
    id: string
    formId?: string
    title?: string
    displayOrder: number
    routingRules?: FormPageRoutingRule[]
    fields?: FormFieldDTO[]
}

export interface FormDTO {
    id: string
    title: string
    description?: string
    slug: string
    bannerImage?: string | null
    themePrimaryColor?: string
    themeBackground?: string
    themeBackgroundImage?: string | null
    footerBgColor?: string | null
    footerTextColor?: string | null
    footerPatternColor?: string | null
    isPublished: boolean
    acceptResponses: boolean
    successMessage?: string
    responseLimit?: number | null
    expiresAt?: number | null
    pages?: FormPageDTO[]
    // Legacy fields array for backward compatibility or flat lists
    fields?: FormFieldDTO[]
    responseCount?: number
    createdAt?: number
    updatedAt?: number
}

export interface FormResponseDTO {
    id: string
    formId: string
    responseData: Record<string, unknown>
    submittedAt: number
}

export interface FormResponsesResult {
    responses: FormResponseDTO[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

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
    async uploadFile(path: string, file: File | Blob, fieldName = 'file', formId?: string, userName?: string): Promise<ApiResponse<{ url: string; filename: string }>> {
        const formData = new FormData()

        // Pass formId if provided
        if (formId) {
            console.log('UPLOADING for formId:', formId)
            formData.append('formId', formId)
        }

        // Pass userName if provided for subfolder organization
        if (userName) {
            console.log('UPLOADING for userName:', userName)
            formData.append('userName', userName)
        }

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
        async image(file: File | Blob, formId?: string, userName?: string) {
            return api.uploadFile('/api/upload/image', file, 'file', formId, userName)
        },
        async pdf(file: File, formId?: string, userName?: string) {
            return api.uploadFile('/api/upload/pdf', file, 'file', formId, userName)
        },
        async audio(file: File | Blob, formId?: string, userName?: string) {
            return api.uploadFile('/api/upload/audio', file, 'file', formId, userName)
        },
        async deleteFile(type: 'images' | 'pdfs' | 'audio', filename: string) {
            return api.delete(`/api/upload/${type}/${filename}`)
        }
    },

    // Forms
    forms: {
        async getAll() {
            return api.get<FormDTO[]>('/api/forms')
        },
        async get(id: string) {
            return api.get<FormDTO>(`/api/forms/${id}`)
        },
        async getPublic(slugOrId: string) {
            return api.get<FormDTO>(`/api/forms/public/${slugOrId}`)
        },
        async create(data: Partial<FormDTO>) {
            return api.post<FormDTO>('/api/forms', data)
        },
        async update(id: string, data: Partial<FormDTO>) {
            return api.put<FormDTO>(`/api/forms/${id}`, data)
        },
        async delete(id: string) {
            return api.delete(`/api/forms/${id}`)
        },
        async updateFields(formId: string, fields: FormFieldDTO[]) {
            return api.put<FormDTO>(`/api/forms/${formId}/fields`, { fields })
        },
        async getResponses(formId: string, page = 1, limit = 50) {
            return api.get<FormResponsesResult>(`/api/forms/${formId}/responses?page=${page}&limit=${limit}`)
        },
        async submit(formId: string, responses: Record<string, unknown>) {
            return api.post<{ success: boolean; message: string }>(`/api/forms/${formId}/submit`, { responses })
        },
        async getResponse(formId: string, responseId: string) {
            return api.get<FormResponseDTO>(`/api/forms/${formId}/responses/${responseId}`)
        },
        async updateResponse(formId: string, responseId: string, responseData: Record<string, unknown>) {
            return api.put<FormResponseDTO>(`/api/forms/${formId}/responses/${responseId}`, { responseData })
        },
        async deleteResponse(formId: string, responseId: string) {
            return api.delete(`/api/forms/${formId}/responses/${responseId}`)
        },
        getExportUrl(formId: string, format: 'csv' | 'json' = 'csv') {
            return `${API_BASE}/api/forms/${formId}/export?format=${format}`
        }
    }
}
