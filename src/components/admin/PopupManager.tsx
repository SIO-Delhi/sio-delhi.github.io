import { useState, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useContent } from '../../context/ContentContext'
import { uploadImage, deleteImage } from '../../lib/storage'
import { Upload, Trash2, Eye, EyeOff, Save, Image as ImageIcon } from 'lucide-react'

export function PopupManager() {
    const { isDark } = useTheme()
    const { popup, savePopup, deletePopup, fetchPopup } = useContent()
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    const [image, setImage] = useState<string>(popup?.image || '')
    const [isActive, setIsActive] = useState(popup?.isActive ?? true)
    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [previewOpen, setPreviewOpen] = useState(false)

    // Sync state when popup changes
    useState(() => {
        if (popup) {
            setImage(popup.image)
            setIsActive(popup.isActive)
        }
    })

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            const url = await uploadImage(file)
            setImage(url)
        } catch (err) {
            console.error('Error uploading image:', err)
            alert('Failed to upload image')
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async () => {
        if (!image) {
            alert('Please upload an image first')
            return
        }

        try {
            setSaving(true)
            await savePopup(image, isActive)
            await fetchPopup()
            alert('Popup saved successfully!')
        } catch (err) {
            console.error('Error saving popup:', err)
            alert('Failed to save popup')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this popup?')) return

        try {
            // Delete the image from storage if exists
            if (popup?.image) {
                try {
                    await deleteImage(popup.image)
                } catch (err) {
                    console.error('Error deleting image from storage:', err)
                }
            }
            await deletePopup()
            setImage('')
            setIsActive(true)
            alert('Popup deleted successfully!')
        } catch (err) {
            console.error('Error deleting popup:', err)
            alert('Failed to delete popup')
        }
    }

    const cardStyle: React.CSSProperties = {
        background: isDark ? '#111' : '#fff',
        border: isDark ? '1px solid #222' : '1px solid #e0e0e0',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px'
    }

    const buttonStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        borderRadius: '8px',
        fontWeight: 600,
        cursor: 'pointer',
        border: 'none',
        transition: 'all 0.2s',
        fontFamily: 'inherit'
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                marginBottom: '8px',
                color: isDark ? '#fff' : '#111'
            }}>
                Popup Manager
            </h1>
            <p style={{
                color: isDark ? '#888' : '#666',
                marginBottom: '32px'
            }}>
                Upload an image to display as a popup when visitors enter the site.
            </p>

            {/* Upload Section */}
            <div style={cardStyle}>
                <h2 style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: isDark ? '#fff' : '#111'
                }}>
                    Popup Image
                </h2>

                {/* Image Preview */}
                {image ? (
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{
                            position: 'relative',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: isDark ? '1px solid #333' : '1px solid #ddd',
                            maxWidth: '400px'
                        }}>
                            <img
                                src={image}
                                alt="Popup preview"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    display: 'block'
                                }}
                            />
                            <button
                                onClick={() => setPreviewOpen(true)}
                                style={{
                                    position: 'absolute',
                                    bottom: '8px',
                                    right: '8px',
                                    background: 'rgba(0,0,0,0.7)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '6px 12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.85rem'
                                }}
                            >
                                <Eye size={14} /> Preview
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '200px',
                        background: isDark ? '#0a0a0a' : '#f5f5f5',
                        borderRadius: '8px',
                        border: isDark ? '2px dashed #333' : '2px dashed #ddd',
                        marginBottom: '20px'
                    }}>
                        <div style={{ textAlign: 'center', color: isDark ? '#666' : '#999' }}>
                            <ImageIcon size={48} style={{ marginBottom: '8px' }} />
                            <p>No image uploaded</p>
                        </div>
                    </div>
                )}

                {/* Upload Button */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                        ...buttonStyle,
                        background: isDark ? '#222' : '#f0f0f0',
                        color: isDark ? '#fff' : '#111'
                    }}
                >
                    <Upload size={18} />
                    {uploading ? 'Uploading...' : image ? 'Change Image' : 'Upload Image'}
                </button>
            </div>

            {/* Settings Section */}
            <div style={cardStyle}>
                <h2 style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: isDark ? '#fff' : '#111'
                }}>
                    Settings
                </h2>

                {/* Active Toggle */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0'
                }}>
                    <div>
                        <div style={{
                            fontWeight: 500,
                            color: isDark ? '#fff' : '#111',
                            marginBottom: '4px'
                        }}>
                            Active Status
                        </div>
                        <div style={{
                            fontSize: '0.85rem',
                            color: isDark ? '#888' : '#666'
                        }}>
                            {isActive ? 'Popup will be shown to visitors' : 'Popup is disabled'}
                        </div>
                    </div>
                    <button
                        onClick={() => setIsActive(!isActive)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 500,
                            background: isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: isActive ? '#22c55e' : '#ef4444'
                        }}
                    >
                        {isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                        {isActive ? 'Active' : 'Inactive'}
                    </button>
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap'
            }}>
                <button
                    onClick={handleSave}
                    disabled={saving || !image}
                    style={{
                        ...buttonStyle,
                        background: '#ff3b3b',
                        color: '#fff',
                        opacity: saving || !image ? 0.5 : 1
                    }}
                >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Popup'}
                </button>

                {popup && (
                    <button
                        onClick={handleDelete}
                        style={{
                            ...buttonStyle,
                            background: 'transparent',
                            border: '1px solid #ef4444',
                            color: '#ef4444'
                        }}
                    >
                        <Trash2 size={18} />
                        Delete Popup
                    </button>
                )}
            </div>

            {/* Preview Modal */}
            {previewOpen && image && (
                <div
                    onClick={() => setPreviewOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '20px',
                        cursor: 'pointer'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'relative',
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            cursor: 'default'
                        }}
                    >
                        <img
                            src={image}
                            alt="Popup full preview"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '85vh',
                                borderRadius: '12px',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                            }}
                        />
                        <button
                            onClick={() => setPreviewOpen(false)}
                            style={{
                                position: 'absolute',
                                top: '-40px',
                                right: '0',
                                background: 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                cursor: 'pointer',
                                fontSize: '18px'
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
