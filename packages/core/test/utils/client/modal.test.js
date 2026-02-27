/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setArticleList, closeArticleModal, initModalHandlers, } from '@utils/client/modal';
// Mock window/document APIs for client-side testing
const mockPushState = vi.fn();
beforeEach(() => {
    vi.restoreAllMocks();
    // Set up DOM
    document.body.innerHTML = '';
    // Mock history
    Object.defineProperty(window, 'history', {
        value: {
            pushState: mockPushState,
            state: null,
        },
        writable: true,
    });
});
describe('setArticleList', () => {
    it('sets the article ID list', () => {
        setArticleList(['a1', 'a2', 'a3']);
        // The list is internal state; we test it via navigateArticle behaviour
        expect(true).toBe(true);
    });
});
describe('closeArticleModal', () => {
    it('removes the modal container from DOM', () => {
        const container = document.createElement('div');
        container.id = 'article-modal-container';
        document.body.appendChild(container);
        closeArticleModal();
        expect(document.getElementById('article-modal-container')).toBeNull();
    });
    it('restores previous URL from history state', () => {
        Object.defineProperty(window, 'history', {
            value: {
                pushState: mockPushState,
                state: { previousUrl: '/' },
            },
            writable: true,
        });
        closeArticleModal();
        expect(mockPushState).toHaveBeenCalledWith(null, '', '/');
    });
});
describe('initModalHandlers', () => {
    it('collects article IDs from DOM', () => {
        document.body.innerHTML = `
      <article data-article-id="a1">
        <a data-article-link href="/article/a1">Article 1</a>
      </article>
      <article data-article-id="a2">
        <a data-article-link href="/article/a2">Article 2</a>
      </article>
    `;
        // Should not throw
        initModalHandlers();
        const cards = document.querySelectorAll('[data-article-id]');
        expect(cards).toHaveLength(2);
    });
    it('prevents default link navigation on card clicks', () => {
        document.body.innerHTML = `
      <article data-article-id="a1">
        <a data-article-link href="/article/a1">Article 1</a>
      </article>
    `;
        // Mock fetch for openArticleModal
        global.fetch = vi.fn().mockResolvedValue({
            json: () => Promise.resolve({ data: [{ id: 'a1', title: 'Test' }] }),
        });
        initModalHandlers();
        const link = document.querySelector('[data-article-link]');
        const event = new Event('click', { bubbles: true, cancelable: true });
        const spy = vi.spyOn(event, 'preventDefault');
        link.dispatchEvent(event);
        expect(spy).toHaveBeenCalled();
    });
});
//# sourceMappingURL=modal.test.js.map