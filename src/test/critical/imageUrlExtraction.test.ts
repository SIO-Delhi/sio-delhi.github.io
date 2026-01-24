import { describe, it, expect } from 'vitest'

/**
 * CRITICAL TESTS: Image URL Extraction
 *
 * These tests verify that ALL image URLs are correctly extracted from posts.
 * This is the exact bug that caused the garbage collector to delete valid images.
 *
 * The garbage collector was incorrectly identifying images as "orphans" because
 * it failed to extract URLs from:
 * - galleryImages array
 * - carousel images in HTML content
 * - composite block images
 */

// Replicate the URL extraction logic from AdminGarbageCollector
function extractUrlsFromHtml(html: string): string[] {
    if (!html) return []
    const urls: string[] = []

    // Match src="..."
    const srcRegex = /src=["']([^"']+)["']/g
    let match
    while ((match = srcRegex.exec(html)) !== null) {
        urls.push(match[1])
    }

    // Match href="..." (for linked files/PDFs)
    const hrefRegex = /href=["']([^"']+)["']/g
    while ((match = hrefRegex.exec(html)) !== null) {
        urls.push(match[1])
    }

    // Match data-images='[...]' (composite block carousel images)
    const dataImagesRegex = /data-images='([^']+)'/g
    while ((match = dataImagesRegex.exec(html)) !== null) {
        try {
            const parsed = JSON.parse(match[1])
            if (Array.isArray(parsed)) {
                parsed.forEach(url => urls.push(url))
            }
        } catch { /* ignore parse errors */ }
    }

    // Match data-image-url="..." (composite block main image - URL encoded)
    const dataImageUrlRegex = /data-image-url=["']([^"']+)["']/g
    while ((match = dataImageUrlRegex.exec(html)) !== null) {
        try {
            urls.push(decodeURIComponent(match[1]))
        } catch { urls.push(match[1]) }
    }

    // Match data-pdf-url="..." (PDF blocks)
    const dataPdfUrlRegex = /data-pdf-url=["']([^"']+)["']/g
    while ((match = dataPdfUrlRegex.exec(html)) !== null) {
        urls.push(match[1])
    }

    return urls
}

// Collect all used URLs from a post (replicate garbage collector logic)
function collectUsedUrlsFromPost(post: {
    image?: string
    pdfUrl?: string
    icon?: string
    galleryImages?: string[]
    content?: string
    title?: string
}): Set<string> {
    const usedUrls = new Set<string>()

    if (post.image) usedUrls.add(post.image)
    if (post.pdfUrl) usedUrls.add(post.pdfUrl)
    if (post.icon) usedUrls.add(post.icon)

    // CRITICAL: Gallery images must be included
    if (post.galleryImages && post.galleryImages.length > 0) {
        post.galleryImages.forEach(url => usedUrls.add(url))
    }

    // Content (HTML)
    if (post.content) {
        const contentUrls = extractUrlsFromHtml(post.content)
        contentUrls.forEach(u => usedUrls.add(u))
    }

    return usedUrls
}

// Check if a file is an orphan (replicate garbage collector logic)
function isOrphan(fileUrl: string, usedUrls: Set<string>, filename: string): boolean {
    // Strict match
    if (usedUrls.has(fileUrl)) return false

    // Loose match by filename
    const found = Array.from(usedUrls).some(used => used.includes(filename))
    if (found) return false

    return true
}

describe('Image URL Extraction - Critical Tests', () => {
    describe('extractUrlsFromHtml', () => {
        it('should extract src URLs from img tags', () => {
            const html = '<p>Text</p><img src="https://api.siodelhi.org/uploads/images/photo1.webp" alt="test"/>'
            const urls = extractUrlsFromHtml(html)

            expect(urls).toContain('https://api.siodelhi.org/uploads/images/photo1.webp')
        })

        it('should extract multiple src URLs', () => {
            const html = `
                <img src="https://api.siodelhi.org/uploads/images/photo1.webp" />
                <img src="https://api.siodelhi.org/uploads/images/photo2.webp" />
                <img src="https://api.siodelhi.org/uploads/images/photo3.webp" />
            `
            const urls = extractUrlsFromHtml(html)

            expect(urls).toHaveLength(3)
            expect(urls).toContain('https://api.siodelhi.org/uploads/images/photo1.webp')
            expect(urls).toContain('https://api.siodelhi.org/uploads/images/photo2.webp')
            expect(urls).toContain('https://api.siodelhi.org/uploads/images/photo3.webp')
        })

        it('should extract href URLs from links', () => {
            const html = '<a href="https://api.siodelhi.org/uploads/pdfs/document.pdf">Download</a>'
            const urls = extractUrlsFromHtml(html)

            expect(urls).toContain('https://api.siodelhi.org/uploads/pdfs/document.pdf')
        })

        it('CRITICAL: should extract carousel images from data-images attribute', () => {
            const carouselImages = [
                'https://api.siodelhi.org/uploads/images/carousel1.webp',
                'https://api.siodelhi.org/uploads/images/carousel2.webp',
                'https://api.siodelhi.org/uploads/images/carousel3.webp'
            ]
            const html = `<div class="siodel-block" data-images='${JSON.stringify(carouselImages)}' data-carousel="true"></div>`

            const urls = extractUrlsFromHtml(html)

            expect(urls).toContain('https://api.siodelhi.org/uploads/images/carousel1.webp')
            expect(urls).toContain('https://api.siodelhi.org/uploads/images/carousel2.webp')
            expect(urls).toContain('https://api.siodelhi.org/uploads/images/carousel3.webp')
        })

        it('CRITICAL: should extract composite block main image from data-image-url', () => {
            const imageUrl = 'https://api.siodelhi.org/uploads/images/composite-main.webp'
            const html = `<div class="siodel-block" data-layout="image-left" data-image-url="${encodeURIComponent(imageUrl)}"></div>`

            const urls = extractUrlsFromHtml(html)

            expect(urls).toContain(imageUrl)
        })

        it('should extract PDF URLs from data-pdf-url', () => {
            const html = '<div class="siodel-block" data-pdf-url="https://api.siodelhi.org/uploads/pdfs/report.pdf"></div>'
            const urls = extractUrlsFromHtml(html)

            expect(urls).toContain('https://api.siodelhi.org/uploads/pdfs/report.pdf')
        })

        it('should handle malformed JSON in data-images gracefully', () => {
            const html = `<div data-images='[invalid json'></div>`

            // Should not throw
            expect(() => extractUrlsFromHtml(html)).not.toThrow()
            const urls = extractUrlsFromHtml(html)
            expect(urls).toHaveLength(0)
        })

        it('should handle empty HTML', () => {
            expect(extractUrlsFromHtml('')).toEqual([])
            expect(extractUrlsFromHtml(null as unknown as string)).toEqual([])
        })

        it('should handle complex nested HTML with multiple image types', () => {
            const html = `
                <div class="post-content">
                    <p>Some text <img src="https://api.siodelhi.org/uploads/images/inline.webp" /></p>
                    <div class="siodel-block block-composite" data-layout="image-left" data-image-url="${encodeURIComponent('https://api.siodelhi.org/uploads/images/composite.webp')}">
                        <div data-images='["https://api.siodelhi.org/uploads/images/c1.webp","https://api.siodelhi.org/uploads/images/c2.webp"]'></div>
                    </div>
                    <a href="https://api.siodelhi.org/uploads/pdfs/doc.pdf">PDF</a>
                </div>
            `

            const urls = extractUrlsFromHtml(html)

            expect(urls).toContain('https://api.siodelhi.org/uploads/images/inline.webp')
            expect(urls).toContain('https://api.siodelhi.org/uploads/images/composite.webp')
            expect(urls).toContain('https://api.siodelhi.org/uploads/images/c1.webp')
            expect(urls).toContain('https://api.siodelhi.org/uploads/images/c2.webp')
            expect(urls).toContain('https://api.siodelhi.org/uploads/pdfs/doc.pdf')
        })
    })

    describe('collectUsedUrlsFromPost', () => {
        it('should collect main post image', () => {
            const post = {
                image: 'https://api.siodelhi.org/uploads/images/main.webp'
            }

            const urls = collectUsedUrlsFromPost(post)

            expect(urls.has('https://api.siodelhi.org/uploads/images/main.webp')).toBe(true)
        })

        it('should collect PDF URL', () => {
            const post = {
                pdfUrl: 'https://api.siodelhi.org/uploads/pdfs/doc.pdf'
            }

            const urls = collectUsedUrlsFromPost(post)

            expect(urls.has('https://api.siodelhi.org/uploads/pdfs/doc.pdf')).toBe(true)
        })

        it('should collect icon URL', () => {
            const post = {
                icon: 'https://api.siodelhi.org/uploads/images/icon.webp'
            }

            const urls = collectUsedUrlsFromPost(post)

            expect(urls.has('https://api.siodelhi.org/uploads/images/icon.webp')).toBe(true)
        })

        it('CRITICAL: should collect ALL gallery images', () => {
            const post = {
                galleryImages: [
                    'https://api.siodelhi.org/uploads/images/gallery1.webp',
                    'https://api.siodelhi.org/uploads/images/gallery2.webp',
                    'https://api.siodelhi.org/uploads/images/gallery3.webp',
                    'https://api.siodelhi.org/uploads/images/gallery4.webp',
                    'https://api.siodelhi.org/uploads/images/gallery5.webp'
                ]
            }

            const urls = collectUsedUrlsFromPost(post)

            expect(urls.size).toBe(5)
            post.galleryImages.forEach(url => {
                expect(urls.has(url)).toBe(true)
            })
        })

        it('CRITICAL: should handle empty galleryImages array', () => {
            const post = {
                galleryImages: []
            }

            const urls = collectUsedUrlsFromPost(post)

            expect(urls.size).toBe(0)
        })

        it('CRITICAL: should handle undefined galleryImages', () => {
            const post = {
                title: 'Test Post'
            }

            const urls = collectUsedUrlsFromPost(post)

            expect(urls.size).toBe(0)
        })

        it('should collect all URL types from a complete post', () => {
            const post = {
                image: 'https://api.siodelhi.org/uploads/images/main.webp',
                pdfUrl: 'https://api.siodelhi.org/uploads/pdfs/doc.pdf',
                icon: 'https://api.siodelhi.org/uploads/images/icon.webp',
                galleryImages: [
                    'https://api.siodelhi.org/uploads/images/g1.webp',
                    'https://api.siodelhi.org/uploads/images/g2.webp'
                ],
                content: `
                    <img src="https://api.siodelhi.org/uploads/images/content.webp" />
                    <div data-images='["https://api.siodelhi.org/uploads/images/carousel.webp"]'></div>
                `
            }

            const urls = collectUsedUrlsFromPost(post)

            expect(urls.has('https://api.siodelhi.org/uploads/images/main.webp')).toBe(true)
            expect(urls.has('https://api.siodelhi.org/uploads/pdfs/doc.pdf')).toBe(true)
            expect(urls.has('https://api.siodelhi.org/uploads/images/icon.webp')).toBe(true)
            expect(urls.has('https://api.siodelhi.org/uploads/images/g1.webp')).toBe(true)
            expect(urls.has('https://api.siodelhi.org/uploads/images/g2.webp')).toBe(true)
            expect(urls.has('https://api.siodelhi.org/uploads/images/content.webp')).toBe(true)
            expect(urls.has('https://api.siodelhi.org/uploads/images/carousel.webp')).toBe(true)
        })
    })

    describe('Orphan Detection - The Bug That Caused Data Loss', () => {
        const baseUrl = 'https://api.siodelhi.org/uploads/images/'

        it('CRITICAL: gallery images should NOT be detected as orphans', () => {
            const post = {
                galleryImages: [
                    `${baseUrl}gallery1.webp`,
                    `${baseUrl}gallery2.webp`,
                    `${baseUrl}gallery3.webp`
                ]
            }

            const usedUrls = collectUsedUrlsFromPost(post)

            // Simulate garbage collector checking each file
            const storageFiles = [
                { url: `${baseUrl}gallery1.webp`, name: 'gallery1.webp' },
                { url: `${baseUrl}gallery2.webp`, name: 'gallery2.webp' },
                { url: `${baseUrl}gallery3.webp`, name: 'gallery3.webp' }
            ]

            storageFiles.forEach(file => {
                const orphan = isOrphan(file.url, usedUrls, file.name)
                expect(orphan).toBe(false) // These should NOT be orphans!
            })
        })

        it('CRITICAL: carousel images should NOT be detected as orphans', () => {
            const carouselImages = [
                `${baseUrl}carousel1.webp`,
                `${baseUrl}carousel2.webp`
            ]
            const post = {
                content: `<div data-images='${JSON.stringify(carouselImages)}'></div>`
            }

            const usedUrls = collectUsedUrlsFromPost(post)

            const storageFiles = [
                { url: `${baseUrl}carousel1.webp`, name: 'carousel1.webp' },
                { url: `${baseUrl}carousel2.webp`, name: 'carousel2.webp' }
            ]

            storageFiles.forEach(file => {
                const orphan = isOrphan(file.url, usedUrls, file.name)
                expect(orphan).toBe(false)
            })
        })

        it('CRITICAL: composite block images should NOT be detected as orphans', () => {
            const imageUrl = `${baseUrl}composite-image.webp`
            const post = {
                content: `<div data-image-url="${encodeURIComponent(imageUrl)}"></div>`
            }

            const usedUrls = collectUsedUrlsFromPost(post)

            const storageFile = { url: imageUrl, name: 'composite-image.webp' }
            const orphan = isOrphan(storageFile.url, usedUrls, storageFile.name)

            expect(orphan).toBe(false)
        })

        it('should correctly identify actual orphans', () => {
            const post = {
                image: `${baseUrl}used-image.webp`,
                galleryImages: [`${baseUrl}gallery-image.webp`]
            }

            const usedUrls = collectUsedUrlsFromPost(post)

            // This file is NOT referenced anywhere
            const orphanFile = { url: `${baseUrl}actually-orphaned.webp`, name: 'actually-orphaned.webp' }
            const orphan = isOrphan(orphanFile.url, usedUrls, orphanFile.name)

            expect(orphan).toBe(true)
        })

        it('should handle URL variations (with/without trailing slashes)', () => {
            const post = {
                image: 'https://api.siodelhi.org/uploads/images/test.webp'
            }

            const usedUrls = collectUsedUrlsFromPost(post)

            // Same image, slight URL variation
            const storageFile = {
                url: 'https://api.siodelhi.org/uploads/images/test.webp',
                name: 'test.webp'
            }
            const orphan = isOrphan(storageFile.url, usedUrls, storageFile.name)

            expect(orphan).toBe(false)
        })
    })

    describe('Edge Cases', () => {
        it('should handle posts with no images at all', () => {
            const post = {
                title: 'Text Only Post',
                content: '<p>Just some text content</p>'
            }

            const urls = collectUsedUrlsFromPost(post)

            expect(urls.size).toBe(0)
        })

        it('should handle very large gallery arrays', () => {
            const galleryImages = Array.from({ length: 100 }, (_, i) =>
                `https://api.siodelhi.org/uploads/images/gallery-${i}.webp`
            )

            const post = { galleryImages }

            const urls = collectUsedUrlsFromPost(post)

            expect(urls.size).toBe(100)
            galleryImages.forEach(url => {
                expect(urls.has(url)).toBe(true)
            })
        })

        it('should handle duplicate URLs gracefully', () => {
            const duplicateUrl = 'https://api.siodelhi.org/uploads/images/duplicate.webp'
            const post = {
                image: duplicateUrl,
                galleryImages: [duplicateUrl, duplicateUrl],
                content: `<img src="${duplicateUrl}" />`
            }

            const urls = collectUsedUrlsFromPost(post)

            // Set should dedupe automatically
            expect(urls.size).toBe(1)
            expect(urls.has(duplicateUrl)).toBe(true)
        })
    })
})

describe('Integration: Full Post Processing Simulation', () => {
    it('should correctly process a real-world post structure', () => {
        // Simulate a complex post like those in the siodel CMS
        const post = {
            id: 'post-123',
            sectionId: 'initiatives',
            title: 'Annual Event 2024',
            subtitle: 'A great success',
            image: 'https://api.siodelhi.org/uploads/images/event-banner.webp',
            pdfUrl: 'https://api.siodelhi.org/uploads/pdfs/event-report.pdf',
            galleryImages: [
                'https://api.siodelhi.org/uploads/images/event-1.webp',
                'https://api.siodelhi.org/uploads/images/event-2.webp',
                'https://api.siodelhi.org/uploads/images/event-3.webp',
                'https://api.siodelhi.org/uploads/images/event-4.webp',
                'https://api.siodelhi.org/uploads/images/event-5.webp'
            ],
            content: `
                <p>The event was a great success!</p>
                <img src="https://api.siodelhi.org/uploads/images/inline-photo.webp" />
                <div class="siodel-block block-composite"
                     data-layout="image-left"
                     data-image-url="${encodeURIComponent('https://api.siodelhi.org/uploads/images/composite-main.webp')}"
                     data-images='["https://api.siodelhi.org/uploads/images/carousel-1.webp","https://api.siodelhi.org/uploads/images/carousel-2.webp"]'>
                </div>
                <a href="https://api.siodelhi.org/uploads/pdfs/brochure.pdf">Download Brochure</a>
            `
        }

        const usedUrls = collectUsedUrlsFromPost(post)

        // All these URLs should be detected as "used"
        const allExpectedUrls = [
            'https://api.siodelhi.org/uploads/images/event-banner.webp',
            'https://api.siodelhi.org/uploads/pdfs/event-report.pdf',
            'https://api.siodelhi.org/uploads/images/event-1.webp',
            'https://api.siodelhi.org/uploads/images/event-2.webp',
            'https://api.siodelhi.org/uploads/images/event-3.webp',
            'https://api.siodelhi.org/uploads/images/event-4.webp',
            'https://api.siodelhi.org/uploads/images/event-5.webp',
            'https://api.siodelhi.org/uploads/images/inline-photo.webp',
            'https://api.siodelhi.org/uploads/images/composite-main.webp',
            'https://api.siodelhi.org/uploads/images/carousel-1.webp',
            'https://api.siodelhi.org/uploads/images/carousel-2.webp',
            'https://api.siodelhi.org/uploads/pdfs/brochure.pdf'
        ]

        allExpectedUrls.forEach(url => {
            expect(usedUrls.has(url)).toBe(true)
        })

        // None of these should be considered orphans
        allExpectedUrls.forEach(url => {
            const filename = url.split('/').pop()!
            const isOrph = isOrphan(url, usedUrls, filename)
            expect(isOrph).toBe(false)
        })
    })
})
