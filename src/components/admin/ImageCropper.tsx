import { useState, useRef } from 'react'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import getCroppedImg from '../../lib/cropUtils'
import { X, Check, Loader2 } from 'lucide-react'

interface ImageCropperProps {
    imageSrc: string
    onCancel: () => void
    onCropComplete: (croppedBlob: Blob) => void
    onSkip?: () => void
    aspectRatio?: number // Optional fixed aspect ratio (e.g. 16/9)
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    )
}

export function ImageCropper({ imageSrc, onCancel, onCropComplete, onSkip, aspectRatio }: ImageCropperProps) {
    const [crop, setCrop] = useState<Crop>()
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
    const imgRef = useRef<HTMLImageElement>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        if (aspectRatio) {
            const { width, height } = e.currentTarget
            setCrop(centerAspectCrop(width, height, aspectRatio))
        } else {
            // Default to a 80% crop centered
            const { width, height } = e.currentTarget
            setCrop(centerCrop({ unit: '%', width: 80, height: 80, x: 10, y: 10 }, width, height))
        }
    }

    const handleSave = async () => {
        if (completedCrop && imgRef.current) {
            const img = imgRef.current

            // Calculate scale factors (Natural / Displayed)
            const scaleX = img.naturalWidth / img.width
            const scaleY = img.naturalHeight / img.height

            // Adjust crop to natural image size
            const pixelCrop = {
                unit: 'px',
                x: completedCrop.x * scaleX,
                y: completedCrop.y * scaleY,
                width: completedCrop.width * scaleX,
                height: completedCrop.height * scaleY,
            }

            setIsProcessing(true)
            try {
                const blob = await getCroppedImg(imageSrc, pixelCrop)
                if (blob) {
                    onCropComplete(blob)
                } else {
                    console.error('Failed to crop')
                }
            } catch (e) {
                console.error(e)
            } finally {
                setIsProcessing(false)
            }
        }
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                background: '#1a1a1a', borderRadius: '16px', border: '1px solid #333',
                maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ color: 'white', fontWeight: 600, margin: 0 }}>Crop Image</h3>
                    <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ flex: 1, overflow: 'auto', padding: '24px', display: 'flex', justifyContent: 'center', background: '#111' }}>
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={aspectRatio}
                        style={{ maxHeight: '60vh' }}
                    >
                        <img
                            ref={imgRef}
                            alt="Crop me"
                            src={imageSrc}
                            onLoad={onImageLoad}
                            style={{ maxWidth: '100%', maxHeight: '60vh' }}
                        />
                    </ReactCrop>
                </div>

                <div style={{ padding: '16px 24px', borderTop: '1px solid #333', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#1a1a1a' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '10px 20px', borderRadius: '8px', border: '1px solid #333',
                            background: 'transparent', color: '#ccc', cursor: 'pointer', fontWeight: 500
                        }}
                    >
                        Cancel
                        Cancel
                    </button>
                    {onSkip && (
                        <button
                            onClick={onSkip}
                            style={{
                                padding: '10px 20px', borderRadius: '8px', border: '1px solid #333',
                                background: 'transparent', color: '#ccc', cursor: 'pointer', fontWeight: 500
                            }}
                        >
                            Skip/Full
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isProcessing || !completedCrop}
                        style={{
                            padding: '10px 24px', borderRadius: '8px', border: 'none',
                            background: '#ff3b3b', color: 'white', cursor: 'pointer', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '8px',
                            opacity: (isProcessing || !completedCrop) ? 0.5 : 1
                        }}
                    >
                        {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        Crop & Upload
                    </button>
                </div>
            </div>
        </div>
    )
}
