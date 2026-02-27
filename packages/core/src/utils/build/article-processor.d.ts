import sanitize from 'sanitize-html';
/**
 * Sanitises HTML content from an RSS article.
 *
 * @param html - Raw HTML content from the RSS feed
 * @param options - Optional custom sanitize-html options
 * @returns Sanitised HTML string
 * @since 0.2.0
 */
export declare function sanitiseArticleHtml(html: string, options?: sanitize.IOptions): string;
/**
 * Extracts a plain-text summary from HTML content.
 *
 * @param html - HTML content to summarise
 * @param maxLength - Maximum summary length (default 200)
 * @returns Plain text summary
 * @since 0.2.0
 */
export declare function extractSummary(html: string, maxLength?: number): string;
/**
 * Processes a raw article from the queue: sanitises HTML and extracts metadata.
 *
 * @since 0.2.0
 */
export interface ProcessedArticle {
    title: string;
    content: string;
    summary: string;
    authorName: string;
    originalLink: string;
    publishedAt: Date;
    freshrssItemId: string;
    feedId: string;
}
/**
 * Processes a raw article message from the queue.
 *
 * @param message - Raw article data from the queue
 * @returns Processed article ready for database insertion
 * @since 0.2.0
 */
export declare function processArticle(message: {
    freshrssItemId: string;
    feedId: string;
    title: string;
    content?: string;
    summary?: string;
    authorName?: string;
    originalLink?: string;
    publishedAt?: number;
}): ProcessedArticle;
//# sourceMappingURL=article-processor.d.ts.map