/**
 * FilterEngine - WebGL-based image processing engine
 * Handles real-time color grading with LUT support
 */

import type { LUTData } from './utils/lutParser'
import { lutToTextureData } from './utils/lutParser'

// Import shaders as raw text
import vertexShaderSource from './shaders/vertex.glsl?raw'
import fragmentShaderSource from './shaders/fragment.glsl?raw'

export interface FilterConfig {
    exposure: number      // -5 to +5
    contrast: number      // -100 to +100
    highlights: number    // -100 to +100
    shadows: number       // -100 to +100
    whites: number        // -100 to +100
    blacks: number        // -100 to +100
    temperature: number   // -100 to +100
    tint: number          // -100 to +100
    vibrance: number      // -100 to +100
    saturation: number    // -100 to +100
    hue: number           // -180 to +180
}

export const DEFAULT_FILTER_CONFIG: FilterConfig = {
    exposure: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    temperature: 0,
    tint: 0,
    vibrance: 0,
    saturation: 0,
    hue: 0
}

export class FilterEngine {
    private canvas: HTMLCanvasElement
    private gl: WebGLRenderingContext
    private program: WebGLProgram
    private imageTexture: WebGLTexture | null = null
    private lutTexture: WebGLTexture | null = null
    private lutSize: number = 0
    private useLut: boolean = false

    // Uniform locations
    private uniforms: Record<string, WebGLUniformLocation | null> = {}

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        const gl = canvas.getContext('webgl', {
            premultipliedAlpha: false,
            preserveDrawingBuffer: true
        })

        if (!gl) {
            throw new Error('WebGL not supported')
        }

        this.gl = gl
        this.program = this.createProgram()
        this.setupBuffers()
        this.cacheUniformLocations()
    }

    private createShader(type: number, source: string): WebGLShader {
        const gl = this.gl
        const shader = gl.createShader(type)!
        gl.shaderSource(shader, source)
        gl.compileShader(shader)

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(shader)
            gl.deleteShader(shader)
            throw new Error(`Shader compile error: ${error}`)
        }

        return shader
    }

    private createProgram(): WebGLProgram {
        const gl = this.gl
        const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexShaderSource)
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource)

        const program = gl.createProgram()!
        gl.attachShader(program, vertexShader)
        gl.attachShader(program, fragmentShader)
        gl.linkProgram(program)

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const error = gl.getProgramInfoLog(program)
            throw new Error(`Program link error: ${error}`)
        }

        gl.useProgram(program)
        return program
    }

    private setupBuffers(): void {
        const gl = this.gl

        // Position buffer (full-screen quad)
        const positionBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            -1, 1,
            1, -1,
            1, 1
        ]), gl.STATIC_DRAW)

        const positionLoc = gl.getAttribLocation(this.program, 'a_position')
        gl.enableVertexAttribArray(positionLoc)
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

        // Texture coordinate buffer
        const texCoordBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 1,
            1, 1,
            0, 0,
            0, 0,
            1, 1,
            1, 0
        ]), gl.STATIC_DRAW)

        const texCoordLoc = gl.getAttribLocation(this.program, 'a_texCoord')
        gl.enableVertexAttribArray(texCoordLoc)
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0)
    }

    private cacheUniformLocations(): void {
        const gl = this.gl
        const uniformNames = [
            'u_image', 'u_lut', 'u_useLut', 'u_lutSize',
            'u_exposure', 'u_contrast', 'u_highlights', 'u_shadows',
            'u_whites', 'u_blacks', 'u_temperature', 'u_tint',
            'u_vibrance', 'u_saturation', 'u_hue'
        ]

        for (const name of uniformNames) {
            this.uniforms[name] = gl.getUniformLocation(this.program, name)
        }
    }

    /**
     * Load an image as the source texture
     */
    loadImage(image: HTMLImageElement): void {
        const gl = this.gl

        // Resize canvas to match image
        this.canvas.width = image.naturalWidth
        this.canvas.height = image.naturalHeight
        gl.viewport(0, 0, image.naturalWidth, image.naturalHeight)

        // Create texture
        if (this.imageTexture) {
            gl.deleteTexture(this.imageTexture)
        }

        this.imageTexture = gl.createTexture()
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.imageTexture)

        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

        // Upload image
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

        gl.uniform1i(this.uniforms['u_image'], 0)
    }

    /**
     * Load a LUT for color grading
     */
    loadLUT(lut: LUTData): void {
        const gl = this.gl
        const textureData = lutToTextureData(lut)

        if (this.lutTexture) {
            gl.deleteTexture(this.lutTexture)
        }

        this.lutTexture = gl.createTexture()
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, this.lutTexture)

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA,
            textureData.width, textureData.height, 0,
            gl.RGBA, gl.UNSIGNED_BYTE, textureData.data
        )

        this.lutSize = lut.size
        this.useLut = true

        gl.uniform1i(this.uniforms['u_lut'], 1)
    }

    /**
     * Clear the loaded LUT
     */
    clearLUT(): void {
        this.useLut = false
        if (this.lutTexture) {
            this.gl.deleteTexture(this.lutTexture)
            this.lutTexture = null
        }
    }

    /**
     * Render with the given filter configuration
     */
    render(config: FilterConfig): void {
        const gl = this.gl

        if (!this.imageTexture) return

        // Ensure correct program is active
        gl.useProgram(this.program)

        // Rebind textures to ensure correct state
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.imageTexture)
        gl.uniform1i(this.uniforms['u_image'], 0)

        if (this.useLut && this.lutTexture) {
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, this.lutTexture)
            gl.uniform1i(this.uniforms['u_lut'], 1)
        }

        // Set uniforms
        gl.uniform1i(this.uniforms['u_useLut'], this.useLut ? 1 : 0)
        gl.uniform1f(this.uniforms['u_lutSize'], this.lutSize)

        gl.uniform1f(this.uniforms['u_exposure'], config.exposure)
        gl.uniform1f(this.uniforms['u_contrast'], config.contrast)
        gl.uniform1f(this.uniforms['u_highlights'], config.highlights)
        gl.uniform1f(this.uniforms['u_shadows'], config.shadows)
        gl.uniform1f(this.uniforms['u_whites'], config.whites)
        gl.uniform1f(this.uniforms['u_blacks'], config.blacks)
        gl.uniform1f(this.uniforms['u_temperature'], config.temperature)
        gl.uniform1f(this.uniforms['u_tint'], config.tint)
        gl.uniform1f(this.uniforms['u_vibrance'], config.vibrance)
        gl.uniform1f(this.uniforms['u_saturation'], config.saturation)
        gl.uniform1f(this.uniforms['u_hue'], config.hue)

        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    /**
     * Export the current canvas as a Blob
     */
    async toBlob(type: string = 'image/jpeg', quality: number = 0.92): Promise<Blob> {
        return new Promise((resolve, reject) => {
            this.canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob)
                    else reject(new Error('Failed to create blob'))
                },
                type,
                quality
            )
        })
    }

    /**
     * Get the canvas element
     */
    getCanvas(): HTMLCanvasElement {
        return this.canvas
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        const gl = this.gl
        if (this.imageTexture) gl.deleteTexture(this.imageTexture)
        if (this.lutTexture) gl.deleteTexture(this.lutTexture)
        gl.deleteProgram(this.program)
    }
}
