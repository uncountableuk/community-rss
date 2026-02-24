/**
 * Mock user data for tests.
 * Covers all user tiers: guest, registered, verified, admin, system.
 * @since 0.1.0
 */

export const mockUsers = {
  guest: {
    id: 'user-guest-1',
    email: null,
    isGuest: true,
    role: 'user' as const,
    name: null,
    bio: null,
    avatarUrl: null,
    emailVerified: false,
    createdAt: new Date('2025-01-20T10:00:00Z'),
    updatedAt: new Date('2025-01-20T10:00:00Z'),
  },
  registered: {
    id: 'user-registered-1',
    email: 'reader@example.com',
    isGuest: false,
    role: 'user' as const,
    name: 'Regular Reader',
    bio: 'I enjoy reading tech blogs',
    avatarUrl: null,
    emailVerified: true,
    createdAt: new Date('2025-01-15T10:00:00Z'),
    updatedAt: new Date('2025-01-15T10:00:00Z'),
  },
  author: {
    id: 'user-author-1',
    email: 'jane@example.com',
    isGuest: false,
    role: 'user' as const,
    name: 'Jane Doe',
    bio: 'Web developer and tech writer',
    avatarUrl: 'https://example.com/avatar/jane.jpg',
    emailVerified: true,
    createdAt: new Date('2025-01-01T10:00:00Z'),
    updatedAt: new Date('2025-01-01T10:00:00Z'),
  },
  admin: {
    id: 'user-admin-1',
    email: 'admin@example.com',
    isGuest: false,
    role: 'admin' as const,
    name: 'Admin User',
    bio: 'Platform administrator',
    avatarUrl: null,
    emailVerified: true,
    createdAt: new Date('2024-12-01T10:00:00Z'),
    updatedAt: new Date('2024-12-01T10:00:00Z'),
  },
  system: {
    id: 'system',
    email: null,
    isGuest: false,
    role: 'system' as const,
    name: 'System',
    bio: null,
    avatarUrl: null,
    emailVerified: false,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
};
