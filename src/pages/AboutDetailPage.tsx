import { PageTemplate } from '../components/layout/PageTemplate'
import { ContentSection } from '../components/ui/ContentSection'
import { useTheme } from '../context/ThemeContext'

export function AboutDetailPage() {
    const { isDark } = useTheme()

    return (
        <PageTemplate title="About" highlight="Us" highlightColor="#ff3b3b">
            {/* Intro Section - No specific title/image, just content card content */}
            <ContentSection
                content={
                    <>
                        <p>
                            Students Islamic Organisation of India (SIO) is an ideological organization working in the country since its inception on 19th October 1982 for the social progress and development of the students' fraternity. It is SIO's endeavor to prepare Students and Youth for the reconstruction of the society in the light of Divine guidance.
                        </p>

                        <p style={{
                            borderLeft: '3px solid #ff3b3b',
                            paddingLeft: '24px',
                            fontStyle: 'italic',
                            color: isDark ? '#fdedcb' : 'rgba(0, 0, 0, 0.6)'
                        }}>
                            In order to understand SIO, it is essential to have a good grasp on its views on Islam, student and organization. The Arabic word Islam signifies peace, dedication and absolute submission. In other words it is the path to peace through complete surrender to God.
                        </p>

                        <p>
                            SIO believes that the real function of education should be to impart genuine knowledge about life, existence and future. A real student is therefore one seeking for the realities about life and universe.
                        </p>

                        <p>
                            With its Headquarter based in Delhi, SIO has spread to all the states stretching from Punjab to Kerala and Gujarat to Manipur. Heart-beat of millions of students across India, SIO's message of "spreading the virtues and eradicating evils" is now motto of life for them. All students irrespective of their religion, caste, creed and place are now part of the organisation and working proactively for its cause. SIO is reaching now every nook and corner of the Indian Campus with its services to the student community.
                        </p>
                    </>
                }
            >
                {/* Manual Gradient Insert for Intro Card only */}

            </ContentSection>

            {/* SIO Aims */}
            <ContentSection
                title="SIO"
                highlight="Aims"
                highlightColor="#3b82f6"
                image="https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80"
                imageAlt="SIO Aims - Students Rally"
                imagePosition="right"
                content={
                    <>
                        <p>
                            SIO finds itself committed to impart genuine knowledge and awareness to students and getting them ready to become torch bearers of morality and ethics to fight against evils by reinforcing their own life.
                        </p>
                        <p>
                            The organization also strives for promoting values in educational system and better academic and moral atmosphere in educational institutions. SIO focuses its efforts to nurture the talents of students in such a way as to benefit the society.
                        </p>
                    </>
                }
            />

            {/* SIO Works */}
            <ContentSection
                title="SIO"
                highlight="Works"
                highlightColor="#10b981"
                image="https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80"
                imageAlt="SIO Works - Group discussion"
                imagePosition="left"
                content={
                    <>
                        <p>
                            All the above mentioned aims are striven for only within the limits of morality and constructive, peaceful manner. The organization abstains from anything that is contrary to truth and honesty and that which may result in communal hatred and class struggle.
                        </p>
                    </>
                }
            >
                <button
                    className="btn-primary"
                    style={{
                        background: '#0ea5e9',
                        padding: '16px 32px',
                        fontSize: '1rem',
                        borderRadius: '100px',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        boxShadow: '0 4px 20px rgba(14, 165, 233, 0.4)'
                    }}
                    data-cursor="view"
                >
                    Join SIO
                </button>
            </ContentSection>
        </PageTemplate>
    )
}
