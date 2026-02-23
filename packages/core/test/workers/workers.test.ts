import { describe, it, expect, vi } from 'vitest';
import { scheduled } from '../../src/workers/scheduled';
import { queue } from '../../src/workers/queue';

describe('Worker Exports', () => {
  describe('scheduled', () => {
    it('should be a function', () => {
      expect(typeof scheduled).toBe('function');
    });

    it('should execute without error', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await expect(
        scheduled(
          {} as ScheduledController,
          {} as Parameters<typeof scheduled>[1],
          { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as unknown as ExecutionContext,
        ),
      ).resolves.toBeUndefined();

      consoleSpy.mockRestore();
    });

    it('should log a message when triggered', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await scheduled(
        {} as ScheduledController,
        {} as Parameters<typeof scheduled>[1],
        { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as unknown as ExecutionContext,
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Scheduled handler triggered'),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('queue', () => {
    it('should be a function', () => {
      expect(typeof queue).toBe('function');
    });

    it('should execute without error', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await expect(
        queue(
          {} as MessageBatch,
          {} as Parameters<typeof queue>[1],
          { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as unknown as ExecutionContext,
        ),
      ).resolves.toBeUndefined();

      consoleSpy.mockRestore();
    });

    it('should log a message when triggered', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await queue(
        {} as MessageBatch,
        {} as Parameters<typeof queue>[1],
        { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as unknown as ExecutionContext,
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Queue consumer triggered'),
      );
      consoleSpy.mockRestore();
    });
  });
});
