/**
 * Strips HTML tags and returns plain text.
 * Useful for generating meta descriptions from rich content.
 */
export function extractPlainText(html: string): string {
    if (!html) return ''
    const div = document.createElement('div')
    div.innerHTML = html
    return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim()
}
