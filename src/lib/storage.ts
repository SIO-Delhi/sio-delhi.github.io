import { api } from './api'

/**
 * Upload an image to the server
 * @param file - File or base64 data URL
 * @param filename - Optional custom filename (not used with API, kept for compatibility)
 * @returns Public URL of the uploaded image
 */
export async function uploadImage(file: File | string, _filename?: string): Promise<string> {
    let fileToUpload: File | Blob

    // Handle base64 data URL
    if (typeof file === 'string' && file.startsWith('data:')) {
        const response = await fetch(file)
        const blob = await response.blob()
        fileToUpload = blob
    } else if (file instanceof File) {
        fileToUpload = file
    } else {
        throw new Error('Invalid file input')
    }

    const result = await api.upload.image(fileToUpload)

    if (result.error) {
        console.error('Upload error:', result.error)
        throw new Error(result.error)
    }

    return result.data!.url
}

/**
 * Delete an image from the server
 * @param url - Public URL of the image
 */
export async function deleteImage(url: string): Promise<void> {
    // Extract filename from URL
    const filename = url.split('/').pop()
    if (!filename) return

    const result = await api.upload.deleteFile('images', filename)

    if (result.error) {
        console.error('Delete error:', result.error)
        throw new Error(result.error)
    }
}

/**
 * Upload a PDF to the server
 * @param file - PDF File
 * @returns Public URL of the uploaded PDF
 */
export async function uploadPdf(file: File): Promise<string> {
    const result = await api.upload.pdf(file)

    if (result.error) {
        console.error('PDF upload error:', result.error)
        throw new Error(result.error)
    }

    return result.data!.url
}

/**
 * Delete a PDF from the server
 * @param url - Public URL of the PDF
 */
export async function deletePdf(url: string): Promise<void> {
    const filename = url.split('/').pop()
    if (!filename) return

    const result = await api.upload.deleteFile('pdfs', filename)

    if (result.error) {
        console.error('PDF delete error:', result.error)
        throw new Error(result.error)
    }
}

/**
 * Upload an Audio file to the server
 * @param file - Audio File or Blob
 * @returns Public URL of the uploaded Audio
 */
export async function uploadAudio(file: File | Blob): Promise<string> {
    const result = await api.upload.audio(file)

    if (result.error) {
        console.error('Audio upload error:', result.error)
        throw new Error(result.error)
    }

    return result.data!.url
}

/**
 * Delete an Audio file from the server
 * @param url - Public URL of the Audio
 */
export async function deleteAudio(url: string): Promise<void> {
    const filename = url.split('/').pop()
    if (!filename) return

    const result = await api.upload.deleteFile('audio', filename)

    if (result.error) {
        console.error('Audio delete error:', result.error)
        throw new Error(result.error)
    }
}
