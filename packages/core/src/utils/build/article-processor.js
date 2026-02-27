import sanitize from 'sanitize-html';
/**
 * Default allow-list for HTML sanitisation of RSS article content.
 *
 * Permits standard semantic HTML while stripping scripts, iframes,
 * and other dangerous elements. Images are preserved with original
 * external URLs — media caching rewrites them asynchronously in 0.6.0.
 *
 * @since 0.2.0
 */
const DEFAULT_SANITIZE_OPTIONS = {
    allowedTags: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'blockquote', 'pre', 'code',
        'ul', 'ol', 'li',
        'a', 'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins',
        'img', 'figure', 'figcaption',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span', 'sup', 'sub',
    ],
    allowedAttributes: {
        'a': ['href', 'title', 'target', 'rel'],
        'img': ['src', 'alt', 'title', 'width', 'height', 'loading'],
        'code': ['class'],
        'pre': ['class'],
        'td': ['colspan', 'rowspan'],
        'th': ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
        'a': sanitize.simpleTransform('a', {
            target: '_blank',
            rel: 'noopener noreferrer',
        }),
    },
};
/**
 * Sanitises HTML content from an RSS article.
 *
 * @param html - Raw HTML content from the RSS feed
 * @param options - Optional custom sanitize-html options
 * @returns Sanitised HTML string
 * @since 0.2.0
 */
export function sanitiseArticleHtml(html, options) {
    return sanitize(html, options ?? DEFAULT_SANITIZE_OPTIONS);
}
/**
 * Extracts a plain-text summary from HTML content.
 *
 * @param html - HTML content to summarise
 * @param maxLength - Maximum summary length (default 200)
 * @returns Plain text summary
 * @since 0.2.0
 */
export function extractSummary(html, maxLength = 200) {
    const text = sanitize(html, { allowedTags: [], allowedAttributes: {} });
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= maxLength) {
        return cleaned;
    }
    return cleaned.substring(0, maxLength).replace(/\s+\S*$/, '') + '…';
}
/**
 * Processes a raw article message from the queue.
 *
 * @param message - Raw article data from the queue
 * @returns Processed article ready for database insertion
 * @since 0.2.0
 */
export function processArticle(message) {
    const rawContent = message.content || message.summary || '';
    const sanitisedContent = sanitiseArticleHtml(rawContent);
    const summary = message.summary
        ? extractSummary(message.summary)
        : extractSummary(rawContent);
    return {
        title: message.title,
        content: sanitisedContent,
        summary,
        authorName: message.authorName || 'Unknown',
        originalLink: message.originalLink || '',
        publishedAt: message.publishedAt
            ? new Date(message.publishedAt * 1000)
            : new Date(),
        freshrssItemId: message.freshrssItemId,
        feedId: message.feedId,
    };
}
//# sourceMappingURL=article-processor.js.map