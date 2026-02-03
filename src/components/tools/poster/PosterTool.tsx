import React, { useState, useEffect, useRef } from 'react'
import { Briefcase, Download, Upload, Calendar, User, Palette, Edit3, RefreshCcw, Eye } from 'lucide-react'
import { useHistory } from '../../../hooks/useHistory'
import posterSvgUrl from '../../../assets/poster.svg'
import './poster.css'

import flamanteSerifBoldUrl from '../../../fonts/flamante-serif/Flamante Serif -demo versions FFP-/Flamante-Serif-Bold-FFP.ttf'
import ascendantSerifUrl from '../../../fonts/ascendant_serif/AscendantSerif-PersonalUse-Regular.otf'
import ascenderSerifBoldUrl from '../../../fonts/Ascender-Serif-W02-Bold/Ascender Serif W02 Bold.ttf'
import openSansBoldUrl from '../../../fonts/open-sans/OpenSans-Bold.ttf'

const fontDefs = [
    { family: 'FlamanteSerifBold', url: flamanteSerifBoldUrl, format: 'truetype' },
    { family: 'AscendantSerif', url: ascendantSerifUrl, format: 'opentype' },
    { family: 'AscenderSerifBold', url: ascenderSerifBoldUrl, format: 'truetype' },
    { family: 'OpenSansBold', url: openSansBoldUrl, format: 'truetype' },
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
    position: 'Position',
    organization: 'Organization Name',
    location: 'Abul Fazal Enclave, Okhla',
    time: '00:00 PM',
    date: 'DD Mon YYYY',
    hue: 0,
    image: null,
    logoText: 'DELHI'
}



export function PosterTool() {
    const { state, set: setState } = useHistory<PosterState>(INITIAL_STATE)
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

    const downloadPoster = async () => {
        if (!containerRef.current) return

        const fontStyles = await buildEmbeddedFontStyles()
        let svgData = getProcessedSvg(true)
        // Inject embedded font styles into the SVG
        svgData = svgData.replace(/<svg([^>]*)>/, `<svg$1><defs><style>${fontStyles}</style></defs>`)
        const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData)
        const img = new Image()
        img.crossOrigin = 'anonymous'

        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = 2000
            canvas.height = 2500
            const ctx = canvas.getContext('2d')

            if (ctx) {
                // Fill white background for JPEG (no transparency)
                ctx.fillStyle = '#ffffff'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage(img, 0, 0, 2000, 2500)

                canvas.toBlob((blob) => {
                    if (blob) {
                        const blobUrl = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = blobUrl
                        a.download = `poster-${state.date.replace(/\s+/g, '-')}.jpg`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(blobUrl)
                    }
                }, 'image/jpeg', 0.95)
            }
        }

        img.onerror = () => {
            // Fallback: download as SVG if JPEG conversion fails
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `poster-${state.date.replace(/\s+/g, '-')}.svg`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        }

        img.src = svgDataUrl
    }



    // Helpers for Date/Time formatting
    const formatDateStr = (isoDate: string) => {
        if (!isoDate) return ''
        const d = new Date(isoDate)
        if (isNaN(d.getTime())) return ''

        // Format: "26 August 2025"
        const day = d.getDate().toString().padStart(2, '0')
        const month = d.toLocaleDateString('en-US', { month: 'long' })
        const year = d.getFullYear()
        return `${day} ${month} ${year}`
    }

    const formatTimeStr = (isoTime: string) => {
        if (!isoTime) return ''
        const [h, m] = isoTime.split(':')
        const date = new Date()
        date.setHours(parseInt(h), parseInt(m))
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    }

    // Attempt to reverse-parse current state for picker initial values
    const getRawDate = () => {
        try {
            const d = new Date(state.date)
            if (!isNaN(d.getTime())) {
                return d.toISOString().split('T')[0]
            }
        } catch { }
        return ''
    }

    const getRawTime = (timeStr: string) => {
        try {
            const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
            if (match) {
                let [_, h, m, p] = match
                let hour = parseInt(h)
                if (p.toUpperCase() === 'PM' && hour < 12) hour += 12
                if (p.toUpperCase() === 'AM' && hour === 12) hour = 0
                return `${hour.toString().padStart(2, '0')}:${m}`
            }
        } catch { }
        return ''
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
            `<svg$1 width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" style="filter: hue-rotate(${state.hue}deg);">`
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
            '<text class="st5" transform="translate(883.55 1780.68)">': '<text class="st5" transform="translate(883.55 1780.68)" style="display:none">',
            // Separator lines between date/time and time/location
            '<rect class="st6" x="885.55" y="1819.51" width="212.5" height="3.02"/>': '<rect class="st6" x="885.55" y="1819.51" width="212.5" height="3.02" style="display:none"/>',
            '<rect class="st6" x="885.55" y="1949.61" width="212.5" height="3.02"/>': '<rect class="st6" x="885.55" y="1949.61" width="212.5" height="3.02" style="display:none"/>',
            // Header pill/strip background - hide the static one, we render a dynamic one
            '<rect class="st11" x="657.1" y="287.63" width="685.8" height="91.22" rx="15.64" ry="15.64"/>': '<rect class="st11" x="657.1" y="287.63" width="685.8" height="91.22" rx="15.64" ry="15.64" style="display:none"/>',
            // Hide the static decorative circles on the strip edges - we'll re-render them dynamically
            '<circle class="st1" cx="1342.9" cy="333.24" r="16.95"/>': '<circle class="st1" cx="1342.9" cy="333.24" r="16.95" style="display:none"/>',
            '<circle class="st1" cx="657.1" cy="333.24" r="16.95"/>': '<circle class="st1" cx="657.1" cy="333.24" r="16.95" style="display:none"/>'
        }

        Object.entries(textHidingReplacements).forEach(([key, value]) => {
            processed = processed.replace(key, value)
        })

        // Hidings IDs
        idsToHide.forEach(id => {
            processed = processed.replace(`id="${id}"`, `id="${id}" style="display:none;"`)
            processed = processed.replace(`id = "${id}"`, `id="${id}" style="display:none;"`)
        })

        // 2. Image Replacement (Keep existing logic)
        const placeholderRect = '<rect class="st8" x="411.99" y="1023.4" width="524.41" height="573.33" rx="68.4" ry="68.4"/>'
        if (state.image) {
            const imageTag = `
    <defs>
        <clipPath id="speaker-clip">
            <rect x="411.99" y="1023.4" width="524.41" height="573.33" rx="68.4" ry="68.4"/>
        </clipPath>
    </defs>
    <rect x="411.99" y="1023.4" width="524.41" height="573.33" rx="68.4" ry="68.4" fill="#f5e6d3" stroke="#d4a574" stroke-width="2"/>
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
        } else {
            // Show placeholder with user icon when no image uploaded
            // Using SVG primitives (not nested <svg>) to avoid breaking </svg> replacement later
            const cx = 674.2  // center x of the rect
            const cy = 1280   // center of the icon area
            const placeholderTag = `
    <rect x="411.99" y="1023.4" width="524.41" height="573.33" rx="68.4" ry="68.4" fill="#e8d5c0" stroke="#d4a574" stroke-width="2"/>
    <g transform="translate(${cx - 60}, ${cy - 70})" fill="none" stroke="#c8884d" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="60" cy="40" r="30"/>
        <path d="M0 120 C0 90, 25 70, 60 70 C95 70, 120 90, 120 120"/>
    </g>`
            processed = processed.replace(placeholderRect, placeholderTag)
        }

        // 3. Name & Profession - using foreignObject for dynamic sizing
        // Hide original SVG text elements
        processed = processed.replace(
            /<text class="st9" transform="translate\(1016\.19 1242\.14\)">.*?<\/text>/s,
            `<text class="st9" transform="translate(1016.19 1242.14)" style="display:none"></text>`
        )
        processed = processed.replace(
            /<text class="st7" transform="translate\(1012\.82 1406\.84\)">.*?<\/text>/s,
            `<text class="st7" transform="translate(1012.82 1406.84)" style="display:none"></text>`
        )

        // Dynamic name sizing
        const nameLen = Math.max(state.name.length, state.name2.length)
        const nameFontSize = nameLen > 20 ? 55 : nameLen > 15 ? 65 : 80

        // Dynamic position sizing
        const posLen = Math.max(state.position.length, state.organization.length)
        const posFontSize = posLen > 25 ? 38 : posLen > 18 ? 45 : 52

        const namePositionOverlay = `
    <foreignObject x="1010" y="1180" width="920" height="360">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: flex-start; gap: 8px;">
            <div style="font-family: AscendantSerif, serif; color: #d3830f; font-size: ${nameFontSize}px; line-height: 1.15; font-weight: bold;">
                <div>${escapeXml(state.name)}</div>
                <div>${escapeXml(state.name2)}</div>
            </div>
            <div style="font-family: AscendantSerif, serif; color: #a05415; font-size: ${posFontSize}px; line-height: 1.25;">
                <div>${escapeXml(state.position)}</div>
                <div>${escapeXml(state.organization)}</div>
            </div>
        </div>
    </foreignObject>
    `

        // 4. ForeignObject Layer for Layout (Header, Topic, Icons+Details)
        // Using a 100% width/height overlay to place HTML elements precisely
        // Note: The total viewBox is roughly 0 0 2000 2500 (inferred from coordinates)

        // Font styles need to be injected or inline. 
        // st2 (Header) -> fill: #FFFFFF
        // st5 (Details) -> fill: #A05415 (Brown/Gold)
        // Topic -> fill: #A05415

        const foreignObjectOverlay = `
    <foreignObject x="0" y="0" width="2000" height="2500" style="pointer-events: none;">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; flex-direction: column; position: relative;">
            <div style="position: absolute; top: 270px; width: 100%; display: flex; justify-content: center; align-items: center;">
                <div style="display: flex; align-items: center; gap: 0;">
                    <div style="width: 34px; height: 34px; border-radius: 50%; background: #fff2e3; flex-shrink: 0; margin-right: -17px; z-index: 1;"></div>
                    <div style="background: #d3830f; color: white; font-size: 60px; font-family: AscendantSerif, serif; padding: 16px 60px; border-radius: 16px; white-space: nowrap;">
                        ${escapeXml(state.header)}
                    </div>
                    <div style="width: 34px; height: 34px; border-radius: 50%; background: #fff2e3; flex-shrink: 0; margin-left: -17px; z-index: 1;"></div>
                </div>
            </div>
            ${(() => {
                const topicText = state.topic || 'Topic Title Here'
                const isPlaceholder = !state.topic
                const len = topicText.length
                const fontSize = len > 200 ? 70 : len > 150 ? 85 : len > 100 ? 100 : len > 60 ? 120 : 140
                return `
            <div style="position: absolute; top: 500px; width: 100%; display: flex; justify-content: center; align-items: center; padding: 0 40px; max-height: 480px;">
                <div style="color: #a05415; font-size: ${fontSize}px; font-weight: bold; font-family: FlamanteSerifBold, 'Flamante Serif', serif; text-align: center; line-height: 0.98; letter-spacing: -0.02em; word-wrap: break-word; max-width: 1600px;${isPlaceholder ? ' opacity: 0.3;' : ''}">
                    ${escapeXml(topicText).replace(/\n/g, '<br/>')}
                </div>
            </div>`
            })()}
            <div style="position: absolute; top: 1720px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 15px; color: #a05415; font-size: 62px; font-weight: bold; font-family: OpenSansBold, AscenderSerifBold, sans-serif;">
                <div style="display: flex; align-items: center; gap: 24px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="#c8884d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
                    <span>${escapeXml(state.date)}</span>
                </div>
                <div style="width: 220px; height: 2px; background: #a05415; opacity: 0.4;"></div>
                <div style="display: flex; align-items: center; gap: 24px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="#c8884d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>${escapeXml(state.time)}</span>
                </div>
                <div style="width: 220px; height: 2px; background: #a05415; opacity: 0.4;"></div>
                <div style="display: flex; align-items: center; gap: 24px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="#c8884d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>${escapeXml(state.location)}</span>
                </div>
            </div>
        </div>
    </foreignObject>
    `

        // Logo Text Replacement (Bottom Right)
        if (state.logoText) {
            const len = state.logoText.length
            const fontSize = len > 14 ? '26' : len > 10 ? '30' : len > 6 ? '36' : '40'
            const spacing = len > 10 ? '0.02em' : len > 6 ? '0.08em' : '0.15em'
            const logoTextElement = `
    <foreignObject x="1560" y="2295" width="260" height="140">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: flex-start; padding-top: 14px;">
            <div style="color: #a05415; font-family: FlamanteSerifBold, 'Flamante Serif', serif; font-weight: bold; text-align: center; line-height: 1.05; letter-spacing: ${spacing}; font-size: ${fontSize}px;">
                ${escapeXml(state.logoText.toUpperCase())}
            </div>
        </div>
    </foreignObject>
    `
            const lastSvgIdx1 = processed.lastIndexOf('</svg>')
            processed = processed.slice(0, lastSvgIdx1) + logoTextElement + processed.slice(lastSvgIdx1)
        }

        // Append foreignObject overlays before the last closing </svg>
        const lastSvgIdx2 = processed.lastIndexOf('</svg>')
        processed = processed.slice(0, lastSvgIdx2) + namePositionOverlay + foreignObjectOverlay + processed.slice(lastSvgIdx2)

        return processed
    }

    const hueSlider = (
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
                    onMouseDown={() => { isAdjustingRef.current = true; hasCapturedStartRef.current = false }}
                    onMouseUp={() => { isAdjustingRef.current = false; hasCapturedStartRef.current = false }}
                    onTouchStart={() => { isAdjustingRef.current = true; hasCapturedStartRef.current = false }}
                    onTouchEnd={() => { isAdjustingRef.current = false; hasCapturedStartRef.current = false }}
                    className="pt-slider"
                />
            </div>
        </div>
    )

    return (
        <div className="poster-tool-container">
            {/* Left Sidebar (Controls) */}
            <div className={`pt-sidebar-left ${activeTab === 'edit' ? 'pt-active' : ''}`}>
                <div className="pt-sidebar-header">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="pt-header-title">Poster Details</h1>
                            <p className="pt-header-subtitle">Customize your program poster</p>
                        </div>
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
                            <label className="pt-label">Unit Name (Bottom Right)</label>
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
                                    type="date"
                                    className="pt-input"
                                    defaultValue={getRawDate()}
                                    onChange={e => setState({ ...state, date: formatDateStr(e.target.value) })}
                                />
                            </div>
                            <div className="pt-input-group">
                                <label className="pt-label">Time</label>
                                <input
                                    type="time"
                                    className="pt-input"
                                    defaultValue={getRawTime(state.time)}
                                    onChange={e => setState({ ...state, time: formatTimeStr(e.target.value) })}
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

                    {/* Appearance Section - desktop only (on mobile it's in preview) */}
                    {window.innerWidth >= 1024 && (
                        <div className="pt-section">
                            <div className="pt-section-title">
                                <Palette size={12} /> Styles
                            </div>
                            {hueSlider}
                        </div>
                    )}

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
                    display: window.innerWidth < 1024 && activeTab !== 'preview' ? 'none' : 'flex',
                    ...(window.innerWidth < 1024 ? { flex: '1 1 0', height: 'auto' } : {})
                }}
            >
                {/* Floating Toolbar - desktop only */}
                <div className="pt-preview-toolbar" style={{ display: window.innerWidth < 1024 ? 'none' : 'flex' }}>
                    <button
                        onClick={downloadPoster}
                        className="pt-download-btn"
                    >
                        <Download size={18} />
                        <span>Download</span>
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
                            className="bg-white shadow-2xl overflow-hidden w-auto aspect-[4/5]"
                            style={{
                                height: '95%',
                                maxHeight: 'calc(100vh - 80px)',
                            }}
                            dangerouslySetInnerHTML={{ __html: getProcessedSvg(false) }}
                        />
                    )}
                </div>
            </div>

            {/* Mobile Bottom: Download + Tabs */}
            {window.innerWidth < 1024 && (
                <div style={{ order: 3, flexShrink: 0, width: '100%' }}>
                    {activeTab === 'preview' && (
                        <div style={{ padding: '12px 22px 12px', background: 'var(--pt-bg-main)', display: 'flex', flexDirection: 'column', gap: '36px' }}>
                            {hueSlider}
                            <button
                                onClick={downloadPoster}
                                className="pt-btn pt-btn-primary"
                                style={{ width: '100%' }}
                            >
                                <Download size={16} />
                                Download Poster
                            </button>
                        </div>
                    )}
                    <div className="pt-mobile-tabs">
                        <button
                            onClick={() => setActiveTab('edit')}
                            className={`pt-tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
                        >
                            <Edit3 size={18} />
                            Edit Details
                        </button>
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`pt-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                        >
                            <Eye size={18} />
                            Preview Poster
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
