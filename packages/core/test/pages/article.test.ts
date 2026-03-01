import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ARTICLE_PAGE_PATH = join(__dirname, '../../src/pages/article/[id].astro');

/**
 * Article detail page SSR architecture tests.
 *
 * Validates that the article page uses server-side rendering —
 * querying the database in the Astro frontmatter rather than
 * fetching client-side via JavaScript.
 *
 * @since 0.6.0
 */
describe('Article Page ([id].astro) — SSR Architecture', () => {
    const content = readFileSync(ARTICLE_PAGE_PATH, 'utf-8');

    // Extract frontmatter (content between --- delimiters)
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';

    // Extract template (content after the second ---)
    const templateMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*?)(?:<style|$)/);
    const template = templateMatch ? templateMatch[1] : '';

    describe('SSR data fetching', () => {
        it('imports getArticleById from the database queries layer', () => {
            expect(frontmatter).toContain("import { getArticleById } from '../../db/queries/articles'");
        });

        it('imports AppContext type for type-safe locals access', () => {
            expect(frontmatter).toContain("import type { AppContext } from '../../types/context'");
        });

        it('accesses the database via Astro.locals.app', () => {
            expect(frontmatter).toContain('Astro.locals');
            expect(frontmatter).toContain('app?.db');
        });

        it('calls getArticleById with the route id parameter', () => {
            expect(frontmatter).toContain('getArticleById(app.db, id)');
        });
    });

    describe('server-side error handling', () => {
        it('returns 404 when id parameter is missing', () => {
            expect(frontmatter).toContain("if (!id || !app?.db)");
            expect(frontmatter).toContain("new Response('Not Found', { status: 404 })");
        });

        it('returns 404 when article is not found', () => {
            expect(frontmatter).toContain('if (!article)');
        });
    });

    describe('SEO', () => {
        it('sets a dynamic page title from the article', () => {
            expect(frontmatter).toContain('article.title');
            expect(frontmatter).toContain('pageTitle');
            expect(template).toContain('title={pageTitle}');
        });

        it('sets a dynamic description from the article summary', () => {
            expect(frontmatter).toContain('pageDescription');
            expect(frontmatter).toContain('article.summary');
            expect(template).toContain('description={pageDescription}');
        });
    });

    describe('no client-side rendering', () => {
        it('does not contain a <script> block for data fetching', () => {
            expect(content).not.toContain('<script define:vars');
            expect(content).not.toContain('loadArticle');
            expect(content).not.toContain("fetch(`/api/v1/articles");
        });

        it('does not contain loading state placeholder elements', () => {
            expect(content).not.toContain('id="article-loading"');
            expect(content).not.toContain('id="article-error"');
        });

        it('does not use display:none to hide content before JS hydration', () => {
            expect(template).not.toContain('style="display: none;"');
            expect(template).not.toContain("style=\"display: none;\"");
        });
    });

    describe('SSR template rendering', () => {
        it('renders article title directly in the template', () => {
            expect(template).toContain('{article.title}');
        });

        it('renders article content via set:html directive', () => {
            expect(template).toContain("set:html={article.content || ''}");
        });

        it('renders article author name', () => {
            expect(template).toContain("article.authorName || 'Unknown'");
        });

        it('conditionally renders the original link', () => {
            expect(template).toContain('article.originalLink');
            expect(template).toContain('href={article.originalLink}');
        });
    });

    describe('slot architecture preserved', () => {
        it('has a content super-slot wrapping main content', () => {
            expect(template).toContain('<slot name="content">');
        });

        it('has generic wrapper slots', () => {
            expect(content).toContain('<slot name="before-unnamed-slot" />');
            expect(content).toContain('<slot name="after-unnamed-slot" />');
        });

        it('has a default slot passthrough', () => {
            expect(content).toContain('<slot />');
        });
    });

    describe('CSS architecture', () => {
        it('uses global layered styles', () => {
            expect(content).toContain('<style is:global>');
            expect(content).toContain('@layer crss-components');
        });

        it('preserves all crss-article CSS class definitions', () => {
            expect(content).toContain('.crss-article-page');
            expect(content).toContain('.crss-article__back');
            expect(content).toContain('.crss-article__title');
            expect(content).toContain('.crss-article__content');
            expect(content).toContain('.crss-article__footer');
            expect(content).toContain('.crss-article__original-link');
        });
    });
});
