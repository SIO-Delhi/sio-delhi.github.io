import JSZip from 'jszip'

// --- Types (Duplicated from FrameTool.tsx for now to avoid complexity) ---
type FitMode = 'cover' | 'contain' | 'fill'
type CanvasMode = 'square' | 'original' | 'portrait' | 'landscape' | 'story'

interface FrameConfig {
    // Crop region as percentage of source image (0-100)
    cropX: number      // Left position of crop (0-100%)
    cropY: number      // Top position of crop (0-100%)
    cropSize: number   // Crop box size as percentage (zoomed in = smaller %)
    // Frame positioning
    frameScale: number // Frame scale (0.5 to 2)
    frameX: number     // Frame X offset (-50 to 50%)
    frameY: number     // Frame Y offset (-50 to 50%)
    fitMode: FitMode
    canvasMode: CanvasMode
}

interface WorkerMessage {
    type: 'START' | 'TRANSFER_START'
    payload: {
        frameURL: string // Blob URL passed from main thread
        photos: {
            id: string // Needed for transfer matching
            url: string // Blob URL
            name: string
            config: FrameConfig
        }[]
    }
}

// --- Drawing Helper ---
// Copy of drawToCanvas logic, adapted for OffscreenCanvas context
const drawToCanvas = (
    ctx: OffscreenCanvasRenderingContext2D,
    width: number,
    height: number,
    photoImg: ImageBitmap | null,
    frameImg: ImageBitmap | null,
    drawConfig: FrameConfig
) => {
    ctx.clearRect(0, 0, width, height)

    // Background
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, width, height)

    if (!photoImg && !frameImg) {
        return
    }

    // 1. Draw Photo (cropped region)
    if (photoImg) {
        const imgW = photoImg.width
        const imgH = photoImg.height

        // Calculate crop dimensions based on aspect ratio
        const canvasAspect = width / height
        const imgAspect = imgW / imgH

        // Crop size determines the percentage of the image to show
        let cropW: number, cropH: number

        // Determine crop dimensions to maintain output aspect ratio
        if (imgAspect > canvasAspect) {
            // Image is wider than canvas - height is the limiting factor
            cropH = (drawConfig.cropSize / 100) * imgH
            cropW = cropH * canvasAspect
        } else {
            // Image is taller than canvas - width is the limiting factor
            cropW = (drawConfig.cropSize / 100) * imgW
            cropH = cropW / canvasAspect
        }

        // Ensure crop doesn't exceed image bounds
        cropW = Math.min(cropW, imgW)
        cropH = Math.min(cropH, imgH)

        // Calculate source position based on cropX, cropY percentage
        const maxOffsetX = imgW - cropW
        const maxOffsetY = imgH - cropH
        const srcX = (drawConfig.cropX / 100) * maxOffsetX
        const srcY = (drawConfig.cropY / 100) * maxOffsetY

        // Draw the cropped region to fill the canvas
        ctx.drawImage(
            photoImg,
            srcX, srcY, cropW, cropH,  // Source: crop region
            0, 0, width, height         // Destination: full canvas
        )
    }

    // 2. Draw Frame with positioning (AspectRatio Preserved)
    if (frameImg) {
        const frameAspect = frameImg.width / frameImg.height
        const canvasAspect = width / height

        let baseFrameW, baseFrameH

        if (frameAspect > canvasAspect) {
            // Frame is wider than canvas - fit by width
            baseFrameW = width
            baseFrameH = width / frameAspect
        } else {
            // Frame is taller than canvas - fit by height
            baseFrameH = height
            baseFrameW = height * frameAspect
        }

        const fw = baseFrameW * drawConfig.frameScale
        const fh = baseFrameH * drawConfig.frameScale
        const fx = (width - fw) / 2 + (drawConfig.frameX / 100) * width
        const fy = (height - fh) / 2 + (drawConfig.frameY / 100) * height
        ctx.drawImage(frameImg, fx, fy, fw, fh)
    }
}


// --- Message Handler ---
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    const { type, payload } = e.data

    if (type === 'START' || type === 'TRANSFER_START') {
        const { frameURL, photos } = payload
        const isTransfer = type === 'TRANSFER_START'

        try {
            const zip = isTransfer ? null : new JSZip()
            const folder = zip ? zip.folder("frames") : null
            const renderedPhotos: { id: string, blob: Blob, name: string }[] = []

            // Load Frame Once using fetch -> blob -> createImageBitmap
            // We use fetch because we have blob URLs
            const frameResponse = await fetch(frameURL)
            const frameBlob = await frameResponse.blob()
            const frameImg = await createImageBitmap(frameBlob)

            const total = photos.length

            for (let i = 0; i < total; i++) {
                // Report Progress
                self.postMessage({ type: 'PROGRESS', payload: { current: i + 1, total } })

                const photo = photos[i]

                try {
                    // Load Photo
                    const photoResponse = await fetch(photo.url)
                    const photoBlob = await photoResponse.blob()
                    const photoImg = await createImageBitmap(photoBlob)

                    // Determine dimensions
                    let w = 1080
                    let h = 1080

                    if (photo.config.canvasMode === 'original') {
                        w = photoImg.width
                        h = photoImg.height
                    } else if (photo.config.canvasMode === 'portrait') {
                        w = 1080
                        h = 1350
                    } else if (photo.config.canvasMode === 'landscape') {
                        w = 1920
                        h = 1080
                    } else if (photo.config.canvasMode === 'story') {
                        w = 1080
                        h = 1920
                    }

                    // Create offscreen canvas
                    const canvas = new OffscreenCanvas(w, h)
                    const ctx = canvas.getContext('2d')

                    if (!ctx) throw new Error('Could not get canvas context')

                    // Draw
                    drawToCanvas(ctx, w, h, photoImg, frameImg, photo.config)

                    // Get Blob
                    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 })

                    if (isTransfer) {
                        renderedPhotos.push({ id: photo.id, blob, name: photo.name })
                    } else if (folder) {
                        folder.file(`frame_${i + 1}_${photo.name}.jpg`, blob)
                    }

                } catch (err) {
                    console.error(`Error processing photo ${i}:`, err)
                    // Continue to next photo on error
                }
            }

            if (isTransfer) {
                self.postMessage({ type: 'TRANSFER_COMPLETE', payload: renderedPhotos })
            } else if (zip) {
                // Generate Zip
                const content = await zip.generateAsync({ type: "blob" })

                // Send back result
                self.postMessage({ type: 'COMPLETE', payload: content })
            }

        } catch (error) {
            console.error('Worker Error:', error)
            self.postMessage({ type: 'ERROR', payload: String(error) })
        }
    }
}
