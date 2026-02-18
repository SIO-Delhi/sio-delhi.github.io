import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT_DIR, 'public', 'sitemap.xml');

const BASE_URL = 'https://siodelhi.org';
const API_BASE = 'https://api.siodelhi.org';

// Static routes
const STATIC_URLS = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/utilities', priority: '0.8', changefreq: 'monthly' },
    { loc: '/utilities/filter-tool', priority: '0.8', changefreq: 'monthly' },
    { loc: '/utilities/poster-tool', priority: '0.8', changefreq: 'monthly' },
    { loc: '/utilities/frame-tool', priority: '0.8', changefreq: 'monthly' },
];

function slugify(text) {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

function getUrlForPost(sectionId, title) {
    const slug = slugify(title);
    if (!slug) return null;

    switch (sectionId) {
        case 'about': return `/about-us/${slug}`;
        case 'initiatives': return `/initiative/${slug}`;
        case 'media': return `/media/${slug}`;
        case 'leadership': return `/leader/${slug}`;
        case 'resources':
        case 'more': return `/resource/${slug}`;
        default: return `/section/${sectionId}/${slug}`;
    }
}

async function generateSitemap() {
    console.log('Fetching posts from API...');

    let posts = [];
    try {
        const res = await fetch(`${API_BASE}/api/posts?publishedOnly=true`);
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        posts = await res.json();
    } catch (err) {
        console.error('Failed to fetch posts from API:', err.message);
        console.log('Generating sitemap with static routes only.');
    }

    console.log(`Fetched ${posts.length} published posts.`);

    const urls = STATIC_URLS.map(u => ({ ...u }));

    for (const post of posts) {
        if (!post.sectionId) continue;

        const postPath = getUrlForPost(post.sectionId, post.title);
        if (!postPath) continue;

        const lastmod = post.updatedAt
            ? new Date(post.updatedAt).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

        urls.push({
            loc: postPath,
            lastmod,
            priority: '0.6',
            changefreq: 'monthly'
        });
    }

    // Generate XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const u of urls) {
        xml += '  <url>\n';
        xml += `    <loc>${BASE_URL}${u.loc}</loc>\n`;
        if (u.lastmod) xml += `    <lastmod>${u.lastmod}</lastmod>\n`;
        xml += `    <changefreq>${u.changefreq}</changefreq>\n`;
        xml += `    <priority>${u.priority}</priority>\n`;
        xml += '  </url>\n';
    }

    xml += '</urlset>';

    fs.writeFileSync(SITEMAP_PATH, xml);
    console.log(`Sitemap generated with ${urls.length} URLs at ${SITEMAP_PATH}`);
}

generateSitemap();
