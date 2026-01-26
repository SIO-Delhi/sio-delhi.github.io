
import { useEffect, useState } from 'react'
import { useContent } from '../../context/ContentContext'
import { Link } from 'react-router-dom'
import { Layers, Plus, HardDrive, Image, FileText, Loader2, ChevronDown, ChevronUp, Trash2, ExternalLink, Search, X, FileInput } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.siodelhi.org'

interface FileInfo {
    name: string
    size: number
    modified: number
    url: string
}

interface BucketStats {
    name: string
    displayName: string
    icon: React.ReactNode
    color: string
    fileCount: number
    totalSize: number
    loading: boolean
    files: FileInfo[]
    expanded: boolean
}

export function Dashboard() {
    const { sections, posts } = useContent()
    const [isMobile, setIsMobile] = useState(false)
    const [maxStorage, setMaxStorage] = useState(5024 * 1024 * 1024) // 5GB cPanel quota
    const [bucketStats, setBucketStats] = useState<BucketStats[]>([
        { name: 'images', displayName: 'Images', icon: <Image size={20} />, color: '#3b82f6', fileCount: 0, totalSize: 0, loading: true, files: [], expanded: false },
        { name: 'pdfs', displayName: 'PDFs', icon: <FileText size={20} />, color: '#10b981', fileCount: 0, totalSize: 0, loading: true, files: [], expanded: false },
        { name: 'forms', displayName: 'Form Files', icon: <FileInput size={20} />, color: '#8b5cf6', fileCount: 0, totalSize: 0, loading: true, files: [], expanded: false },
    ])
    const [deletingFile, setDeletingFile] = useState<string | null>(null)
    const [fileSearchTerms, setFileSearchTerms] = useState<Record<string, string>>({})

    // Detect screen size
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Fetch storage stats from PHP API
    useEffect(() => {
        const loadStats = async () => {
            try {
                const response = await fetch(`${API_BASE}/stats/storage`)
                if (!response.ok) throw new Error('Failed to fetch stats')

                const data = await response.json()

                if (data.maxStorage) {
                    setMaxStorage(data.maxStorage)
                }

                setBucketStats(prev => prev.map(bucket => {
                    const stats = data.buckets?.[bucket.name] || { fileCount: 0, totalSize: 0, files: [] }
                    return {
                        ...bucket,
                        fileCount: stats.fileCount,
                        totalSize: stats.totalSize,
                        files: stats.files || [],
                        loading: false
                    }
                }))
            } catch (err) {
                console.error('Error fetching storage stats:', err)
                setBucketStats(prev => prev.map(bucket => ({
                    ...bucket,
                    loading: false
                })))
            }
        }

        loadStats()
    }, [])

    const getPostCount = (sectionId: string) => posts.filter(p => p.sectionId === sectionId).length

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B'
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
    }

    const toggleBucketExpanded = (bucketName: string) => {
        setBucketStats(prev => prev.map(bucket =>
            bucket.name === bucketName
                ? { ...bucket, expanded: !bucket.expanded }
                : bucket
        ))
    }

    const handleDeleteFile = async (bucketName: string, fileName: string) => {
        if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return

        setDeletingFile(fileName)
        try {
            const response = await fetch(`${API_BASE}/upload/${bucketName}/${encodeURIComponent(fileName)}`, {
                method: 'DELETE'
            })

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete file');
            }

            // Strictly check for success message
            if (data.message !== 'File deleted successfully') {
                throw new Error('Server did not confirm deletion');
            }

            // Remove file from state
            setBucketStats(prev => prev.map(bucket => {
                if (bucket.name !== bucketName) return bucket
                const deletedFile = bucket.files.find(f => f.name === fileName)
                return {
                    ...bucket,
                    files: bucket.files.filter(f => f.name !== fileName),
                    fileCount: bucket.fileCount - 1,
                    totalSize: bucket.totalSize - (deletedFile?.size || 0)
                }
            }))
        } catch (err: any) {
            console.error('Error deleting file:', err)
            alert(`Failed to delete file: ${err.message || 'Unknown error'}`)
        } finally {
            setDeletingFile(null)
        }
    }

    const totalStorageUsed = bucketStats.reduce((acc, b) => acc + b.totalSize, 0)
    const totalFiles = bucketStats.reduce((acc, b) => acc + b.fileCount, 0)
    // cPanel storage limit (fetched from API or default 10GB)
    const usagePercentage = Math.min((totalStorageUsed / maxStorage) * 100, 100)

    return (
        <div>
            <h1 style={{
                fontSize: isMobile ? '1.75rem' : '2.5rem',
                fontWeight: 800,
                marginBottom: '8px'
            }}>Dashboard</h1>
            <p style={{ color: '#888', marginBottom: isMobile ? '20px' : '32px', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                Welcome to the Content Management System.
            </p>

            {/* Storage Stats Section - Premium Design */}
            <div style={{
                marginBottom: isMobile ? '24px' : '32px',
                padding: isMobile ? '20px' : '28px',
                borderRadius: '20px',
                background: 'linear-gradient(145deg, rgba(20, 20, 25, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative gradient orbs */}
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '150px',
                    height: '150px',
                    background: 'radial-gradient(circle, rgba(255, 59, 59, 0.15) 0%, transparent 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '-30px',
                    left: '20%',
                    width: '100px',
                    height: '100px',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none'
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', position: 'relative' }}>
                    <div style={{
                        padding: '10px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(255, 59, 59, 0.2) 0%, rgba(255, 59, 59, 0.05) 100%)',
                        border: '1px solid rgba(255, 59, 59, 0.2)'
                    }}>
                        <HardDrive size={22} color="#ff3b3b" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Storage Usage</h2>
                        <p style={{ fontSize: '0.75rem', color: '#666', margin: '2px 0 0 0' }}>Server Storage • {formatSize(maxStorage)} Limit</p>
                    </div>
                </div>

                {/* Overall Usage Ring */}
                <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '24px' : '40px',
                    alignItems: isMobile ? 'center' : 'flex-start'
                }}>
                    {/* Enhanced Circular Progress with Glow */}
                    <div style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0 }}>
                        {/* Glow effect behind the ring */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '130px',
                            height: '130px',
                            borderRadius: '50%',
                            background: `radial-gradient(circle, ${usagePercentage > 80 ? 'rgba(255, 59, 59, 0.3)' : usagePercentage > 50 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'} 0%, transparent 70%)`,
                            filter: 'blur(10px)'
                        }} />

                        <svg width="160" height="160" style={{ transform: 'rotate(-90deg)', position: 'relative', zIndex: 1 }}>
                            {/* Background circle with subtle pattern */}
                            <circle
                                cx="80" cy="80" r="65"
                                fill="none"
                                stroke="rgba(255, 255, 255, 0.05)"
                                strokeWidth="14"
                            />
                            {/* Track circle */}
                            <circle
                                cx="80" cy="80" r="65"
                                fill="none"
                                stroke="#1a1a1a"
                                strokeWidth="14"
                            />
                            {/* Progress circle with gradient simulation */}
                            <circle
                                cx="80" cy="80" r="65"
                                fill="none"
                                stroke={usagePercentage > 80 ? '#ff3b3b' : usagePercentage > 50 ? '#f59e0b' : '#10b981'}
                                strokeWidth="14"
                                strokeLinecap="round"
                                strokeDasharray={`${usagePercentage * 4.08} 408`}
                                style={{
                                    transition: 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                                    filter: `drop-shadow(0 0 6px ${usagePercentage > 80 ? 'rgba(255, 59, 59, 0.5)' : usagePercentage > 50 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.5)'})`
                                }}
                            />
                        </svg>

                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                            zIndex: 2
                        }}>
                            <div style={{
                                fontSize: '2rem',
                                fontWeight: 800,
                                background: `linear-gradient(135deg, ${usagePercentage > 80 ? '#ff6b6b, #ff3b3b' : usagePercentage > 50 ? '#fbbf24, #f59e0b' : '#34d399, #10b981'})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.03em'
                            }}>
                                {usagePercentage.toFixed(1)}%
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 500, marginTop: '2px' }}>of {formatSize(maxStorage)}</div>
                        </div>
                    </div>

                    {/* Bucket Details - Enhanced Cards */}
                    <div style={{ flex: 1, width: '100%' }}>
                        {/* Summary Stats */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '20px',
                            padding: '12px 16px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                            <div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatSize(totalStorageUsed)}</div>
                                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '2px' }}>Total Used</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{totalFiles}</div>
                                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '2px' }}>Total Files</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatSize(maxStorage - totalStorageUsed)}</div>
                                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '2px' }}>Available</div>
                            </div>
                        </div>

                        {bucketStats.map((bucket, idx) => (
                            <div key={bucket.name} style={{
                                marginBottom: idx < bucketStats.length - 1 ? '16px' : 0,
                            }}>
                                <div
                                    onClick={() => toggleBucketExpanded(bucket.name)}
                                    style={{
                                        padding: '14px 16px',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        borderRadius: bucket.expanded ? '12px 12px 0 0' : '12px',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        borderBottom: bucket.expanded ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                padding: '6px',
                                                borderRadius: '8px',
                                                background: `${bucket.color}15`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <span style={{ color: bucket.color }}>{bucket.icon}</span>
                                            </div>
                                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{bucket.displayName}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {bucket.loading ? (
                                                <Loader2 size={14} className="animate-spin" style={{ color: '#666' }} />
                                            ) : (
                                                <>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{formatSize(bucket.totalSize)}</span>
                                                        <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: '8px' }}>{bucket.fileCount} files</span>
                                                    </div>
                                                    {bucket.expanded ? <ChevronUp size={18} color="#666" /> : <ChevronDown size={18} color="#666" />}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {/* Enhanced Progress bar */}
                                    <div style={{
                                        height: '8px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '4px',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            width: bucket.loading ? '0%' : `${Math.min((bucket.totalSize / maxStorage) * 100, 100)}%`,
                                            background: `linear-gradient(90deg, ${bucket.color}cc, ${bucket.color})`,
                                            borderRadius: '4px',
                                            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: `0 0 12px ${bucket.color}40`,
                                            position: 'relative'
                                        }}>
                                            {/* Shimmer effect */}
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                                                animation: 'shimmer 2s infinite'
                                            }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Expandable File List */}
                                {bucket.expanded && (
                                    <div style={{
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        borderRadius: '0 0 12px 12px',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        borderTop: 'none',
                                        maxHeight: '350px',
                                        overflowY: 'auto'
                                    }}>
                                        {/* Search Input */}
                                        {bucket.files.length > 0 && (
                                            <div style={{
                                                padding: '12px 16px',
                                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                                position: 'sticky',
                                                top: 0,
                                                background: 'rgba(15, 15, 20, 0.98)',
                                                backdropFilter: 'blur(8px)',
                                                zIndex: 1
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
                                                        placeholder="Search files..."
                                                        value={fileSearchTerms[bucket.name] || ''}
                                                        onChange={(e) => setFileSearchTerms(prev => ({ ...prev, [bucket.name]: e.target.value }))}
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
                                                    {fileSearchTerms[bucket.name] && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setFileSearchTerms(prev => ({ ...prev, [bucket.name]: '' }))
                                                            }}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                padding: '2px',
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            <X size={14} color="#666" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {bucket.files.length === 0 ? (
                                            <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>
                                                No files in this folder
                                            </div>
                                        ) : (() => {
                                            const filteredFiles = bucket.files.filter(file => {
                                                const searchTerm = fileSearchTerms[bucket.name]?.toLowerCase() || ''
                                                return !searchTerm || file.name.toLowerCase().includes(searchTerm)
                                            })

                                            if (filteredFiles.length === 0) {
                                                return (
                                                    <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>
                                                        No files matching "{fileSearchTerms[bucket.name]}"
                                                    </div>
                                                )
                                            }

                                            return filteredFiles.map((file, fileIdx) => (
                                                <div
                                                    key={file.name}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '10px 16px',
                                                        borderBottom: fileIdx < filteredFiles.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none',
                                                        transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            fontSize: '0.85rem',
                                                            fontWeight: 500,
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            maxWidth: isMobile ? '150px' : '300px'
                                                        }}>
                                                            {file.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
                                                            {formatSize(file.size)}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                                                        <a
                                                            href={file.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                padding: '6px',
                                                                borderRadius: '6px',
                                                                background: 'rgba(59, 130, 246, 0.15)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                transition: 'background 0.15s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <ExternalLink size={14} color="#3b82f6" />
                                                        </a>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteFile(bucket.name, file.name)
                                                            }}
                                                            disabled={deletingFile === file.name}
                                                            style={{
                                                                padding: '6px',
                                                                borderRadius: '6px',
                                                                background: 'rgba(239, 68, 68, 0.15)',
                                                                border: 'none',
                                                                cursor: deletingFile === file.name ? 'wait' : 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                transition: 'background 0.15s',
                                                                opacity: deletingFile === file.name ? 0.5 : 1
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (deletingFile !== file.name) e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
                                                            }}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                                                        >
                                                            {deletingFile === file.name ? (
                                                                <Loader2 size={14} className="animate-spin" color="#ef4444" />
                                                            ) : (
                                                                <Trash2 size={14} color="#ef4444" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        })()}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* CSS for shimmer animation */}
                <style>{`
                    @keyframes shimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                `}</style>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: isMobile ? '16px' : '24px'
            }}>
                {/* Stats Card */}
                <div style={{
                    padding: isMobile ? '20px' : '24px',
                    borderRadius: '16px',
                    background: 'rgba(255, 59, 59, 0.1)',
                    border: '1px solid rgba(255, 59, 59, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <span style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#ff3b3b', fontWeight: 600 }}>TOTAL POSTS</span>
                    <span style={{ fontSize: isMobile ? '2.5rem' : '3.5rem', fontWeight: 800, lineHeight: 1 }}>{posts.length}</span>
                </div>

                {sections.map(section => (
                    <Link
                        key={section.id}
                        to={`/admin/section/${section.id}`}
                        style={{
                            padding: isMobile ? '20px' : '24px',
                            borderRadius: '16px',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'transform 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: isMobile ? '12px' : '16px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)'
                            e.currentTarget.style.borderColor = '#555'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.borderColor = '#333'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{
                                width: isMobile ? '36px' : '40px',
                                height: isMobile ? '36px' : '40px',
                                borderRadius: '10px',
                                background: '#333',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Layers size={isMobile ? 18 : 20} color="#fff" />
                            </div>
                            <div style={{
                                padding: '4px 10px',
                                borderRadius: '100px',
                                background: '#222',
                                fontSize: isMobile ? '0.7rem' : '0.8rem',
                                fontWeight: 600
                            }}>
                                {section.label}
                            </div>
                        </div>

                        <div>
                            <h3 style={{
                                fontSize: isMobile ? '1.1rem' : '1.2rem',
                                fontWeight: 700,
                                margin: '0 0 4px 0'
                            }}>{section.title}</h3>
                            <div style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#888' }}>
                                {getPostCount(section.id)} Posts published
                            </div>
                        </div>

                        <div style={{
                            marginTop: 'auto',
                            paddingTop: isMobile ? '12px' : '16px',
                            borderTop: '1px solid #333',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: isMobile ? '0.8rem' : '0.9rem',
                            fontWeight: 500,
                            color: '#ff3b3b'
                        }}>
                            Manage Section <Plus size={14} />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
