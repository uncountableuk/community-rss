import cron from 'node-cron';
import type { AppContext } from '../../types/context';
import { syncFeeds } from './sync';

/**
 * Active cron task reference for cleanup.
 * @internal
 */
let activeTask: cron.ScheduledTask | null = null;

/**
 * Starts the background feed sync scheduler.
 *
 * Registers a cron job that calls `syncFeeds()` at the configured interval.
 * Only one scheduler can be active at a time — calling `startScheduler()`
 * again will stop the previous task before registering a new one.
 *
 * @param app - Application context with database, config, and environment
 * @returns The cron `ScheduledTask` instance
 * @since 0.4.0
 *
 * @example
 * ```ts
 * import { startScheduler, stopScheduler } from '@community-rss/core';
 *
 * // Start with default schedule (every 30 minutes)
 * startScheduler(app);
 *
 * // Graceful shutdown
 * process.on('SIGTERM', () => stopScheduler());
 * ```
 */
export function startScheduler(app: AppContext): cron.ScheduledTask {
  // Stop any existing scheduler first
  if (activeTask) {
    activeTask.stop();
    activeTask = null;
  }

  const schedule = app.config.syncSchedule;

  if (!cron.validate(schedule)) {
    throw new Error(`[community-rss] Invalid cron expression: "${schedule}"`);
  }

  console.log(`[community-rss] Scheduler started with schedule: ${schedule}`);

  activeTask = cron.schedule(schedule, async () => {
    try {
      const result = await syncFeeds(app);
      console.log(
        `[community-rss] Sync complete: ${result.feedsProcessed} feeds, ${result.articlesProcessed} articles processed`,
      );
    } catch (error) {
      console.error('[community-rss] Scheduled sync failed:', error);
    }
  });

  return activeTask;
}

/**
 * Stops the active feed sync scheduler.
 *
 * Safe to call even if no scheduler is running (no-op).
 *
 * @since 0.4.0
 */
export function stopScheduler(): void {
  if (activeTask) {
    activeTask.stop();
    activeTask = null;
    console.log('[community-rss] Scheduler stopped');
  }
}

/**
 * Returns whether the scheduler is currently active.
 *
 * @returns `true` if a cron task is registered and running
 * @since 0.4.0
 */
export function isSchedulerRunning(): boolean {
  return activeTask !== null;
}
