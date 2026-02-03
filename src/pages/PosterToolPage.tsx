import { useState } from 'react'
import { ToolLayout } from '../components/tools/layout/ToolLayout'
import { PosterTool } from '../components/tools/poster/PosterTool'
import { EventPosterTool } from '../components/tools/poster/EventPosterTool'
import { ChevronLeft, User, Users } from 'lucide-react'

type View =
    | { type: 'select' }
    | { type: 'classic' }
    | { type: 'event-count' }
    | { type: 'event'; count: 2 | 3 }

export function PosterToolPage() {
    const [view, setView] = useState<View>({ type: 'select' })

    if (view.type === 'classic') {
        return (
            <ToolLayout>
                <PosterTool />
            </ToolLayout>
        )
    }

    if (view.type === 'event') {
        return (
            <ToolLayout>
                <EventPosterTool
                    speakerCount={view.count}
                    onBack={() => setView({ type: 'select' })}
                />
            </ToolLayout>
        )
    }

    // Template selection or speaker count selection
    return (
        <ToolLayout>
            <div className="ep-template-select">
                {view.type === 'select' ? (
                    <>
                        <h2 className="ep-select-title">Create a Poster</h2>
                        <p className="ep-select-subtitle">Select your preferred style to begin customizing</p>

                        <div className="ep-template-grid">
                            {/* Classic poster */}
                            <button
                                className="ep-template-card"
                                onClick={() => setView({ type: 'classic' })}
                            >
                                <div className="ep-template-thumb ep-thumb-classic">
                                    <div className="ep-thumb-overlay">
                                        <User size={48} strokeWidth={1.5} color="rgba(255,255,255,0.8)" />
                                    </div>
                                    <div className="ep-card-badge">SINGLE SPEAKER</div>
                                </div>
                                <div className="ep-template-info">
                                    <h3>Classic Layout</h3>
                                    <p>Standard design for weekly lectures and single-speaker programs.</p>
                                </div>
                            </button>

                            {/* Event poster */}
                            <button
                                className="ep-template-card"
                                onClick={() => setView({ type: 'event-count' })}
                            >
                                <div className="ep-template-thumb ep-thumb-event">
                                    <div className="ep-thumb-overlay">
                                        <Users size={48} strokeWidth={1.5} color="rgba(255,255,255,0.8)" />
                                    </div>
                                    <div className="ep-card-badge" style={{ background: 'rgba(124, 58, 237, 0.2)', color: '#a78bfa' }}>MULTI SPEAKER</div>
                                </div>
                                <div className="ep-template-info">
                                    <h3>Event Layout</h3>
                                    <p>Modern design for conferences, seminars, and multi-speaker events.</p>
                                </div>
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <button
                            className="ep-back-btn"
                            style={{ marginBottom: '24px' }}
                            onClick={() => setView({ type: 'select' })}
                        >
                            <ChevronLeft size={18} /> Back
                        </button>

                        <h2 className="ep-select-title">Speaker Composition</h2>
                        <p className="ep-select-subtitle">How many guests are joining the program?</p>

                        <div className="ep-template-grid">
                            <button
                                className="ep-template-card"
                                onClick={() => setView({ type: 'event', count: 2 })}
                            >
                                <div className="ep-template-thumb ep-thumb-2sp">
                                    <div className="ep-thumb-overlay">
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <User size={38} strokeWidth={1.5} />
                                            <User size={38} strokeWidth={1.5} />
                                        </div>
                                    </div>
                                    <div className="ep-card-badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>Side-by-Side</div>
                                </div>
                                <div className="ep-template-info">
                                    <h3>Double Speakers</h3>
                                    <p>Balanced two-person layout with circular photo frames.</p>
                                </div>
                            </button>

                            <button
                                className="ep-template-card"
                                onClick={() => setView({ type: 'event', count: 3 })}
                            >
                                <div className="ep-template-thumb ep-thumb-3sp">
                                    <div className="ep-thumb-overlay">
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                                            <User size={32} strokeWidth={1.5} style={{ opacity: 0.7 }} />
                                            <User size={42} strokeWidth={2} />
                                            <User size={32} strokeWidth={1.5} style={{ opacity: 0.7 }} />
                                        </div>
                                    </div>
                                    <div className="ep-card-badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>Triple Layout</div>
                                </div>
                                <div className="ep-template-info">
                                    <h3>Three Speakers</h3>
                                    <p>Panoramic layout optimized for dynamic panel discussions.</p>
                                </div>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </ToolLayout>
    )
}
