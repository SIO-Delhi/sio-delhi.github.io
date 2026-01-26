import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { SectionCard } from '../ui/SectionCard'
import SectionLayout from '../layout/SectionLayout'
import { useContent } from '../../context/ContentContext'

export function MediaSection() {
    const { isDark } = useTheme()
    const navigate = useNavigate()
    const { getPostsBySection } = useContent()

    const cards = getPostsBySection('media').filter(post => post.isPublished)
    const hasContent = cards.length > 0

    const headerContent = (
        <h1
            style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: 700,
                color: '#efc676',
                lineHeight: 1.1,
                margin: 0,
                fontFamily: '"DM Sans", sans-serif',
                letterSpacing: '-0.02em'
            }}
        >
            Media & <span style={{ color: '#ff3333' }}>News</span>
        </h1>
    )

    return (
        <SectionLayout
            id="media"
            header={headerContent}
        >
            {hasContent ? (
                cards.map((card) => (
                    <SectionCard
                        key={card.id}
                        cardId={`card-${card.id}`}
                        {...card}
                        variant="media"
                        label="MEDIA"
                        labelColor="#FF3333"
                        description={card.subtitle || card.content.replace(/<[^>]+>/g, '').substring(0, 100)}
                        publishedDate={(card as any).publishedDate || card.createdAt}
                        image={(card as any).coverImage || card.image}
                        onClick={() => {
                            window.history.replaceState(null, '', `#media:${card.id}`)
                            navigate(`/media/${card.id}`, { state: { post: card } })
                        }}
                    />
                ))
            ) : (
                <div style={{
                    minWidth: '100%',
                    height: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                    fontSize: '1.1rem'
                }}>
                    No content published yet
                </div>
            )}
        </SectionLayout>
    )
}
