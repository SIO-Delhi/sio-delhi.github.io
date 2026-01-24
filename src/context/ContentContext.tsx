import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Post, Section, Popup, SectionTemplate } from '../types/content'
import { api } from '../lib/api'


interface ContentContextType {
    sections: Section[]
    posts: Post[]
    loading: boolean
    error: string | null
    getPostsBySection: (sectionId: string) => Post[]
    getPostById: (id: string) => Post | undefined
    getChildPosts: (parentId: string) => Post[]
    getSubsectionsBySection: (sectionId: string) => Post[]
    // Post Actions
    addPost: (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: number }) => Promise<void>
    updatePost: (id: string, post: Partial<Post>) => Promise<void>
    deletePost: (id: string) => Promise<void>
    refreshPosts: () => Promise<void>
    // Section Actions
    createSection: (section: Omit<Section, 'display_order' | 'is_published' | 'type'>) => Promise<void>
    updateSection: (id: string, updates: Partial<Section>) => Promise<void>
    deleteSection: (id: string) => Promise<void>
    // UI Actions
    showDonation: boolean
    setShowDonation: (show: boolean) => void
    // Popup Actions
    popup: Popup | null
    fetchPopup: () => Promise<void>
    savePopup: (image: string, isActive: boolean) => Promise<void>
    deletePopup: () => Promise<void>
}

const ContentContext = createContext<ContentContextType | undefined>(undefined)

export function ContentProvider({ children }: { children: ReactNode }) {
    const [sections, setSections] = useState<Section[]>([])
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showDonation, setShowDonation] = useState(false) // Donation Modal State
    const [popup, setPopup] = useState<Popup | null>(null) // Popup State

    // Fetch Sections from API
    const fetchSections = useCallback(async () => {
        const result = await api.sections.getAll()

        if (result.error) {
            console.error('Error fetching sections:', result.error)
            // Fallback for initial migration or error
            setSections([
                { id: 'about', label: 'ABOUT US', title: 'About SIO Delhi', display_order: 1, is_published: true, type: 'custom' },
                { id: 'initiatives', label: 'INITIATIVES', title: 'Our Initiatives', display_order: 2, is_published: true, type: 'custom' },
                { id: 'media', label: 'MEDIA', title: 'Press & Media', display_order: 3, is_published: true, type: 'custom' },
                { id: 'leadership', label: 'LEADERSHIP', title: 'Our Leadership', display_order: 4, is_published: true, type: 'custom' },
                { id: 'more', label: 'resources', title: 'More Resources', display_order: 5, is_published: true, type: 'custom' },
            ])
            return
        }

        const mapped: Section[] = (result.data || []).map(row => ({
            id: row.id,
            title: row.title,
            label: row.label,
            description: row.description,
            display_order: row.displayOrder ?? 0,
            is_published: row.isPublished ?? true,
            type: (row.type || 'generic') as 'custom' | 'generic',
            template: row.template as SectionTemplate | undefined
        }))
        setSections(mapped)
    }, [])

    const createSection = async (sectionData: Omit<Section, 'display_order' | 'is_published' | 'type'>) => {
        try {
            // Auto-assign order (last + 1)
            const maxOrder = Math.max(...sections.map(s => s.display_order || 0), 0)

            const newSection = {
                id: sectionData.id,
                title: sectionData.title,
                label: sectionData.label,
                description: sectionData.description,
                type: 'generic',
                displayOrder: maxOrder + 1,
                isPublished: true,
                template: sectionData.template || 'standard'
            }

            const result = await api.sections.create(newSection)
            if (result.error) throw new Error(result.error)
            await fetchSections()
        } catch (err) {
            console.error('Error creating section:', err)
            alert(`Failed to create section: ${err instanceof Error ? err.message : String(err)}`)
            throw err
        }
    }

    const updateSection = async (id: string, updates: Partial<Section>) => {
        try {
            const apiUpdates: Record<string, unknown> = {}
            if (updates.title !== undefined) apiUpdates.title = updates.title
            if (updates.label !== undefined) apiUpdates.label = updates.label
            if (updates.description !== undefined) apiUpdates.description = updates.description
            if (updates.display_order !== undefined) apiUpdates.displayOrder = updates.display_order
            if (updates.is_published !== undefined) apiUpdates.isPublished = updates.is_published
            if (updates.type !== undefined) apiUpdates.type = updates.type
            if (updates.template !== undefined) apiUpdates.template = updates.template

            const result = await api.sections.update(id, apiUpdates)

            if (result.error) throw new Error(result.error)

            await fetchSections()
        } catch (err) {
            console.error('Error updating section:', err)
            alert(`Failed to update section: ${err instanceof Error ? err.message : String(err)}`)
            throw err
        }
    }

    const deleteSection = async (id: string) => {
        try {
            const result = await api.sections.delete(id)

            if (result.error) throw new Error(result.error)

            await fetchSections()
        } catch (err) {
            console.error('Error deleting section:', err)
            alert(`Failed to delete section: ${err instanceof Error ? err.message : String(err)}`)
            throw err
        }
    }

    // Fetch Popup from API
    const fetchPopup = useCallback(async () => {
        try {
            const result = await api.popups.getActive()

            if (result.error) {
                console.error('Error fetching popup:', result.error)
                setPopup(null)
                return
            }

            if (!result.data) {
                setPopup(null)
                return
            }

            const row = result.data
            setPopup({
                id: row.id,
                image: row.image,
                isActive: row.isActive ?? true,
                createdAt: row.createdAt ?? Date.now(),
                updatedAt: row.updatedAt ?? Date.now()
            })
        } catch (err) {
            console.error('Error fetching popup:', err)
            setPopup(null)
        }
    }, [])

    const savePopup = async (image: string, isActive: boolean) => {
        try {
            // Check if popup exists
            const existingResult = await api.popups.getAll()
            const existing = existingResult.data && existingResult.data.length > 0 ? existingResult.data[0] : null

            if (existing) {
                // Update existing
                const result = await api.popups.update(existing.id, {
                    image,
                    isActive
                })
                if (result.error) throw new Error(result.error)
            } else {
                // Insert new
                const result = await api.popups.create({
                    image,
                    isActive
                })
                if (result.error) throw new Error(result.error)
            }

            await fetchPopup()
        } catch (err) {
            console.error('Error saving popup:', err)
            throw err
        }
    }

    const deletePopup = async () => {
        try {
            const result = await api.popups.clear()
            if (result.error) throw new Error(result.error)
            setPopup(null)
        } catch (err) {
            console.error('Error deleting popup:', err)
            throw err
        }
    }

    // Fetch posts from API
    const fetchPosts = useCallback(async () => {
        setLoading(prev => prev && true) // partial loading
        setError(null)
        try {
            const result = await api.posts.getAll()

            if (result.error) throw new Error(result.error)

            // Map API response to our Post interface
            const mappedPosts: Post[] = (result.data || []).map(row => ({
                id: row.id,
                sectionId: row.sectionId ?? '',
                parentId: row.parentId || undefined,
                isSubsection: row.isSubsection ?? false,
                title: row.title,
                subtitle: row.subtitle || '',
                content: row.content ?? '',
                image: row.image || '',
                pdfUrl: row.pdfUrl || '',
                enableAudio: row.enableAudio ?? false,
                email: row.email || '',
                instagram: row.instagram || '',
                layout: row.layout as Post['layout'],
                order: row.order,
                isPublished: row.isPublished ?? false,
                createdAt: row.createdAt ?? Date.now(),
                updatedAt: row.updatedAt ?? Date.now(),
                tags: row.tags || [],
                icon: row.icon || undefined,
                galleryImages: row.galleryImages || []
            }))

            setPosts(mappedPosts)
        } catch (err) {
            console.error('Error fetching posts:', err)
            setError(err instanceof Error ? err.message : 'Failed to load posts')
        } finally {
            setLoading(false)
        }
    }, [])

    // Initial fetch
    useEffect(() => {
        // Run both
        const load = async () => {
            setLoading(true)
            await Promise.all([fetchSections(), fetchPosts(), fetchPopup()])
            setLoading(false)
        }
        load()
    }, [fetchSections, fetchPosts, fetchPopup])

    const getPostsBySection = (sectionId: string) => {
        // Only return top-level posts (no parent) for section view
        return posts
            .filter(p => p.sectionId === sectionId && !p.parentId)
            .sort((a, b) => {
                // Sort by order ascending. Treat undefined/null as Infinity (bottom)
                const orderA = (a.order !== undefined && a.order !== null) ? a.order : Number.MAX_SAFE_INTEGER
                const orderB = (b.order !== undefined && b.order !== null) ? b.order : Number.MAX_SAFE_INTEGER

                return orderA - orderB
            })
    }

    const getPostById = (id: string) => {
        return posts.find(p => p.id === id)
    }

    const getChildPosts = (parentId: string) => {
        return posts
            .filter(p => p.parentId === parentId)
            .sort((a, b) => {
                const orderA = (a.order !== undefined && a.order !== null) ? a.order : Number.MAX_SAFE_INTEGER
                const orderB = (b.order !== undefined && b.order !== null) ? b.order : Number.MAX_SAFE_INTEGER

                return orderA - orderB
            })
    }

    const getSubsectionsBySection = (sectionId: string) => {
        return posts
            .filter(p => p.sectionId === sectionId && p.isSubsection)
            .sort((a, b) => {
                const orderA = (a.order !== undefined && a.order !== null) ? a.order : Number.MAX_SAFE_INTEGER
                const orderB = (b.order !== undefined && b.order !== null) ? b.order : Number.MAX_SAFE_INTEGER

                return orderA - orderB
            })
    }

    const addPost = async (newPostData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: number }) => {
        try {
            const result = await api.posts.create({
                sectionId: newPostData.sectionId,
                parentId: newPostData.parentId || undefined,
                isSubsection: newPostData.isSubsection ?? false,
                title: newPostData.title,
                subtitle: newPostData.subtitle || undefined,
                content: newPostData.content,
                image: newPostData.image || undefined,
                pdfUrl: newPostData.pdfUrl || undefined,
                enableAudio: newPostData.enableAudio ?? false,
                email: newPostData.email || undefined,
                instagram: newPostData.instagram || undefined,
                layout: newPostData.layout,
                order: newPostData.order,
                isPublished: newPostData.isPublished ?? false,
                tags: newPostData.tags || undefined,
                icon: newPostData.icon || undefined,
                galleryImages: newPostData.galleryImages || undefined
            })

            if (result.error) throw new Error(result.error)
            await fetchPosts() // Refresh the list
        } catch (err) {
            console.error('Error adding post:', err)
            throw err
        }
    }

    const updatePost = async (id: string, updates: Partial<Post>) => {
        try {
            const apiUpdates: Record<string, unknown> = {}
            if (updates.title !== undefined) apiUpdates.title = updates.title
            if (updates.subtitle !== undefined) apiUpdates.subtitle = updates.subtitle || undefined
            if (updates.content !== undefined) apiUpdates.content = updates.content
            if (updates.image !== undefined) apiUpdates.image = updates.image || undefined
            if (updates.pdfUrl !== undefined) apiUpdates.pdfUrl = updates.pdfUrl || undefined
            if (updates.enableAudio !== undefined) apiUpdates.enableAudio = updates.enableAudio
            if (updates.email !== undefined) apiUpdates.email = updates.email || undefined
            if (updates.instagram !== undefined) apiUpdates.instagram = updates.instagram || undefined
            if (updates.layout !== undefined) apiUpdates.layout = updates.layout
            if (updates.order !== undefined) apiUpdates.order = updates.order
            if (updates.isPublished !== undefined) apiUpdates.isPublished = updates.isPublished
            if (updates.parentId !== undefined) apiUpdates.parentId = updates.parentId || undefined
            if (updates.isSubsection !== undefined) apiUpdates.isSubsection = updates.isSubsection
            if (updates.tags !== undefined) apiUpdates.tags = updates.tags
            if (updates.icon !== undefined) apiUpdates.icon = updates.icon || undefined
            if (updates.galleryImages !== undefined) apiUpdates.galleryImages = updates.galleryImages || undefined

            const result = await api.posts.update(id, apiUpdates)

            if (result.error) throw new Error(result.error)
            await fetchPosts() // Refresh the list
        } catch (err) {
            console.error('Error updating post:', err)
            throw err
        }
    }

    const deletePost = async (id: string) => {
        try {
            console.log('Attempting to delete post:', id)
            const result = await api.posts.delete(id)

            if (result.error) {
                console.error('API delete error:', result.error)
                alert(`Delete failed: ${result.error}`)
                throw new Error(result.error)
            }

            await fetchPosts() // Refresh the list
        } catch (err) {
            console.error('Error deleting post:', err)
            throw err
        }
    }



    return (
        <ContentContext.Provider value={{
            sections,
            posts,
            loading,
            error,
            getPostsBySection,
            getPostById,
            getChildPosts,
            getSubsectionsBySection,
            addPost,
            updatePost,
            deletePost,
            refreshPosts: fetchPosts,
            createSection,
            updateSection,
            deleteSection,
            showDonation,
            setShowDonation,
            popup,
            fetchPopup,
            savePopup,
            deletePopup
        }}>
            {children}
        </ContentContext.Provider>
    )
}

export function useContent() {
    const context = useContext(ContentContext)
    if (context === undefined) {
        throw new Error('useContent must be used within a ContentProvider')
    }
    return context
}
