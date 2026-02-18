import { Helmet } from '@dr.pogodin/react-helmet'

interface SEOHeadProps {
    title?: string
    description?: string
    image?: string
    url?: string
    type?: 'website' | 'article'
}

const DEFAULTS = {
    title: 'SIO Delhi',
    description: 'The mission of the Students Islamic Organisation of India (SIO) is to prepare the students and youth for the reconstruction of the society in the light of Divine Guidance.',
    image: 'https://siodelhi.org/siodel-cricular.png',
    siteUrl: 'https://siodelhi.org',
}

export function SEOHead({ title, description, image, url, type = 'website' }: SEOHeadProps) {
    const fullTitle = title ? `${title} - SIO Delhi` : DEFAULTS.title
    const desc = description || DEFAULTS.description
    const img = image || DEFAULTS.image
    const canonical = url || `${DEFAULTS.siteUrl}${window.location.pathname}`

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={desc} />
            <link rel="canonical" href={canonical} />

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={desc} />
            <meta property="og:image" content={img} />
            <meta property="og:url" content={canonical} />
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content="SIO Delhi" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={desc} />
            <meta name="twitter:image" content={img} />
        </Helmet>
    )
}
