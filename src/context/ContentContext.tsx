import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Post, Section } from '../types/content'
import { supabase } from '../lib/supabase'


interface ContentContextType {
    sections: Section[]
    posts: Post[]
    loading: boolean
    error: string | null
    getPostsBySection: (sectionId: string) => Post[]
    getPostById: (id: string) => Post | undefined
    getChildPosts: (parentId: string) => Post[]
    getSubsectionsBySection: (sectionId: string) => Post[]
    addPost: (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: number }) => Promise<void>
    updatePost: (id: string, post: Partial<Post>) => Promise<void>
    deletePost: (id: string) => Promise<void>
    refreshPosts: () => Promise<void>
}

const ContentContext = createContext<ContentContextType | undefined>(undefined)

export function ContentProvider({ children }: { children: ReactNode }) {
    // Initial Sections Configuration (these are static for now)
    const initialSections: Section[] = [
        { id: 'about', label: 'ABOUT US', title: 'About SIO Delhi' },
        { id: 'initiatives', label: 'INITIATIVES', title: 'Our Initiatives' },
        { id: 'media', label: 'MEDIA', title: 'Press & Media' },
        { id: 'leadership', label: 'LEADERSHIP', title: 'Our Leadership' },
        { id: 'more', label: 'resources', title: 'More Resources' },
    ]

    const [sections] = useState<Section[]>(initialSections)
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch posts from Supabase
    const fetchPosts = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const { data, error: fetchError } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false })

            if (fetchError) throw fetchError

            // Map DB columns to our Post interface
            const mappedPosts: Post[] = (data || []).map(row => ({
                id: row.id,
                sectionId: row.section_id,
                parentId: row.parent_id || undefined,
                isSubsection: row.is_subsection ?? false,
                title: row.title,
                subtitle: row.subtitle || '',
                content: row.content,
                image: row.image || '',
                pdfUrl: row.pdf_url || '',
                enableAudio: row.enable_audio ?? false,
                email: row.email || '',
                instagram: row.instagram || '',
                layout: row.layout,
                order: row.display_order, // Map from DB
                isPublished: row.is_published ?? false,
                createdAt: new Date(row.created_at).getTime(),
                updatedAt: new Date(row.updated_at).getTime(),
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
        fetchPosts()
    }, [fetchPosts])

    const getPostsBySection = (sectionId: string) => {
        // Only return top-level posts (no parent) for section view
        return posts
            .filter(p => p.sectionId === sectionId && !p.parentId)
            .sort((a, b) => {
                // Sort by order ascending (0, 1, 2...)
                if (a.order !== undefined && b.order !== undefined) {
                    return (a.order || 0) - (b.order || 0)
                }
                // Fallback to createdAt descending (newest first)
                return b.createdAt - a.createdAt
            })
    }

    const getPostById = (id: string) => {
        return posts.find(p => p.id === id)
    }

    const getChildPosts = (parentId: string) => {
        return posts
            .filter(p => p.parentId === parentId)
            .sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) {
                    return (a.order || 0) - (b.order || 0)
                }
                return b.createdAt - a.createdAt
            })
    }

    const getSubsectionsBySection = (sectionId: string) => {
        return posts
            .filter(p => p.sectionId === sectionId && p.isSubsection)
            .sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) {
                    return (a.order || 0) - (b.order || 0)
                }
                return b.createdAt - a.createdAt
            })
    }

    const addPost = async (newPostData: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: number }) => {
        try {
            const { error: insertError } = await supabase
                .from('posts')
                .insert({
                    section_id: newPostData.sectionId,
                    parent_id: newPostData.parentId || null,
                    is_subsection: newPostData.isSubsection ?? false,
                    title: newPostData.title,
                    subtitle: newPostData.subtitle || null,
                    content: newPostData.content,
                    image: newPostData.image || null,
                    pdf_url: newPostData.pdfUrl || null,
                    enable_audio: newPostData.enableAudio ?? false,
                    email: newPostData.email || null,
                    instagram: newPostData.instagram || null,
                    layout: newPostData.layout,
                    display_order: newPostData.order || null,
                    is_published: newPostData.isPublished ?? false,
                    created_at: newPostData.createdAt ? new Date(newPostData.createdAt).toISOString() : undefined // Allow manual date
                })

            if (insertError) throw insertError
            await fetchPosts() // Refresh the list
        } catch (err) {
            console.error('Error adding post:', err)
            throw err
        }
    }

    const updatePost = async (id: string, updates: Partial<Post>) => {
        try {
            const dbUpdates: Record<string, unknown> = {}
            if (updates.title !== undefined) dbUpdates.title = updates.title
            if (updates.subtitle !== undefined) dbUpdates.subtitle = updates.subtitle || null
            if (updates.content !== undefined) dbUpdates.content = updates.content
            if (updates.image !== undefined) dbUpdates.image = updates.image || null
            if (updates.pdfUrl !== undefined) dbUpdates.pdf_url = updates.pdfUrl || null
            if (updates.enableAudio !== undefined) dbUpdates.enable_audio = updates.enableAudio
            if (updates.email !== undefined) dbUpdates.email = updates.email || null
            if (updates.instagram !== undefined) dbUpdates.instagram = updates.instagram || null
            if (updates.layout !== undefined) dbUpdates.layout = updates.layout
            if (updates.order !== undefined) dbUpdates.display_order = updates.order
            if (updates.isPublished !== undefined) dbUpdates.is_published = updates.isPublished
            if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId || null
            if (updates.isSubsection !== undefined) dbUpdates.is_subsection = updates.isSubsection
            if (updates.createdAt !== undefined) dbUpdates.created_at = new Date(updates.createdAt).toISOString() // Allow manual date update
            dbUpdates.updated_at = new Date().toISOString()

            const { error: updateError } = await supabase
                .from('posts')
                .update(dbUpdates)
                .eq('id', id)

            if (updateError) throw updateError
            await fetchPosts() // Refresh the list
        } catch (err) {
            console.error('Error updating post:', err)
            throw err
        }
    }

    const deletePost = async (id: string) => {
        try {
            console.log('Attempting to delete post:', id)
            const { error: deleteError, count } = await supabase
                .from('posts')
                .delete({ count: 'exact' })
                .eq('id', id)

            if (deleteError) {
                console.error('Supabase delete error:', deleteError)
                alert(`Delete failed: ${deleteError.message}`)
                throw deleteError
            }

            console.log('Deleted rows count:', count)
            if (count === 0) {
                alert('Operation successful but 0 posts were deleted. This usually means "Row Level Security" (RLS) is blocking the delete, or the post was already gone.')
            } else {
                // alert('Post deleted successfully.') 
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
            refreshPosts: fetchPosts
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
