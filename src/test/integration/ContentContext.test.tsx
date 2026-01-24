import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { type ReactNode } from 'react'
import { ContentProvider, useContent } from '../../context/ContentContext'
import { resetMockData } from '../mocks/handlers'

// Wrapper component for the hook tests
function wrapper({ children }: { children: ReactNode }) {
    return <ContentProvider>{children}</ContentProvider>
}

describe('ContentContext', () => {
    beforeEach(() => {
        resetMockData()
    })

    describe('useContent hook', () => {
        it('should throw error when used outside provider', () => {
            // Suppress console.error for this test
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

            expect(() => {
                renderHook(() => useContent())
            }).toThrow('useContent must be used within a ContentProvider')

            consoleSpy.mockRestore()
        })

        it('should provide initial loading state', () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            expect(result.current.loading).toBe(true)
        })

        it('should load sections on mount', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(result.current.sections.length).toBeGreaterThan(0)
        })

        it('should load posts on mount', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(result.current.posts.length).toBeGreaterThan(0)
        })
    })

    describe('getPostsBySection', () => {
        it('should filter posts by sectionId', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            const aboutPosts = result.current.getPostsBySection('about')

            expect(aboutPosts.every(p => p.sectionId === 'about')).toBe(true)
        })

        it('should exclude posts with parentId (child posts)', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            const initiativePosts = result.current.getPostsBySection('initiatives')

            // Child posts should be excluded
            expect(initiativePosts.every(p => !p.parentId)).toBe(true)
        })

        it('should sort posts by order', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            const posts = result.current.getPostsBySection('about')

            for (let i = 1; i < posts.length; i++) {
                const prevOrder = posts[i - 1].order ?? Number.MAX_SAFE_INTEGER
                const currOrder = posts[i].order ?? Number.MAX_SAFE_INTEGER
                expect(prevOrder).toBeLessThanOrEqual(currOrder)
            }
        })
    })

    describe('getPostById', () => {
        it('should return post by ID', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            const post = result.current.getPostById('post-1')

            expect(post).toBeDefined()
            expect(post?.id).toBe('post-1')
        })

        it('should return undefined for non-existent ID', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            const post = result.current.getPostById('non-existent-id')

            expect(post).toBeUndefined()
        })
    })

    describe('getChildPosts', () => {
        it('should return child posts for a parent', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            const children = result.current.getChildPosts('post-3')

            expect(children.length).toBeGreaterThan(0)
            expect(children.every(p => p.parentId === 'post-3')).toBe(true)
        })

        it('should return empty array for posts with no children', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            const children = result.current.getChildPosts('post-1')

            expect(children).toEqual([])
        })
    })

    describe('addPost', () => {
        it('should add a new post', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            const initialCount = result.current.posts.length

            await act(async () => {
                await result.current.addPost({
                    sectionId: 'about',
                    title: 'New Post',
                    content: '<p>Content</p>',
                    isPublished: true,
                    layout: 'default'
                })
            })

            await waitFor(() => {
                expect(result.current.posts.length).toBe(initialCount + 1)
            })
        })

        it('should add post with galleryImages', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            const galleryImages = [
                'https://api.siodelhi.org/uploads/images/new1.webp',
                'https://api.siodelhi.org/uploads/images/new2.webp'
            ]

            await act(async () => {
                await result.current.addPost({
                    sectionId: 'about',
                    title: 'Gallery Post',
                    content: '',
                    isPublished: true,
                    layout: 'default',
                    galleryImages
                })
            })

            await waitFor(() => {
                const newPost = result.current.posts.find(p => p.title === 'Gallery Post')
                expect(newPost).toBeDefined()
                expect(newPost?.galleryImages).toHaveLength(2)
            })
        })
    })

    describe('updatePost', () => {
        it('should update an existing post', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            await act(async () => {
                await result.current.updatePost('post-1', { title: 'Updated Title' })
            })

            await waitFor(() => {
                const post = result.current.getPostById('post-1')
                expect(post?.title).toBe('Updated Title')
            })
        })

        it('should update galleryImages', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            const newGalleryImages = [
                'https://api.siodelhi.org/uploads/images/updated1.webp',
                'https://api.siodelhi.org/uploads/images/updated2.webp',
                'https://api.siodelhi.org/uploads/images/updated3.webp'
            ]

            await act(async () => {
                await result.current.updatePost('post-1', { galleryImages: newGalleryImages })
            })

            await waitFor(() => {
                const post = result.current.getPostById('post-1')
                expect(post?.galleryImages).toHaveLength(3)
            })
        })
    })

    describe('deletePost', () => {
        it('should delete a post', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            const initialCount = result.current.posts.length

            await act(async () => {
                await result.current.deletePost('post-1')
            })

            await waitFor(() => {
                expect(result.current.posts.length).toBe(initialCount - 1)
                expect(result.current.getPostById('post-1')).toBeUndefined()
            })
        })
    })

    describe('Section Operations', () => {
        it('should create a new section', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            const initialCount = result.current.sections.length

            await act(async () => {
                await result.current.createSection({
                    id: 'new-section',
                    title: 'New Section',
                    label: 'NEW'
                })
            })

            await waitFor(() => {
                expect(result.current.sections.length).toBe(initialCount + 1)
            })
        })

        it('should update a section', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            await act(async () => {
                await result.current.updateSection('about', { title: 'Updated About' })
            })

            await waitFor(() => {
                const section = result.current.sections.find(s => s.id === 'about')
                expect(section?.title).toBe('Updated About')
            })
        })

        it('should delete a section', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            const initialCount = result.current.sections.length

            await act(async () => {
                await result.current.deleteSection('about')
            })

            await waitFor(() => {
                expect(result.current.sections.length).toBe(initialCount - 1)
            })
        })
    })

    describe('Popup Operations', () => {
        it('should load popup on mount', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(result.current.popup).toBeDefined()
            expect(result.current.popup?.isActive).toBe(true)
        })

        it('should save popup', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            await act(async () => {
                await result.current.savePopup(
                    'https://api.siodelhi.org/uploads/images/new-popup.webp',
                    true
                )
            })

            await waitFor(() => {
                expect(result.current.popup?.image).toContain('popup')
            })
        })

        it('should delete popup', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            await act(async () => {
                await result.current.deletePopup()
            })

            await waitFor(() => {
                expect(result.current.popup).toBeNull()
            })
        })
    })

    describe('Donation Modal State', () => {
        it('should toggle donation modal visibility', async () => {
            const { result } = renderHook(() => useContent(), { wrapper })

            await waitFor(() => {
                expect(result.current.loading).toBe(false)
            })

            expect(result.current.showDonation).toBe(false)

            act(() => {
                result.current.setShowDonation(true)
            })

            expect(result.current.showDonation).toBe(true)

            act(() => {
                result.current.setShowDonation(false)
            })

            expect(result.current.showDonation).toBe(false)
        })
    })
})

describe('Data Integrity Tests', () => {
    beforeEach(() => {
        resetMockData()
    })

    it('should preserve galleryImages array structure', async () => {
        const { result } = renderHook(() => useContent(), { wrapper })

        await waitFor(() => {
            expect(result.current.loading).toBe(false)
        })

        const post = result.current.getPostById('post-1')

        expect(Array.isArray(post?.galleryImages)).toBe(true)
        expect(post?.galleryImages?.length).toBeGreaterThan(0)
    })

    it('should handle posts with empty galleryImages', async () => {
        const { result } = renderHook(() => useContent(), { wrapper })

        await waitFor(() => {
            expect(result.current.loading).toBe(false)
        })

        const post = result.current.getPostById('post-2')

        expect(Array.isArray(post?.galleryImages)).toBe(true)
        expect(post?.galleryImages?.length).toBe(0)
    })

    it('should correctly map API response to Post interface', async () => {
        const { result } = renderHook(() => useContent(), { wrapper })

        await waitFor(() => {
            expect(result.current.loading).toBe(false)
        })

        const post = result.current.getPostById('post-1')

        // Verify all expected fields are present
        expect(post).toHaveProperty('id')
        expect(post).toHaveProperty('sectionId')
        expect(post).toHaveProperty('title')
        expect(post).toHaveProperty('content')
        expect(post).toHaveProperty('isPublished')
        expect(post).toHaveProperty('galleryImages')
    })
})
