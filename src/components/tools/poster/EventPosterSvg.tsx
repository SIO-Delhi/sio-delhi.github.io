import React from 'react'
import { FormFooter } from '../../ui/FormFooter'
import { MoroccanCircularPattern } from './MoroccanCircularPattern'
import { Instagram, Link as LinkIcon } from 'lucide-react'

export interface Speaker {
    photo: string | null
    topic: string
    name: string
    designation: string
}

export interface EventPosterProps {
    title: string
    date: string
    day: string
    timeStart: string
    timeEnd: string
    venue: string
    speakerCount: 2 | 3
    speakers: Speaker[]
    hue: number
    forDownload?: boolean
    unitName?: string
    websiteText?: string
    showSocialIcons?: boolean
    showLinkIcon?: boolean
}

export const EventPosterSvg = React.memo(React.forwardRef<SVGSVGElement, EventPosterProps>(
    function EventPosterSvg(props, ref) {
        const { title, date, day, timeStart, timeEnd, venue, speakerCount, speakers, hue, forDownload, unitName = 'DELHI', websiteText = 'siodelhi.org', showSocialIcons = true, showLinkIcon = true } = props

        const W = 2000
        const H = 2500

        // Speaker positions based on count
        const speakerPositions = speakerCount === 3
            ? [{ x: 450 }, { x: 1000 }, { x: 1550 }]
            : [{ x: 670 }, { x: 1330 }]

        const photoW = speakerCount === 3 ? 400 : 460
        const photoH = speakerCount === 3 ? 460 : 520
        const photoY = 1630
        const photoR = 48

        const cardW = speakerCount === 3 ? 530 : 600
        const cardY = photoY + photoH - 60

        // Bottom wash dimensions
        const washH = speakerCount === 3 ? 1300 : 1000
        const washW = speakerCount === 3 ? W : 1545

        // Dynamic title font size — large and prominent
        const titleLen = title.length
        const titleSize = titleLen > 60 ? 130 : titleLen > 40 ? 160 : titleLen > 25 ? 190 : 250

        // Dynamic venue font size
        const venueSize = venue.length > 40 ? 45 : venue.length > 25 ? 52 : 60

        return (
            <svg
                ref={ref}
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                viewBox={`0 0 ${W} ${H}`}
                width={forDownload ? W : '100%'}
                height={forDownload ? H : '100%'}
                style={{
                    '--ep-hue': `${hue}deg`,
                    display: 'block'
                } as React.CSSProperties}
            >
                <defs>
                    {/* Background — plain white */}
                    <linearGradient id="ep-bg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>

                    {/* Soft edge blob gradients - Removed in favor of Moroccan pattern */}


                    {/* Full-width bottom gradient — rising purple wash */}
                    <linearGradient id="ep-bottom-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
                        <stop offset="40%" stopColor="#7c3aed" stopOpacity="0.05" />
                        <stop offset="75%" stopColor="#7c3aed" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.30" />
                    </linearGradient>

                    {/* Card shadow filter */}
                    <filter id="ep-card-shadow" x="-10%" y="-10%" width="120%" height="130%">
                        <feDropShadow dx="0" dy="4" stdDeviation="16" floodColor="#7c3aed" floodOpacity="0.12" />
                    </filter>

                    {/* Photo shadow filter */}
                    <filter id="ep-photo-shadow" x="-5%" y="-5%" width="110%" height="115%">
                        <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#1a1a2e" floodOpacity="0.15" />
                    </filter>

                    {/* Clip paths for speaker photos */}
                    {speakerPositions.map((pos, i) => (
                        <clipPath key={`clip-${i}`} id={`ep-photo-clip-${i}`}>
                            <rect
                                x={pos.x - photoW / 2}
                                y={photoY}
                                width={photoW}
                                height={photoH}
                                rx={photoR}
                                ry={photoR}
                            />
                        </clipPath>
                    ))}
                    {/* Dotted texture pattern */}
                    <pattern id="ep-dot-pattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="#c4b5fd" fillOpacity="0.3" />
                    </pattern>


                </defs>

                {/* Background */}
                <rect width={W} height={H} fill="url(#ep-bg)" />



                {/* Content group with selective hue shift - Fast CSS Variable approach */}
                <g style={{ filter: `hue-rotate(var(--ep-hue, ${hue}deg))` }}>
                    {/* ─── Bottom Wash Layer (Under Patterns) — Responsive to Hue ─── */}
                    <g>
                        {/* Linear Wash rect — Restricted width for clean sides (sharp edges are okay) */}
                        <rect
                            x={speakerCount !== 3 ? (W - washW) / 2 : 0}
                            y={H - washH}
                            width={washW}
                            height={washH}
                            fill="url(#ep-bottom-gradient)"
                        />
                        <rect
                            x={speakerCount !== 3 ? (W - washW) / 2 : 0}
                            y={H - washH}
                            width={washW}
                            height={washH}
                            fill="url(#ep-dot-pattern)"
                            style={{ opacity: 0.15 }}
                        />
                    </g>
                    {/* Moroccan Pattern Decorations — Sides (Hidden for 3 speakers) */}
                    {speakerCount !== 3 && (
                        <>
                            <g transform={`translate(0, ${H / 2}) rotate(90) scale(2.5)`} opacity={0.20}>
                                <g transform="translate(-482.5, -91)">
                                    <FormFooter bgColor="none" patternColor="#c9a0dc" width={965} height={182} />
                                </g>
                            </g>

                            <g transform={`translate(${W}, ${H / 2}) rotate(-90) scale(2.5)`} opacity={0.20}>
                                <g transform="translate(-482.5, -91)">
                                    <FormFooter bgColor="none" patternColor="#a78bba" width={965} height={182} />
                                </g>
                            </g>
                        </>
                    )}

                    {/* Moroccan Pattern Decoration — Centered (3-Speaker Variant) */}
                    {speakerCount === 3 && (
                        <g transform={`translate(${W / 2}, 450) scale(2.2)`} opacity={0.15}>
                            <MoroccanCircularPattern patternColor="#c9a0dc" />
                        </g>
                    )}
                    {/* Subtle center glow removed */}

                    {/* Header Group - Transferred from Poster Footer */}
                    <g transform="translate(0, -2100)">

                        {/* Socials Group - Pure SVG */}
                        {showSocialIcons && (() => {
                            const circleR = 30 // radius of each circle (diameter 60)
                            const iconSize = 34 // icon size inside circle
                            const gap = 65 // center-to-center distance
                            // Left-aligned area matching PosterTool (foreignObject x=175, width=800)
                            const areaCenter = 500 // center of left social area
                            const totalSpan = 4 * gap // 260
                            const startX = areaCenter - totalSpan / 2
                            const cy = 2235 // y center of circles

                            const iconPaths = [
                                null, // Instagram (Lucide stroked)
                                'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
                                'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231h.001zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z',
                                'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
                                'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z',
                            ]

                            return (
                                <g>
                                    {iconPaths.map((path, i) => {
                                        const cx = startX + i * gap
                                        return (
                                            <g key={i}>
                                                <circle cx={cx} cy={cy} r={circleR} fill="none" stroke="#000000" strokeWidth={1.5} />
                                                {i === 0 ? (
                                                    <foreignObject x={cx - iconSize / 2} y={cy - iconSize / 2} width={iconSize} height={iconSize}>
                                                        <div
                                                            // @ts-expect-error xmlns needed
                                                            xmlns="http://www.w3.org/1999/xhtml"
                                                            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        >
                                                            <Instagram size={iconSize} color="#000000" />
                                                        </div>
                                                    </foreignObject>
                                                ) : (
                                                    <svg x={cx - iconSize / 2} y={cy - iconSize / 2} width={iconSize} height={iconSize} viewBox="0 0 24 24">
                                                        <path d={path!} fill="#000000" />
                                                    </svg>
                                                )}
                                            </g>
                                        )
                                    })}
                                </g>
                            )
                        })()}

                        {/* Website Text Row - matches PosterTool logic */}
                        {websiteText && (() => {
                            const hasLinkCircle = showLinkIcon && !!websiteText
                            const linkCircleR = 30
                            const linkIconSize = 32
                            const areaCenter = 500 // same center as social icons
                            // Vertical: social circle bottom = 2235+30 = 2265, link circle top needs to clear that
                            const rowY = showSocialIcons ? 2265 + linkCircleR + 10 : 2235 // 2305 when socials visible
                            // Position link circle + text centered under icon group
                            const linkCircleCx = hasLinkCircle ? areaCenter - 100 : 0
                            const textX = hasLinkCircle ? linkCircleCx + linkCircleR + 12 : areaCenter

                            return (
                                <g>
                                    {hasLinkCircle && (
                                        <>
                                            <circle cx={linkCircleCx} cy={rowY} r={linkCircleR} fill="none" stroke="#000000" strokeWidth={1.5} />
                                            <foreignObject x={linkCircleCx - linkIconSize / 2} y={rowY - linkIconSize / 2} width={linkIconSize} height={linkIconSize}>
                                                <div
                                                    // @ts-expect-error xmlns needed
                                                    xmlns="http://www.w3.org/1999/xhtml"
                                                    style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <LinkIcon size={linkIconSize} color="#000000" strokeWidth={2} />
                                                </div>
                                            </foreignObject>
                                        </>
                                    )}
                                    <text
                                        x={textX}
                                        y={rowY + 12}
                                        fill="#000000"
                                        fontFamily="DMSerifText, serif"
                                        fontSize={36}
                                        letterSpacing="0.02em"
                                        textAnchor={hasLinkCircle ? 'start' : 'middle'}
                                    >
                                        {websiteText}
                                    </text>
                                </g>
                            )
                        })()}

                        {/* SIO Logo Group - Shifted Left */}
                        <g transform="translate(-100, 0)">
                            <g fill="#000000">
                                <path d="M1733.67,2222.02c24.65-1.29,43.46,15.89,41.58,41.05-2.01,26.87-29.09,42.15-54.1,34.84-11.59-3.39-21.54-12.86-24.87-24.55-7.19-25.24,11.67-49.99,37.4-51.34ZM1730.52,2226.87c-18.75,1.37-18.99,28.22-15.64,41.64s14.84,31.24,31.07,25.17c15.57-5.82,14.06-29.75,10.19-42.57-3.45-11.42-11.95-25.24-25.62-24.24Z" />
                                <path d="M1630.64,2222.02c5.09-.28,11.54.39,16.38,2.02,2.13.72,3.63,1.6,3.83,4.03.32,3.82.36,7.71.66,11.53.07.96.71,2.36-.56,2.98-1.92.94-3.46-1.82-4.34-3.18-4.19-6.48-7.45-13.22-16.4-13.75-10.8-.64-17.62,10.87-8.38,18.35,7.28,5.89,19.47,6.74,26.41,13.83,12.31,12.57,6.2,35.59-10.52,40.74-9.26,2.85-18.12-.55-27.07-2.36-1.22-.25-3.93-.34-4.87-.9-1.79-1.06-.85-4.29-.79-6.01.17-5.45-.63-10.97-.4-16.4.03-.66.12-2.08.76-2.39.98-.48,2.35-.48,3.05.43s1.22,3.99,1.7,5.38c3.53,10.16,11.75,22.08,24.25,18.48,9.74-2.81,11.45-15.42,3.45-21.28-10.96-8.02-29.53-8.15-31.74-25.01s9.3-25.64,24.6-26.49Z" />
                                <path d="M1657.97,2296.92c-.32-.36-.36-1.13-.31-1.6.2-1.68,3.46-2.39,4.71-3.28,3.44-2.44,4.44-9.97,4.21-13.89-.68-11.45.44-23.31-.13-34.74-.23-4.57-.98-8.97-6.36-9.36-1.28-.09-4.39.45-4.98-.92-1.06-2.45,2.04-3.63,3.84-4.16,7.38-2.17,13.29-3.01,20.12-7.14.95-.57,2.77-2.1,3.67-2.36,2.57-.76,1.82,1.95,1.79,3.37-.34,18.43.27,36.89,0,55.33.48,8.04,1.81,13.17,10.58,14.46,1.33.2,4.26.05,5.01,1.28,1.56,2.55-2.92,3.23-4.5,3.33-7.06.45-14.61-1.68-21.77-1.45-4.46.14-8.81,1.28-13.1,1.58-.74.05-2.26.15-2.78-.43Z" />
                                <path d="M1674.54,2177.32c.81-.17,1.33.18,1.97.59,2.44,1.59,7.32,7.9,9.06,10.48.9,1.33,1.48,2.31,1,3.97-.79,2.72-6.84,9.87-9.17,11.67-1.03.8-1.97,1.56-3.34,1.12-1.69-.54-4.54-4.7-5.83-6.23s-5.26-5.28-5.32-7.15c-.06-1.69,3.69-6.29,4.86-7.73.72-.88,1.53-1.85,2.29-2.69.83-.93,3.4-3.8,4.49-4.03Z" />
                            </g>

                            {/* Editable Unit Name (replacing static DELHI paths) */}
                            <foreignObject x={1540} y={2310} width={300} height={170}>
                                <div
                                    style={{
                                        fontFamily: 'BodoniModa28pt, serif',
                                        fontSize: '28px',
                                        color: '#000000',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        textAlign: 'center',
                                        lineHeight: 0.85,
                                        letterSpacing: unitName.length < 8 ? '0.55em' : '0.05em',
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'flex-start',
                                        wordBreak: 'break-word',
                                        paddingTop: '4px',
                                    }}
                                >
                                    {unitName}
                                </div>
                            </foreignObject>
                        </g>
                    </g>



                    {/* ─── Main Title ─── */}
                    <foreignObject x={220} y={350} width={W - 440} height={800}>
                        <div
                            // @ts-expect-error - xmlns is needed for SVG serialization
                            xmlns="http://www.w3.org/1999/xhtml"
                            style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                fontFamily: 'BodoniModa28pt, serif',
                                fontSize: `${titleSize}px`,
                                fontWeight: 400,
                                lineHeight: 0.9,
                                color: '#7c3aed',
                                padding: '0 40px',
                                wordBreak: 'break-word',
                                whiteSpace: 'pre-line',
                                letterSpacing: '-0.04em',
                                opacity: title ? 1 : 0.3,
                            }}
                        >
                            {(() => {
                                const text = title || 'Event Title'
                                const lastSpaceIdx = text.lastIndexOf(' ') === -1 ? text.lastIndexOf('\n') : text.lastIndexOf(' ')
                                if (lastSpaceIdx === -1) return <span style={{ color: '#000', fontStyle: 'italic' }}>{text}</span>
                                return (
                                    <span>
                                        {text.slice(0, lastSpaceIdx + 1)}
                                        <span style={{ color: '#000', fontStyle: 'italic' }}>{text.slice(lastSpaceIdx + 1)}</span>
                                    </span>
                                )
                            })()}
                        </div>
                    </foreignObject>

                    {/* ─── Thin decorative line (Hidden for 3 speakers due to centered pattern) ─── */}
                    {speakerCount !== 3 && (
                        <line x1={W / 2 - 200} y1={1180} x2={W / 2 + 200} y2={1180} stroke="#c9a0dc" strokeWidth={1.5} opacity={0.5} />
                    )}

                    {/* ─── Date | Day ─── */}
                    <foreignObject x={100} y={1210} width={W - 200} height={80}>
                        <div
                            // @ts-expect-error - xmlns is needed for SVG serialization
                            xmlns="http://www.w3.org/1999/xhtml"
                            style={{
                                width: '100%',
                                textAlign: 'center',
                                fontFamily: 'CynthoNextBold, sans-serif',
                                fontSize: '64px',
                                fontWeight: 700,
                                color: '#1a1a2e',
                                letterSpacing: '-0.01em',
                                lineHeight: 1.1,
                            }}
                        >
                            {date || 'Date'} {day ? `| ${day}` : ''}
                        </div>
                    </foreignObject>

                    {/* ─── Time Range ─── */}
                    <foreignObject x={100} y={1285} width={W - 200} height={70}>
                        <div
                            // @ts-expect-error - xmlns is needed for SVG serialization
                            xmlns="http://www.w3.org/1999/xhtml"
                            style={{
                                width: '100%',
                                textAlign: 'center',
                                fontFamily: 'CynthoNextBold, sans-serif',
                                fontSize: '56px',
                                fontWeight: 700,
                                color: '#333',
                                lineHeight: 1.1,
                            }}
                        >
                            {timeStart || 'Start'} - {timeEnd || 'End'}
                        </div>
                    </foreignObject>

                    {/* ─── Venue ─── */}
                    <foreignObject x={100} y={1365} width={W - 200} height={80}>
                        <div
                            // @ts-expect-error - xmlns is needed for SVG serialization
                            xmlns="http://www.w3.org/1999/xhtml"
                            style={{
                                width: '100%',
                                textAlign: 'center',
                                fontFamily: 'CynthoNextBold, sans-serif',
                                fontSize: `${venueSize}px`,
                                fontWeight: 700,
                                color: '#7c3aed',
                                letterSpacing: '-0.01em',
                                lineHeight: 1.1,
                            }}
                        >
                            {venue || 'Venue'}
                        </div>
                    </foreignObject>





                </g>

                {/* ─── Speaker Cards + Photos ─── */}
                {speakerPositions.map((pos, i) => {
                    const speaker = speakers[i] || { photo: null, topic: '', name: '', designation: '' }
                    const topicSize = speaker.topic.length > 40 ? 26 : speaker.topic.length > 25 ? 30 : 34
                    const nameSize = speaker.name.length > 20 ? 32 : 38
                    const desigSize = speaker.designation.length > 30 ? 20 : 24

                    return (
                        <g key={`speaker-${i}`}>
                            {/* Photo — renders first (behind card) */}
                            {speaker.photo ? (
                                <g filter="url(#ep-photo-shadow)">
                                    <rect
                                        x={pos.x - photoW / 2}
                                        y={photoY}
                                        width={photoW}
                                        height={photoH}
                                        rx={photoR}
                                        ry={photoR}
                                        fill="#e8ddf0"
                                    />
                                    <image
                                        href={speaker.photo}
                                        x={pos.x - photoW / 2}
                                        y={photoY}
                                        width={photoW}
                                        height={photoH}
                                        clipPath={`url(#ep-photo-clip-${i})`}
                                        preserveAspectRatio="xMidYMid slice"
                                    />
                                    <rect
                                        x={pos.x - photoW / 2}
                                        y={photoY}
                                        width={photoW}
                                        height={photoH}
                                        rx={photoR}
                                        ry={photoR}
                                        fill="none"
                                        stroke="white"
                                        strokeWidth={4}
                                    />
                                </g>
                            ) : (
                                <g filter="url(#ep-photo-shadow)">
                                    <rect
                                        x={pos.x - photoW / 2}
                                        y={photoY}
                                        width={photoW}
                                        height={photoH}
                                        rx={photoR}
                                        ry={photoR}
                                        fill="#ede4f5"
                                        stroke="white"
                                        strokeWidth={4}
                                    />
                                    {/* Placeholder person silhouette - Theme shift applied via CSS Var */}
                                    <g style={{ filter: `hue-rotate(var(--ep-hue, ${hue}deg))` }}>
                                        <circle cx={pos.x} cy={photoY + photoH * 0.36} r={photoW * 0.16} fill="#c9a0dc" opacity={0.45} />
                                        <ellipse cx={pos.x} cy={photoY + photoH * 0.75} rx={photoW * 0.26} ry={photoW * 0.16} fill="#c9a0dc" opacity={0.25} />
                                    </g>
                                </g>
                            )}

                            {/* ── Dynamic Card — HTML based ── */}
                            <foreignObject
                                x={pos.x - cardW / 2}
                                y={cardY}
                                width={cardW}
                                height={600} // ample space for expansion
                                style={{ overflow: 'visible' }}
                            >
                                <div
                                    // @ts-expect-error - xmlns needed
                                    xmlns="http://www.w3.org/1999/xhtml"
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'white',
                                        borderRadius: '32px',
                                        padding: '24px 32px',
                                        boxShadow: '0 4px 32px rgba(124, 58, 237, 0.15)',
                                        width: 'fit-content',
                                        margin: '0 auto',
                                        maxWidth: '100%',
                                        gap: '6px'
                                    }}
                                >
                                    {/* Topic - Theme shift applied */}
                                    <div style={{
                                        textAlign: 'center',
                                        fontFamily: 'MontserratItalic, sans-serif',
                                        fontSize: `${topicSize}px`,
                                        fontWeight: 700,
                                        fontStyle: 'italic',
                                        color: '#7c3aed',
                                        lineHeight: 1.1,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        filter: hue !== 0 ? `hue-rotate(${hue}deg)` : undefined
                                    }}>
                                        {speaker.topic || 'Topic'}
                                    </div>

                                    {/* Divider - Black Dotted Line */}
                                    <div style={{
                                        width: '50%',
                                        height: '0',
                                        borderTop: '3px dotted #000',
                                        margin: '10px 0',
                                        opacity: 0.3
                                    }} />

                                    {/* Name */}
                                    <div style={{
                                        textAlign: 'center',
                                        fontFamily: 'Montserrat, sans-serif',
                                        fontSize: `${nameSize}px`,
                                        fontWeight: 700,
                                        color: '#1a1a2e',
                                        lineHeight: 1.1,
                                        letterSpacing: '-0.02em',
                                    }}>
                                        {speaker.name || 'Speaker Name'}
                                    </div>

                                    {/* Designation */}
                                    <div style={{
                                        textAlign: 'center',
                                        fontFamily: 'Montserrat, sans-serif',
                                        fontSize: `${desigSize}px`,
                                        fontWeight: 500,
                                        color: '#000000',
                                        lineHeight: 1.2,
                                        marginTop: '2px',
                                        maxWidth: '90%'
                                    }}>
                                        {speaker.designation || 'Designation'}
                                    </div>
                                </div>
                            </foreignObject>
                        </g>
                    )
                })}


            </svg>
        )
    }
))
