import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { SectionCard } from '../ui/SectionCard'
import SectionLayout from '../layout/SectionLayout'
import { useContent } from '../../context/ContentContext'
import type { SectionTemplate } from '../../types/content'
import { slugify } from '../../utils/slugify'

interface GenericSectionProps {
    sectionId: string
    title: string
    label: string
    template?: SectionTemplate
}

export function GenericSection({ sectionId, title, label, template }: GenericSectionProps) {
    const { isDark } = useTheme()
    const navigate = useNavigate()
    const { getPostsBySection } = useContent()

    const cards = getPostsBySection(sectionId).filter(post => post.isPublished)
    const hasContent = cards.length > 0

    // Split title for styling if it has spaces (e.g. "Our Initiatives")
    // This is a naive heuristic to make it look "designed". First word normal, rest colored?
    // Or just simple styling. Let's try to match existing style roughly.
    const titleParts = title.split(' ')
    const firstWord = titleParts[0]
    const restWords = titleParts.slice(1).join(' ')

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
            {firstWord} {restWords && <span style={{ color: '#ff3333' }}>{restWords}</span>}
        </h1>
    )

    return (
        <SectionLayout
            id={sectionId}
            header={headerContent}
        >
            {hasContent ? (
                cards.map((card) => (
                    <SectionCard
                        key={card.id}
                        cardId={`card-${slugify(card.title)}`}
                        {...card}
                        label={label}
                        labelColor="#FF3333"
                        description={card.subtitle || card.content.replace(/<[^>]+>/g, '').substring(0, 100)}
                        publishedDate={(card as any).publishedDate || card.createdAt}
                        image={(card as any).coverImage || card.image}
                        icon={card.icon}
                        variant={template || 'default'}
                        onClick={() => {
                            const slug = slugify(card.title)
                            window.history.replaceState(null, '', `#${sectionId}:${slug}`)
                            navigate(`/section/${sectionId}/${slug}`, { state: { post: card } })
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
