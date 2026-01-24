import { http, HttpResponse } from 'msw'

// Sample test data
export const mockSections = [
    { id: 'about', title: 'About Us', label: 'ABOUT', displayOrder: 1, isPublished: true, type: 'custom' },
    { id: 'initiatives', title: 'Our Initiatives', label: 'INITIATIVES', displayOrder: 2, isPublished: true, type: 'custom' },
    { id: 'media', title: 'Press & Media', label: 'MEDIA', displayOrder: 3, isPublished: true, type: 'custom' }
]

export const mockPosts = [
    {
        id: 'post-1',
        sectionId: 'about',
        title: 'Test Post 1',
        subtitle: 'Subtitle 1',
        content: '<p>Test content</p>',
        image: 'https://api.siodelhi.org/uploads/images/test1.webp',
        isPublished: true,
        order: 1,
        galleryImages: [
            'https://api.siodelhi.org/uploads/images/gallery1.webp',
            'https://api.siodelhi.org/uploads/images/gallery2.webp'
        ]
    },
    {
        id: 'post-2',
        sectionId: 'about',
        title: 'Test Post 2',
        content: '<div class="siodel-block" data-images=\'["https://api.siodelhi.org/uploads/images/carousel1.webp","https://api.siodelhi.org/uploads/images/carousel2.webp"]\' data-carousel="true"></div>',
        isPublished: true,
        order: 2,
        galleryImages: []
    },
    {
        id: 'post-3',
        sectionId: 'initiatives',
        parentId: undefined,
        title: 'Initiative Post',
        isPublished: true,
        order: 1,
        galleryImages: []
    },
    {
        id: 'post-4',
        sectionId: 'initiatives',
        parentId: 'post-3',
        title: 'Child Post',
        isPublished: true,
        order: 1,
        galleryImages: []
    }
]

export const mockPopup = {
    id: 'popup-1',
    image: 'https://api.siodelhi.org/uploads/images/popup.webp',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
}

// Track deleted/modified data for tests
let sectionsData = [...mockSections]
let postsData = [...mockPosts]
let popupData: typeof mockPopup | null = { ...mockPopup }

export const resetMockData = () => {
    sectionsData = [...mockSections]
    postsData = [...mockPosts]
    popupData = { ...mockPopup }
}

// Use wildcard to match any host
export const handlers = [
    // Health check
    http.get('*/health', () => {
        return HttpResponse.json({ status: 'ok', message: 'API is running' })
    }),

    // ===================
    // SECTIONS ENDPOINTS
    // ===================
    http.get('*/api/sections', () => {
        return HttpResponse.json(sectionsData)
    }),

    http.get('*/api/sections/:id', ({ params }) => {
        const section = sectionsData.find(s => s.id === params.id)
        if (!section) {
            return HttpResponse.json({ error: 'Section not found' }, { status: 404 })
        }
        return HttpResponse.json(section)
    }),

    http.post('*/api/sections', async ({ request }) => {
        const data = await request.json() as Record<string, unknown>
        if (!data.title || !data.label) {
            return HttpResponse.json({ error: 'title and label are required' }, { status: 400 })
        }
        const newSection = {
            id: (data.id as string) || `section-${Date.now()}`,
            title: data.title as string,
            label: data.label as string,
            displayOrder: data.displayOrder as number || sectionsData.length + 1,
            isPublished: (data.isPublished as boolean | undefined) ?? true,
            type: (data.type as string | undefined) || 'generic'
        }
        sectionsData.push(newSection)
        return HttpResponse.json(newSection, { status: 201 })
    }),

    // IMPORTANT: reorder must come BEFORE :id to avoid matching "reorder" as an ID
    http.put('*/api/sections/reorder', async ({ request }) => {
        const items = await request.json() as Array<{ id: string; displayOrder: number }>
        items.forEach(item => {
            const section = sectionsData.find(s => s.id === item.id)
            if (section) {
                section.displayOrder = item.displayOrder
            }
        })
        return HttpResponse.json({ message: 'Sections reordered' })
    }),

    http.put('*/api/sections/:id', async ({ params, request }) => {
        const data = await request.json() as Record<string, unknown>
        const index = sectionsData.findIndex(s => s.id === params.id)
        if (index === -1) {
            return HttpResponse.json({ error: 'Section not found' }, { status: 404 })
        }
        sectionsData[index] = { ...sectionsData[index], ...data }
        return HttpResponse.json(sectionsData[index])
    }),

    http.delete('*/api/sections/:id', ({ params }) => {
        const index = sectionsData.findIndex(s => s.id === params.id)
        if (index === -1) {
            return HttpResponse.json({ error: 'Section not found' }, { status: 404 })
        }
        sectionsData.splice(index, 1)
        return HttpResponse.json({ message: 'Section deleted successfully' })
    }),

    // ===================
    // POSTS ENDPOINTS
    // ===================
    http.get('*/api/posts', ({ request }) => {
        const url = new URL(request.url)
        const sectionId = url.searchParams.get('sectionId')
        const parentId = url.searchParams.get('parentId')
        const publishedOnly = url.searchParams.get('publishedOnly') === 'true'

        let filtered = [...postsData]
        if (sectionId) {
            filtered = filtered.filter(p => p.sectionId === sectionId)
        }
        if (parentId) {
            filtered = filtered.filter(p => p.parentId === parentId)
        }
        if (publishedOnly) {
            filtered = filtered.filter(p => p.isPublished)
        }

        return HttpResponse.json(filtered)
    }),

    http.get('*/api/posts/:id', ({ params }) => {
        const post = postsData.find(p => p.id === params.id)
        if (!post) {
            return HttpResponse.json({ error: 'Post not found' }, { status: 404 })
        }
        return HttpResponse.json(post)
    }),

    http.post('*/api/posts', async ({ request }) => {
        const data = await request.json() as Record<string, unknown>
        if (!data.title) {
            return HttpResponse.json({ error: 'title is required' }, { status: 400 })
        }
        const newPost = {
            id: (data.id as string) || `post-${Date.now()}`,
            sectionId: data.sectionId as string,
            parentId: data.parentId as string | undefined,
            title: data.title as string,
            subtitle: data.subtitle as string || '',
            content: data.content as string || '',
            image: data.image as string || '',
            pdfUrl: data.pdfUrl as string || '',
            isPublished: (data.isPublished as boolean | undefined) ?? false,
            order: data.order as number || 0,
            galleryImages: (data.galleryImages as string[]) || [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
        postsData.push(newPost as any)
        return HttpResponse.json(newPost, { status: 201 })
    }),

    // IMPORTANT: reorder must come BEFORE :id to avoid matching "reorder" as an ID
    http.put('*/api/posts/reorder', async ({ request }) => {
        const items = await request.json() as Array<{ id: string; order: number }>
        items.forEach(item => {
            const post = postsData.find(p => p.id === item.id)
            if (post) {
                post.order = item.order
            }
        })
        return HttpResponse.json({ message: 'Posts reordered' })
    }),

    http.put('*/api/posts/:id', async ({ params, request }) => {
        const data = await request.json() as Record<string, unknown>
        const index = postsData.findIndex(p => p.id === params.id)
        if (index === -1) {
            return HttpResponse.json({ error: 'Post not found' }, { status: 404 })
        }
        postsData[index] = { ...postsData[index], ...(data as any), updatedAt: Date.now() }
        return HttpResponse.json(postsData[index])
    }),

    http.delete('*/api/posts/:id', ({ params }) => {
        const index = postsData.findIndex(p => p.id === params.id)
        if (index === -1) {
            return HttpResponse.json({ error: 'Post not found' }, { status: 404 })
        }
        postsData.splice(index, 1)
        return HttpResponse.json({ message: 'Post deleted successfully' })
    }),

    // ===================
    // POPUPS ENDPOINTS
    // ===================
    http.get('*/api/popups/active', () => {
        if (!popupData || !popupData.isActive) {
            return HttpResponse.json(null)
        }
        return HttpResponse.json(popupData)
    }),

    http.get('*/api/popups', () => {
        return HttpResponse.json(popupData ? [popupData] : [])
    }),

    http.post('*/api/popups', async ({ request }) => {
        const data = await request.json() as { image: string; isActive?: boolean }
        popupData = {
            id: `popup-${Date.now()}`,
            image: data.image,
            isActive: data.isActive ?? true,
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
        return HttpResponse.json(popupData, { status: 201 })
    }),

    http.put('*/api/popups/:id', async ({ params, request }) => {
        const data = await request.json() as Partial<typeof mockPopup>
        if (!popupData || popupData.id !== params.id) {
            return HttpResponse.json({ error: 'Popup not found' }, { status: 404 })
        }
        popupData = { ...popupData, ...data, updatedAt: Date.now() }
        return HttpResponse.json(popupData)
    }),

    // IMPORTANT: clear must come BEFORE :id to avoid matching "clear" as an ID
    http.delete('*/api/popups/clear', () => {
        popupData = null
        return HttpResponse.json({ message: 'Popups cleared' })
    }),

    http.delete('*/api/popups/:id', ({ params }) => {
        if (!popupData || popupData.id !== params.id) {
            return HttpResponse.json({ error: 'Popup not found' }, { status: 404 })
        }
        popupData = null
        return HttpResponse.json({ message: 'Popup deleted successfully' })
    }),

    // ===================
    // UPLOAD ENDPOINTS
    // ===================
    http.post('*/api/upload/image', async () => {
        const filename = `${Date.now()}-test.webp`
        return HttpResponse.json({
            url: `https://api.siodelhi.org/uploads/images/${filename}`,
            filename
        }, { status: 201 })
    }),

    http.post('*/api/upload/pdf', async () => {
        const filename = `${Date.now()}-test.pdf`
        return HttpResponse.json({
            url: `https://api.siodelhi.org/uploads/pdfs/${filename}`,
            filename
        }, { status: 201 })
    }),

    http.post('*/api/upload/audio', async () => {
        const filename = `${Date.now()}-test.mp3`
        return HttpResponse.json({
            url: `https://api.siodelhi.org/uploads/audio/${filename}`,
            filename
        }, { status: 201 })
    }),

    http.delete('*/api/upload/:type/:filename', ({ params }) => {
        const validTypes = ['images', 'pdfs', 'audio']
        if (!validTypes.includes(params.type as string)) {
            return HttpResponse.json({ error: 'Invalid file type' }, { status: 400 })
        }
        return HttpResponse.json({ message: 'File deleted successfully' })
    }),

    // ===================
    // STATS ENDPOINTS
    // ===================
    http.get('*/api/stats/storage', () => {
        return HttpResponse.json({
            images: { count: 10, size: 5242880 },
            pdfs: { count: 3, size: 1048576 },
            audio: { count: 2, size: 2097152 }
        })
    })
]
