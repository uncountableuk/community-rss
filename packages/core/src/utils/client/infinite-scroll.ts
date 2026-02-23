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
export function createInfiniteScroll(options: InfiniteScrollOptions): {
    state: InfiniteScrollState;
    destroy: () => void;
} {
    const {
        sentinelSelector,
        containerSelector,
        apiUrl,
        limit = 20,
        threshold = 0.1,
        renderItem,
        onLoadingChange,
        onComplete,
    } = options;

    const state: InfiniteScrollState = {
        currentPage: 1,
        loading: false,
        hasMore: true,
        observer: null,
    };

    const sentinel = document.querySelector(sentinelSelector);
    const container = document.querySelector(containerSelector);

    if (!sentinel || !container) {
        console.warn('[community-rss] Infinite scroll: sentinel or container not found');
        return { state, destroy: () => { } };
    }

    async function loadMore(): Promise<void> {
        if (state.loading || !state.hasMore) return;

        state.loading = true;
        onLoadingChange?.(true);
        state.currentPage++;

        try {
            const separator = apiUrl.includes('?') ? '&' : '?';
            const url = `${apiUrl}${separator}page=${state.currentPage}&limit=${limit}`;
            const response = await fetch(url);
            const data = await response.json() as {
                data?: Record<string, unknown>[];
                pagination?: { hasMore?: boolean };
            };

            if (data.data && data.data.length > 0) {
                const fragment = document.createDocumentFragment();
                for (const item of data.data) {
                    const wrapper = document.createElement('div');
                    wrapper.innerHTML = renderItem(item);
                    const element = wrapper.firstElementChild;
                    if (element) {
                        fragment.appendChild(element);
                    }
                }
                container!.appendChild(fragment);
                state.hasMore = data.pagination?.hasMore ?? data.data.length === limit;
            } else {
                state.hasMore = false;
            }

            if (!state.hasMore) {
                onComplete?.();
            }
        } catch (error) {
            console.error('[community-rss] Infinite scroll: failed to load more:', error);
        }

        state.loading = false;
        onLoadingChange?.(false);
    }

    const observer = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting) {
                loadMore();
            }
        },
        { threshold },
    );

    observer.observe(sentinel);
    state.observer = observer;

    function destroy(): void {
        state.observer?.disconnect();
        state.observer = null;
    }

    return { state, destroy };
}
