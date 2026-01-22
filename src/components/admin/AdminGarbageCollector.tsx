import { useState, useEffect } from 'react'
import { useContent } from '../../context/ContentContext'
import { supabase } from '../../lib/supabase'
import { Trash2, RefreshCw, CheckSquare, Square, AlertTriangle, FileText, Music, Loader2 } from 'lucide-react'

interface StorageFile {
    name: string
    id: string | null
    updated_at: string
    created_at: string
    last_accessed_at: string
    metadata: Record<string, any>
    bucket: 'post-images' | 'post-pdfs' | 'post-audios'
    url: string
}

export function AdminGarbageCollector() {
    const { posts, sections } = useContent()
    const [loading, setLoading] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    // const [files, setFiles] = useState<StorageFile[]>([]) // Unused
    const [orphans, setOrphans] = useState<StorageFile[]>([])
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [deleting, setDeleting] = useState(false)

    // Helper to extract all URLs from HTML content
    const extractUrlsFromHtml = (html: string): string[] => {
        if (!html) return []
        const urls: string[] = []
        // Match src="..."
        const srcRegex = /src=["']([^"']+)["']/g
        let match
        while ((match = srcRegex.exec(html)) !== null) {
            urls.push(match[1])
        }
        // Match href="..." (for linked files/PDFs)
        const hrefRegex = /href=["']([^"']+)["']/g
        while ((match = hrefRegex.exec(html)) !== null) {
            urls.push(match[1])
        }
        return urls
    }

    // Fetch all files from a bucket
    const fetchBucketFiles = async (bucketName: 'post-images' | 'post-pdfs' | 'post-audios'): Promise<StorageFile[]> => {
        try {
            const { data, error } = await supabase.storage.from(bucketName).list('', { limit: 1000, offset: 0 })
            if (error) throw error

            return (data || []).map(file => {
                const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(file.name)
                return {
                    ...file,
                    bucket: bucketName,
                    url: urlData.publicUrl
                }
            })
        } catch (err) {
            console.error(`Error fetching ${bucketName}:`, err)
            return []
        }
    }

    const scanValues = () => {
        setAnalyzing(true)
        setLoading(true)

        // 1. Fetch all files from storage
        Promise.all([
            fetchBucketFiles('post-images'),
            fetchBucketFiles('post-pdfs'),
            fetchBucketFiles('post-audios')
        ]).then(([images, pdfs, audios]) => {
            const allFiles = [...images, ...pdfs, ...audios]
            // setFiles(allFiles)

            // 2. Collect all Used URLs from DB
            const usedUrls = new Set<string>()

            // Sections
            sections.forEach(_s => {
                // If sections had images/icons, add here. Currently only text/template, but flexible.
            })

            // Posts
            posts.forEach(p => {
                if (p.image) usedUrls.add(p.image)
                if (p.pdfUrl) usedUrls.add(p.pdfUrl)
                if (p.icon) usedUrls.add(p.icon) // if icon is a URL (some implementations use icon name, some might use custom upload)

                // Content (HTML)
                if (p.content) {
                    const contentUrls = extractUrlsFromHtml(p.content)
                    contentUrls.forEach(u => usedUrls.add(u))
                }

                // Check potentially other fields if schema evolves (e.g. carousel images encoded in content or separate field)
            })

            // 3. Find Orphans
            // We match by checking if the File URL is contained in the Used URLs set.
            // Note: Supabase Public URLs are standard. 
            // However, DB usage might store just the path or full URL. Usually we store full URL.
            // Also need to be careful about URL encoded chars.

            const orphanFiles = allFiles.filter(f => {
                // Check if this file's URL is present in any known usages
                // Normalize both sides to be safe (though usually strict match should work if consistency is maintained)
                const fileUrl = f.url

                // Simple check: is the strict URL in the set?
                let isUsed = usedUrls.has(fileUrl)

                // Looser check: iterate used URLs to see if they end with filename (risky if filenames duplicate)
                // or if they match encoded/decoded versions
                if (!isUsed) {
                    // Try to match by filename if strict URL fail (sometimes different domains or http/https mismatches)
                    const found = Array.from(usedUrls).some(used => used.includes(f.name))
                    if (found) isUsed = true
                }

                return !isUsed
            })

            setOrphans(orphanFiles)
            setAnalyzing(false)
            setLoading(false)
        }).catch(err => {
            console.error("Scan failed:", err)
            setAnalyzing(false)
            setLoading(false)
            alert("Failed to scan storage.")
        })
    }

    useEffect(() => {
        scanValues()
    }, [posts]) // Re-scan when posts change (initial load)

    const toggleSelect = (url: string) => {
        const next = new Set(selected)
        if (next.has(url)) next.delete(url)
        else next.add(url)
        setSelected(next)
    }

    const toggleSelectAll = () => {
        if (selected.size === orphans.length) {
            setSelected(new Set())
        } else {
            setSelected(new Set(orphans.map(f => f.url)))
        }
    }

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selected.size} files? This cannot be undone.`)) return

        setDeleting(true)
        const toDelete = orphans.filter(f => selected.has(f.url))

        try {
            // Group by bucket
            const groups: Record<string, string[]> = {}
            toDelete.forEach(f => {
                if (!groups[f.bucket]) groups[f.bucket] = []
                groups[f.bucket].push(f.name)
            })

            // Execute deletes
            for (const bucket of Object.keys(groups)) {
                if (groups[bucket].length > 0) {
                    const { error } = await supabase.storage.from(bucket).remove(groups[bucket])
                    if (error) throw error
                }
            }

            // Refresh
            setSelected(new Set())
            scanValues()
            alert("Cleanup complete.")
        } catch (err: any) {
            console.error("Delete failed:", err)
            alert("Delete failed: " + err.message)
        } finally {
            setDeleting(false)
        }
    }

    const formatSize = (bytes: number) => {
        if (!bytes) return '0 B'
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Storage Cleaner</h1>
                    <p style={{ color: '#888' }}>Detect and remove unused files from your buckets.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={scanValues}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#333', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                        Scan Now
                    </button>
                </div>
            </div>

            {analyzing && (
                <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
                    <Loader2 size={40} className="animate-spin" style={{ marginBottom: '16px' }} />
                    <p>Analyzing storage vs database usage...</p>
                </div>
            )}

            {!analyzing && orphans.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(46, 255, 113, 0.05)', borderRadius: '16px', border: '1px solid rgba(46, 255, 113, 0.2)' }}>
                    <CheckSquare size={48} color="#2eff71" style={{ marginBottom: '16px' }} />
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>All Clean!</h2>
                    <p style={{ color: '#888' }}>No unused files found in your storage buckets.</p>
                </div>
            )}

            {!analyzing && orphans.length > 0 && (
                <>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '16px 24px', background: '#1a1a1a', borderRadius: '12px', marginBottom: '24px',
                        border: '1px solid #333'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <AlertTriangle size={20} color="#ffbb3b" />
                            <span style={{ fontWeight: 600, color: '#ffbb3b' }}>{orphans.length} Potential Orphans Found</span>
                            <span style={{ color: '#666' }}>({formatSize(orphans.reduce((acc, f) => acc + (f.metadata?.size || 0), 0))})</span>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <button onClick={toggleSelectAll} style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                                {selected.size === orphans.length ? 'Deselect All' : 'Select All'}
                            </button>
                            {selected.size > 0 && (
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    style={{
                                        background: '#ff3b3b', color: 'white', border: 'none',
                                        padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '8px'
                                    }}
                                >
                                    {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                    Delete {selected.size} Files
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                        {orphans.map(file => {
                            const isSelected = selected.has(file.url)
                            return (
                                <div
                                    key={file.url}
                                    onClick={() => toggleSelect(file.url)}
                                    style={{
                                        position: 'relative',
                                        background: '#111',
                                        border: isSelected ? '2px solid #ff3b3b' : '1px solid #333',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex', flexDirection: 'column'
                                    }}
                                >
                                    <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10 }}>
                                        {isSelected ? (
                                            <div style={{ background: '#ff3b3b', borderRadius: '4px', padding: '2px', display: 'flex' }}>
                                                <CheckSquare size={16} color="white" />
                                            </div>
                                        ) : (
                                            <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '4px', padding: '2px', display: 'flex' }}>
                                                <Square size={16} color="rgba(255,255,255,0.7)" />
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ aspectRatio: '16/9', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {file.bucket === 'post-images' ? (
                                            <img src={file.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="orphan" />
                                        ) : file.bucket === 'post-audios' ? (
                                            <Music size={48} color="#444" />
                                        ) : (
                                            <FileText size={48} color="#444" />
                                        )}
                                    </div>

                                    <div style={{ padding: '12px' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{file.bucket}</div>
                                        <div style={{ fontSize: '0.9rem', color: '#eee', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }} title={file.name}>
                                            {file.name}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                            {formatSize(file.metadata?.size)} • {new Date(file.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}
