import React, { useState, useEffect, useRef } from 'react'
import { Briefcase, Download, Upload, Calendar, User, Palette, Edit3, RefreshCcw, Eye, Instagram, Link as LinkIcon, Check } from 'lucide-react'
import { renderToStaticMarkup } from 'react-dom/server'
import { useHistory } from '../../../hooks/useHistory'
import { trackEvent } from '../../../hooks/usePageTracker'
import posterSvgUrl from '../../../assets/poster.svg'
import './poster.css'
import { isUrdu } from '../../../lib/utils'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.siodelhi.org'

import flamanteSerifBoldUrl from '../../../fonts/flamante-serif/Flamante Serif -demo versions FFP-/Flamante-Serif-Bold-FFP.ttf'
import ascendantSerifUrl from '../../../fonts/ascendant_serif/AscendantSerif-PersonalUse-Regular.otf'
import ascenderSerifBoldUrl from '../../../fonts/Ascender-Serif-W02-Bold/Ascender Serif W02 Bold.ttf'
import openSansBoldUrl from '../../../fonts/open-sans/OpenSans-Bold.ttf'
import dmSerifDisplayUrl from '../../../fonts/DM_Serif_Display/DMSerifDisplay-Regular.ttf'
import dmSansLightUrl from '../../../fonts/DM_Sans/static/DMSans-Light.ttf'
import dmSerifTextUrl from '../../../fonts/DM_Serif_Text/DMSerifText-Regular.ttf'
import alQalamUrl from '../../../fonts/AlQalam Taj Nastaleeq Regular.ttf'

const fontDefs = [
    { family: 'FlamanteSerifBold', url: flamanteSerifBoldUrl, format: 'truetype' },
    { family: 'AscendantSerif', url: ascendantSerifUrl, format: 'opentype' },
    { family: 'AscenderSerifBold', url: ascenderSerifBoldUrl, format: 'truetype' },
    { family: 'OpenSansBold', url: openSansBoldUrl, format: 'truetype' },
    { family: 'DMSerifDisplay', url: dmSerifDisplayUrl, format: 'truetype' },
    { family: 'DMSansLight', url: dmSansLightUrl, format: 'truetype' },
    { family: 'DMSerifText', url: dmSerifTextUrl, format: 'truetype' },
    { family: 'AlQalam Taj Nastaleeq', url: alQalamUrl, format: 'truetype' },
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
    websiteText: string
    showLinkIcon: boolean
    showSocialIcons: boolean
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
    logoText: 'DELHI',
    websiteText: 'siodelhi.org',
    showLinkIcon: true,
    showSocialIcons: true
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
        trackEvent('poster_download', 'weekly_poster')

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

                        // Save poster to backend (fire-and-forget)
                        const formData = new FormData()
                        formData.append('poster', blob, `poster-${Date.now()}.jpg`)
                        formData.append('poster_type', 'weekly_poster')
                        formData.append('metadata', JSON.stringify({
                            topic: state.topic, name: state.name,
                            name2: state.name2, date: state.date,
                            header: state.header
                        }))
                        fetch(`${API_BASE}/posters/save`, {
                            method: 'POST', body: formData
                        }).catch(() => { })
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
                const [_, h, m, p] = match
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

        // Dynamic Y-Offset Calculation for Centering
        const topicText = state.topic || 'Topic Title Here'
        const len = topicText.length

        // Font size logic matches the foreignObject rendering below
        const topicFontSize = len > 200 ? 70 : len > 150 ? 85 : len > 100 ? 100 : len > 60 ? 120 : 140
        const lineHeightRatio = 0.98 // Matches CSS line-height

        // Estimate visual lines
        // 1. Explicit newlines
        const explicitLines = (topicText.match(/\n/g) || []).length + 1
        // 2. Wrap estimate (Container width 1600px, avg char width approx 0.5 * fontSize)
        const charsPerLine = 1600 / (topicFontSize * 0.55) // 0.55 factor for FlamanteSerifBold
        const wrapLines = Math.ceil(len / charsPerLine)
        const estLines = Math.max(explicitLines, wrapLines)

        const topicHeight = estLines * topicFontSize * lineHeightRatio
        const topicStartY = 500 // The text container starts at top: 500px
        const topicBottomY = topicStartY + topicHeight

        const footerCurveY = 1650 // Approx top of the bottom wave/curve

        // Available vertical space
        // Strictly center between Topic Bottom and Footer Curve for equal margins
        const availableTop = topicBottomY
        const availableBottom = footerCurveY
        const availableCenterY = (availableTop + availableBottom) / 2

        // Speaker Section Dimensions
        const speakerOriginalY = 1023.4
        const speakerHeight = 573.33
        const speakerOriginalCenterY = speakerOriginalY + (speakerHeight / 2)

        // Calculate Offset to move Speaker Center to Available Center
        // We cap the shift to avoid extreme movements if calculation is off, but centering is the goal.
        const yOffset = availableCenterY - speakerOriginalCenterY

        // Optional: Clamp to prevent intersecting footer if calculation says move down too much? 
        // Usually yOffset will be negative (moving up). 
        // If topic is HUGE, topicBottomY is large, available space is small/lower, availableCenterY is lower.
        // We trust the calc.

        const speakerImageY = 1023.4 + yOffset
        const speakerOverlayY = 1180 + yOffset

        // Vertical Separator Line (The "Stick")
        const stickY = 1192.55 + yOffset

        // Add the static stick to the hiding list (if not already hidden by ID)
        // We do this by adding a replacement rule for it
        const stickRectString = '<rect class="st8" x="973.85" y="1192.55" width="8.1" height="276.75"/>'
        processed = processed.replace(stickRectString, '<rect class="st8" x="973.85" y="1192.55" width="8.1" height="276.75" style="display:none"/>')

        // 2. Image Replacement (Keep existing logic)
        const placeholderRect = '<rect class="st8" x="411.99" y="1023.4" width="524.41" height="573.33" rx="68.4" ry="68.4"/>'
        if (state.image) {
            const imageTag = `
    <defs>
        <clipPath id="speaker-clip">
            <rect x="411.99" y="${speakerImageY}" width="524.41" height="573.33" rx="68.4" ry="68.4"/>
        </clipPath>
    </defs>
    <rect x="411.99" y="${speakerImageY}" width="524.41" height="573.33" rx="68.4" ry="68.4" fill="#f5e6d3" stroke="#d4a574" stroke-width="2"/>
    <image
        x="411.99"
        y="${speakerImageY}"
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
            // Adjust center Y by offset
            const cx = 674.2  // center x of the rect
            const cy = 1280 + yOffset   // center of the icon area
            const placeholderTag = `
    <rect x="411.99" y="${speakerImageY}" width="524.41" height="573.33" rx="68.4" ry="68.4" fill="#e8d5c0" stroke="#d4a574" stroke-width="2"/>
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
        const nameFontFamily = (isUrdu(state.name) || isUrdu(state.name2)) ? "'AlQalam Taj Nastaleeq', serif" : "AscendantSerif, serif"

        // Dynamic position sizing
        const posLen = Math.max(state.position.length, state.organization.length)
        const posFontSize = posLen > 25 ? 38 : posLen > 18 ? 45 : 52
        const posFontFamily = (isUrdu(state.position) || isUrdu(state.organization)) ? "'AlQalam Taj Nastaleeq', serif" : "AscendantSerif, serif"

        // Include the vertical stick in the overlay strings (using SVG rect)
        // We append it BEFORE the foreignObject so it sits in the SVG layer but at new position
        const stickElement = `<rect x="973.85" y="${stickY}" width="8.1" height="276.75" fill="#68310c"/>`

        const namePositionOverlay = `
    ${stickElement}
    <foreignObject x="1010" y="${speakerOverlayY}" width="920" height="360">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: flex-start; gap: 8px;">
            <div style="font-family: ${nameFontFamily}; color: #d3830f; font-size: ${nameFontSize}px; line-height: 1.15; font-weight: bold;">
                <div>${escapeXml(state.name)}</div>
                <div>${escapeXml(state.name2)}</div>
            </div>
            <div style="font-family: ${posFontFamily}; color: #a05415; font-size: ${posFontSize}px; line-height: 1.25;">
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

        const headerFontFamily = isUrdu(state.header) ? "'AlQalam Taj Nastaleeq', serif" : "AscendantSerif, serif"
        const detailsFontFamily = (isUrdu(state.date) || isUrdu(state.time) || isUrdu(state.location)) ? "'AlQalam Taj Nastaleeq', sans-serif" : "OpenSansBold, AscenderSerifBold, sans-serif"

        const foreignObjectOverlay = `
    <foreignObject x="0" y="0" width="2000" height="2500" style="pointer-events: none;">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; flex-direction: column; position: relative;">
            <div style="position: absolute; top: 270px; width: 100%; display: flex; justify-content: center; align-items: center;">
                <div style="display: flex; align-items: center; gap: 0;">
                    <div style="width: 34px; height: 34px; border-radius: 50%; background: #fff2e3; flex-shrink: 0; margin-right: -17px; z-index: 1;"></div>
                    <div style="background: #d3830f; color: white; font-size: 60px; font-family: ${headerFontFamily}; padding: 16px 60px; border-radius: 16px; white-space: nowrap;">
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
                const isUrduTopic = isUrdu(topicText)
                const topicFontFamily = isUrduTopic ? "'AlQalam Taj Nastaleeq', serif" : "FlamanteSerifBold, 'Flamante Serif', serif"

                return `
            <div style="position: absolute; top: 500px; width: 100%; display: flex; justify-content: center; align-items: center; padding: 0 40px; max-height: 480px;">
                <div style="color: #a05415; font-size: ${fontSize}px; font-weight: bold; font-family: ${topicFontFamily}; text-align: center; line-height: ${isUrduTopic ? '1.4' : '0.98'}; letter-spacing: ${isUrduTopic ? '0.04em' : '-0.02em'}; word-spacing: ${isUrduTopic ? '0.15em' : 'normal'}; ${isUrduTopic ? 'direction: rtl;' : ''} word-wrap: break-word; max-width: 1600px;${isPlaceholder ? ' opacity: 0.3;' : ''}">
                    ${escapeXml(topicText).replace(/\n/g, '<br/>')}
                </div>
            </div>`
            })()}
            <div style="position: absolute; top: 1720px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 15px; color: #a05415; font-size: 62px; font-weight: bold; font-family: ${detailsFontFamily};">
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


        // 5. Website / Social Media Logic
        // Hide original website group pattern
        const websiteGroupPattern = /(<g>\s*<text\s+class="st3"\s+transform="translate\(278\.07\s+2310\.63\)">[\s\S]*?<\/g>)/;
        processed = processed.replace(websiteGroupPattern, '<g style="display:none">$1</g>');

        // Decorative Line Replacement logic
        // Original line: <rect class="st4" x="674.5" y="2278.53" width="651" height="4.99"/>
        // We hide it if BOTH social icons AND website text are hidden/empty
        if (!state.showSocialIcons && !state.websiteText.trim()) {
            processed = processed.replace(
                /<rect class="st4" x="674\.5" y="2278\.53" width="651" height="4\.99"\/>/,
                '<rect class="st4" x="674.5" y="2278.53" width="651" height="4.99" style="display:none"/>'
            );
        }

        // Generate Icons SVG using renderToStaticMarkup
        // const iconSize = 34; // Removed, using 32 in renders
        const circleSize = 54;
        const iconColor = '#82400f';
        const circleStroke = '#82400f';

        // Custom Icons
        const XIcon = ({ size, color }: { size: number, color: string }) => (
            <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color}>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231h.001zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
            </svg>
        );

        const FacebookFilledIcon = ({ size, color }: { size: number, color: string }) => (
            <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color}>
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
        );

        const YouTubeFilledIcon = ({ size, color }: { size: number, color: string }) => (
            <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color}>
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
        );

        const WhatsAppFilledIcon = ({ size, color }: { size: number, color: string }) => (
            <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
        );

        const SocialIcon = ({ Icon }: { Icon: any }) => (
            <div style={{
                width: circleSize, height: circleSize,
                borderRadius: '50%', border: `1.5px solid ${circleStroke}`, // Thin border
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent'
            }}>
                <Icon size={28} color={iconColor} /> {/* Slightly larger icon (was 26) */}
            </div>
        );

        let combinedRowSvg = '';
        const hasSocials = state.showSocialIcons;
        const hasWebsite = !!state.websiteText.trim();

        if (hasSocials || hasWebsite) {
            // Order: Instagram (Lucide), Facebook (Filled), X (Custom), YouTube (Filled), WhatsApp (Filled)
            const icons = [Instagram, FacebookFilledIcon, XIcon, YouTubeFilledIcon, WhatsAppFilledIcon];

            const socialIconsHtml = hasSocials ? `
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                    ${icons.map(Icon => renderToStaticMarkup(<SocialIcon Icon={Icon} />)).join('')}
                </div>
            ` : '';

            const linkIconHtml = (hasWebsite && state.showLinkIcon) ? renderToStaticMarkup(
                <div style={{
                    width: circleSize, height: circleSize,
                    borderRadius: '50%', border: `1.5px solid ${circleStroke}`, // Thin border
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginRight: '12px'
                }}>
                    <LinkIcon size={26} color={iconColor} strokeWidth={2} />
                </div>
            ) : '';

            const websiteHtml = hasWebsite ? `
                <div style="display: flex; align-items: center; margin-top: ${hasSocials ? '6px' : '0'};">
                    ${linkIconHtml}
                    <div style="color: #82400f; font-family: DMSerifText, serif; font-size: 40px; letter-spacing: 0.02em; font-weight: normal; margin-top: -4px;">
                        ${escapeXml(state.websiteText)}
                    </div>
                </div>
            ` : '';

            // Unified container
            combinedRowSvg = `
    <foreignObject x="175" y="2235" width="800" height="200">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: ${hasSocials ? 'flex-start' : 'flex-start'}; gap: 0; padding-left: 20px;">
             <div style="display: flex; flex-direction: column; align-items: center;">
                ${socialIconsHtml}
                ${websiteHtml}
             </div>
        </div>
    </foreignObject>`;
        }

        // Append foreignObject overlays before the last closing </svg>
        const lastSvgIdx2 = processed.lastIndexOf('</svg>')
        processed = processed.slice(0, lastSvgIdx2) + namePositionOverlay + foreignObjectOverlay + combinedRowSvg + processed.slice(lastSvgIdx2)

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

                        <div className="pt-input-group">
                            <div className="flex justify-between items-center mb-1">
                                <label className="pt-label m-0">Website / Social</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button
                                        onClick={() => setState({ ...state, showSocialIcons: !state.showSocialIcons })}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            letterSpacing: '0.02em',
                                            textTransform: 'uppercase',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: state.showSocialIcons ? '#d97706' : 'transparent',
                                            color: state.showSocialIcons ? 'white' : '#71717a', // zinc-500
                                            border: `1px solid ${state.showSocialIcons ? '#d97706' : '#d4d4d8'}`, // amber-600 : zinc-300
                                            outline: 'none',
                                            minWidth: '90px',
                                            justifyContent: 'center'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!state.showSocialIcons) {
                                                e.currentTarget.style.backgroundColor = '#f4f4f5'; // zinc-100
                                                e.currentTarget.style.borderColor = '#a1a1aa'; // zinc-400
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!state.showSocialIcons) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                e.currentTarget.style.borderColor = '#d4d4d8';
                                            }
                                        }}
                                    >
                                        {state.showSocialIcons ? <Check size={12} strokeWidth={3} /> : <div style={{ width: 12 }} />}
                                        Socials
                                    </button>
                                    <button
                                        onClick={() => setState({ ...state, showLinkIcon: !state.showLinkIcon })}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            letterSpacing: '0.02em',
                                            textTransform: 'uppercase',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: state.showLinkIcon ? '#d97706' : 'transparent',
                                            color: state.showLinkIcon ? 'white' : '#71717a',
                                            border: `1px solid ${state.showLinkIcon ? '#d97706' : '#d4d4d8'}`,
                                            outline: 'none',
                                            minWidth: '100px',
                                            justifyContent: 'center'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!state.showLinkIcon) {
                                                e.currentTarget.style.backgroundColor = '#f4f4f5';
                                                e.currentTarget.style.borderColor = '#a1a1aa';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!state.showLinkIcon) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                e.currentTarget.style.borderColor = '#d4d4d8';
                                            }
                                        }}
                                    >
                                        {state.showLinkIcon ? <Check size={12} strokeWidth={3} /> : <div style={{ width: 12 }} />}
                                        Link Icon
                                    </button>
                                </div>
                            </div>
                            <input
                                type="text"
                                value={state.websiteText}
                                onChange={e => setState({ ...state, websiteText: e.target.value })}
                                className="pt-input"
                                placeholder="siodelhi.org or @handle"
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
                        <div className="pt-mobile-download-section">
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
