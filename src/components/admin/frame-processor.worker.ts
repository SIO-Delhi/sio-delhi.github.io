import JSZip from 'jszip'

// --- Types (Duplicated from FrameTool.tsx for now to avoid complexity) ---
type FitMode = 'cover' | 'contain' | 'fill'
type CanvasMode = 'square' | 'original'

interface FrameConfig {
    scale: number
    x: number // Percentage -50 to 50
    y: number // Percentage -50 to 50
    fitMode: FitMode
    canvasMode: CanvasMode
}

interface WorkerMessage {
    type: 'START'
    payload: {
        frameURL: string // Blob URL passed from main thread
        photos: {
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

    // 1. Draw Photo
    if (photoImg) {
        // Calculate fit logic
        const pRatio = photoImg.width / photoImg.height
        const cRatio = width / height

        let dw = width
        let dh = height
        let dx = 0
        let dy = 0

        if (drawConfig.fitMode === 'cover') {
            if (pRatio > cRatio) {
                dw = height * pRatio
                dx = (width - dw) / 2
            } else {
                dh = width / pRatio
                dy = (height - dh) / 2
            }
        } else if (drawConfig.fitMode === 'contain') {
            if (pRatio > cRatio) {
                dh = width / pRatio
                dy = (height - dh) / 2
            } else {
                dw = height * pRatio
                dx = (width - dw) / 2
            }
        }
        // fill is default (0,0,width,height)

        ctx.drawImage(photoImg, dx, dy, dw, dh)
    }

    // 2. Draw Frame
    if (frameImg) {
        const frameAspect = frameImg.width / frameImg.height
        const canvasAspect = width / height

        let baseW = width
        let baseH = height

        // Calculate base dimensions that effectively "contain" the frame in the canvas
        if (frameAspect > canvasAspect) {
            // Frame is wider relative to canvas: constrain by width
            baseW = width
            baseH = width / frameAspect
        } else {
            // Frame is taller relative to canvas: constrain by height
            baseH = height
            baseW = height * frameAspect
        }

        const fw = baseW * drawConfig.scale
        const fh = baseH * drawConfig.scale

        // Center + Offset
        const fx = (width - fw) / 2 + (drawConfig.x / 100) * width
        const fy = (height - fh) / 2 + (drawConfig.y / 100) * height

        ctx.drawImage(frameImg, fx, fy, fw, fh)
    }
}


// --- Message Handler ---
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    const { type, payload } = e.data

    if (type === 'START') {
        const { frameURL, photos } = payload

        try {
            const zip = new JSZip()
            const folder = zip.folder("frames")

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
                    }

                    // Create offscreen canvas
                    const canvas = new OffscreenCanvas(w, h)
                    const ctx = canvas.getContext('2d')

                    if (!ctx) throw new Error('Could not get canvas context')

                    // Draw
                    drawToCanvas(ctx, w, h, photoImg, frameImg, photo.config)

                    // Get Blob
                    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 })

                    if (folder) {
                        folder.file(`frame_${i + 1}_${photo.name}.jpg`, blob)
                    }

                } catch (err) {
                    console.error(`Error processing photo ${i}:`, err)
                    // Continue to next photo on error
                }
            }

            // Generate Zip
            const content = await zip.generateAsync({ type: "blob" })

            // Send back result
            self.postMessage({ type: 'COMPLETE', payload: content })

        } catch (error) {
            console.error('Worker Error:', error)
            self.postMessage({ type: 'ERROR', payload: String(error) })
        }
    }
}
