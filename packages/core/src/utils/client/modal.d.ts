/**
 * Client-side article modal management.
 *
 * Handles opening/closing the article modal, URL state via pushState,
 * and next/previous article navigation.
 *
 * @since 0.2.0
 */
/**
 * Sets the article ID list for navigation context.
 *
 * @param ids - Array of article IDs in display order
 * @since 0.2.0
 */
export declare function setArticleList(ids: string[]): void;
/**
 * Opens the article modal by fetching article data and updating the URL.
 *
 * @param articleId - The article ID to display
 * @since 0.2.0
 */
export declare function openArticleModal(articleId: string): Promise<void>;
/**
 * Navigates to the next or previous article in the list context.
 *
 * @param direction - 'next' or 'prev'
 * @since 0.2.0
 */
export declare function navigateArticle(direction: 'next' | 'prev'): void;
/**
 * Closes the article modal and restores the previous URL.
 *
 * @since 0.2.0
 */
export declare function closeArticleModal(): void;
/**
 * Initialises modal click handlers on feed cards.
 *
 * @since 0.2.0
 */
export declare function initModalHandlers(): void;
//# sourceMappingURL=modal.d.ts.map