/**
 * Mock feed data for tests.
 * @since 0.1.0
 */
export const mockFeeds = [
    {
        id: 'feed-1',
        userId: 'user-author-1',
        feedUrl: 'https://example.com/feed.xml',
        title: 'Example Tech Blog',
        description: 'A blog about web development',
        category: 'technology',
        status: 'approved',
        consentAt: new Date('2025-01-01T00:00:00Z'),
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
    },
    {
        id: 'feed-2',
        userId: 'user-author-1',
        feedUrl: 'https://blog.example.org/rss',
        title: 'Example Dev Notes',
        description: 'Developer notes and tips',
        category: 'development',
        status: 'approved',
        consentAt: new Date('2025-01-05T00:00:00Z'),
        createdAt: new Date('2025-01-05T00:00:00Z'),
        updatedAt: new Date('2025-01-05T00:00:00Z'),
    },
    {
        id: 'feed-3',
        userId: 'user-author-2',
        feedUrl: 'https://dev.example.net/atom.xml',
        title: 'Dev Example',
        description: 'Web components and more',
        category: 'web',
        status: 'pending',
        consentAt: null,
        createdAt: new Date('2025-01-10T00:00:00Z'),
        updatedAt: new Date('2025-01-10T00:00:00Z'),
    },
];
//# sourceMappingURL=feeds.js.map