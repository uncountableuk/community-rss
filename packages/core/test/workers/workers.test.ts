import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scheduled } from '../../src/workers/scheduled';
import { queue } from '../../src/workers/queue';

// Mock the sync module
vi.mock('../../src/utils/build/sync', () => ({
  syncFeeds: vi.fn().mockResolvedValue({ feedsProcessed: 2, articlesEnqueued: 5 }),
}));

// Mock the article processor
vi.mock('../../src/utils/build/article-processor', () => ({
  processArticle: vi.fn().mockReturnValue({
    feedId: 'feed-1',
    freshrssItemId: 'item-1',
    title: 'Test Article',
    content: '<p>Content</p>',
    summary: 'Content',
    originalLink: 'https://example.com/article',
    authorName: 'Author',
    publishedAt: new Date(),
  }),
}));

// Mock the articles DB queries
vi.mock('../../src/db/queries/articles', () => ({
  upsertArticle: vi.fn().mockResolvedValue(undefined),
}));

describe('Worker Exports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scheduled', () => {
    it('should be a function', () => {
      expect(typeof scheduled).toBe('function');
    });

    it('should execute without error', async () => {
      const waitUntilFn = vi.fn((p: Promise<unknown>) => p.catch(() => { }));

      await expect(
        scheduled(
          {} as ScheduledController,
          { FRESHRSS_URL: 'https://rss.example.com', FRESHRSS_USER: 'user', FRESHRSS_PASSWORD: 'pass' } as unknown as Parameters<typeof scheduled>[1],
          { waitUntil: waitUntilFn, passThroughOnException: vi.fn() } as unknown as ExecutionContext,
        ),
      ).resolves.toBeUndefined();

      // Wait for the waitUntil promise to resolve
      await waitUntilFn.mock.calls[0]?.[0];
    });

    it('should call syncFeeds via ctx.waitUntil', async () => {
      const waitUntilFn = vi.fn((p: Promise<unknown>) => p.catch(() => { }));

      await scheduled(
        {} as ScheduledController,
        { FRESHRSS_URL: 'https://rss.example.com', FRESHRSS_USER: 'user', FRESHRSS_PASSWORD: 'pass' } as unknown as Parameters<typeof scheduled>[1],
        { waitUntil: waitUntilFn, passThroughOnException: vi.fn() } as unknown as ExecutionContext,
      );

      expect(waitUntilFn).toHaveBeenCalledOnce();
    });
  });

  describe('queue', () => {
    it('should be a function', () => {
      expect(typeof queue).toBe('function');
    });

    it('should execute without error with empty batch', async () => {
      await expect(
        queue(
          { messages: [] } as unknown as Parameters<typeof queue>[0],
          { DB: {} } as unknown as Parameters<typeof queue>[1],
          { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as unknown as ExecutionContext,
        ),
      ).resolves.toBeUndefined();
    });

    it('should process messages and ack them', async () => {
      const ackFn = vi.fn();
      const mockBatch = {
        messages: [
          {
            body: {
              freshrssItemId: 'item-1',
              feedId: 'feed-1',
              title: 'Test',
              content: '<p>Test</p>',
              link: 'https://example.com',
              author: 'Author',
              published: Date.now() / 1000,
            },
            ack: ackFn,
            retry: vi.fn(),
          },
        ],
      } as unknown as Parameters<typeof queue>[0];

      await queue(
        mockBatch,
        { DB: {} } as unknown as Parameters<typeof queue>[1],
        { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as unknown as ExecutionContext,
      );

      expect(ackFn).toHaveBeenCalledOnce();
    });
  });
});
