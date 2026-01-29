import { useState } from 'react'
import { useContent } from '../../context/ContentContext'
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, Loader2, Database } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.siodelhi.org'

interface FileInfo {
    name: string
    size: number
    url: string
    modified: number
}

interface OrphanFile extends FileInfo {
    bucket: string
}

export function AdminGarbageCollector() {
    const { posts } = useContent()
    const [isScanning, setIsScanning] = useState(false)
    const [orphans, setOrphans] = useState<OrphanFile[]>([])
    const [scannedCount, setScannedCount] = useState(0)
    const [deleting, setDeleting] = useState<string | null>(null)

    const scanForOrphans = async () => {
        setIsScanning(true)
        setOrphans([])

        try {
            // 1. Fetch all files from storage
            const response = await fetch(`${API_BASE}/stats/storage`)
            if (!response.ok) throw new Error('Failed to fetch storage stats')
            const data = await response.json()

            // Flatten files from buckets
            const allFiles: { bucket: string, file: FileInfo }[] = []
            if (data.buckets) {
                Object.entries(data.buckets).forEach(([bucketName, bucketData]: [string, any]) => {
                    if (bucketData.files) {
                        bucketData.files.forEach((f: FileInfo) => {
                            allFiles.push({ bucket: bucketName, file: f })
                        })
                    }
                })
            }

            setScannedCount(allFiles.length)

            // 2. Build Set of ALL used URLs from Content
            const usedUrls = new Set<string>()



            // B. Posts
            posts.forEach(p => {
                if (p.image) usedUrls.add(p.image)
                if (p.galleryImages && Array.isArray(p.galleryImages)) {
                    p.galleryImages.forEach(img => usedUrls.add(img))
                }

                // Content Blocks (Images and PDFs)
                if (p.content) {
                    try {
                        const blocks = typeof p.content === 'string' ? JSON.parse(p.content) : p.content
                        if (Array.isArray(blocks)) {
                            blocks.forEach((b: any) => {
                                if (b.type === 'image' && b.url) usedUrls.add(b.url)
                                if (b.type === 'pdf' && b.url) usedUrls.add(b.url)
                                if (b.type === 'gallery' && Array.isArray(b.images)) {
                                    b.images.forEach((img: string) => usedUrls.add(img))
                                }
                                if (b.type === 'composite' && Array.isArray(b.items)) {
                                    b.items.forEach((item: any) => {
                                        if (item.image) usedUrls.add(item.image)
                                    })
                                }
                            })
                        }
                    } catch (e) {
                        console.warn('Error parsing post content', p.id)
                    }
                }
            })

            // 3. Find Orphans
            const foundOrphans: OrphanFile[] = []

            allFiles.forEach(({ bucket, file }) => {
                // Check if file.url matches any used URL
                // Note: stored URLs are usually full absolute URLs, but might vary
                // We should check if the filename exists in the used URLs as a rough check if exact match fails

                let isUsed = false

                // Exact match check
                if (usedUrls.has(file.url)) isUsed = true

                // If not found, try checking if the filename is part of any used URL (handling relative/absolute differences)
                if (!isUsed) {
                    for (const used of usedUrls) {
                        if (used.includes(file.name)) {
                            isUsed = true
                            break
                        }
                    }
                }

                if (!isUsed) {
                    foundOrphans.push({ ...file, bucket })
                }
            })

            setOrphans(foundOrphans)

        } catch (err) {
            console.error('Scan failed', err)
            alert('Failed to scan storage')
        } finally {
            setIsScanning(false)
        }
    }

    const handleDelete = async (file: OrphanFile) => {
        if (!confirm(`Permanently delete "${file.name}"? This cannot be undone.`)) return

        setDeleting(file.name)
        try {
            const res = await fetch(`${API_BASE}/upload/${file.bucket}/${encodeURIComponent(file.name)}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error('Delete failed')

            setOrphans(prev => prev.filter(p => p.name !== file.name))
        } catch (err) {
            alert('Failed to delete file')
        } finally {
            setDeleting(null)
        }
    }

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>

                <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Database color="#ff3b3b" />
                    Garbage Collector
                </h1>
                <p style={{ color: '#888', marginTop: '8px' }}>
                    Scan your storage contents to identify and remove files that are not being used in any posts or sections.
                </p>
            </div>

            <div style={{ background: '#1a1a1a', borderRadius: '16px', border: '1px solid #333', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Scan Results</h2>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>
                            {scannedCount > 0 ? `Scanned ${scannedCount} files` : 'Ready to scan'}
                        </p>
                    </div>
                    <button
                        onClick={scanForOrphans}
                        disabled={isScanning}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '8px',
                            background: isScanning ? '#333' : '#ff3b3b',
                            color: 'white', border: 'none', fontWeight: 600,
                            cursor: isScanning ? 'wait' : 'pointer'
                        }}
                    >
                        {isScanning ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                        {isScanning ? 'Scanning...' : 'Start Scan'}
                    </button>
                </div>

                {orphans.length > 0 ? (
                    <div>
                        <div style={{
                            padding: '12px 16px', background: 'rgba(255, 165, 0, 0.1)',
                            border: '1px solid rgba(255, 165, 0, 0.2)', borderRadius: '8px',
                            marginBottom: '20px', color: '#ffa500', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.9rem'
                        }}>
                            <AlertTriangle size={18} />
                            <span>Found {orphans.length} orphaned files taking up {formatSize(orphans.reduce((acc, f) => acc + f.size, 0))}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {orphans.map(file => (
                                <div key={file.name} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 16px', background: '#222', borderRadius: '8px', border: '1px solid #333'
                                }}>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{
                                                fontSize: '0.7rem', textTransform: 'uppercase', padding: '2px 6px',
                                                borderRadius: '4px', background: '#333', color: '#888'
                                            }}>
                                                {file.bucket}
                                            </span>
                                            <a href={file.url} target="_blank" rel="noopener noreferrer" style={{
                                                color: 'white', textDecoration: 'none', fontWeight: 500,
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px', display: 'block'
                                            }}>
                                                {file.name}
                                            </a>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                                            {formatSize(file.size)} • Modified {new Date(file.modified * 1000).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(file)}
                                        disabled={deleting === file.name}
                                        style={{
                                            padding: '8px', background: 'rgba(255, 59, 59, 0.1)',
                                            color: '#ff3b3b', border: 'none', borderRadius: '6px',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >
                                        {deleting === file.name ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center', padding: '40px', color: '#555',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
                    }}>
                        <CheckCircle size={40} />
                        <p>{scannedCount > 0 ? 'No orphans found! Your storage is clean.' : 'Click "Start Scan" to check for unused files.'}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
