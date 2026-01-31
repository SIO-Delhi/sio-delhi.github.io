
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Go up one level from 'scripts' to root
const ROOT_DIR = path.join(__dirname, '..');
const CSV_PATH = path.join(ROOT_DIR, 'posts_rows.csv');
const SITEMAP_PATH = path.join(ROOT_DIR, 'public', 'sitemap.xml');

const BASE_URL = 'https://siodelhi.org';

// Manual static routes
const STATIC_URLS = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/utilities', priority: '0.8', changefreq: 'monthly' },
    { loc: '/utilities/filter-tool', priority: '0.8', changefreq: 'monthly' },
    { loc: '/utilities/poster-tool', priority: '0.8', changefreq: 'monthly' },
    { loc: '/utilities/frame-tool', priority: '0.8', changefreq: 'monthly' },
];

/**
 * Parses a simple CSV line, respecting double quotes for fields with commas/newlines.
 * Returns an array of fields.
 */
function parseCSVLine(line) {
    const fields = [];
    let currentField = '';
    let insideQuote = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (insideQuote && line[i + 1] === '"') {
                // Escaped quote
                currentField += '"';
                i++;
            } else {
                insideQuote = !insideQuote;
            }
        } else if (char === ',' && !insideQuote) {
            fields.push(currentField);
            currentField = '';
        } else {
            currentField += char;
        }
    }
    fields.push(currentField);
    return fields;
}

function slugify(text) {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')        // Replace spaces with -
        .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
        .replace(/\-\-+/g, '-')      // Replace multiple - with single -
        .replace(/^-+/, '')          // Trim - from start of text
        .replace(/-+$/, '');         // Trim - from end of text
}

function getUrlForPost(id, sectionId, title) {
    if (!id || !sectionId) return null;
    const slug = slugify(title);

    // If no slug (empty title), fallback to ID? Or just skip? 
    // Let's fallback to ID if slug is empty, but our routing prefers slugs.
    // If slug is empty, the route /:slug might match ID if valid.
    const param = slug || id;

    switch (sectionId) {
        case 'about': return `/about-us/${param}`;
        case 'initiatives': return `/initiative/${param}`;
        case 'media': return `/media/${param}`;
        case 'leadership': return `/leader/${param}`;
        case 'resources': return `/resource/${param}`;
        case 'more': return `/resource/${param}`; // Fixed mapping for 'more' to 'resource' route
        default: return `/section/${sectionId}/${param}`;
    }
}

async function generateSitemap() {
    console.log(`Reading CSV from ${CSV_PATH}...`);

    if (!fs.existsSync(CSV_PATH)) {
        console.error('posts_rows.csv not found!');
        process.exit(1);
    }

    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    // Split by newlines but respect quotes? Simple split is risky if newlines in content.
    // However, CSV usually escapes newlines inside quotes. 
    // A robust CSV parser reads char by char.
    // For this quick script, let's try a regex for line matching or use a library-free approach.
    // Given the file size is small (~90KB), we can iterate the whole string.

    const rows = [];
    let currentRow = '';
    let insideQuote = false;

    // Split file into logical rows
    for (let i = 0; i < csvContent.length; i++) {
        const char = csvContent[i];

        if (char === '"') {
            if (insideQuote && csvContent[i + 1] === '"') {
                i++; // Skip escaped
            } else {
                insideQuote = !insideQuote;
            }
        }

        if (char === '\n' && !insideQuote) {
            rows.push(currentRow);
            currentRow = '';
        } else {
            currentRow += char;
        }
    }
    if (currentRow) rows.push(currentRow);

    // Skip header
    const dataRows = rows.slice(1);
    console.log(`Found ${dataRows.length} rows.`);

    // Columns: id, section_id, ..., created_at, updated_at, ..., is_published (index 10 or so)
    // We need to parse strictly.
    // Header: id,section_id,title,subtitle,content,image,layout,created_at,updated_at,pdf_url,is_published,...
    // Indices: 0, 1,        2,    3,       4,      5,    6,     7,          8,         9,       10

    const urls = [...STATIC_URLS.map(u => ({ ...u, loc: BASE_URL + u.loc }))];

    dataRows.forEach((rowStr, index) => {
        const cols = parseCSVLine(rowStr);
        if (cols.length < 2) return;

        const id = cols[0];
        const sectionId = cols[1];
        const title = cols[2];
        const updatedAt = cols[8]; // Timestamp
        const isPublished = cols[10]; // "true" or "false"

        // Basic validation
        if (!id || !sectionId) return;
        if (isPublished !== 'true') return;

        const path = getUrlForPost(id, sectionId, title);
        if (path) {
            urls.push({
                loc: BASE_URL + path,
                lastmod: updatedAt ? new Date(updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                priority: '0.6', // Slightly lower for dynamic posts
                changefreq: 'monthly'
            });
        }
    });

    // Generate XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    urls.forEach(u => {
        xml += '  <url>\n';
        xml += `    <loc>${u.loc}</loc>\n`;
        if (u.lastmod) xml += `    <lastmod>${u.lastmod}</lastmod>\n`;
        xml += `    <changefreq>${u.changefreq}</changefreq>\n`;
        xml += `    <priority>${u.priority}</priority>\n`;
        xml += '  </url>\n';
    });

    xml += '</urlset>';

    fs.writeFileSync(SITEMAP_PATH, xml);
    console.log(`Sitemap generated with ${urls.length} URLs at ${SITEMAP_PATH}`);
}

generateSitemap();
