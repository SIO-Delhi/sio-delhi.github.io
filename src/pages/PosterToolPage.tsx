import { useState } from 'react'
import { ToolLayout } from '../components/tools/layout/ToolLayout'
import { PosterTool } from '../components/tools/poster/PosterTool'
import { EventPosterTool } from '../components/tools/poster/EventPosterTool'
import { ChevronLeft, User, Users, Mic } from 'lucide-react'

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
                        <h2 className="ep-select-title">Choose a Template</h2>
                        <p className="ep-select-subtitle">Select a poster style to get started</p>

                        <div className="ep-template-grid">
                            {/* Classic poster */}
                            <button
                                className="ep-template-card"
                                onClick={() => setView({ type: 'classic' })}
                            >
                                <div className="ep-template-thumb ep-thumb-classic">
                                    <User size={40} strokeWidth={1.5} />
                                </div>
                                <div className="ep-template-info">
                                    <h3>Classic Poster</h3>
                                    <p>Single speaker with topic, date, and venue</p>
                                </div>
                            </button>

                            {/* Event poster */}
                            <button
                                className="ep-template-card"
                                onClick={() => setView({ type: 'event-count' })}
                            >
                                <div className="ep-template-thumb ep-thumb-event">
                                    <Users size={40} strokeWidth={1.5} />
                                </div>
                                <div className="ep-template-info">
                                    <h3>Event Poster</h3>
                                    <p>Multi-speaker event with photos and topics</p>
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

                        <h2 className="ep-select-title">How many speakers?</h2>
                        <p className="ep-select-subtitle">Choose the number of speakers for your event poster</p>

                        <div className="ep-template-grid">
                            <button
                                className="ep-template-card"
                                onClick={() => setView({ type: 'event', count: 2 })}
                            >
                                <div className="ep-template-thumb ep-thumb-2sp">
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <Mic size={28} strokeWidth={1.5} />
                                        <Mic size={28} strokeWidth={1.5} />
                                    </div>
                                </div>
                                <div className="ep-template-info">
                                    <h3>2 Speakers</h3>
                                    <p>Two speaker layout with photos and topic cards</p>
                                </div>
                            </button>

                            <button
                                className="ep-template-card"
                                onClick={() => setView({ type: 'event', count: 3 })}
                            >
                                <div className="ep-template-thumb ep-thumb-3sp">
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <Mic size={24} strokeWidth={1.5} />
                                        <Mic size={28} strokeWidth={1.5} />
                                        <Mic size={24} strokeWidth={1.5} />
                                    </div>
                                </div>
                                <div className="ep-template-info">
                                    <h3>3 Speakers</h3>
                                    <p>Three speaker layout with photos and topic cards</p>
                                </div>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </ToolLayout>
    )
}
