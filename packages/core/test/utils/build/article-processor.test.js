import { describe, it, expect } from 'vitest';
import { sanitiseArticleHtml, extractSummary, processArticle, } from '@utils/build/article-processor';
describe('sanitiseArticleHtml', () => {
    it('preserves allowed tags', () => {
        const html = '<p>Hello <strong>world</strong></p>';
        expect(sanitiseArticleHtml(html)).toBe('<p>Hello <strong>world</strong></p>');
    });
    it('strips script tags', () => {
        const html = '<p>Hello</p><script>alert("xss")</script>';
        expect(sanitiseArticleHtml(html)).toBe('<p>Hello</p>');
    });
    it('strips iframe tags', () => {
        const html = '<p>Hello</p><iframe src="https://evil.com"></iframe>';
        expect(sanitiseArticleHtml(html)).toBe('<p>Hello</p>');
    });
    it('strips event handlers', () => {
        const html = '<p onclick="alert(1)">Hello</p>';
        expect(sanitiseArticleHtml(html)).toBe('<p>Hello</p>');
    });
    it('preserves images with allowed attributes', () => {
        const html = '<img src="https://example.com/img.jpg" alt="Photo" />';
        const result = sanitiseArticleHtml(html);
        expect(result).toContain('src="https://example.com/img.jpg"');
        expect(result).toContain('alt="Photo"');
    });
    it('adds target and rel to links', () => {
        const html = '<a href="https://example.com">Link</a>';
        const result = sanitiseArticleHtml(html);
        expect(result).toContain('target="_blank"');
        expect(result).toContain('rel="noopener noreferrer"');
    });
    it('strips javascript: URLs', () => {
        const html = '<a href="javascript:alert(1)">Click</a>';
        const result = sanitiseArticleHtml(html);
        expect(result).not.toContain('javascript:');
    });
    it('allows code blocks', () => {
        const html = '<pre><code class="language-js">console.log("hi")</code></pre>';
        expect(sanitiseArticleHtml(html)).toContain('<pre><code');
    });
});
describe('extractSummary', () => {
    it('extracts plain text from HTML', () => {
        const html = '<p>Hello <strong>world</strong></p>';
        expect(extractSummary(html)).toBe('Hello world');
    });
    it('truncates long content', () => {
        const html = '<p>' + 'a'.repeat(300) + '</p>';
        const result = extractSummary(html, 200);
        expect(result.length).toBeLessThanOrEqual(201); // 200 + ellipsis
        expect(result).toContain('…');
    });
    it('does not truncate short content', () => {
        const html = '<p>Short text</p>';
        expect(extractSummary(html)).toBe('Short text');
    });
    it('collapses whitespace', () => {
        const html = '<p>Hello   \n\n  world</p>';
        expect(extractSummary(html)).toBe('Hello world');
    });
});
describe('processArticle', () => {
    it('processes a complete article', () => {
        const result = processArticle({
            freshrssItemId: 'item-1',
            feedId: 'feed_1',
            title: 'Test Article',
            content: '<p>Article content</p><script>evil()</script>',
            summary: '<p>Summary text</p>',
            authorName: 'Jane Doe',
            originalLink: 'https://example.com/article',
            publishedAt: 1672531200,
        });
        expect(result.freshrssItemId).toBe('item-1');
        expect(result.feedId).toBe('feed_1');
        expect(result.title).toBe('Test Article');
        expect(result.content).toBe('<p>Article content</p>');
        expect(result.content).not.toContain('script');
        expect(result.summary).toBe('Summary text');
        expect(result.authorName).toBe('Jane Doe');
        expect(result.originalLink).toBe('https://example.com/article');
        expect(result.publishedAt).toEqual(new Date(1672531200 * 1000));
    });
    it('uses summary as content fallback', () => {
        const result = processArticle({
            freshrssItemId: 'item-2',
            feedId: 'feed_1',
            title: 'No Content',
            summary: '<p>Only summary</p>',
        });
        expect(result.content).toBe('<p>Only summary</p>');
    });
    it('defaults author to Unknown when missing', () => {
        const result = processArticle({
            freshrssItemId: 'item-3',
            feedId: 'feed_1',
            title: 'No Author',
        });
        expect(result.authorName).toBe('Unknown');
    });
    it('defaults publishedAt to current date when missing', () => {
        const before = Date.now();
        const result = processArticle({
            freshrssItemId: 'item-4',
            feedId: 'feed_1',
            title: 'No Date',
        });
        const after = Date.now();
        expect(result.publishedAt.getTime()).toBeGreaterThanOrEqual(before);
        expect(result.publishedAt.getTime()).toBeLessThanOrEqual(after);
    });
});
//# sourceMappingURL=article-processor.test.js.map