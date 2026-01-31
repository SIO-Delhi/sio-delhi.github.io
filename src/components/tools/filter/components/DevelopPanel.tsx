/**
 * DevelopPanel - Right panel with Lightroom-style adjustment sliders
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronDown, ChevronRight, X, RotateCcw, Download, Loader2, CheckCircle2, Repeat } from 'lucide-react'
import { useTheme } from '../../../../context/ThemeContext'
import type { FilterConfig } from '../FilterEngine'
import { parseCubeFile } from '../utils/lutParser'
import type { LUTData } from '../utils/lutParser'

interface DevelopPanelProps {
    config: FilterConfig
    onChange: (config: FilterConfig) => void
    lut: LUTData | null
    onLutChange: (lut: LUTData | null) => void
    onReset: () => void
    onApplyToAll: () => void
    hasMultiplePhotos: boolean
    onExport: () => void
    isExporting: boolean
    exportProgress: number
    photoCount: number
    onTransfer?: () => void
    isTransferring?: boolean
    transferProgress?: number
    isApplying?: boolean
    applySuccess?: boolean
}

interface SliderProps {
    label: string
    value: number
    min: number
    max: number
    step?: number
    onChange: (value: number) => void
    color?: string
    gradient?: string // CSS gradient for the track background
}

function Slider({ label, value, min, max, step = 1, onChange, color, gradient }: SliderProps) {
    const { isDark } = useTheme()
    const percentage = ((value - min) / (max - min)) * 100
    const isNeutral = value === 0 || value === (min + max) / 2
    const trackColor = color || (isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)')
    const isBidirectional = min < 0
    const centerValue = isBidirectional ? 0 : (min + max) / 2

    const handleDoubleClick = () => onChange(centerValue)

    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            const delta = -Math.sign(e.deltaY) * step
            const newValue = Math.max(min, Math.min(max, value + delta))
            if (newValue !== value) {
                onChange(newValue)
            }
        }

        container.addEventListener('wheel', onWheel, { passive: false })
        return () => container.removeEventListener('wheel', onWheel)
    }, [value, min, max, step, onChange])

    return (
        <div
            ref={containerRef}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '4px 0'
            }}
        >
            <span style={{
                width: '76px',
                fontSize: '0.72rem',
                color: isDark ? '#777' : '#777',
                flexShrink: 0,
                letterSpacing: '0.01em',
                userSelect: 'none'
            }}>
                {label}
            </span>
            <div
                onDoubleClick={handleDoubleClick}
                style={{
                    flex: 1,
                    position: 'relative',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                }}
            >
                {/* Track background */}
                <div style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: gradient ? '3px' : '2px',
                    background: gradient || (isDark ? '#2a2a2a' : '#ddd'),
                    borderRadius: '1.5px',
                    overflow: 'hidden'
                }}>
                    {/* Fill indicator - inside track for clean look */}
                    {!gradient && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: isBidirectional ? (value < 0 ? `${percentage}%` : '50%') : 0,
                            width: isBidirectional ? `${Math.abs(percentage - 50)}%` : `${percentage}%`,
                            background: trackColor,
                            borderRadius: '1.5px'
                        }} />
                    )}
                </div>
                {/* Center tick for bidirectional */}
                {isBidirectional && !gradient && (
                    <div style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '1px',
                        height: '6px',
                        background: isDark ? '#444' : '#bbb',
                        pointerEvents: 'none'
                    }} />
                )}
                {/* Thumb */}
                <div style={{
                    position: 'absolute',
                    left: `${percentage}%`,
                    transform: 'translateX(-50%)',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: isDark ? '#fff' : '#222',
                    boxShadow: isDark
                        ? '0 0 0 1.5px rgba(255,255,255,0.15), 0 1px 4px rgba(0,0,0,0.4)'
                        : '0 0 0 1.5px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.12)',
                    pointerEvents: 'none'
                }} />
                {/* Hidden range input */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                        margin: 0
                    }}
                />
            </div>
            <span
                style={{
                    width: '36px',
                    textAlign: 'right',
                    fontSize: '0.68rem',
                    fontWeight: 500,
                    color: isNeutral ? (isDark ? '#444' : '#bbb') : (isDark ? '#999' : '#444'),
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    letterSpacing: '-0.02em',
                    userSelect: 'none'
                }}
                onDoubleClick={handleDoubleClick}
                title="Double-click to reset"
            >
                {value > 0 && min < 0 ? '+' : ''}{step < 1 ? value.toFixed(2) : value}
            </span>
        </div>
    )
}

interface SectionProps {
    title: string
    children: React.ReactNode
    defaultOpen?: boolean
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
    const { isDark } = useTheme()
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div style={{ borderBottom: `1px solid ${isDark ? '#1a1a1a' : '#eee'}` }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '14px 16px',
                    background: 'none',
                    border: 'none',
                    color: isDark ? '#aaa' : '#555',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em'
                }}
            >
                {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {title}
            </button>
            {isOpen && (
                <div style={{ padding: '0 16px 14px' }}>
                    {children}
                </div>
            )}
        </div>
    )
}

export function DevelopPanel({
    config,
    onChange,
    lut,
    onLutChange,
    onReset,
    onApplyToAll,
    hasMultiplePhotos,
    onExport,
    isExporting,
    exportProgress,
    photoCount,
    onTransfer,
    isTransferring,
    transferProgress,
    isApplying,
    applySuccess
}: DevelopPanelProps) {
    const { isDark } = useTheme()
    const lutInputRef = useRef<HTMLInputElement>(null)

    const updateConfig = useCallback((key: keyof FilterConfig, value: number) => {
        onChange({ ...config, [key]: value })
    }, [config, onChange])

    const handleLutSelect = async (value: string) => {
        if (value === 'none') {
            onLutChange(null)
        } else if (value === 'import') {
            lutInputRef.current?.click()
        } else {
            try {
                const response = await fetch(`/luts/${encodeURIComponent(value)}`)
                if (!response.ok) throw new Error(`HTTP ${response.status}`)
                const content = await response.text()
                const lutData = parseCubeFile(content)
                lutData.title = value
                onLutChange(lutData)
            } catch (err) {
                console.error('Failed to load preset LUT:', err)
            }
        }
    }

    const handleWBSelect = useCallback((value: string) => {
        const presets: Record<string, { temp: number; tint: number }> = {
            auto: { temp: 0, tint: 0 },
            daylight: { temp: 10, tint: 5 },
            cloudy: { temp: 25, tint: 10 },
            shade: { temp: 35, tint: 15 },
            tungsten: { temp: -55, tint: -10 },
            fluorescent: { temp: -20, tint: 25 }
        }
        const preset = presets[value]
        if (preset) {
            onChange({
                ...config,
                temperature: preset.temp,
                tint: preset.tint
            })
        }
    }, [config, onChange])

    const lutSelectRef = useRef<HTMLSelectElement>(null)
    const wbSelectRef = useRef<HTMLSelectElement>(null)

    useEffect(() => {
        const select = lutSelectRef.current
        if (!select) return

        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            const options = Array.from(select.querySelectorAll('option'))
                .filter(opt => opt.value !== 'import')

            const currentIndex = options.findIndex(opt => opt.value === (lut?.title || 'none'))
            if (currentIndex === -1) return

            const delta = Math.sign(e.deltaY)
            let nextIndex = currentIndex + delta

            if (nextIndex < 0) nextIndex = options.length - 1
            if (nextIndex >= options.length) nextIndex = 0

            handleLutSelect(options[nextIndex].value)
        }

        select.addEventListener('wheel', onWheel, { passive: false })
        return () => select.removeEventListener('wheel', onWheel)
    }, [lut, handleLutSelect])

    useEffect(() => {
        const select = wbSelectRef.current
        if (!select) return

        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            const options = Array.from(select.querySelectorAll('option'))
                .filter(opt => !opt.disabled)

            const currentValue = config.temperature === 0 && config.tint === 0 ? 'auto' :
                config.temperature === 10 && config.tint === 5 ? 'daylight' :
                    config.temperature === 25 && config.tint === 10 ? 'cloudy' :
                        config.temperature === 35 && config.tint === 15 ? 'shade' :
                            config.temperature === -55 && config.tint === -10 ? 'tungsten' :
                                config.temperature === -20 && config.tint === 25 ? 'fluorescent' :
                                    'custom'

            const currentIndex = options.findIndex(opt => opt.value === currentValue)
            if (currentIndex === -1) return

            const delta = Math.sign(e.deltaY)
            let nextIndex = currentIndex + delta

            if (nextIndex < 0) nextIndex = options.length - 1
            if (nextIndex >= options.length) nextIndex = 0

            handleWBSelect(options[nextIndex].value)
        }

        select.addEventListener('wheel', onWheel, { passive: false })
        return () => select.removeEventListener('wheel', onWheel)
    }, [config, handleWBSelect])

    const handleLutUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            const content = await file.text()
            const lutData = parseCubeFile(content)
            onLutChange(lutData)
        } catch (err) {
            console.error('Failed to parse LUT:', err)
            alert('Failed to parse LUT file. Please ensure it is a valid .cube file.')
        }

        e.target.value = ''
    }

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: isDark ? '#0a0a0a' : '#f8f8f8',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '14px 16px',
                borderBottom: `1px solid ${isDark ? '#1a1a1a' : '#eee'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <span style={{
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    color: isDark ? '#ddd' : '#222',
                    letterSpacing: '0.02em'
                }}>
                    Develop
                </span>
                <button
                    onClick={onReset}
                    title="Reset all"
                    style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: `1px solid ${isDark ? '#2a2a2a' : '#ddd'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: isDark ? '#666' : '#999',
                        transition: 'color 0.15s, border-color 0.15s'
                    }}
                >
                    <RotateCcw size={13} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {/* Profile / LUT Section */}
                <Section title="Profile">
                    {/* LUT Dropdown Selector */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                            ref={lutSelectRef}
                            value={lut?.title || 'none'}
                            onChange={(e) => handleLutSelect(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '6px',
                                background: isDark ? '#1a1a1a' : '#fff',
                                border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                                color: isDark ? '#fff' : '#111',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${isDark ? '%23888' : '%23666'}' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center',
                                paddingRight: '36px'
                            }}
                        >
                            <option value="none">No Profile</option>
                            <optgroup label="Alen Palander">
                                <option value="Alen Palander - Alaska.cube">Alaska</option>
                                <option value="Alen Palander - Arizona.cube">Arizona</option>
                                <option value="Alen Palander - Austria.cube">Austria</option>
                                <option value="Alen Palander - Big Sur.cube">Big Sur</option>
                                <option value="Alen Palander - Cappadocia.cube">Cappadocia</option>
                                <option value="Alen Palander - Istanbul.cube">Istanbul</option>
                                <option value="Alen Palander - Los Angeles.cube">Los Angeles</option>
                                <option value="Alen Palander - Toronto.cube">Toronto</option>
                                <option value="Alen Palander - Vancouver.cube">Vancouver</option>
                                <option value="Alen Palander - Yosemite.cube">Yosemite</option>
                                <option value="Alen Palander - Zurich.cube">Zurich</option>
                            </optgroup>
                            <optgroup label="Custom">
                                <option value="import">Import LUT (.cube)</option>
                            </optgroup>
                        </select>
                        {lut && (
                            <button
                                onClick={() => onLutChange(null)}
                                title="Clear profile"
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    background: isDark ? '#1a1a1a' : '#fff',
                                    border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: isDark ? '#888' : '#666',
                                    flexShrink: 0
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <input
                        ref={lutInputRef}
                        type="file"
                        accept=".cube"
                        onChange={handleLutUpload}
                        style={{ display: 'none' }}
                    />
                </Section>

                {/* Light Section */}
                <Section title="Light">
                    <Slider
                        label="Exposure"
                        value={config.exposure}
                        min={-5}
                        max={5}
                        step={0.05}
                        onChange={(v) => updateConfig('exposure', v)}
                    />
                    <Slider
                        label="Contrast"
                        value={config.contrast}
                        min={-100}
                        max={100}
                        onChange={(v) => updateConfig('contrast', v)}
                    />
                    <Slider
                        label="Highlights"
                        value={config.highlights}
                        min={-100}
                        max={100}
                        onChange={(v) => updateConfig('highlights', v)}
                    />
                    <Slider
                        label="Shadows"
                        value={config.shadows}
                        min={-100}
                        max={100}
                        onChange={(v) => updateConfig('shadows', v)}
                    />
                    <Slider
                        label="Whites"
                        value={config.whites}
                        min={-100}
                        max={100}
                        onChange={(v) => updateConfig('whites', v)}
                    />
                    <Slider
                        label="Blacks"
                        value={config.blacks}
                        min={-100}
                        max={100}
                        onChange={(v) => updateConfig('blacks', v)}
                    />
                </Section>

                {/* Color Section */}
                <Section title="Color">
                    {/* White Balance Dropdown */}
                    <div style={{ marginBottom: '14px' }}>
                        <span style={{
                            fontSize: '0.68rem',
                            color: isDark ? '#666' : '#999',
                            display: 'block',
                            marginBottom: '6px',
                            letterSpacing: '0.02em'
                        }}>
                            White Balance
                        </span>
                        <select
                            value={
                                config.temperature === 0 && config.tint === 0 ? 'auto' :
                                    config.temperature === 10 && config.tint === 5 ? 'daylight' :
                                        config.temperature === 25 && config.tint === 10 ? 'cloudy' :
                                            config.temperature === 35 && config.tint === 15 ? 'shade' :
                                                config.temperature === -55 && config.tint === -10 ? 'tungsten' :
                                                    config.temperature === -20 && config.tint === 25 ? 'fluorescent' :
                                                        'custom'
                            }
                            onChange={(e) => handleWBSelect(e.target.value)}
                            ref={wbSelectRef}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                background: isDark ? '#1a1a1a' : '#fff',
                                border: `1px solid ${isDark ? '#333' : '#ddd'}`,
                                color: isDark ? '#fff' : '#111',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${isDark ? '%23888' : '%23666'}' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center',
                                paddingRight: '36px'
                            }}
                        >
                            <option value="auto">Auto (Neutral)</option>
                            <option value="daylight">Daylight</option>
                            <option value="cloudy">Cloudy</option>
                            <option value="shade">Shade</option>
                            <option value="tungsten">Tungsten</option>
                            <option value="fluorescent">Fluorescent</option>
                            <option value="custom" disabled>Custom</option>
                        </select>
                    </div>
                    <Slider
                        label="Temp"
                        value={config.temperature}
                        min={-100}
                        max={100}
                        onChange={(v) => updateConfig('temperature', v)}
                        gradient="linear-gradient(to right, #3b82f6, #fbbf24, #f97316)"
                    />
                    <Slider
                        label="Tint"
                        value={config.tint}
                        min={-100}
                        max={100}
                        onChange={(v) => updateConfig('tint', v)}
                        gradient="linear-gradient(to right, #10b981, #e5e5e5, #ec4899)"
                    />
                    <Slider
                        label="Vibrance"
                        value={config.vibrance}
                        min={-100}
                        max={100}
                        onChange={(v) => updateConfig('vibrance', v)}
                        gradient="linear-gradient(to right, #6b7280, #a855f7, #ec4899)"
                    />
                    <Slider
                        label="Saturation"
                        value={config.saturation}
                        min={-100}
                        max={100}
                        onChange={(v) => updateConfig('saturation', v)}
                        gradient="linear-gradient(to right, #9ca3af, #f43f5e, #ef4444)"
                    />
                </Section>

                {/* Action Buttons */}
                <div style={{
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    <button
                        onClick={onApplyToAll}
                        disabled={isApplying || !hasMultiplePhotos}
                        title={hasMultiplePhotos ? 'Apply current settings to all photos' : 'Upload 2+ photos to enable'}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            background: applySuccess ? 'rgba(16, 185, 129, 0.1)' : (isDark ? '#27272a' : '#eee'),
                            border: `1px solid ${applySuccess ? '#10b981' : (isDark ? '#3f3f46' : 'transparent')}`,
                            color: applySuccess ? '#10b981' : (isDark ? 'white' : '#444'),
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: (isApplying || !hasMultiplePhotos) ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                    >
                        {isApplying ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Applying...
                            </>
                        ) : applySuccess ? (
                            <>
                                <CheckCircle2 size={14} />
                                Applied to All
                            </>
                        ) : (
                            <>
                                <Repeat size={14} />
                                Apply Settings to All
                            </>
                        )}
                    </button>

                    {onTransfer && (
                        <button
                            onClick={onTransfer}
                            disabled={isTransferring || isExporting || photoCount === 0}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '8px',
                                background: isTransferring ? (isDark ? '#1a1a1a' : '#eee') : 'rgba(167, 139, 250, 0.1)',
                                border: `1px solid ${isTransferring ? 'transparent' : 'rgba(167, 139, 250, 0.2)'}`,
                                color: isTransferring ? '#666' : '#a78bfa',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: isTransferring ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            {isTransferring ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Transferring {Math.round(transferProgress || 0)}%
                                </>
                            ) : (
                                'Transfer to Frame Tool'
                            )}
                        </button>
                    )}

                    <button
                        onClick={onExport}
                        disabled={photoCount === 0 || isExporting}
                        title={photoCount > 0 ? 'Export all photos as ZIP' : 'Add photos first'}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            background: photoCount > 0 ? '#ff3b3b' : (isDark ? '#222' : '#ddd'),
                            border: 'none',
                            color: 'white',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: photoCount > 0 && !isExporting ? 'pointer' : 'not-allowed',
                            fontFamily: 'inherit',
                            opacity: isExporting ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        {isExporting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Exporting {Math.round(exportProgress)}%
                            </>
                        ) : (
                            <>
                                <Download size={16} />
                                Export All as ZIP
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
