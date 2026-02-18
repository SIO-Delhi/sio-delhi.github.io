/**
 * Fetches all published routes from the API for build-time prerendering.
 * Used by the prerender script and vite config.
 */

const API_BASE = 'https://api.siodelhi.org'

function slugify(text) {
    if (!text) return ''
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '')
}

function getUrlForPost(sectionId, title) {
    const slug = slugify(title)
    if (!slug) return null

    switch (sectionId) {
        case 'about': return `/about-us/${slug}`
        case 'initiatives': return `/initiative/${slug}`
        case 'media': return `/media/${slug}`
        case 'leadership': return `/leader/${slug}`
        case 'resources':
        case 'more': return `/resource/${slug}`
        default: return `/section/${sectionId}/${slug}`
    }
}

export async function fetchRoutes() {
    const routes = ['/']

    try {
        // Fetch sections for landing pages
        const sectionsRes = await fetch(`${API_BASE}/api/sections`)
        if (sectionsRes.ok) {
            const sections = await sectionsRes.json()
            for (const section of sections) {
                if (section.is_published && section.id) {
                    routes.push(`/${section.id}`)
                }
            }
        }

        // Fetch posts for detail pages
        const res = await fetch(`${API_BASE}/api/posts?publishedOnly=true`)
        if (!res.ok) throw new Error(`API returned ${res.status}`)
        const posts = await res.json()

        for (const post of posts) {
            if (!post.sectionId) continue
            const url = getUrlForPost(post.sectionId, post.title)
            if (url) routes.push(url)
        }
    } catch (err) {
        console.warn('Failed to fetch routes from API:', err.message)
    }

    // Static utility routes
    routes.push('/utilities', '/utilities/filter-tool', '/utilities/frame-tool', '/utilities/poster-tool')

    return [...new Set(routes)]
}

// Allow running directly: node scripts/fetch-routes.mjs
if (import.meta.url === `file://${process.argv[1]}`) {
    fetchRoutes().then(routes => {
        console.log(`Found ${routes.length} routes:`)
        routes.forEach(r => console.log(`  ${r}`))
    })
}
