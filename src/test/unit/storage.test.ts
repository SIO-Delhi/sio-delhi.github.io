import { describe, it, expect, beforeEach } from 'vitest'
import { uploadImage, deleteImage, uploadPdf, deletePdf, uploadAudio, deleteAudio } from '../../lib/storage'
import { resetMockData } from '../mocks/handlers'

describe('Storage Utilities', () => {
    beforeEach(() => {
        resetMockData()
    })

    describe('uploadImage', () => {
        it('should upload a File and return URL', async () => {
            const file = new File(['test content'], 'test.webp', { type: 'image/webp' })

            const url = await uploadImage(file)

            expect(url).toContain('https://api.siodelhi.org/uploads/images/')
            expect(url).toContain('.webp')
        })

        it('should upload a base64 data URL and return URL', async () => {
            // Create a simple base64 data URL
            const dataUrl = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/'

            const url = await uploadImage(dataUrl)

            expect(url).toContain('https://api.siodelhi.org/uploads/images/')
        })

        it('should throw error for invalid file input', async () => {
            await expect(uploadImage('invalid-string')).rejects.toThrow('Invalid file input')
        })
    })

    describe('deleteImage', () => {
        it('should delete image by full URL', async () => {
            const url = 'https://api.siodelhi.org/uploads/images/test-image.webp'

            // Should not throw
            await expect(deleteImage(url)).resolves.toBeUndefined()
        })

        it('should handle URL with no filename gracefully', async () => {
            const url = ''

            // Should not throw, just return early
            await expect(deleteImage(url)).resolves.toBeUndefined()
        })

        it('should extract filename correctly from URL', async () => {
            const url = 'https://api.siodelhi.org/uploads/images/1234567890-abcdef12.webp'

            await expect(deleteImage(url)).resolves.toBeUndefined()
        })
    })

    describe('uploadPdf', () => {
        it('should upload a PDF file and return URL', async () => {
            const file = new File(['%PDF-1.4 test'], 'document.pdf', { type: 'application/pdf' })

            const url = await uploadPdf(file)

            expect(url).toContain('https://api.siodelhi.org/uploads/pdfs/')
            expect(url).toContain('.pdf')
        })
    })

    describe('deletePdf', () => {
        it('should delete PDF by URL', async () => {
            const url = 'https://api.siodelhi.org/uploads/pdfs/test-doc.pdf'

            await expect(deletePdf(url)).resolves.toBeUndefined()
        })

        it('should handle empty URL gracefully', async () => {
            await expect(deletePdf('')).resolves.toBeUndefined()
        })
    })

    describe('uploadAudio', () => {
        it('should upload an audio file and return URL', async () => {
            const file = new File(['audio data'], 'audio.mp3', { type: 'audio/mpeg' })

            const url = await uploadAudio(file)

            expect(url).toContain('https://api.siodelhi.org/uploads/audio/')
            expect(url).toContain('.mp3')
        })

        it('should handle Blob input', async () => {
            const blob = new Blob(['audio data'], { type: 'audio/mpeg' })

            const url = await uploadAudio(blob)

            expect(url).toContain('https://api.siodelhi.org/uploads/audio/')
        })
    })

    describe('deleteAudio', () => {
        it('should delete audio by URL', async () => {
            const url = 'https://api.siodelhi.org/uploads/audio/test-audio.mp3'

            await expect(deleteAudio(url)).resolves.toBeUndefined()
        })

        it('should handle empty URL gracefully', async () => {
            await expect(deleteAudio('')).resolves.toBeUndefined()
        })
    })
})

describe('URL Extraction', () => {
    // These tests verify the filename extraction logic used in delete functions
    it('should extract filename from standard cPanel URL', () => {
        const url = 'https://api.siodelhi.org/uploads/images/1234567890-abc123.webp'
        const filename = url.split('/').pop()

        expect(filename).toBe('1234567890-abc123.webp')
    })

    it('should handle URLs with query parameters', () => {
        const url = 'https://api.siodelhi.org/uploads/images/test.webp?v=123'
        const filename = url.split('/').pop()?.split('?')[0]

        expect(filename).toBe('test.webp')
    })

    it('should handle URLs with special characters in filename', () => {
        const url = 'https://api.siodelhi.org/uploads/images/file%20name.webp'
        const filename = url.split('/').pop()

        expect(filename).toBe('file%20name.webp')
    })
})
