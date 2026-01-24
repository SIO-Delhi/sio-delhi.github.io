import { describe, it, expect, beforeEach } from 'vitest'
import { api } from '../../lib/api'
import { resetMockData, mockSections, mockPosts, mockPopup } from '../mocks/handlers'

describe('API Client', () => {
    beforeEach(() => {
        resetMockData()
    })

    // ====================
    // SECTIONS API TESTS
    // ====================
    describe('Sections API', () => {
        describe('getAll', () => {
            it('should fetch all sections successfully', async () => {
                const result = await api.sections.getAll()

                expect(result.error).toBeUndefined()
                expect(result.data).toHaveLength(mockSections.length)
                expect(result.data?.[0].id).toBe('about')
            })
        })

        describe('get', () => {
            it('should fetch a single section by ID', async () => {
                const result = await api.sections.get('about')

                expect(result.error).toBeUndefined()
                expect(result.data?.id).toBe('about')
                expect(result.data?.title).toBe('About Us')
            })

            it('should return error for non-existent section', async () => {
                const result = await api.sections.get('non-existent')

                expect(result.error).toBe('Section not found')
            })
        })

        describe('create', () => {
            it('should create a new section', async () => {
                const newSection = {
                    id: 'test-section',
                    title: 'Test Section',
                    label: 'TEST',
                    displayOrder: 10
                }

                const result = await api.sections.create(newSection)

                expect(result.error).toBeUndefined()
                expect(result.data?.id).toBe('test-section')
                expect(result.data?.title).toBe('Test Section')
            })

            it('should require title and label', async () => {
                const result = await api.sections.create({ id: 'no-title' })

                expect(result.error).toBe('title and label are required')
            })
        })

        describe('update', () => {
            it('should update an existing section', async () => {
                const result = await api.sections.update('about', { title: 'Updated Title' })

                expect(result.error).toBeUndefined()
                expect(result.data?.title).toBe('Updated Title')
            })

            it('should return error for non-existent section', async () => {
                const result = await api.sections.update('non-existent', { title: 'Test' })

                expect(result.error).toBe('Section not found')
            })
        })

        describe('delete', () => {
            it('should delete an existing section', async () => {
                const result = await api.sections.delete('about')

                expect(result.error).toBeUndefined()

                // Verify deletion
                const getResult = await api.sections.get('about')
                expect(getResult.error).toBe('Section not found')
            })

            it('should return error for non-existent section', async () => {
                const result = await api.sections.delete('non-existent')

                expect(result.error).toBe('Section not found')
            })
        })

        describe('reorder', () => {
            it('should reorder sections', async () => {
                const result = await api.sections.reorder([
                    { id: 'about', displayOrder: 3 },
                    { id: 'initiatives', displayOrder: 1 },
                    { id: 'media', displayOrder: 2 }
                ])

                expect(result.error).toBeUndefined()
            })
        })
    })

    // ====================
    // POSTS API TESTS
    // ====================
    describe('Posts API', () => {
        describe('getAll', () => {
            it('should fetch all posts', async () => {
                const result = await api.posts.getAll()

                expect(result.error).toBeUndefined()
                expect(result.data).toHaveLength(mockPosts.length)
            })

            it('should filter by sectionId', async () => {
                const result = await api.posts.getAll({ sectionId: 'about' })

                expect(result.error).toBeUndefined()
                expect(result.data?.every(p => p.sectionId === 'about')).toBe(true)
            })

            it('should filter by parentId', async () => {
                const result = await api.posts.getAll({ parentId: 'post-3' })

                expect(result.error).toBeUndefined()
                expect(result.data?.length).toBeGreaterThan(0)
                expect(result.data?.every(p => p.parentId === 'post-3')).toBe(true)
            })

            it('should filter by publishedOnly', async () => {
                const result = await api.posts.getAll({ publishedOnly: true })

                expect(result.error).toBeUndefined()
                expect(result.data?.every(p => p.isPublished)).toBe(true)
            })
        })

        describe('get', () => {
            it('should fetch a single post by ID', async () => {
                const result = await api.posts.get('post-1')

                expect(result.error).toBeUndefined()
                expect(result.data?.id).toBe('post-1')
                expect(result.data?.title).toBe('Test Post 1')
            })

            it('should include galleryImages in response', async () => {
                const result = await api.posts.get('post-1')

                expect(result.error).toBeUndefined()
                expect(result.data?.galleryImages).toHaveLength(2)
                expect(result.data?.galleryImages?.[0]).toContain('gallery1.webp')
            })

            it('should return error for non-existent post', async () => {
                const result = await api.posts.get('non-existent')

                expect(result.error).toBe('Post not found')
            })
        })

        describe('create', () => {
            it('should create a new post', async () => {
                const newPost = {
                    title: 'New Test Post',
                    sectionId: 'about',
                    content: '<p>Content</p>',
                    isPublished: true
                }

                const result = await api.posts.create(newPost)

                expect(result.error).toBeUndefined()
                expect(result.data?.title).toBe('New Test Post')
                expect(result.data?.sectionId).toBe('about')
            })

            it('should create post with galleryImages', async () => {
                const newPost = {
                    title: 'Gallery Post',
                    sectionId: 'about',
                    galleryImages: [
                        'https://api.siodelhi.org/uploads/images/img1.webp',
                        'https://api.siodelhi.org/uploads/images/img2.webp'
                    ]
                }

                const result = await api.posts.create(newPost)

                expect(result.error).toBeUndefined()
                expect(result.data?.galleryImages).toHaveLength(2)
            })

            it('should require title', async () => {
                const result = await api.posts.create({ sectionId: 'about' })

                expect(result.error).toBe('title is required')
            })
        })

        describe('update', () => {
            it('should update an existing post', async () => {
                const result = await api.posts.update('post-1', { title: 'Updated Title' })

                expect(result.error).toBeUndefined()
                expect(result.data?.title).toBe('Updated Title')
            })

            it('should update galleryImages', async () => {
                const newGalleryImages = [
                    'https://api.siodelhi.org/uploads/images/new1.webp',
                    'https://api.siodelhi.org/uploads/images/new2.webp',
                    'https://api.siodelhi.org/uploads/images/new3.webp'
                ]

                const result = await api.posts.update('post-1', { galleryImages: newGalleryImages })

                expect(result.error).toBeUndefined()
                expect(result.data?.galleryImages).toHaveLength(3)
            })

            it('should return error for non-existent post', async () => {
                const result = await api.posts.update('non-existent', { title: 'Test' })

                expect(result.error).toBe('Post not found')
            })
        })

        describe('delete', () => {
            it('should delete an existing post', async () => {
                const result = await api.posts.delete('post-1')

                expect(result.error).toBeUndefined()

                // Verify deletion
                const getResult = await api.posts.get('post-1')
                expect(getResult.error).toBe('Post not found')
            })

            it('should return error for non-existent post', async () => {
                const result = await api.posts.delete('non-existent')

                expect(result.error).toBe('Post not found')
            })
        })

        describe('reorder', () => {
            it('should reorder posts', async () => {
                const result = await api.posts.reorder([
                    { id: 'post-1', order: 2 },
                    { id: 'post-2', order: 1 }
                ])

                expect(result.error).toBeUndefined()
            })
        })
    })

    // ====================
    // POPUPS API TESTS
    // ====================
    describe('Popups API', () => {
        describe('getActive', () => {
            it('should fetch active popup', async () => {
                const result = await api.popups.getActive()

                expect(result.error).toBeUndefined()
                expect(result.data?.id).toBe(mockPopup.id)
                expect(result.data?.isActive).toBe(true)
            })
        })

        describe('getAll', () => {
            it('should fetch all popups', async () => {
                const result = await api.popups.getAll()

                expect(result.error).toBeUndefined()
                expect(result.data).toHaveLength(1)
            })
        })

        describe('create', () => {
            it('should create a new popup', async () => {
                // First clear existing
                await api.popups.clear()

                const result = await api.popups.create({
                    image: 'https://api.siodelhi.org/uploads/images/new-popup.webp',
                    isActive: true
                })

                expect(result.error).toBeUndefined()
                expect(result.data?.image).toContain('new-popup.webp')
            })
        })

        describe('update', () => {
            it('should update an existing popup', async () => {
                const result = await api.popups.update(mockPopup.id, { isActive: false })

                expect(result.error).toBeUndefined()
                expect(result.data?.isActive).toBe(false)
            })
        })

        describe('delete', () => {
            it('should delete a popup', async () => {
                const result = await api.popups.delete(mockPopup.id)

                expect(result.error).toBeUndefined()

                // Verify deletion
                const getResult = await api.popups.getActive()
                expect(getResult.data).toBeNull()
            })
        })

        describe('clear', () => {
            it('should clear all popups', async () => {
                const result = await api.popups.clear()

                expect(result.error).toBeUndefined()

                // Verify cleared
                const getResult = await api.popups.getAll()
                expect(getResult.data).toHaveLength(0)
            })
        })
    })

    // ====================
    // UPLOAD API TESTS
    // ====================
    describe('Upload API', () => {
        describe('image', () => {
            it('should upload an image and return URL', async () => {
                const file = new Blob(['test'], { type: 'image/webp' })

                const result = await api.upload.image(file)

                expect(result.error).toBeUndefined()
                expect(result.data?.url).toContain('/uploads/images/')
                expect(result.data?.filename).toContain('.webp')
            })
        })

        describe('pdf', () => {
            it('should upload a PDF and return URL', async () => {
                const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })

                const result = await api.upload.pdf(file)

                expect(result.error).toBeUndefined()
                expect(result.data?.url).toContain('/uploads/pdfs/')
                expect(result.data?.filename).toContain('.pdf')
            })
        })

        describe('audio', () => {
            it('should upload audio and return URL', async () => {
                const file = new Blob(['test'], { type: 'audio/mpeg' })

                const result = await api.upload.audio(file)

                expect(result.error).toBeUndefined()
                expect(result.data?.url).toContain('/uploads/audio/')
                expect(result.data?.filename).toContain('.mp3')
            })
        })

        describe('deleteFile', () => {
            it('should delete an image file', async () => {
                const result = await api.upload.deleteFile('images', 'test.webp')

                expect(result.error).toBeUndefined()
            })

            it('should delete a PDF file', async () => {
                const result = await api.upload.deleteFile('pdfs', 'test.pdf')

                expect(result.error).toBeUndefined()
            })

            it('should delete an audio file', async () => {
                const result = await api.upload.deleteFile('audio', 'test.mp3')

                expect(result.error).toBeUndefined()
            })

            it('should reject invalid file type', async () => {
                const result = await api.upload.deleteFile('invalid' as 'images', 'test.txt')

                expect(result.error).toBe('Invalid file type')
            })
        })
    })
})
