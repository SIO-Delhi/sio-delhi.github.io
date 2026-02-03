import React, { useState, useRef } from 'react'
import { Download, Upload, Calendar, User, ChevronLeft, X, Edit3, Eye, Palette } from 'lucide-react'
import { useHistory } from '../../../hooks/useHistory'
import { EventPosterSvg, type Speaker } from './EventPosterSvg'
import './poster.css'

import bodoniModa28ptUrl from '../../../fonts/Bodoni_Moda/static/BodoniModa_28pt-Regular.ttf'
import cynthoNextBoldUrl from '../../../fonts/cyntho-next/CynthoNextBold.otf'
import montserratUrl from '../../../fonts/Montserrat/Montserrat-VariableFont_wght.ttf'
import montserratItalicUrl from '../../../fonts/Montserrat/Montserrat-Italic-VariableFont_wght.ttf'

const fontDefs = [
    { family: 'BodoniModa28pt', url: bodoniModa28ptUrl, format: 'truetype' },
    { family: 'CynthoNextBold', url: cynthoNextBoldUrl, format: 'opentype' },
    { family: 'Montserrat', url: montserratUrl, format: 'truetype' },
    { family: 'MontserratItalic', url: montserratItalicUrl, format: 'truetype' },
]

async function buildEmbeddedFontStyles(): Promise<string> {
    const rules: string[] = []
    for (const font of fontDefs) {
        try {
            const resp = await fetch(font.url)
            const blob = await resp.blob()
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result as string)
                reader.readAsDataURL(blob)
            })
            rules.push(`@font-face { font-family: '${font.family}'; src: url('${base64}') format('${font.format}'); }`)
        } catch (e) {
            console.warn(`Failed to embed font ${font.family}`, e)
        }
    }
    return rules.join('\n')
}

interface EventPosterState {
    title: string
    date: string
    day: string
    timeStart: string
    timeEnd: string
    venue: string
    speakerCount: 2 | 3
    speakers: Speaker[]
    hue: number
    unitName: string
}

const defaultSpeaker = (): Speaker => ({
    photo: null,
    topic: '',
    name: '',
    designation: '',
})

const defaultState: EventPosterState = {
    title: 'Weekly Tarbiyah Program',
    date: '03 February 2026',
    day: 'Tuesday',
    timeStart: '06:30 PM',
    timeEnd: '07:30 PM',
    venue: 'Masjid Isha\'at-e-Islam, Delhi',
    speakerCount: 3,
    speakers: [defaultSpeaker(), defaultSpeaker(), defaultSpeaker()],
    hue: 0,
    unitName: 'DELHI',
}

interface Props {
    speakerCount: 2 | 3
    onBack: () => void
}

export function EventPosterTool({ speakerCount, onBack }: Props) {
    const { state, set: setState } = useHistory<EventPosterState>({
        ...defaultState,
        speakerCount,
        speakers: Array.from({ length: speakerCount }, defaultSpeaker),
    })
    const svgRef = useRef<SVGSVGElement>(null)
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
    const [activeSpeaker, setActiveSpeaker] = useState(0)
    const [downloading, setDownloading] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [localHue, setLocalHue] = useState(state.hue)
    const previewContainerRef = useRef<HTMLDivElement>(null)

    // Fast Hue Update logic
    const handleHueChange = (newHue: number) => {
        setLocalHue(newHue)
        // Directly update CSS variable for lag-free preview
        if (previewContainerRef.current) {
            previewContainerRef.current.style.setProperty('--ep-hue', `${newHue}deg`)
        }
    }

    // Sync localHue when state.hue changes (e.g. from history undo/redo)
    React.useEffect(() => {
        setLocalHue(state.hue)
    }, [state.hue])

    React.useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    const updateField = <K extends keyof EventPosterState>(key: K, value: EventPosterState[K]) => {
        setState(prev => ({ ...prev, [key]: value }))
    }

    const updateSpeaker = (index: number, field: keyof Speaker, value: string | null) => {
        setState(prev => {
            const speakers = [...prev.speakers]
            speakers[index] = { ...speakers[index], [field]: value }
            return { ...prev, speakers }
        })
    }

    const handlePhotoUpload = (index: number, file: File) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            if (e.target?.result) {
                updateSpeaker(index, 'photo', e.target.result as string)
            }
        }
        reader.readAsDataURL(file)
    }

    const downloadPoster = async () => {
        if (!svgRef.current) return
        setDownloading(true)

        try {
            const fontStyles = await buildEmbeddedFontStyles()

            // Serialize the SVG from the ref
            const serializer = new XMLSerializer()
            let svgData = serializer.serializeToString(svgRef.current)

            // Set fixed dimensions for download
            svgData = svgData.replace(/width="100%"/, 'width="2000"')
            svgData = svgData.replace(/height="100%"/, 'height="2500"')

            // Inject embedded font styles
            svgData = svgData.replace(/<svg([^>]*)>/, `<svg$1><defs><style>${fontStyles}</style></defs>`)

            const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData)
            const img = new window.Image()
            img.crossOrigin = 'anonymous'

            img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = 2000
                canvas.height = 2500
                const ctx = canvas.getContext('2d')

                if (ctx) {
                    ctx.fillStyle = '#ffffff'
                    ctx.fillRect(0, 0, canvas.width, canvas.height)
                    ctx.drawImage(img, 0, 0, 2000, 2500)

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const blobUrl = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = blobUrl
                            a.download = `event-poster-${state.date.replace(/\s+/g, '-')}.jpg`
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                            URL.revokeObjectURL(blobUrl)
                        }
                        setDownloading(false)
                    }, 'image/jpeg', 0.95)
                } else {
                    setDownloading(false)
                }
            }

            img.onerror = () => {
                // Fallback SVG download
                const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `event-poster-${state.date.replace(/\s+/g, '-')}.svg`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
                setDownloading(false)
            }

            img.src = svgDataUrl
        } catch {
            setDownloading(false)
        }
    }

    const currentSpeaker = state.speakers[activeSpeaker] || defaultSpeaker()

    // Edit panel content
    const editPanel = (
        <div className="ep-edit-panel">
            <button className="ep-back-btn" onClick={onBack}>
                <ChevronLeft size={18} /> Back to Templates
            </button>

            {/* Event Info */}
            <div className="ep-section">
                <div className="ep-section-header">
                    <Calendar size={16} />
                    <span>Event Info</span>
                </div>

                <label className="pt-label">Event Title</label>
                <textarea
                    className="pt-input"
                    value={state.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    rows={2}
                    style={{ resize: 'vertical', minHeight: '60px' }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                        <label className="pt-label">Date</label>
                        <input
                            className="pt-input"
                            value={state.date}
                            onChange={(e) => updateField('date', e.target.value)}
                            placeholder="26 August 2025"
                        />
                    </div>
                    <div>
                        <label className="pt-label">Day</label>
                        <input
                            className="pt-input"
                            value={state.day}
                            onChange={(e) => updateField('day', e.target.value)}
                            placeholder="Tuesday"
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                        <label className="pt-label">Start Time</label>
                        <input
                            className="pt-input"
                            value={state.timeStart}
                            onChange={(e) => updateField('timeStart', e.target.value)}
                            placeholder="09:30 PM"
                        />
                    </div>
                    <div>
                        <label className="pt-label">End Time</label>
                        <input
                            className="pt-input"
                            value={state.timeEnd}
                            onChange={(e) => updateField('timeEnd', e.target.value)}
                            placeholder="12:30 AM"
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                        <label className="pt-label">Venue</label>
                        <input
                            className="pt-input"
                            value={state.venue}
                            onChange={(e) => updateField('venue', e.target.value)}
                            placeholder="Masjid Name, City"
                        />
                    </div>
                    <div>
                        <label className="pt-label">Unit Name</label>
                        <input
                            className="pt-input"
                            value={state.unitName}
                            onChange={(e) => updateField('unitName', e.target.value)}
                            placeholder="DELHI"
                        />
                    </div>
                </div>
            </div>

            {/* Speaker Tabs */}
            <div className="ep-section">
                <div className="ep-section-header">
                    <User size={16} />
                    <span>Speakers ({state.speakerCount})</span>
                </div>

                <div className="ep-speaker-tabs">
                    {state.speakers.map((_, i) => (
                        <button
                            key={i}
                            className={`ep-speaker-tab ${activeSpeaker === i ? 'active' : ''}`}
                            onClick={() => setActiveSpeaker(i)}
                        >
                            Speaker {i + 1}
                        </button>
                    ))}
                </div>

                {/* Photo upload */}
                <label className="pt-label">Photo</label>
                {currentSpeaker.photo ? (
                    <div className="ep-photo-preview">
                        <img src={currentSpeaker.photo} alt={`Speaker ${activeSpeaker + 1}`} />
                        <button
                            className="ep-photo-remove"
                            onClick={() => updateSpeaker(activeSpeaker, 'photo', null)}
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <label className="ep-upload-label">
                        <Upload size={20} />
                        <span>Upload Photo</span>
                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handlePhotoUpload(activeSpeaker, file)
                                e.target.value = ''
                            }}
                        />
                    </label>
                )}

                <label className="pt-label">Topic</label>
                <input
                    className="pt-input"
                    value={currentSpeaker.topic}
                    onChange={(e) => updateSpeaker(activeSpeaker, 'topic', e.target.value)}
                    placeholder="Talk topic or title"
                />

                <label className="pt-label">Name</label>
                <input
                    className="pt-input"
                    value={currentSpeaker.name}
                    onChange={(e) => updateSpeaker(activeSpeaker, 'name', e.target.value)}
                    placeholder="Speaker Name"
                />

                <label className="pt-label">Designation</label>
                <input
                    className="pt-input"
                    value={currentSpeaker.designation}
                    onChange={(e) => updateSpeaker(activeSpeaker, 'designation', e.target.value)}
                    placeholder="Title, Organization"
                />
            </div>


            {/* Style - Desktop Only */}
            {!isMobile && (
                <div className="ep-section">
                    <div className="ep-section-header">
                        <Palette size={16} />
                        <span>Style</span>
                    </div>
                    <label className="pt-label">Color Theme</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                            type="range"
                            min={0}
                            max={360}
                            value={localHue}
                            onChange={(e) => handleHueChange(Number(e.target.value))}
                            onPointerUp={() => updateField('hue', localHue)}
                            className="pt-slider"
                            style={{ flex: 1 }}
                        />
                        <span style={{
                            fontSize: '0.85rem',
                            color: 'var(--pt-accent)',
                            fontWeight: 'bold',
                            fontFamily: 'monospace',
                            minWidth: '45px',
                            textAlign: 'right'
                        }}>
                            {localHue.toString().padStart(3, '0')}°
                        </span>
                    </div>
                </div>
            )}
        </div>
    )

    // Hidden SVG for download (with forDownload=true)
    const downloadSvg = (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <EventPosterSvg
                ref={svgRef}
                {...state}
                forDownload={true}
            />
        </div>
    )

    // Preview SVG - Performance Optimized
    const previewSvg = (
        <div
            ref={previewContainerRef}
            className="ep-preview-container"
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%'
            }}
        >
            <EventPosterSvg {...state} hue={localHue} />
        </div>
    )

    if (isMobile) {
        return (
            <div className="poster-tool-container">
                {downloadSvg}

                {/* Main Content Area */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {activeTab === 'edit' ? (
                        <div className="pt-sidebar-left pt-active" style={{ width: '100%', border: 'none' }}>
                            {editPanel}
                        </div>
                    ) : (
                        <div className="pt-center-preview" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px', backgroundColor: '#000000' }}>
                            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {previewSvg}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Controls (Preview only) */}
                {
                    activeTab === 'preview' && (
                        <div style={{ padding: '16px', background: 'var(--pt-bg-main)', borderTop: '1px solid var(--pt-border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label className="pt-label" style={{ marginBottom: '8px', display: 'block' }}>Color Style</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <input
                                        type="range"
                                        min={0}
                                        max={360}
                                        value={localHue}
                                        onChange={(e) => setLocalHue(Number(e.target.value))}
                                        onPointerUp={() => updateField('hue', localHue)}
                                        className="pt-slider"
                                        style={{ flex: 1 }}
                                    />
                                    <span style={{ fontSize: '0.8rem', color: '#a1a1aa', width: '3ch', textAlign: 'right' }}>{localHue}°</span>
                                </div>
                            </div>
                            <button
                                className="pt-btn pt-btn-primary"
                                style={{ width: '100%' }}
                                onClick={downloadPoster}
                                disabled={downloading}
                            >
                                <Download size={18} />
                                {downloading ? 'Generating...' : 'Download JPEG'}
                            </button>
                        </div>
                    )
                }

                {/* Bottom Tabs */}
                <div className="pt-mobile-tabs">
                    <button
                        className={`pt-tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
                        onClick={() => setActiveTab('edit')}
                    >
                        <Edit3 size={18} />
                        Edit Details
                    </button>
                    <button
                        className={`pt-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('preview')}
                    >
                        <Eye size={18} />
                        Preview Poster
                    </button>
                </div>
            </div >
        )
    }

    // Desktop layout
    return (
        <div className="ep-desktop-layout">
            {downloadSvg}

            {/* Sidebar */}
            <div className="pt-sidebar-left">
                {editPanel}
            </div>

            {/* Preview */}
            <div className="pt-center-preview">
                <div className="ep-preview-wrapper">
                    {previewSvg}
                </div>

                {/* Download button floating (Top Right) */}
                <div className="pt-preview-toolbar">
                    <button
                        className="pt-download-btn"
                        onClick={downloadPoster}
                        disabled={downloading}
                    >
                        <Download size={18} />
                        {downloading ? 'Generating...' : 'Download JPEG'}
                    </button>
                </div>
            </div>
        </div>
    )
}
