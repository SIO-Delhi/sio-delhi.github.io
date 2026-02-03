import React, { useMemo } from 'react'
import { FormFooter } from '../../ui/FormFooter'

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
}

export const EventPosterSvg = React.forwardRef<SVGSVGElement, EventPosterProps>(
    function EventPosterSvg(props, ref) {
        const { title, date, day, timeStart, timeEnd, venue, speakerCount, speakers, hue, forDownload, unitName = 'DELHI' } = props

        const W = 2000
        const H = 2500

        // Speaker positions based on count
        const speakerPositions = speakerCount === 3
            ? [{ x: 340 }, { x: 1000 }, { x: 1660 }]
            : [{ x: 620 }, { x: 1380 }]

        const photoW = speakerCount === 3 ? 400 : 460
        const photoH = speakerCount === 3 ? 460 : 520
        const photoY = 1630
        const photoR = 48

        const cardW = speakerCount === 3 ? 530 : 600
        const cardY = photoY + photoH - 60

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
                style={{ filter: hue !== 0 ? `hue-rotate(${hue}deg)` : undefined }}
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
                        <stop offset="0%" stopColor="#5b21b6" stopOpacity="0" />
                        <stop offset="35%" stopColor="#5b21b6" stopOpacity="0.08" />
                        <stop offset="65%" stopColor="#4c1d95" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3b0764" stopOpacity="0.55" />
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

                {/* Moroccan Pattern Decoration — Left */}
                <g transform={`translate(0, ${H / 2}) rotate(90) scale(2.5)`} opacity={0.20}>
                    <g transform="translate(-482.5, -91)">
                        <FormFooter bgColor="none" patternColor="#c9a0dc" width={965} height={182} />
                    </g>
                </g>

                {/* Moroccan Pattern Decoration — Right */}
                <g transform={`translate(${W}, ${H / 2}) rotate(-90) scale(2.5)`} opacity={0.20}>
                    <g transform="translate(-482.5, -91)">
                        <FormFooter bgColor="none" patternColor="#a78bba" width={965} height={182} />
                    </g>
                </g>
                {/* Subtle center glow removed */}

                {/* Header Group - Transferred from Poster Footer */}
                <g transform="translate(0, -2100)">


                    {/* Socials Group - Shifted Right */}
                    <g transform="translate(100, 0)">
                        <g>
                            {/* siodelhi.org text */}
                            <text
                                x={278}
                                y={2310}
                                style={{
                                    fontFamily: 'BodoniModa28pt, serif',
                                    fontSize: '34.55px',
                                    fill: '#000000',
                                }}
                            >
                                siodelhi.org
                            </text>
                            {/* Icons */}
                            <g fill="#000000">
                                <path d="M396.14,2218.15c16.52-2.16,30.86,13.19,27.87,29.53-3.17,17.33-23.51,26.06-38.38,16.65-19.86-12.57-12.77-43.15,10.51-46.18ZM396.14,2220.8c-12.68,1.65-21.68,14.35-19.06,26.86,3.64,17.38,25.41,23.88,38.06,11.39,15.34-15.15,2.05-40.99-19.01-38.25Z" />
                                <path d="M338.41,2218.15c10.9-1.47,22.96,6.08,26.52,16.45,8.21,23.86-19.45,43.45-39.01,28.4-18.02-13.87-9.81-41.85,12.49-44.85ZM337.75,2220.8c-15.31,2.31-23.86,20.09-16.12,33.54,8.24,14.32,29.2,15.1,38.37,1.32,10.94-16.44-3.05-37.76-22.25-34.86Z" />
                                <path d="M474.74,2261.09c-11.41,11.28-31.98,8.41-39.64-5.75-11.88-21.97,11.66-45.68,33.67-34.33,15.06,7.77,18.03,28.16,5.97,40.08ZM453.54,2220.81c-9,1.3-17.31,9.48-18.68,18.48-3.6,23.72,26.23,35.88,40.46,17.24,12.21-15.99-2.1-38.57-21.79-35.72Z" />
                                <path d="M281.7,2218.17c17.23-1.4,30.55,15.76,25.59,32.23-6.7,22.24-38.57,23.66-47.15,2.4-6.53-16.16,4.36-33.23,21.56-34.63ZM279.36,2220.81c-8.06,1.34-15.8,8.41-17.88,16.29-6.09,23.13,22.78,38.57,38.7,21.12,14.48-15.86.14-40.89-20.83-37.42Z" />
                                <path d="M205.92,2259.09c-11.18-13.5-5.06-34.76,11.81-39.85,21.54-6.5,40.59,16.09,29.7,36-8.4,15.36-30.41,17.26-41.52,3.85ZM209.56,2259.76c8.2,8.03,22.16,8.15,30.74.62,11.89-10.43,10.22-29.44-3.69-37.13-23.12-12.77-46.27,17.68-27.05,36.51Z" />
                                <path d="M245.53,2275.89c16.87-1.8,29.36,14.58,22.26,30.22-8.05,17.73-34.69,15.87-40.19-3.18-3.57-12.37,5.05-25.67,17.93-27.04ZM246.87,2277.89c-23.6,1.57-23.43,36.96-.09,38.38,27.72,1.68,27.04-40.17.09-38.38Z" />
                                <path d="M391.85,2234.09c3.55-.38,14.74-.54,17.73.65.71.28,1.56.7,1.83,1.49.3.87.74,4.54.76,5.55.03,1.62-.19,4.65-.39,6.28-.6,5.02-5.44,3.7-9.1,3.84-3.85.15-8.73.51-12.56-.02-.68-.09-1.86-.49-2.36-.96-2.14-1.98-2.08-13.6,0-15.62.76-.74,3.01-1.1,4.1-1.21ZM396.23,2246.27c2.43-.87,4.83-1.99,6.96-3.48,0-.45-5.96-3.26-6.96-3.48v6.97Z" />
                                <path d="M335.35,2230.02l6.99,8.98c.42.07.67-.13.99-.34,2.64-1.74,5.17-6.62,7.46-8.13.86-.57,2.21-.92,2.97-.01l-9.56,10.55,10.89,14.83h-8.46l-7.31-9.62c-.68-.17-3.64,3.94-4.3,4.65-.83.88-4.57,4.82-5.32,4.96-.66.13-1.46-.05-2.15,0l10.16-11.45-10.17-14.43h7.8ZM350.77,2254.23c.3-.26-1.54-2.87-1.85-3.29-3.7-5.1-7.71-10.02-11.56-14.98-1.72-2.2-1.76-4.36-5.49-3.63l.32,1.17,16.1,20.73h2.49Z" />
                                <path d="M455.87,2229.45c18.28-2.35,20.27,24.94,2.89,26.11-3.37.23-5.53-1.56-7.28-1.61-1.42-.04-5.31,1.84-6.28,1.6l-.48-.74c.32-1.55,1.67-4.26,1.62-5.72-.03-.91-1.39-3.23-1.59-4.71-.95-6.97,4.05-14.01,11.12-14.92ZM447.99,2252.57c.13.14,2.98-1.04,3.8-.98.91.06,2.78,1.36,4.08,1.57,12.39,1.95,17.69-14.63,7.28-20.22-8.25-4.42-17.32,2.18-16.07,11.42.21,1.57,1.55,3.47,1.6,4.39.07,1.22-.84,2.54-.69,3.82Z" />
                                <path d="M285.42,2239.63l4.31.33c.12,3.68.57,5.11-3.77,4.69l-.5.5-.19,11.09-4.29.26c-.43-.11-.47-.4-.54-.78-.55-2.98.45-7.42-.05-10.57-.33-1.01-3.04-.38-3.94-.54v-4.65s3.84-.31,3.84-.31c.36-1.46,0-2.98.18-4.46.56-4.61,5.52-6,9.45-4.88.7.55.79,4.02-.08,4.3-4.38-.33-4.8.92-4.43,5.02Z" />
                                <path d="M236.87,2230.8c1.15.84,1.98,2.57,2.12,4.01.28,2.83.37,15.79-.28,18.01s-2.93,3.82-5.21,4.08c-3.73.42-12.14.35-15.94.01-2.22-.2-4.53-1.48-5.29-3.67-.88-2.54-.81-15.26-.5-18.41.25-2.45,1.91-4.85,4.47-5.15,3.59-.43,14.36-.44,17.93,0,.82.1,2.04.64,2.7,1.13ZM235.55,2253.14c.4-.46.71-1.43.78-2.05.38-3.39.4-12.57,0-15.94-.15-1.29-1.11-2.66-2.48-2.83-5.33.43-11.39-.51-16.63,0-2.25.22-2.64,1.85-2.81,3.82-.3,3.57-.38,11.12.01,14.61.23,2.03,1.01,3.23,3.15,3.49,3.4.41,11.81.34,15.29,0,.87-.08,2.11-.44,2.7-1.11Z" />
                                <path d="M250.48,2294.14c.82.99.43,2.63-1.01,2.49-1.15-.12-1.64-1.94-3.78-1.01-.49.21-4.17,3.81-4.58,4.38-1.87,2.61.58,5.33,3.16,4.15,1-.46,2.45-3.44,3.98-2.66l.62.75c.53,1.92-3.43,4.56-5.09,4.74-4.15.47-7.53-3.72-5.55-7.54.53-1.01,4.72-5.24,5.72-5.89,1.77-1.16,5.14-1.09,6.52.58Z" />
                                <path d="M252.49,2286.15c3.39-.66,7.17,3.22,6.23,6.58-.46,1.64-5.15,6.57-6.7,7.23-3.13,1.34-8.29-1.04-5.94-2.97,1.12-.92,2.59,1.55,4.83.52.37-.17,3.26-2.82,3.66-3.3,1.59-1.9,2.2-5-.91-5.42-2.46-.33-3.31,3.51-5.49,2.86-2.86-.85,2.77-5.21,4.32-5.51Z" />
                                <path d="M452.87,2236.37c1.31-.36,2.32,1.57,2.6,2.6.47,1.7-.82,1.62-.85,2.48-.04,1.15,3.15,3.88,4.22,4.11,1.65.35,1.45-1.4,2.29-1.56.23-.04,2.6,1.09,2.9,1.32,1.31.99-.46,2.93-1.69,3.21-4.62,1.06-12.39-5.71-10.9-10.56.15-.47.94-1.46,1.42-1.59Z" />
                                <path d="M223.62,2236.06c5.04-1.04,10.08,3.43,8.91,8.58-1.34,5.86-9.02,7.83-12.79,3.12-3.08-3.86-1.12-10.66,3.88-11.69ZM224.28,2238.72c-5.45,1.12-3.61,10.11,2.18,8.81,5.39-1.21,4.06-10.09-2.18-8.81Z" />
                                <path d="M234.25,2234.41c1.38,1.39-.53,4.3-2.43,2.93-2.23-1.61.83-4.54,2.43-2.93Z" />
                            </g>
                        </g>
                    </g>

                    {/* SIO Logo Group - Shifted Left */}
                    <g transform="translate(-100, 0)">
                        <g fill="#000000">
                            <path d="M1733.67,2222.02c24.65-1.29,43.46,15.89,41.58,41.05-2.01,26.87-29.09,42.15-54.1,34.84-11.59-3.39-21.54-12.86-24.87-24.55-7.19-25.24,11.67-49.99,37.4-51.34ZM1730.52,2226.87c-18.75,1.37-18.99,28.22-15.64,41.64s14.84,31.24,31.07,25.17c15.57-5.82,14.06-29.75,10.19-42.57-3.45-11.42-11.95-25.24-25.62-24.24Z" />
                            <path d="M1630.64,2222.02c5.09-.28,11.54.39,16.38,2.02,2.13.72,3.63,1.6,3.83,4.03.32,3.82.36,7.71.66,11.53.07.96.71,2.36-.56,2.98-1.92.94-3.46-1.82-4.34-3.18-4.19-6.48-7.45-13.22-16.4-13.75-10.8-.64-17.62,10.87-8.38,18.35,7.28,5.89,19.47,6.74,26.41,13.83,12.31,12.57,6.2,35.59-10.52,40.74-9.26,2.85-18.12-.55-27.07-2.36-1.22-.25-3.93-.34-4.87-.9-1.79-1.06-.85-4.29-.79-6.01.17-5.45-.63-10.97-.4-16.4.03-.66.12-2.08.76-2.39.98-.48,2.35-.48,3.05.43s1.22,3.99,1.7,5.38c3.53,10.16,11.75,22.08,24.25,18.48,9.74-2.81,11.45-15.42,3.45-21.28-10.96-8.02-29.53-8.15-31.74-25.01s9.3-25.64,24.6-26.49Z" />
                            <path d="M1657.97,2296.92c-.32-.36-.36-1.13-.31-1.6.2-1.68,3.46-2.39,4.71-3.28,3.44-2.44,4.44-9.97,4.21-13.89-.68-11.45.44-23.31-.13-34.74-.23-4.57-.98-8.97-6.36-9.36-1.28-.09-4.39.45-4.98-.92-1.06-2.45,2.04-3.63,3.84-4.16,7.38-2.17,13.29-3.01,20.12-7.14.95-.57,2.77-2.1,3.67-2.36,2.57-.76,1.82,1.95,1.79,3.37-.34,18.43.27,36.89,0,55.33.48,8.04,1.81,13.17,10.58,14.46,1.33.2,4.26.05,5.01,1.28,1.56,2.55-2.92,3.23-4.5,3.33-7.06.45-14.61-1.68-21.77-1.45-4.46.14-8.81,1.28-13.1,1.58-.74.05-2.26.15-2.78-.43Z" />
                            <path d="M1674.54,2177.32c.81-.17,1.33.18,1.97.59,2.44,1.59,7.32,7.9,9.06,10.48.9,1.33,1.48,2.31,1,3.97-.79,2.72-6.84,9.87-9.17,11.67-1.03.8-1.97,1.56-3.34,1.12-1.69-.54-4.54-4.7-5.83-6.23s-5.26-5.28-5.32-7.15c-.06-1.69,3.69-6.29,4.86-7.73.72-.88,1.53-1.85,2.29-2.69.83-.93,3.4-3.8,4.49-4.03Z" />
                        </g>

                        {/* Editable Unit Name (replacing static DELHI paths) */}
                        <foreignObject x={1540} y={2310} width={300} height={150}>
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

                {/* ─── Thin decorative line ─── */}
                <line x1={W / 2 - 200} y1={1180} x2={W / 2 + 200} y2={1180} stroke="#c9a0dc" strokeWidth={1.5} opacity={0.5} />

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

                {/* ─── Full-width purple gradient rising from bottom ─── */}
                <rect
                    x={0}
                    y={H - 900}
                    width={W}
                    height={900}
                    fill="url(#ep-bottom-gradient)"
                />
                <rect
                    x={0}
                    y={H - 900}
                    width={W}
                    height={900}
                    fill="url(#ep-dot-pattern)"
                    style={{ opacity: 0.2 }}
                />



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
                                        style={hue !== 0 ? { filter: `hue-rotate(${-hue}deg)` } : undefined}
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
                                    {/* Placeholder person silhouette */}
                                    <circle cx={pos.x} cy={photoY + photoH * 0.36} r={photoW * 0.16} fill="#c9a0dc" opacity={0.45} />
                                    <ellipse cx={pos.x} cy={photoY + photoH * 0.75} rx={photoW * 0.26} ry={photoW * 0.16} fill="#c9a0dc" opacity={0.25} />
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
                                    {/* Topic */}
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
                                    }}>
                                        {speaker.topic || 'Topic'}
                                    </div>

                                    {/* Divider */}
                                    <div style={{
                                        width: '60%',
                                        height: '1px',
                                        backgroundColor: '#e8ddf0',
                                        margin: '8px 0',
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
)
