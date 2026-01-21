import type { SectionTemplate } from '../../types/content'

interface TemplateSelectorProps {
    selected: SectionTemplate
    onSelect: (template: SectionTemplate) => void
}

export function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
    const list = [
        {
            id: 'standard',
            label: 'Template 1',
            description: 'Standard Card',
            renderPreview: () => (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff3b3b' }} />
                        <div style={{ width: '30px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }} />
                    </div>
                    <div style={{ width: '60%', height: '12px', background: 'white', borderRadius: '3px' }} />
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px' }} />
                    <div style={{ width: '80%', height: '8px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px' }} />
                    <div style={{ marginTop: 'auto', width: '100%', height: '50px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }} />
                </div>
            )
        },
        {
            id: 'media',
            label: 'Template 2',
            description: 'Media / News',
            renderPreview: () => (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }}>
                    <div style={{ width: '50px', height: '16px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '0 4px', gap: '4px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff3b3b' }} />
                    </div>
                    <div style={{ width: '100%', aspectRatio: '1/1', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' }} />
                    <div style={{ width: '80%', height: '12px', background: '#ff3b3b', borderRadius: '3px' }} />
                </div>
            )
        },
        {
            id: 'leadership',
            label: 'Template 3',
            description: 'Leadership Profile',
            renderPreview: () => (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: '6px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '8px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                            <div style={{ width: '60%', height: '10px', background: 'white', borderRadius: '3px', margin: '0 auto 4px auto' }} />
                            <div style={{ width: '40%', height: '8px', background: '#ff3b3b', borderRadius: '2px', margin: '0 auto' }} />
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'resource',
            label: 'Template 4',
            description: 'Resource Icon',
            renderPreview: () => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', border: '2px solid #ff3b3b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '20px', height: '2px', background: '#ff3b3b' }} />
                    </div>
                    <div style={{ width: '70%', height: '12px', background: 'white', borderRadius: '3px' }} />
                    <div style={{ width: '50%', height: '8px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px' }} />
                </div>
            )
        }
    ] as const

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
            {list.map((item) => {
                const isSelected = selected === item.id
                return (
                    <div
                        key={item.id}
                        onClick={() => onSelect(item.id)}
                        style={{
                            background: isSelected ? 'rgba(255, 59, 59, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                            border: isSelected ? '2px solid #ff3b3b' : '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}
                    >
                        {/* Preview Box */}
                        <div style={{
                            width: '100%',
                            height: '120px',
                            background: '#111',
                            borderRadius: '8px',
                            padding: '12px',
                            boxSizing: 'border-box',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            {item.renderPreview()}
                        </div>

                        {/* Label */}
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? '#ff3b3b' : 'white' }}>{item.label}</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{item.description}</div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
