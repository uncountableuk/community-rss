import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoist mock variables so they're available to vi.mock factories
const mocks = vi.hoisted(() => ({
  mockSchedule: vi.fn(),
  mockValidate: vi.fn(),
  mockTaskStop: vi.fn(),
  mockSyncFeeds: vi.fn(),
}));

vi.mock('node-cron', () => ({
  default: {
    schedule: mocks.mockSchedule,
    validate: mocks.mockValidate,
  },
}));

vi.mock('@utils/build/sync', () => ({
  syncFeeds: mocks.mockSyncFeeds,
}));

import {
  startScheduler,
  stopScheduler,
  isSchedulerRunning,
} from '@utils/build/scheduler';
import type { AppContext } from '@core-types/context';

describe('Scheduler', () => {
  const mockApp: AppContext = {
    db: {} as AppContext['db'],
    config: {
      maxFeeds: 5,
      commentTier: 'registered' as const,
      databasePath: './data/test.db',
      syncSchedule: '*/30 * * * *',
      emailTemplateDir: './src/email-templates',
    },
    env: {
      DATABASE_PATH: './data/test.db',
      FRESHRSS_URL: 'https://rss.example.com',
      FRESHRSS_USER: 'user',
      FRESHRSS_API_PASSWORD: 'pass',
      PUBLIC_SITE_URL: 'https://example.com',
      SMTP_HOST: 'localhost',
      SMTP_PORT: '587',
      SMTP_FROM: 'noreply@example.com',
      S3_ENDPOINT: 'http://localhost:9000',
      S3_ACCESS_KEY: 'key',
      S3_SECRET_KEY: 'secret',
      S3_BUCKET: 'media',
      MEDIA_BASE_URL: 'http://localhost:9000/media',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: valid cron expressions
    mocks.mockValidate.mockReturnValue(true);
    // Default: return a mock task object
    mocks.mockSchedule.mockReturnValue({ stop: mocks.mockTaskStop });
    // Ensure clean state
    stopScheduler();
  });

  afterEach(() => {
    stopScheduler();
  });

  describe('startScheduler', () => {
    it('should register a cron job with the configured schedule', () => {
      startScheduler(mockApp);

      expect(mocks.mockValidate).toHaveBeenCalledWith('*/30 * * * *');
      expect(mocks.mockSchedule).toHaveBeenCalledWith(
        '*/30 * * * *',
        expect.any(Function),
      );
    });

    it('should throw on invalid cron expression', () => {
      mocks.mockValidate.mockReturnValue(false);

      const badApp = {
        ...mockApp,
        config: { ...mockApp.config, syncSchedule: 'not-a-cron' },
      };

      expect(() => startScheduler(badApp)).toThrow('Invalid cron expression');
    });

    it('should stop previous scheduler before starting new one', () => {
      startScheduler(mockApp);
      startScheduler(mockApp);

      expect(mocks.mockTaskStop).toHaveBeenCalledOnce();
      expect(mocks.mockSchedule).toHaveBeenCalledTimes(2);
    });

    it('should return the cron task', () => {
      const task = startScheduler(mockApp);
      expect(task).toEqual({ stop: mocks.mockTaskStop });
    });

    it('should call syncFeeds when cron fires', async () => {
      mocks.mockSyncFeeds.mockResolvedValue({ feedsProcessed: 2, articlesProcessed: 5 });

      let cronCallback: (() => Promise<void>) | undefined;
      mocks.mockSchedule.mockImplementation((_schedule: string, cb: () => Promise<void>) => {
        cronCallback = cb;
        return { stop: mocks.mockTaskStop };
      });

      startScheduler(mockApp);

      expect(cronCallback).toBeDefined();
      await cronCallback!();

      expect(mocks.mockSyncFeeds).toHaveBeenCalledWith(mockApp);
    });

    it('should handle sync errors gracefully', async () => {
      mocks.mockSyncFeeds.mockRejectedValue(new Error('Network error'));

      let cronCallback: (() => Promise<void>) | undefined;
      mocks.mockSchedule.mockImplementation((_schedule: string, cb: () => Promise<void>) => {
        cronCallback = cb;
        return { stop: mocks.mockTaskStop };
      });

      startScheduler(mockApp);

      // Should not throw
      await expect(cronCallback!()).resolves.toBeUndefined();
    });
  });

  describe('stopScheduler', () => {
    it('should stop the active task', () => {
      startScheduler(mockApp);
      stopScheduler();

      expect(mocks.mockTaskStop).toHaveBeenCalledOnce();
    });

    it('should be safe to call when no scheduler is running', () => {
      expect(() => stopScheduler()).not.toThrow();
    });
  });

  describe('isSchedulerRunning', () => {
    it('should return false when no scheduler is active', () => {
      expect(isSchedulerRunning()).toBe(false);
    });

    it('should return true when scheduler is active', () => {
      startScheduler(mockApp);
      expect(isSchedulerRunning()).toBe(true);
    });

    it('should return false after stopping', () => {
      startScheduler(mockApp);
      stopScheduler();
      expect(isSchedulerRunning()).toBe(false);
    });
  });
});
