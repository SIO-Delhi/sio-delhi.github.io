import React, { useState, useEffect, useRef } from 'react'
import { Grid, Layers, Type, Image as ImageIcon, Briefcase, Download, Upload, AlertCircle, Plus, X, Box, Calendar, User, Palette, Edit3, RefreshCcw, Eye } from 'lucide-react'
import { UndoRedoGroup } from '../../ui/UndoRedoGroup'
import { useHistory } from '../../../hooks/useHistory'
import posterSvgUrl from '../../../assets/poster.svg'
import './poster.css'

interface PosterState {
    header: string
    topic: string
    name: string
    name2: string
    position: string
    organization: string
    location: string
    time: string
    date: string
    hue: number
    image: string | null
    logoText: string
}

const INITIAL_STATE: PosterState = {
    header: 'Weekly Program',
    topic: '',
    name: 'First Name',
    name2: 'Last Name',
    position: 'Position / Title,',
    organization: 'Organization Name',
    location: 'Abul Fazal Enclave, Okhla',
    time: '00:00 PM',
    date: 'DD Mon YYYY',
    hue: 0,
    image: null,
    logoText: 'DELHI'
}



export function PosterTool() {
    const { state, set: setState, undo, redo, canUndo, canRedo } = useHistory<PosterState>(INITIAL_STATE)
    const [svgContent, setSvgContent] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

    const containerRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const isAdjustingRef = useRef(false)
    const hasCapturedStartRef = useRef(false)

    useEffect(() => {
        fetch(posterSvgUrl)
            .then(res => res.text())
            .then(text => {
                setSvgContent(text)
                setLoading(false)
            })
            .catch(err => {
                console.error('Failed to load poster SVG', err)
                setLoading(false)
            })
    }, [])

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                setState(prev => ({ ...prev, image: e.target?.result as string }))
            }
            reader.readAsDataURL(file)
        }
    }

    const downloadPoster = () => {
        if (!containerRef.current) return


        const svgData = getProcessedSvg(true)
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const img = new Image()

        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = 2000
            canvas.height = 2500
            const ctx = canvas.getContext('2d')

            if (ctx) {
                ctx.drawImage(img, 0, 0)
                const jpgUrl = canvas.toDataURL('image/jpeg', 0.95)

                const a = document.createElement('a')
                a.href = jpgUrl
                a.download = `poster - ${state.date.replace(/\s+/g, '-')}.jpg`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
            }
        }
        img.src = url
    }

    const escapeXml = (unsafe: string) => {
        return unsafe.replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;'
                case '>': return '&gt;'
                case '&': return '&amp;'
                case '\'': return '&apos;'
                case '"': return '&quot;'
                default: return c
            }
        })
    }



    const getProcessedSvg = (forDownload = false) => {
        if (!svgContent) return ''

        // Remove XML declaration if present
        let processed = svgContent.replace(/<\?xml.*?\?>/, '')

        // Inject width/height for responsiveness
        const width = forDownload ? '2000' : '100%'
        const height = forDownload ? '2500' : '100%'

        processed = processed.replace(
            /<svg([^>]*)>/,
            `< svg$1 width = "${width}" height = "${height}" preserveAspectRatio = "xMidYMid meet" style = "filter: hue-rotate(${state.hue}deg);" > `
        )

        // 1. Hide Original Elements (Text & Icons) that we are replacing
        const idsToHide = [
            'logo-delhi-text',
            'topic-path-group',
            'icon-location',
            'icon-time',
            'icon-date',
            'speaker-icon-group' // handled conditionally below but good to track
        ]

        // Hide known text groups by finding their transform coordinates or classes if IDs don't exist
        // Note: exact string matches from the file content
        const textHidingReplacements = {
            // Header
            '<text class="st2" transform="translate(784.51 352.95)">': '<text class="st2" transform="translate(784.51 352.95)" style="display:none">',
            // Location
            '<text class="st5" transform="translate(623.78 2030.79)">': '<text class="st5" transform="translate(623.78 2030.79)" style="display:none">',
            // Time
            '<text class="st5" transform="translate(911.07 1905.45)">': '<text class="st5" transform="translate(911.07 1905.45)" style="display:none">',
            // Date
            '<text class="st5" transform="translate(883.55 1780.68)">': '<text class="st5" transform="translate(883.55 1780.68)" style="display:none">'
        }

        Object.entries(textHidingReplacements).forEach(([key, value]) => {
            processed = processed.replace(key, value)
        })

        // Hidings IDs
        idsToHide.forEach(id => {
            processed = processed.replace(`id = "${id}"`, `id = "${id}" style = "display: none;"`)
        })

        // 2. Image Replacement (Keep existing logic)
        const placeholderRect = '<rect class="st8" x="411.99" y="1023.4" width="524.41" height="573.33" rx="68.4" ry="68.4"/>'
        if (state.image) {
            const imageTag = `
    < defs >
    <clipPath id="speaker-clip">
        <rect x="411.99" y="1023.4" width="524.41" height="573.33" rx="68.4" ry="68.4" />
    </clipPath>
            </defs >
    <image
        x="411.99"
        y="1023.4"
        width="524.41"
        height="573.33"
        preserveAspectRatio="xMidYMid slice"
        clip-path="url(#speaker-clip)"
        href="${state.image}"
        style="filter: hue-rotate(-${state.hue}deg);"
    />`
            processed = processed.replace(placeholderRect, imageTag)
        }

        // 3. Name & Profession (Keep SVG text for these as they were working fine left-aligned)
        processed = processed.replace(
            /<text class="st9" transform="translate\(1016\.19 1242\.14\)">.*?<\/text>/s,
            `< text class="st9" text - anchor="start" >
                <tspan x="1016" y="1242">${escapeXml(state.name)}</tspan>
                <tspan x="1016" y="1329">${escapeXml(state.name2)}</tspan>
             </text > `
        )
        processed = processed.replace(
            /<text class="st7" transform="translate\(1012\.82 1406\.84\)">.*?<\/text>/s,
            `< text class="st7" text - anchor="start" >
                <tspan x="1013" y="1406">${escapeXml(state.position)}</tspan>
                <tspan x="1013" y="1476">${escapeXml(state.organization)}</tspan>
             </text > `
        )

        // 4. ForeignObject Layer for Layout (Header, Topic, Icons+Details)
        // Using a 100% width/height overlay to place HTML elements precisely
        // Note: The total viewBox is roughly 0 0 2000 2500 (inferred from coordinates)

        // Font styles need to be injected or inline. 
        // st2 (Header) -> fill: #FFFFFF
        // st5 (Details) -> fill: #A05415 (Brown/Gold)
        // Topic -> fill: #A05415

        const foreignObjectOverlay = `
    < foreignObject x = "0" y = "0" width = "2000" height = "2500" style = "pointer-events: none;" >
        <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; flex-direction: column; position: relative; font-family: 'Flamante Serif', serif;">

            <!-- Header (Top) -->
            <div style="position: absolute; top: 300px; width: 100%; text-align: center; color: white; font-size: 60px; font-weight: bold; font-family: FlamanteSerifBold, 'Flamante Serif', serif;">
                ${escapeXml(state.header)}
            </div>

            <!-- Topic (Middle) - Centered Block with Wrapping -->
            ${state.topic ? `
                    <div style="position: absolute; top: 600px; width: 100%; display: flex; justify-content: center; align-items: center; padding: 0 100px;">
                        <div style="color: #a05415; font-size: 140px; font-weight: bold; font-family: FlamanteSerifBold, 'Flamante Serif', serif; text-align: center; line-height: 1.1; word-wrap: break-word; max-width: 1600px;">
                            ${escapeXml(state.topic)}
                        </div>
                    </div>
                    ` : ''}

            <!-- Bottom Details Section (Date, Time, Location) -->
            <!-- Used flexbox for perfect icon alignment -->
            <div style="position: absolute; top: 1730px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 60px; color: #a05415; font-size: 45px; font-weight: 500;">

                <!-- Date -->
                <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="width: 50px; height: 50px; display: flex; justify-content: center; align-items: center;">
                        <!-- Calendar Icon SVG -->
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    </div>
                    <span>${escapeXml(state.date)}</span>
                </div>

                <!-- Time -->
                <div style="display: flex; align-items: center; gap: 20px;">
                    <div style="width: 50px; height: 50px; display: flex; justify-content: center; align-items: center;">
                        <!-- Clock Icon SVG -->
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    </div>
                    <span>${escapeXml(state.time)}</span>
                </div>

                <!-- Location -->
                <div style="display: flex; align-items: center; gap: 20px; margin-top: 40px;">
                    <div style="width: 50px; height: 50px; display: flex; justify-content: center; align-items: center;">
                        <!-- MapPin Icon SVG -->
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                    </div>
                    <span>${escapeXml(state.location)}</span>
                </div>

            </div>

        </div>
            </foreignObject >
    `

        // Logo Text Replacement (Bottom Right)
        if (state.logoText && state.logoText !== 'DELHI') {
            const logoTextElement = `
    < text
x = "1690"
y = "2330"
text - anchor="middle"
fill = "#a05415"
style = "font-family: FlamanteSerifBold, 'Flamante Serif', serif; font-size: 40px; font-weight: bold; letter-spacing: 0.2em;"
    >
    ${escapeXml(state.logoText.toUpperCase())}
                </text >
    `
            processed = processed.replace('</svg>', `${logoTextElement}</svg > `)
        }

        // Append foreignObject
        processed = processed.replace('</svg>', `${foreignObjectOverlay}</svg > `)

        return processed
    }

    return (
        <div className="poster-tool-container">
            {/* Left Sidebar (Controls) */}
            <div className={`pt - sidebar - left ${activeTab === 'edit' ? 'pt-active' : ''} `}>
                <div className="pt-sidebar-header">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="pt-header-title">Poster Details</h1>
                            <p className="pt-header-subtitle">Customize your event poster</p>
                        </div>
                        <UndoRedoGroup
                            undo={undo}
                            redo={redo}
                            canUndo={canUndo}
                            canRedo={canRedo}
                            className="bg-zinc-900/50 backdrop-blur-md border border-white/10 shadow-lg"
                        />
                    </div>
                </div>

                <div className="pt-sidebar-content">

                    {/* Event Info Section */}
                    <div className="pt-section">
                        <div className="pt-section-title">
                            <Briefcase size={12} /> Event Info
                        </div>

                        <div className="pt-input-group">
                            <label className="pt-label">Top Header</label>
                            <input
                                type="text"
                                value={state.header}
                                onChange={e => setState({ ...state, header: e.target.value })}
                                className="pt-input"
                                placeholder="Weekly Program"
                            />
                        </div>

                        <div className="pt-input-group">
                            <label className="pt-label">Main Topic Title</label>
                            <textarea
                                value={state.topic}
                                onChange={e => setState({ ...state, topic: e.target.value })}
                                className="pt-input min-h-[80px] resize-y"
                                placeholder="Enter the main topic..."
                            />
                        </div>

                        <div className="pt-input-group">
                            <label className="pt-label">Logo Text (Bottom Right)</label>
                            <input
                                type="text"
                                value={state.logoText}
                                onChange={e => setState({ ...state, logoText: e.target.value })}
                                className="pt-input"
                                placeholder="DELHI"
                            />
                        </div>
                    </div>

                    {/* Speaker Section */}
                    <div className="pt-section">
                        <div className="pt-section-title">
                            <User size={12} /> Speaker Details
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="pt-input-group">
                                <label className="pt-label">First Name</label>
                                <input
                                    type="text"
                                    value={state.name}
                                    onChange={e => setState({ ...state, name: e.target.value })}
                                    className="pt-input"
                                />
                            </div>
                            <div className="pt-input-group">
                                <label className="pt-label">Last Name</label>
                                <input
                                    type="text"
                                    value={state.name2}
                                    onChange={e => setState({ ...state, name2: e.target.value })}
                                    className="pt-input"
                                />
                            </div>
                        </div>

                        <div className="pt-input-group">
                            <label className="pt-label">Profession / Title</label>
                            <input
                                type="text"
                                value={state.position}
                                onChange={e => setState({ ...state, position: e.target.value })}
                                className="pt-input"
                            />
                        </div>

                        <div className="pt-input-group">
                            <label className="pt-label">Organization</label>
                            <input
                                type="text"
                                value={state.organization}
                                onChange={e => setState({ ...state, organization: e.target.value })}
                                className="pt-input"
                            />
                        </div>

                        {/* Image Upload */}
                        <div className="pt-input-group mt-2">
                            <label className="pt-label mb-2">Speaker Photo</label>
                            <div className="pt-upload-label" onClick={() => fileInputRef.current?.click()}>
                                {state.image ? (
                                    <>
                                        <img src={state.image} className="pt-upload-preview" />
                                        <div className="pt-upload-actions">
                                            <div className="pt-icon-btn" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
                                                <Edit3 size={14} />
                                            </div>
                                            <div className="pt-icon-btn" onClick={(e) => { e.stopPropagation(); setState({ ...state, image: null }) }}>
                                                <RefreshCcw size={14} />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={24} className="text-zinc-500" />
                                        <span className="text-xs font-medium">Click to upload image</span>
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>
                    </div>


                    {/* Date/Time/Location Section */}
                    <div className="pt-section">
                        <div className="pt-section-title">
                            <Calendar size={12} /> When & Where
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="pt-input-group">
                                <label className="pt-label">Date</label>
                                <input
                                    type="text"
                                    value={state.date}
                                    onChange={e => setState({ ...state, date: e.target.value })}
                                    className="pt-input"
                                />
                            </div>
                            <div className="pt-input-group">
                                <label className="pt-label">Time</label>
                                <input
                                    type="text"
                                    value={state.time}
                                    onChange={e => setState({ ...state, time: e.target.value })}
                                    className="pt-input"
                                />
                            </div>
                        </div>

                        <div className="pt-input-group">
                            <label className="pt-label">Location</label>
                            <input
                                type="text"
                                value={state.location}
                                onChange={e => setState({ ...state, location: e.target.value })}
                                className="pt-input"
                            />
                        </div>
                    </div>

                    {/* Appearance Section */}
                    <div className="pt-section">
                        <div className="pt-section-title">
                            <Palette size={12} /> Styles
                        </div>
                        <div className="pt-input-group">
                            <div className="flex justify-between items-center mb-2">
                                <label className="pt-label">Color Theme (Hue)</label>
                                <span className="pt-slider-value">{state.hue}°</span>
                            </div>
                            <div className="pt-slider-container">
                                <input
                                    type="range"
                                    min="0"
                                    max="360"
                                    value={state.hue}
                                    onChange={e => {
                                        const newValue = parseInt(e.target.value)
                                        const shouldReplace = isAdjustingRef.current && hasCapturedStartRef.current

                                        setState(s => ({ ...s, hue: newValue }), shouldReplace)

                                        if (isAdjustingRef.current) {
                                            hasCapturedStartRef.current = true
                                        }
                                    }}
                                    onMouseDown={() => {
                                        isAdjustingRef.current = true
                                        hasCapturedStartRef.current = false
                                    }}
                                    onMouseUp={() => {
                                        isAdjustingRef.current = false
                                        hasCapturedStartRef.current = false
                                    }}
                                    onTouchStart={() => {
                                        isAdjustingRef.current = true
                                        hasCapturedStartRef.current = false
                                    }}
                                    onTouchEnd={() => {
                                        isAdjustingRef.current = false
                                        hasCapturedStartRef.current = false
                                    }}
                                    className="pt-slider"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-section mt-auto pt-8">
                        <button
                            onClick={() => setState(INITIAL_STATE)}
                            className="pt-btn pt-btn-outline w-full text-xs"
                        >
                            <RefreshCcw size={14} />
                            Reset to Default
                        </button>
                    </div>

                </div>
            </div>

            {/* Main Content - Preview */}
            <div
                className="pt-center-preview"
                style={{
                    // On mobile, if preview tab is active, use full height. If edit tab, use mobile default height.
                    display: window.innerWidth < 1024 && activeTab !== 'preview' ? 'none' : 'flex'
                }}
            >
                {/* Floating Toolbar */}
                <div className="pt-preview-toolbar">
                    <button
                        onClick={downloadPoster}
                        className="pt-toolbar-btn"
                    >
                        <Download size={16} />
                        <span className="font-semibold">Download</span>
                    </button>
                </div>

                <div className="pt-preview-wrapper" ref={containerRef}>
                    {loading ? (
                        <div className="text-zinc-500 flex flex-col items-center gap-4">
                            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs tracking-widest uppercase">Loading...</p>
                        </div>
                    ) : (
                        <div
                            className="bg-white shadow-2xl overflow-hidden h-[85vh] w-auto aspect-[4/5]"
                            style={{
                                transition: 'all 0.3s ease',
                                transform: 'scale(1)',
                                maxHeight: '1200px'
                            }}
                            dangerouslySetInnerHTML={{ __html: getProcessedSvg(false) }}
                        />
                    )}
                </div>
            </div>

            {/* Mobile Tabs */}
            <div className={`pt - mobile - tabs ${window.innerWidth >= 1024 ? 'hidden' : 'flex'} `}>
                <button
                    onClick={() => setActiveTab('edit')}
                    className={`pt - tab - btn ${activeTab === 'edit' ? 'active' : ''} `}
                >
                    <Edit3 size={18} />
                    Edit Details
                </button>
                <button
                    onClick={() => setActiveTab('preview')}
                    className={`pt - tab - btn ${activeTab === 'preview' ? 'active' : ''} `}
                >
                    <Eye size={18} />
                    Preview Poster
                </button>
            </div>
        </div>
    )
}
