import { supabase } from './supabase'

const BUCKET_NAME = 'post-images'

/**
 * Upload an image to Supabase Storage
 * @param file - File or base64 data URL
 * @param filename - Optional custom filename
 * @returns Public URL of the uploaded image
 */
export async function uploadImage(file: File | string, filename?: string): Promise<string> {
    let fileToUpload: File
    let finalFilename: string

    // Handle base64 data URL
    if (typeof file === 'string' && file.startsWith('data:')) {
        const response = await fetch(file)
        const blob = await response.blob()
        const extension = file.split(';')[0].split('/')[1] || 'png'
        finalFilename = filename || `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`
        fileToUpload = new File([blob], finalFilename, { type: blob.type })
    } else if (file instanceof File) {
        finalFilename = filename || `${Date.now()}-${file.name}`
        fileToUpload = file
    } else {
        throw new Error('Invalid file input')
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(finalFilename, fileToUpload, {
            cacheControl: '3600',
            upsert: false
        })

    if (error) {
        console.error('Upload error:', error)
        throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path)

    return urlData.publicUrl
}

/**
 * Delete an image from Supabase Storage
 * @param url - Public URL of the image
 */
export async function deleteImage(url: string): Promise<void> {
    // Extract path from URL
    const bucketPath = url.split(`${BUCKET_NAME}/`)[1]
    if (!bucketPath) return

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([bucketPath])

    if (error) {
        console.error('Delete error:', error)
        throw error
    }
}

const PDF_BUCKET = 'post-pdfs'

/**
 * Upload a PDF to Supabase Storage
 * @param file - PDF File
 * @returns Public URL of the uploaded PDF
 */
export async function uploadPdf(file: File): Promise<string> {
    const finalFilename = `${Date.now()}-${file.name}`

    const { data, error } = await supabase.storage
        .from(PDF_BUCKET)
        .upload(finalFilename, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'application/pdf'
        })

    if (error) {
        console.error('PDF upload error:', error)
        throw error
    }

    const { data: urlData } = supabase.storage
        .from(PDF_BUCKET)
        .getPublicUrl(data.path)

    return urlData.publicUrl
}

/**
 * Delete a PDF from Supabase Storage
 * @param url - Public URL of the PDF
 */
export async function deletePdf(url: string): Promise<void> {
    const bucketPath = url.split(`${PDF_BUCKET}/`)[1]
    if (!bucketPath) return

    const { error } = await supabase.storage
        .from(PDF_BUCKET)
        .remove([bucketPath])

    if (error) {
        console.error('PDF delete error:', error)
        throw error
    }
}

const AUDIO_BUCKET = 'post-audios'

/**
 * Upload an Audio file to Supabase Storage
 * @param file - Audio File or Blob
 * @returns Public URL of the uploaded Audio
 */
export async function uploadAudio(file: File | Blob): Promise<string> {
    const finalFilename = `${Date.now()}-audio.mp3`

    // Try uploading to 'post-audio', fallback to 'post-pdfs' if strictly needed, 
    // but for now we assume 'post-audio' or we'll catch error.
    // Actually, let's use a bucket we know mostly works or try audio.
    // User plan said "attempt to use a bucket named post-audio".

    const { data, error } = await supabase.storage
        .from(AUDIO_BUCKET)
        .upload(finalFilename, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'audio/mpeg'
        })

    if (error) {
        console.error('Audio upload error:', error)
        throw error
    }

    const { data: urlData } = supabase.storage
        .from(AUDIO_BUCKET)
        .getPublicUrl(data.path)

    return urlData.publicUrl
}

/**
 * Delete an Audio file from Supabase Storage
 * @param url - Public URL of the Audio
 */
export async function deleteAudio(url: string): Promise<void> {
    const bucketPath = url.split(`${AUDIO_BUCKET}/`)[1]
    if (!bucketPath) return

    const { error } = await supabase.storage
        .from(AUDIO_BUCKET)
        .remove([bucketPath])

    if (error) {
        console.error('Audio delete error:', error)
        throw error
    }
}
