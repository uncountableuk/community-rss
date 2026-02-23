/**
 * Mock user data for tests.
 * Covers all four user tiers: guest, registered, verified, admin.
 * @since 0.1.0
 */

export const mockUsers = {
  guest: {
    id: 'user-guest-1',
    email: null,
    isGuest: true,
    name: null,
    bio: null,
    avatarUrl: null,
    createdAt: new Date('2025-01-20T10:00:00Z'),
    updatedAt: new Date('2025-01-20T10:00:00Z'),
  },
  registered: {
    id: 'user-registered-1',
    email: 'reader@example.com',
    isGuest: false,
    name: 'Regular Reader',
    bio: 'I enjoy reading tech blogs',
    avatarUrl: null,
    createdAt: new Date('2025-01-15T10:00:00Z'),
    updatedAt: new Date('2025-01-15T10:00:00Z'),
  },
  author: {
    id: 'user-author-1',
    email: 'jane@example.com',
    isGuest: false,
    name: 'Jane Doe',
    bio: 'Web developer and tech writer',
    avatarUrl: 'https://example.com/avatar/jane.jpg',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    updatedAt: new Date('2025-01-01T10:00:00Z'),
  },
  admin: {
    id: 'user-admin-1',
    email: 'admin@example.com',
    isGuest: false,
    name: 'Admin User',
    bio: 'Platform administrator',
    avatarUrl: null,
    createdAt: new Date('2024-12-01T10:00:00Z'),
    updatedAt: new Date('2024-12-01T10:00:00Z'),
  },
};
