/**
 * Client-side infinite scroll utility.
 *
 * Uses Intersection Observer for scroll-triggered loading with
 * cursor-based pagination (compatible with D1/SQLite).
 *
 * @since 0.2.0
 */
/**
 * Configuration options for infinite scroll.
 *
 * @since 0.2.0
 */
export interface InfiniteScrollOptions {
    /** CSS selector for the sentinel element that triggers loading */
    sentinelSelector: string;
    /** CSS selector for the container to append new items to */
    containerSelector: string;
    /** API endpoint to fetch more items from */
    apiUrl: string;
    /** Number of items to fetch per page */
    limit?: number;
    /** Intersection Observer threshold (0-1) */
    threshold?: number;
    /** Callback to render a single item into an HTML string */
    renderItem: (item: Record<string, unknown>) => string;
    /** Optional callback when loading state changes */
    onLoadingChange?: (loading: boolean) => void;
    /** Optional callback when all items have been loaded */
    onComplete?: () => void;
}
/**
 * State for an infinite scroll instance.
 *
 * @since 0.2.0
 */
export interface InfiniteScrollState {
    currentPage: number;
    loading: boolean;
    hasMore: boolean;
    observer: IntersectionObserver | null;
}
/**
 * Creates and returns an infinite scroll controller.
 *
 * @param options - Infinite scroll configuration
 * @returns State object and control functions
 * @since 0.2.0
 */
export declare function createInfiniteScroll(options: InfiniteScrollOptions): {
    state: InfiniteScrollState;
    destroy: () => void;
};
//# sourceMappingURL=infinite-scroll.d.ts.map