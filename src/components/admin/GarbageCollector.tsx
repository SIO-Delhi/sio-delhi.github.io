import { useEffect, useState, useRef } from 'react'
import { Trash2, Search, X, AlertTriangle, RefreshCw, CheckCircle2, Loader2, ChevronDown, ChevronUp, Eye, FileText, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.siodelhi.org'

interface OrphanedFile {
    name: string
    path: string
    fullPath: string
    size: number
    modified: number
    url: string
}

interface ReferencedFile {
    url: string
    path: string
    name: string
    size: number
    modified: number
    sources: { table: string, column: string, id: string | number, pid?: string | number }[]
}

export function GarbageCollector() {
    const [isMobile, setIsMobile] = useState(false)
    const [orphanedFiles, setOrphanedFiles] = useState<OrphanedFile[]>([])
    const [referencedFiles, setReferencedFiles] = useState<ReferencedFile[]>([])
    const [garbageLoading, setGarbageLoading] = useState(false)
    const [garbageExpanded, setGarbageExpanded] = useState(true)
    const [referencedExpanded, setReferencedExpanded] = useState(false)
    const [garbageStats, setGarbageStats] = useState({ totalCount: 0, totalSize: 0, scanned: 0, references: 0 })
    const [selectedOrphans, setSelectedOrphans] = useState<Set<string>>(new Set())
    const [deletingOrphans, setDeletingOrphans] = useState(false)
    const [deletingFile, setDeletingFile] = useState<string | null>(null)
    const [orphanSearchTerm, setOrphanSearchTerm] = useState('')
    const [referencedSearchTerm, setReferencedSearchTerm] = useState('')
    const [previewFile, setPreviewFile] = useState<OrphanedFile | ReferencedFile | null>(null)

    // Refs for scrolling to sections
    const orphanedSectionRef = useRef<HTMLDivElement>(null)
    const referencedSectionRef = useRef<HTMLDivElement>(null)

    const scrollToOrphaned = () => {
        setGarbageExpanded(true)
        setTimeout(() => {
            orphanedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
    }

    const scrollToReferenced = () => {
        setReferencedExpanded(true)
        setTimeout(() => {
            referencedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
    }

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Close preview on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setPreviewFile(null)
        }
        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [])

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B'
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
    }

    const isImage = (path: string) => /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(path)
    const isPdf = (path: string) => /\.pdf$/i.test(path)

    const getFileIcon = (path: string, url?: string) => {
        if (isImage(path) && url) {
            return (
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    background: '#222',
                    flexShrink: 0
                }}>
                    <img
                        src={url}
                        alt=""
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                        onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.parentElement!.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>'
                        }}
                    />
                </div>
            )
        }
        if (isPdf(path)) {
            return (
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    color: '#fff',
                    letterSpacing: '0.5px'
                }}>
                    PDF
                </div>
            )
        }
        return (
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '6px',
                background: '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                <FileText size={20} color="#666" />
            </div>
        )
    }

    const loadOrphanedFiles = async () => {
        setGarbageLoading(true)
        try {
            const response = await fetch(`${API_BASE}/garbage`)
            if (!response.ok) throw new Error('Failed to fetch orphaned files')
            const data = await response.json()
            console.log('Garbage API response:', data)
            console.log('totalReferencesFound:', data.totalReferencesFound)
            setOrphanedFiles(data.orphanedFiles || [])
            setReferencedFiles(data.referencedFiles || [])
            setGarbageStats({
                totalCount: data.totalOrphanedCount || 0,
                totalSize: data.totalOrphanedSize || 0,
                scanned: data.totalFilesScanned || 0,
                references: data.totalReferencesFound || 0
            })
        } catch (err) {
            console.error('Error loading orphaned files:', err)
        } finally {
            setGarbageLoading(false)
        }
    }

    const toggleOrphanSelection = (path: string) => {
        setSelectedOrphans(prev => {
            const next = new Set(prev)
            if (next.has(path)) {
                next.delete(path)
            } else {
                next.add(path)
            }
            return next
        })
    }

    // const selectAllOrphans = () => {
    //     if (selectedOrphans.size === orphanedFiles.length) {
    //         setSelectedOrphans(new Set())
    //     } else {
    //         setSelectedOrphans(new Set(orphanedFiles.map(f => f.path)))
    //     }
    // }

    const deleteSelectedOrphans = async () => {
        if (selectedOrphans.size === 0) return
        if (!confirm(`Are you sure you want to delete ${selectedOrphans.size} orphaned file(s)? This cannot be undone.`)) return

        setDeletingOrphans(true)
        try {
            const response = await fetch(`${API_BASE}/garbage/cleanup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: Array.from(selectedOrphans) })
            })
            const data = await response.json()

            if (data.deletedCount > 0) {
                setOrphanedFiles(prev => prev.filter(f => !selectedOrphans.has(f.path)))
                setGarbageStats(prev => ({
                    ...prev,
                    totalCount: prev.totalCount - data.deletedCount,
                    totalSize: prev.totalSize - data.spaceFreed
                }))
                setSelectedOrphans(new Set())
                alert(`Successfully deleted ${data.deletedCount} file(s), freed ${formatSize(data.spaceFreed)}`)
            }

            if (data.failedCount > 0) {
                alert(`Failed to delete ${data.failedCount} file(s): ${data.failed.join(', ')}`)
            }
        } catch (err: any) {
            console.error('Error deleting orphans:', err)
            alert('Failed to delete files: ' + (err.message || 'Unknown error'))
        } finally {
            setDeletingOrphans(false)
        }
    }

    const deleteSingleFile = async (file: OrphanedFile) => {
        if (!confirm(`Are you sure you want to delete "${file.name}"? This cannot be undone.`)) return

        setDeletingFile(file.path)
        try {
            const response = await fetch(`${API_BASE}/garbage/cleanup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: [file.path] })
            })
            const data = await response.json()

            if (data.deletedCount > 0) {
                setOrphanedFiles(prev => prev.filter(f => f.path !== file.path))
                setGarbageStats(prev => ({
                    ...prev,
                    totalCount: prev.totalCount - 1,
                    totalSize: prev.totalSize - file.size
                }))
                setSelectedOrphans(prev => {
                    const next = new Set(prev)
                    next.delete(file.path)
                    return next
                })
            } else if (data.failedCount > 0) {
                alert(`Failed to delete file: ${data.failed.join(', ')}`)
            }
        } catch (err: any) {
            console.error('Error deleting file:', err)
            alert('Failed to delete file: ' + (err.message || 'Unknown error'))
        } finally {
            setDeletingFile(null)
        }
    }

    // const deleteAllOrphans = async () => {
    //     if (orphanedFiles.length === 0) return
    //     if (!confirm(`Are you sure you want to delete ALL ${orphanedFiles.length} orphaned files? This will free ${formatSize(garbageStats.totalSize)}. This cannot be undone.`)) return

    //     setDeletingOrphans(true)
    //     try {
    //         const response = await fetch(`${API_BASE}/garbage/cleanup`, {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ deleteAll: true })
    //         })
    //         const data = await response.json()

    //         if (data.deletedCount > 0) {
    //             setOrphanedFiles([])
    //             setGarbageStats(prev => ({ ...prev, totalCount: 0, totalSize: 0 }))
    //             setSelectedOrphans(new Set())
    //             alert(`Successfully deleted ${data.deletedCount} file(s), freed ${formatSize(data.spaceFreed)}`)
    //         }

    //         if (data.failedCount > 0) {
    //             loadOrphanedFiles()
    //             alert(`Failed to delete ${data.failedCount} file(s)`)
    //         }
    //     } catch (err: any) {
    //         console.error('Error deleting all orphans:', err)
    //         alert('Failed to delete files: ' + (err.message || 'Unknown error'))
    //     } finally {
    //         setDeletingOrphans(false)
    //     }
    // }

    const SourceLink = ({ source }: { source: { table: string, column: string, id: string | number, pid?: string | number } }) => {
        const tableNames: Record<string, string> = {
            posts: 'Post',
            forms: 'Form',
            form_responses: 'Form Response',
            popups: 'Popup'
        }
        const columnNames: Record<string, string> = {
            image: 'Image',
            pdf_url: 'PDF',
            gallery_images: 'Gallery',
            banner_image: 'Banner',
            theme_background_image: 'Background',
            response_data: 'Response Data'
        }

        const label = `${tableNames[source.table] || source.table} #${source.id} (${columnNames[source.column] || source.column})`

        // Determine link target
        let linkTarget = ''
        if (source.table === 'posts') {
            linkTarget = `/admin/post/${source.id}`
        } else if (source.table === 'forms') {
            linkTarget = `/admin/forms/${source.id}`
        } else if (source.table === 'form_responses' && source.pid) {
            linkTarget = `/admin/forms/${source.pid}/responses/${source.id}`
        } else if (source.table === 'popups') {
            linkTarget = `/admin/popup`
        }

        if (linkTarget) {
            return (
                <Link
                    to={linkTarget}
                    target="_blank"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'inherit', textDecoration: 'none' }}
                >
                    {label}
                    <ExternalLink size={10} style={{ opacity: 0.7 }} />
                </Link>
            )
        }

        return <span>{label}</span>
    }

    // Preview Modal
    const PreviewModal = () => {
        if (!previewFile) return null

        const fileUrl = previewFile.url
        const isImg = isImage(previewFile.path || previewFile.name)
        const isPdfFile = isPdf(previewFile.path || previewFile.name)

        return (
            <div
                onClick={() => setPreviewFile(null)}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.9)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}
            >
                <button
                    onClick={() => setPreviewFile(null)}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 1001
                    }}
                >
                    <X size={24} color="#fff" />
                </button>

                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        maxWidth: '90vw',
                        maxHeight: '90vh',
                        background: '#1a1a1a',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{previewFile.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                {formatSize(previewFile.size)} • {new Date(previewFile.modified * 1000).toLocaleDateString()}
                            </div>
                        </div>
                        {'sources' in previewFile && previewFile.sources && previewFile.sources.length > 0 && (
                            <div style={{
                                padding: '6px 12px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                color: '#10b981'
                            }}>
                                Referenced in {previewFile.sources.length} place(s)
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div style={{
                        flex: 1,
                        overflow: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}>
                        {isImg ? (
                            <img
                                src={fileUrl}
                                alt={previewFile.name}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '70vh',
                                    objectFit: 'contain',
                                    borderRadius: '8px'
                                }}
                            />
                        ) : isPdfFile ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '20px',
                                padding: '40px'
                            }}>
                                {/* PDF Thumbnail Card */}
                                <div style={{
                                    width: '200px',
                                    height: '260px',
                                    background: 'linear-gradient(145deg, #dc2626 0%, #991b1b 100%)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 10px 40px rgba(220, 38, 38, 0.3)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {/* Decorative corner fold */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        width: '40px',
                                        height: '40px',
                                        background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.2) 50%)'
                                    }} />
                                    <FileText size={64} color="rgba(255,255,255,0.9)" />
                                    <div style={{
                                        marginTop: '16px',
                                        padding: '8px 16px',
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: '6px',
                                        fontSize: '1.2rem',
                                        fontWeight: 700,
                                        color: '#fff',
                                        letterSpacing: '1px'
                                    }}>
                                        PDF
                                    </div>
                                </div>
                                <div style={{
                                    textAlign: 'center',
                                    maxWidth: '300px'
                                }}>
                                    <div style={{
                                        fontSize: '1rem',
                                        fontWeight: 500,
                                        marginBottom: '8px',
                                        wordBreak: 'break-word'
                                    }}>
                                        {previewFile.name}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                        {formatSize(previewFile.size)}
                                    </div>
                                </div>
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginTop: '8px',
                                        padding: '12px 24px',
                                        background: '#dc2626',
                                        color: '#fff',
                                        borderRadius: '8px',
                                        textDecoration: 'none',
                                        fontWeight: 600,
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                                >
                                    <Eye size={18} />
                                    Open PDF
                                </a>
                            </div>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                                <FileText size={48} style={{ marginBottom: '16px' }} />
                                <div>Preview not available for this file type</div>
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-block',
                                        marginTop: '16px',
                                        padding: '10px 20px',
                                        background: '#3b82f6',
                                        color: '#fff',
                                        borderRadius: '8px',
                                        textDecoration: 'none'
                                    }}
                                >
                                    Open in New Tab
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Sources (for referenced files) */}
                    {'sources' in previewFile && previewFile.sources && previewFile.sources.length > 0 && (
                        <div style={{
                            padding: '16px 20px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                            background: 'rgba(0, 0, 0, 0.3)'
                        }}>
                            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Referenced in:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {previewFile.sources.map((source, idx) => (
                                    <span
                                        key={idx}
                                        style={{
                                            padding: '4px 10px',
                                            background: 'rgba(59, 130, 246, 0.15)',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            color: '#3b82f6'
                                        }}
                                    >
                                        <SourceLink source={source} />
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div>
            <h1 style={{
                fontSize: isMobile ? '1.75rem' : '2.5rem',
                fontWeight: 800,
                marginBottom: '8px'
            }}>Garbage Collector</h1>
            <p style={{ color: '#888', marginBottom: isMobile ? '20px' : '32px', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                Find and remove orphaned files that are no longer referenced in the database.
            </p>

            {/* Preview Modal */}
            <PreviewModal />

            {/* Danger Zone Warning */}
            <div style={{
                marginBottom: '24px',
                padding: '16px 20px',
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'start',
                gap: '12px'
            }}>
                <AlertTriangle size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                    <h3 style={{ color: '#ef4444', margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600 }}>DANGER ZONE: Proceed with Caution</h3>
                    <p style={{ color: '#fca5a5', margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>
                        This tool handles permanent file deletion. <strong>Verify everything twice before deleting.</strong>
                        Deleting files here cannot be undone. Always check the "Referenced Files" list to ensure the matching logic is working correctly for your files.
                    </p>
                </div>
            </div>

            <div style={{
                padding: isMobile ? '20px' : '28px',
                borderRadius: '20px',
                background: 'linear-gradient(145deg, rgba(20, 20, 25, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative gradient orb */}
                <div style={{
                    position: 'absolute',
                    top: '-30px',
                    right: '-30px',
                    width: '120px',
                    height: '120px',
                    background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none'
                }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', position: 'relative', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            padding: '10px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.05) 100%)',
                            border: '1px solid rgba(245, 158, 11, 0.2)'
                        }}>
                            <AlertTriangle size={22} color="#f59e0b" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Orphaned Files Scanner</h2>
                            <p style={{ fontSize: '0.75rem', color: '#666', margin: '2px 0 0 0' }}>Scans uploads directory and compares against database references</p>
                        </div>
                    </div>

                    <button
                        onClick={loadOrphanedFiles}
                        disabled={garbageLoading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            color: '#f59e0b',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: garbageLoading ? 'wait' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: garbageLoading ? 0.7 : 1
                        }}
                    >
                        {garbageLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <RefreshCw size={16} />
                        )}
                        {garbageLoading ? 'Scanning...' : 'Scan for Orphans'}
                    </button>
                </div>

                {/* Stats Summary - Clickable Cards */}
                {garbageStats.scanned > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                        gap: '12px',
                        marginBottom: '20px'
                    }}>
                        {/* Orphaned Files - Clickable */}
                        <div
                            onClick={orphanedFiles.length > 0 ? scrollToOrphaned : undefined}
                            style={{
                                padding: '14px',
                                background: garbageStats.totalCount > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '10px',
                                border: garbageStats.totalCount > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                                textAlign: 'center',
                                cursor: orphanedFiles.length > 0 ? 'pointer' : 'default',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (orphanedFiles.length > 0) {
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.2)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = 'none'
                            }}
                        >
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: garbageStats.totalCount > 0 ? '#f59e0b' : '#10b981' }}>
                                {garbageStats.totalCount}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>Orphaned Files</div>
                            {orphanedFiles.length > 0 && (
                                <div style={{ fontSize: '0.65rem', color: '#f59e0b', marginTop: '4px' }}>Click to view</div>
                            )}
                        </div>

                        {/* Wasted Space - Static Info */}
                        <div
                            style={{
                                padding: '14px',
                                background: garbageStats.totalSize > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '10px',
                                border: garbageStats.totalSize > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                                textAlign: 'center'
                            }}
                        >
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: garbageStats.totalSize > 0 ? '#f59e0b' : '#10b981' }}>
                                {formatSize(garbageStats.totalSize)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>Wasted Space</div>
                        </div>

                        {/* Files Scanned - Static Info */}
                        <div style={{
                            padding: '14px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{garbageStats.scanned}</div>
                            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>Files Scanned</div>
                        </div>

                        {/* DB References - Clickable */}
                        <div
                            onClick={() => {
                                if (garbageStats.references > 0) {
                                    scrollToReferenced()
                                }
                            }}
                            style={{
                                padding: '14px',
                                background: garbageStats.references > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '10px',
                                border: garbageStats.references > 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                                textAlign: 'center',
                                cursor: garbageStats.references > 0 ? 'pointer' : 'default',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (garbageStats.references > 0) {
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = 'none'
                            }}
                        >
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: garbageStats.references > 0 ? '#10b981' : '#888' }}>
                                {garbageStats.references}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>DB References</div>
                            {garbageStats.references > 0 && (
                                <div style={{ fontSize: '0.65rem', color: '#10b981', marginTop: '4px' }}>Click to view</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Orphaned Files List */}
                {orphanedFiles.length > 0 && (
                    <div ref={orphanedSectionRef} style={{ marginBottom: '20px', scrollMarginTop: '20px' }}>
                        {/* Header with actions */}
                        <div
                            onClick={() => setGarbageExpanded(!garbageExpanded)}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '14px 16px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                borderRadius: garbageExpanded ? '12px 12px 0 0' : '12px',
                                border: '1px solid rgba(245, 158, 11, 0.2)',
                                borderBottom: garbageExpanded ? 'none' : '1px solid rgba(245, 158, 11, 0.2)',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f59e0b' }}>
                                    {orphanedFiles.length} Orphaned Files Found
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#888' }}>{formatSize(garbageStats.totalSize)}</span>
                                {garbageExpanded ? <ChevronUp size={18} color="#f59e0b" /> : <ChevronDown size={18} color="#f59e0b" />}
                            </div>
                        </div>

                        {garbageExpanded && (
                            <div style={{
                                background: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '0 0 12px 12px',
                                border: '1px solid rgba(245, 158, 11, 0.2)',
                                borderTop: 'none'
                            }}>
                                {/* Action Bar */}
                                <div style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '10px',
                                    position: 'sticky',
                                    top: 0,
                                    background: 'rgba(15, 15, 20, 0.98)',
                                    backdropFilter: 'blur(8px)',
                                    zIndex: 1
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {/* <button
                                            onClick={(e) => { e.stopPropagation(); selectAllOrphans() }}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                color: '#fff',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {selectedOrphans.size === orphanedFiles.length ? 'Deselect All' : 'Select All'}
                                        </button> */}
                                        {selectedOrphans.size > 0 && (
                                            <span style={{ fontSize: '0.8rem', color: '#888' }}>
                                                {selectedOrphans.size} selected
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {selectedOrphans.size > 0 && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteSelectedOrphans() }}
                                                disabled={deletingOrphans}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    background: 'rgba(239, 68, 68, 0.2)',
                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                    color: '#ef4444',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 500,
                                                    cursor: deletingOrphans ? 'wait' : 'pointer'
                                                }}
                                            >
                                                {deletingOrphans ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                Delete Selected
                                            </button>
                                        )}
                                        {/* <button
                                            onClick={(e) => { e.stopPropagation(); deleteAllOrphans() }}
                                            disabled={deletingOrphans}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                background: 'rgba(239, 68, 68, 0.15)',
                                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                                color: '#ef4444',
                                                fontSize: '0.8rem',
                                                fontWeight: 500,
                                                cursor: deletingOrphans ? 'wait' : 'pointer'
                                            }}
                                        >
                                            Delete All
                                        </button> */}
                                    </div>
                                </div>

                                {/* Search */}
                                <div style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '8px 12px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255, 255, 255, 0.08)'
                                    }}>
                                        <Search size={16} color="#666" />
                                        <input
                                            type="text"
                                            placeholder="Search orphaned files..."
                                            value={orphanSearchTerm}
                                            onChange={(e) => setOrphanSearchTerm(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                flex: 1,
                                                background: 'transparent',
                                                border: 'none',
                                                outline: 'none',
                                                color: '#fff',
                                                fontSize: '0.85rem',
                                                fontFamily: 'inherit'
                                            }}
                                        />
                                        {orphanSearchTerm && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setOrphanSearchTerm('') }}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}
                                            >
                                                <X size={14} color="#666" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* File List */}
                                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                    {(() => {
                                        const filtered = orphanedFiles.filter(f =>
                                            !orphanSearchTerm || f.path.toLowerCase().includes(orphanSearchTerm.toLowerCase())
                                        )
                                        if (filtered.length === 0) {
                                            return (
                                                <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>
                                                    No files matching "{orphanSearchTerm}"
                                                </div>
                                            )
                                        }
                                        return filtered.map((file, idx) => (
                                            <div
                                                key={file.path}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '12px 16px',
                                                    borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none',
                                                    background: selectedOrphans.has(file.path) ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                                                    transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!selectedOrphans.has(file.path)) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!selectedOrphans.has(file.path)) e.currentTarget.style.background = 'transparent'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedOrphans.has(file.path)}
                                                    onChange={() => toggleOrphanSelection(file.path)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ marginRight: '12px', cursor: 'pointer', accentColor: '#f59e0b', width: '16px', height: '16px' }}
                                                />
                                                <div style={{ marginRight: '12px' }}>
                                                    {getFileIcon(file.path, file.url)}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        fontSize: '0.9rem',
                                                        fontWeight: 500,
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        maxWidth: isMobile ? '150px' : '400px'
                                                    }}>
                                                        {file.path}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                                                        {formatSize(file.size)} • {new Date(file.modified * 1000).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                                                    {(isImage(file.path) || isPdf(file.path)) && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setPreviewFile(file) }}
                                                            style={{
                                                                padding: '8px',
                                                                borderRadius: '8px',
                                                                background: 'rgba(59, 130, 246, 0.15)',
                                                                border: 'none',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: 'pointer',
                                                                transition: 'background 0.15s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'}
                                                        >
                                                            <Eye size={16} color="#3b82f6" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteSingleFile(file) }}
                                                        disabled={deletingFile === file.path}
                                                        style={{
                                                            padding: '8px',
                                                            borderRadius: '8px',
                                                            background: 'rgba(239, 68, 68, 0.15)',
                                                            border: 'none',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: deletingFile === file.path ? 'wait' : 'pointer',
                                                            transition: 'background 0.15s',
                                                            opacity: deletingFile === file.path ? 0.5 : 1
                                                        }}
                                                        onMouseEnter={(e) => { if (deletingFile !== file.path) e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)' }}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                                                    >
                                                        {deletingFile === file.path ? (
                                                            <Loader2 size={16} className="animate-spin" color="#ef4444" />
                                                        ) : (
                                                            <Trash2 size={16} color="#ef4444" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Referenced Files List */}
                {(referencedFiles.length > 0 || garbageStats.references > 0) && garbageStats.scanned > 0 && (
                    <div ref={referencedSectionRef} style={{ marginBottom: '20px', scrollMarginTop: '20px' }}>
                        {/* Header */}
                        <div
                            onClick={() => setReferencedExpanded(!referencedExpanded)}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '14px 16px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                borderRadius: referencedExpanded ? '12px 12px 0 0' : '12px',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                borderBottom: referencedExpanded ? 'none' : '1px solid rgba(16, 185, 129, 0.2)',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <CheckCircle2 size={18} color="#10b981" />
                                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#10b981' }}>
                                    {referencedFiles.length} Referenced Files (Safe)
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.8rem', color: '#888' }}>Click to see where each file is used</span>
                                {referencedExpanded ? <ChevronUp size={18} color="#10b981" /> : <ChevronDown size={18} color="#10b981" />}
                            </div>
                        </div>

                        {referencedExpanded && (
                            <div style={{
                                background: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '0 0 12px 12px',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                borderTop: 'none'
                            }}>
                                {/* Search */}
                                <div style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '8px 12px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255, 255, 255, 0.08)'
                                    }}>
                                        <Search size={16} color="#666" />
                                        <input
                                            type="text"
                                            placeholder="Search referenced files..."
                                            value={referencedSearchTerm}
                                            onChange={(e) => setReferencedSearchTerm(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                flex: 1,
                                                background: 'transparent',
                                                border: 'none',
                                                outline: 'none',
                                                color: '#fff',
                                                fontSize: '0.85rem',
                                                fontFamily: 'inherit'
                                            }}
                                        />
                                        {referencedSearchTerm && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setReferencedSearchTerm('') }}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}
                                            >
                                                <X size={14} color="#666" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* File List */}
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {referencedFiles.length === 0 ? (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>
                                            No local files found maximizing the database references.
                                        </div>
                                    ) : (
                                        (() => {
                                            const filtered = referencedFiles.filter(f =>
                                                !referencedSearchTerm || f.path.toLowerCase().includes(referencedSearchTerm.toLowerCase())
                                            )
                                            if (filtered.length === 0) {
                                                return (
                                                    <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>
                                                        No files matching "{referencedSearchTerm}"
                                                    </div>
                                                )
                                            }
                                            return filtered.map((file, idx) => (
                                                <div
                                                    key={file.path}
                                                    style={{
                                                        padding: '12px 16px',
                                                        borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none',
                                                        transition: 'background 0.15s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <div style={{ marginRight: '12px' }}>
                                                            {getFileIcon(file.path, file.url)}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{
                                                                fontSize: '0.9rem',
                                                                fontWeight: 500,
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                maxWidth: isMobile ? '150px' : '400px'
                                                            }}>
                                                                {file.path}
                                                            </div>
                                                            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                                                                {formatSize(file.size)} • {new Date(file.modified * 1000).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                                                            {(isImage(file.path) || isPdf(file.path)) && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setPreviewFile(file) }}
                                                                    style={{
                                                                        padding: '8px',
                                                                        borderRadius: '8px',
                                                                        background: 'rgba(59, 130, 246, 0.15)',
                                                                        border: 'none',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        cursor: 'pointer',
                                                                        transition: 'background 0.15s'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'}
                                                                >
                                                                    <Eye size={16} color="#3b82f6" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {/* Sources */}
                                                    <div style={{ marginTop: '8px', marginLeft: '28px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                        {file.sources.map((source, sIdx) => (
                                                            <span
                                                                key={sIdx}
                                                                style={{
                                                                    padding: '3px 8px',
                                                                    background: 'rgba(16, 185, 129, 0.15)',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.75rem',
                                                                    color: '#10b981'
                                                                }}
                                                            >
                                                                <SourceLink source={source} />
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        })()
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* No orphans message */}
                {garbageStats.scanned > 0 && orphanedFiles.length === 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        padding: '32px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '12px',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                        <CheckCircle2 size={28} color="#10b981" />
                        <div>
                            <div style={{ fontWeight: 600, color: '#10b981', fontSize: '1.1rem' }}>All Clean!</div>
                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>No orphaned files found. All uploaded files are referenced in the database.</div>
                        </div>
                    </div>
                )}

                {/* Initial state - no scan yet */}
                {garbageStats.scanned === 0 && !garbageLoading && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px',
                        padding: '48px 24px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '12px',
                        border: '1px dashed rgba(255, 255, 255, 0.1)',
                        textAlign: 'center'
                    }}>
                        <AlertTriangle size={48} color="#666" />
                        <div>
                            <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>No Scan Results</div>
                            <div style={{ fontSize: '0.9rem', color: '#666', maxWidth: '400px' }}>
                                Click "Scan for Orphans" to analyze your uploads directory and find files that are no longer referenced in the database.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
