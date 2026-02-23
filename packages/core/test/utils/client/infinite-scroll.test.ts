/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createInfiniteScroll } from '@utils/client/infinite-scroll';

// Mock IntersectionObserver
let intersectionCallback: IntersectionObserverCallback;

const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';

    // Reset IntersectionObserver mock
    global.IntersectionObserver = vi.fn((callback) => {
        intersectionCallback = callback;
        return {
            observe: mockObserve,
            disconnect: mockDisconnect,
            unobserve: vi.fn(),
            root: null,
            rootMargin: '0px',
            thresholds: [0],
            takeRecords: () => [],
        };
    }) as unknown as typeof IntersectionObserver;
});

describe('createInfiniteScroll', () => {
    it('creates an observer and observes the sentinel', () => {
        document.body.innerHTML = `
      <div id="container"></div>
      <div id="sentinel"></div>
    `;

        const { state } = createInfiniteScroll({
            sentinelSelector: '#sentinel',
            containerSelector: '#container',
            apiUrl: '/api/v1/articles',
            renderItem: (item) => `<div>${item.title}</div>`,
        });

        expect(mockObserve).toHaveBeenCalled();
        expect(state.currentPage).toBe(1);
        expect(state.hasMore).toBe(true);
        expect(state.loading).toBe(false);
    });

    it('warns when sentinel is not found', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });

        const { state } = createInfiniteScroll({
            sentinelSelector: '#missing',
            containerSelector: '#also-missing',
            apiUrl: '/api/v1/articles',
            renderItem: (item) => `<div>${item.title}</div>`,
        });

        expect(warn).toHaveBeenCalledWith(
            '[community-rss] Infinite scroll: sentinel or container not found',
        );
        expect(state.observer).toBeNull();
    });

    it('fetches and appends items when sentinel is intersecting', async () => {
        document.body.innerHTML = `
      <div id="container"></div>
      <div id="sentinel"></div>
    `;

        global.fetch = vi.fn().mockResolvedValue({
            json: () =>
                Promise.resolve({
                    data: [
                        { id: '1', title: 'Article 1' },
                        { id: '2', title: 'Article 2' },
                    ],
                    pagination: { hasMore: true },
                }),
        });

        createInfiniteScroll({
            sentinelSelector: '#sentinel',
            containerSelector: '#container',
            apiUrl: '/api/v1/articles',
            renderItem: (item) => `<div class="item">${item.title}</div>`,
        });

        // Trigger intersection
        intersectionCallback(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            {} as IntersectionObserver,
        );

        // Wait for async fetch
        await vi.waitFor(() => {
            const items = document.querySelectorAll('.item');
            expect(items).toHaveLength(2);
        });
    });

    it('calls onComplete when no more items', async () => {
        document.body.innerHTML = `
      <div id="container"></div>
      <div id="sentinel"></div>
    `;

        global.fetch = vi.fn().mockResolvedValue({
            json: () => Promise.resolve({ data: [], pagination: { hasMore: false } }),
        });

        const onComplete = vi.fn();

        createInfiniteScroll({
            sentinelSelector: '#sentinel',
            containerSelector: '#container',
            apiUrl: '/api/v1/articles',
            renderItem: (item) => `<div>${item.title}</div>`,
            onComplete,
        });

        intersectionCallback(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            {} as IntersectionObserver,
        );

        await vi.waitFor(() => {
            expect(onComplete).toHaveBeenCalled();
        });
    });

    it('destroys the observer', () => {
        document.body.innerHTML = `
      <div id="container"></div>
      <div id="sentinel"></div>
    `;

        const { destroy } = createInfiniteScroll({
            sentinelSelector: '#sentinel',
            containerSelector: '#container',
            apiUrl: '/api/v1/articles',
            renderItem: (item) => `<div>${item.title}</div>`,
        });

        destroy();
        expect(mockDisconnect).toHaveBeenCalled();
    });

    it('calls onLoadingChange during loading', async () => {
        document.body.innerHTML = `
      <div id="container"></div>
      <div id="sentinel"></div>
    `;

        global.fetch = vi.fn().mockResolvedValue({
            json: () => Promise.resolve({ data: [{ id: '1', title: 'Test' }], pagination: { hasMore: false } }),
        });

        const onLoadingChange = vi.fn();

        createInfiniteScroll({
            sentinelSelector: '#sentinel',
            containerSelector: '#container',
            apiUrl: '/api/v1/articles',
            renderItem: (item) => `<div>${item.title}</div>`,
            onLoadingChange,
        });

        intersectionCallback(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            {} as IntersectionObserver,
        );

        await vi.waitFor(() => {
            expect(onLoadingChange).toHaveBeenCalledWith(true);
            expect(onLoadingChange).toHaveBeenCalledWith(false);
        });
    });
});
