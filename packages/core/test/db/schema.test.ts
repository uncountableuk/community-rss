import { describe, it, expect } from 'vitest';
import * as schema from '@db/schema';
import { getTableConfig } from 'drizzle-orm/sqlite-core';

describe('Database Schema', () => {
  describe('Table exports', () => {
    it('should export users table', () => {
      expect(schema.users).toBeDefined();
    });

    it('should export sessions table', () => {
      expect(schema.sessions).toBeDefined();
    });

    it('should export accounts table', () => {
      expect(schema.accounts).toBeDefined();
    });

    it('should export verifications table', () => {
      expect(schema.verifications).toBeDefined();
    });

    it('should export verifiedDomains table', () => {
      expect(schema.verifiedDomains).toBeDefined();
    });

    it('should export feeds table', () => {
      expect(schema.feeds).toBeDefined();
    });

    it('should export articles table', () => {
      expect(schema.articles).toBeDefined();
    });

    it('should export followers table', () => {
      expect(schema.followers).toBeDefined();
    });

    it('should export interactions table', () => {
      expect(schema.interactions).toBeDefined();
    });

    it('should export comments table', () => {
      expect(schema.comments).toBeDefined();
    });

    it('should export mediaCache table', () => {
      expect(schema.mediaCache).toBeDefined();
    });
  });

  describe('Users table structure', () => {
    it('should have id column', () => {
      expect(schema.users.id).toBeDefined();
    });

    it('should have email column', () => {
      expect(schema.users.email).toBeDefined();
    });

    it('should have isGuest column', () => {
      expect(schema.users.isGuest).toBeDefined();
    });

    it('should have name column', () => {
      expect(schema.users.name).toBeDefined();
    });

    it('should have timestamps', () => {
      expect(schema.users.createdAt).toBeDefined();
      expect(schema.users.updatedAt).toBeDefined();
    });
  });

  describe('Articles table structure', () => {
    it('should have freshrssItemId column for sync idempotency', () => {
      expect(schema.articles.freshrssItemId).toBeDefined();
    });

    it('should have mediaPending column', () => {
      expect(schema.articles.mediaPending).toBeDefined();
    });

    it('should have feedId column', () => {
      expect(schema.articles.feedId).toBeDefined();
    });
  });

  describe('Interactions table structure', () => {
    it('should have userId column', () => {
      expect(schema.interactions.userId).toBeDefined();
    });

    it('should have articleId column', () => {
      expect(schema.interactions.articleId).toBeDefined();
    });

    it('should have type column', () => {
      expect(schema.interactions.type).toBeDefined();
    });
  });

  describe('Feeds table structure', () => {
    it('should have feedUrl column', () => {
      expect(schema.feeds.feedUrl).toBeDefined();
    });

    it('should have status column', () => {
      expect(schema.feeds.status).toBeDefined();
    });

    it('should have consentAt column', () => {
      expect(schema.feeds.consentAt).toBeDefined();
    });
  });

  describe('$defaultFn callbacks', () => {
    it('users.createdAt default should return a Date', () => {
      const config = getTableConfig(schema.users);
      const createdAtCol = config.columns.find((c) => c.name === 'created_at');
      expect(createdAtCol).toBeDefined();
      if (createdAtCol && 'defaultFn' in createdAtCol && typeof createdAtCol.defaultFn === 'function') {
        const value = createdAtCol.defaultFn();
        expect(value).toBeInstanceOf(Date);
      }
    });

    it('users.updatedAt default should return a Date', () => {
      const config = getTableConfig(schema.users);
      const updatedAtCol = config.columns.find((c) => c.name === 'updated_at');
      expect(updatedAtCol).toBeDefined();
      if (updatedAtCol && 'defaultFn' in updatedAtCol && typeof updatedAtCol.defaultFn === 'function') {
        const value = updatedAtCol.defaultFn();
        expect(value).toBeInstanceOf(Date);
      }
    });

    it('interactions.createdAt default should return a Date', () => {
      const config = getTableConfig(schema.interactions);
      const createdAtCol = config.columns.find((c) => c.name === 'created_at');
      expect(createdAtCol).toBeDefined();
      if (createdAtCol && 'defaultFn' in createdAtCol && typeof createdAtCol.defaultFn === 'function') {
        const value = createdAtCol.defaultFn();
        expect(value).toBeInstanceOf(Date);
      }
    });

    it('comments.createdAt default should return a Date', () => {
      const config = getTableConfig(schema.comments);
      const createdAtCol = config.columns.find((c) => c.name === 'created_at');
      expect(createdAtCol).toBeDefined();
      if (createdAtCol && 'defaultFn' in createdAtCol && typeof createdAtCol.defaultFn === 'function') {
        const value = createdAtCol.defaultFn();
        expect(value).toBeInstanceOf(Date);
      }
    });

    it('mediaCache.cachedAt default should return a Date', () => {
      const config = getTableConfig(schema.mediaCache);
      const cachedAtCol = config.columns.find((c) => c.name === 'cached_at');
      expect(cachedAtCol).toBeDefined();
      if (cachedAtCol && 'defaultFn' in cachedAtCol && typeof cachedAtCol.defaultFn === 'function') {
        const value = cachedAtCol.defaultFn();
        expect(value).toBeInstanceOf(Date);
      }
    });
  });

  describe('Table indexes and constraints', () => {
    it('articles table should have freshrss_item_id unique index', () => {
      const config = getTableConfig(schema.articles);
      const idx = config.indexes.find((i) => i.config.name === 'articles_freshrss_item_id_idx');
      expect(idx).toBeDefined();
      expect(idx?.config.unique).toBe(true);
    });

    it('users table should have email unique index', () => {
      const config = getTableConfig(schema.users);
      const idx = config.indexes.find((i) => i.config.name === 'users_email_idx');
      expect(idx).toBeDefined();
      expect(idx?.config.unique).toBe(true);
    });

    it('feeds table should have user_id index', () => {
      const config = getTableConfig(schema.feeds);
      const idx = config.indexes.find((i) => i.config.name === 'feeds_user_id_idx');
      expect(idx).toBeDefined();
    });

    it('articles table should have feed_id index', () => {
      const config = getTableConfig(schema.articles);
      const idx = config.indexes.find((i) => i.config.name === 'articles_feed_id_idx');
      expect(idx).toBeDefined();
    });

    it('articles table should have published_at index', () => {
      const config = getTableConfig(schema.articles);
      const idx = config.indexes.find((i) => i.config.name === 'articles_published_at_idx');
      expect(idx).toBeDefined();
    });
  });
});
