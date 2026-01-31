/**
 * LUT Parser - Parses .cube files for 3D LUT data
 */

export interface LUTData {
    title: string
    size: number
    data: Float32Array
}

/**
 * Parse a .cube file content into LUT data
 */
export function parseCubeFile(content: string): LUTData {
    const lines = content.split('\n')
    let title = 'Untitled LUT'
    let size = 0
    const data: number[] = []

    for (const line of lines) {
        const trimmed = line.trim()

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) continue

        // Parse title
        if (trimmed.startsWith('TITLE')) {
            title = trimmed.replace('TITLE', '').trim().replace(/"/g, '')
            continue
        }

        // Parse LUT size
        if (trimmed.startsWith('LUT_3D_SIZE')) {
            size = parseInt(trimmed.split(/\s+/)[1], 10)
            continue
        }

        // Skip domain min/max (we assume 0-1 range)
        if (trimmed.startsWith('DOMAIN_MIN') || trimmed.startsWith('DOMAIN_MAX')) {
            continue
        }

        // Parse color values
        const parts = trimmed.split(/\s+/)
        if (parts.length >= 3) {
            const r = parseFloat(parts[0])
            const g = parseFloat(parts[1])
            const b = parseFloat(parts[2])

            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                data.push(r, g, b)
            }
        }
    }

    if (size === 0) {
        // Try to infer size from data length
        const inferredSize = Math.round(Math.pow(data.length / 3, 1 / 3))
        if (inferredSize * inferredSize * inferredSize * 3 === data.length) {
            size = inferredSize
        } else {
            throw new Error('Could not determine LUT size')
        }
    }

    return {
        title,
        size,
        data: new Float32Array(data)
    }
}

/**
 * Convert LUT data to a texture-friendly format (RGBA)
 * Returns data in a format suitable for WebGL 3D texture or 2D atlas
 */
export function lutToTextureData(lut: LUTData): {
    data: Uint8Array
    width: number
    height: number
} {
    const size = lut.size
    // Create a 2D atlas layout: size rows of size*size pixels
    const width = size * size
    const height = size
    const data = new Uint8Array(width * height * 4)

    let srcIndex = 0
    for (let b = 0; b < size; b++) {
        for (let g = 0; g < size; g++) {
            for (let r = 0; r < size; r++) {
                const x = b * size + r
                const y = g
                const dstIndex = (y * width + x) * 4

                data[dstIndex] = Math.round(lut.data[srcIndex] * 255)
                data[dstIndex + 1] = Math.round(lut.data[srcIndex + 1] * 255)
                data[dstIndex + 2] = Math.round(lut.data[srcIndex + 2] * 255)
                data[dstIndex + 3] = 255

                srcIndex += 3
            }
        }
    }

    return { data, width, height }
}
