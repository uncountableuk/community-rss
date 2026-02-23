/**
 * Client-side article modal management.
 *
 * Handles opening/closing the article modal, URL state via pushState,
 * and next/previous article navigation.
 *
 * @since 0.2.0
 */

/** Track the current article list context for navigation */
let articleIds: string[] = [];
let currentIndex = -1;

/**
 * Sets the article ID list for navigation context.
 *
 * @param ids - Array of article IDs in display order
 * @since 0.2.0
 */
export function setArticleList(ids: string[]): void {
    articleIds = ids;
}

/**
 * Opens the article modal by fetching article data and updating the URL.
 *
 * @param articleId - The article ID to display
 * @since 0.2.0
 */
export async function openArticleModal(articleId: string): Promise<void> {
    currentIndex = articleIds.indexOf(articleId);

    // Update URL without page reload
    const previousUrl = window.location.pathname;
    window.history.pushState(
        { articleId, previousUrl },
        '',
        `/article/${articleId}`,
    );

    try {
        const response = await fetch(`/api/v1/articles?limit=1&article_id=${articleId}`);
        const data = await response.json();

        if (!data.data || data.data.length === 0) {
            console.error('[community-rss] Article not found:', articleId);
            return;
        }

        renderModal(data.data[0]);
    } catch (error) {
        console.error('[community-rss] Failed to load article:', error);
    }
}

/**
 * Navigates to the next or previous article in the list context.
 *
 * @param direction - 'next' or 'prev'
 * @since 0.2.0
 */
export function navigateArticle(direction: 'next' | 'prev'): void {
    if (articleIds.length === 0) return;

    if (direction === 'next') {
        currentIndex = Math.min(currentIndex + 1, articleIds.length - 1);
    } else {
        currentIndex = Math.max(currentIndex - 1, 0);
    }

    const articleId = articleIds[currentIndex];
    if (articleId) {
        openArticleModal(articleId);
    }
}

/**
 * Closes the article modal and restores the previous URL.
 *
 * @since 0.2.0
 */
export function closeArticleModal(): void {
    const modal = document.getElementById('article-modal-container');
    if (modal) {
        modal.remove();
    }

    // Restore previous URL
    const state = window.history.state;
    if (state?.previousUrl) {
        window.history.pushState(null, '', state.previousUrl);
    } else {
        window.history.pushState(null, '', '/');
    }
}

/**
 * Renders the article modal into the DOM.
 */
function renderModal(article: {
    id: string;
    title: string;
    content?: string;
    authorName?: string;
    publishedAt?: string;
    originalLink?: string;
}): void {
    // Remove existing modal if present
    const existing = document.getElementById('article-modal-container');
    if (existing) {
        existing.remove();
    }

    const formattedDate = article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        : '';

    const container = document.createElement('div');
    container.id = 'article-modal-container';
    container.innerHTML = `
    <div class="crss-modal-overlay" id="article-modal" data-article-id="${article.id}" role="dialog" aria-modal="true">
      <div class="crss-modal">
        <header class="crss-modal__header">
          <div class="crss-modal__meta">
            ${formattedDate ? `<time class="crss-modal__date">${formattedDate}</time>` : ''}
            <span class="crss-modal__author">by ${article.authorName || 'Unknown'}</span>
          </div>
          <button class="crss-modal__close" aria-label="Close article" data-modal-close>✕</button>
        </header>
        <h1 class="crss-modal__title">${article.title}</h1>
        <div class="crss-modal__content">${article.content || ''}</div>
        <footer class="crss-modal__footer">
          ${article.originalLink ? `<a href="${article.originalLink}" class="crss-modal__original-link" target="_blank" rel="noopener noreferrer">Read original →</a>` : ''}
          <nav class="crss-modal__nav">
            <button class="crss-modal__nav-btn" data-modal-prev ${currentIndex <= 0 ? 'disabled' : ''}>← Previous</button>
            <button class="crss-modal__nav-btn" data-modal-next ${currentIndex >= articleIds.length - 1 ? 'disabled' : ''}>Next →</button>
          </nav>
        </footer>
      </div>
    </div>
  `;

    document.body.appendChild(container);

    // Bind event listeners
    container.querySelector('[data-modal-close]')?.addEventListener('click', closeArticleModal);
    container.querySelector('[data-modal-prev]')?.addEventListener('click', () => navigateArticle('prev'));
    container.querySelector('[data-modal-next]')?.addEventListener('click', () => navigateArticle('next'));
    container.querySelector('.crss-modal-overlay')?.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).classList.contains('crss-modal-overlay')) {
            closeArticleModal();
        }
    });

    // Escape key closes modal
    const escHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            closeArticleModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

/**
 * Initialises modal click handlers on feed cards.
 *
 * @since 0.2.0
 */
export function initModalHandlers(): void {
    // Handle popstate (browser back/forward)
    window.addEventListener('popstate', (event) => {
        if (event.state?.articleId) {
            openArticleModal(event.state.articleId);
        } else {
            closeArticleModal();
        }
    });

    // Collect article IDs and bind click handlers
    const cards = document.querySelectorAll<HTMLElement>('[data-article-id]');
    const ids: string[] = [];

    cards.forEach((card) => {
        const id = card.dataset.articleId;
        if (id) {
            ids.push(id);
            const link = card.querySelector('[data-article-link]');
            if (link) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    openArticleModal(id);
                });
            }
        }
    });

    setArticleList(ids);
}
