/**
 * Client-side infinite scroll utility.
 *
 * Uses Intersection Observer for scroll-triggered loading with
 * cursor-based pagination (compatible with D1/SQLite).
 *
 * @since 0.2.0
 */
/**
 * Creates and returns an infinite scroll controller.
 *
 * @param options - Infinite scroll configuration
 * @returns State object and control functions
 * @since 0.2.0
 */
export function createInfiniteScroll(options) {
    const { sentinelSelector, containerSelector, apiUrl, limit = 20, threshold = 0.1, renderItem, onLoadingChange, onComplete, } = options;
    const state = {
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
    async function loadMore() {
        if (state.loading || !state.hasMore)
            return;
        state.loading = true;
        onLoadingChange?.(true);
        state.currentPage++;
        try {
            const separator = apiUrl.includes('?') ? '&' : '?';
            const url = `${apiUrl}${separator}page=${state.currentPage}&limit=${limit}`;
            const response = await fetch(url);
            const data = await response.json();
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
                container.appendChild(fragment);
                state.hasMore = data.pagination?.hasMore ?? data.data.length === limit;
            }
            else {
                state.hasMore = false;
            }
            if (!state.hasMore) {
                onComplete?.();
            }
        }
        catch (error) {
            console.error('[community-rss] Infinite scroll: failed to load more:', error);
        }
        state.loading = false;
        onLoadingChange?.(false);
    }
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            loadMore();
        }
    }, { threshold });
    observer.observe(sentinel);
    state.observer = observer;
    function destroy() {
        state.observer?.disconnect();
        state.observer = null;
    }
    return { state, destroy };
}
//# sourceMappingURL=infinite-scroll.js.map