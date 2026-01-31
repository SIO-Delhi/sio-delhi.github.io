/**
 * AssetSidebar - Left panel for managing uploaded images
 */

import { useState, useRef, useCallback } from 'react'
import { Plus, X, Image as ImageIcon, Check } from 'lucide-react'
import { useTheme } from '../../../../context/ThemeContext'

export interface PhotoAsset {
    id: string
    file: File
    url: string
    thumbnail: string
}

interface AssetSidebarProps {
    photos: PhotoAsset[]
    activePhotoId: string | null
    onPhotosAdd: (photos: PhotoAsset[]) => void
    onPhotoRemove: (id: string) => void
    onPhotoSelect: (id: string) => void
}

export function AssetSidebar({
    photos,
    activePhotoId,
    onPhotosAdd,
    onPhotoRemove,
    onPhotoSelect
}: AssetSidebarProps) {
    const { isDark } = useTheme()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isDragging, setIsDragging] = useState(false)

    const handleFiles = useCallback(async (files: FileList) => {
        const newPhotos: PhotoAsset[] = []

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            if (!file.type.startsWith('image/')) continue

            const id = `${Date.now()}-${i}`
            const url = URL.createObjectURL(file)

            // Create thumbnail
            const thumbnail = await createThumbnail(file, 150)

            newPhotos.push({ id, file, url, thumbnail })
        }

        if (newPhotos.length > 0) {
            onPhotosAdd(newPhotos)
        }
    }, [onPhotosAdd])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files)
        }
    }, [handleFiles])

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => setIsDragging(false)

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: isDark ? '#0a0a0a' : '#f8f8f8',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px',
                borderBottom: `1px solid ${isDark ? '#222' : '#e0e0e0'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <span style={{
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: isDark ? '#fff' : '#111'
                }}>
                    Photos ({photos.length})
                </span>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: '#ff3b3b',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white'
                    }}
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Drop Zone / Grid */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '12px'
                }}
            >
                {photos.length === 0 ? (
                    <div style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        border: `2px dashed ${isDragging ? '#ff3b3b' : (isDark ? '#333' : '#ccc')}`,
                        borderRadius: '12px',
                        padding: '24px',
                        textAlign: 'center',
                        transition: 'border-color 0.2s',
                        background: isDragging ? (isDark ? 'rgba(255,59,59,0.05)' : 'rgba(255,59,59,0.02)') : 'transparent'
                    }}>
                        <ImageIcon size={32} color={isDark ? '#444' : '#aaa'} />
                        <div style={{ color: isDark ? '#666' : '#888', fontSize: '0.8rem' }}>
                            Drop images here<br />or click + to add
                        </div>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '8px'
                    }}>
                        {photos.map(photo => (
                            <div
                                key={photo.id}
                                onClick={() => onPhotoSelect(photo.id)}
                                style={{
                                    position: 'relative',
                                    aspectRatio: '1',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    border: activePhotoId === photo.id
                                        ? '2px solid #ff3b3b'
                                        : `2px solid transparent`,
                                    transition: 'border-color 0.2s'
                                }}
                            >
                                <img
                                    src={photo.thumbnail}
                                    alt=""
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                                {activePhotoId === photo.id && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '4px',
                                        left: '4px',
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        background: '#ff3b3b',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Check size={12} color="white" />
                                    </div>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onPhotoRemove(photo.id)
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '4px',
                                        right: '4px',
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        background: 'rgba(0,0,0,0.6)',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        opacity: 0.7,
                                        transition: 'opacity 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                                >
                                    <X size={12} color="white" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                style={{ display: 'none' }}
            />
        </div>
    )
}

// Helper: Create thumbnail from file
async function createThumbnail(file: File, maxSize: number): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            const scale = Math.min(maxSize / img.width, maxSize / img.height)
            canvas.width = img.width * scale
            canvas.height = img.height * scale

            const ctx = canvas.getContext('2d')!
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

            resolve(canvas.toDataURL('image/jpeg', 0.7))
            URL.revokeObjectURL(img.src)
        }
        img.src = URL.createObjectURL(file)
    })
}
