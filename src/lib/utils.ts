export function isUrdu(text: string): boolean {
    if (!text) return false;
    // Regex matches Arabic/Urdu unicode ranges
    const urduRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return urduRegex.test(text);
}
