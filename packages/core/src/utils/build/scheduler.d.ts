import type { AppContext } from '../../types/context';
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
export declare function startScheduler(app: AppContext): cron.ScheduledTask;
/**
 * Stops the active feed sync scheduler.
 *
 * Safe to call even if no scheduler is running (no-op).
 *
 * @since 0.4.0
 */
export declare function stopScheduler(): void;
/**
 * Returns whether the scheduler is currently active.
 *
 * @returns `true` if a cron task is registered and running
 * @since 0.4.0
 */
export declare function isSchedulerRunning(): boolean;
//# sourceMappingURL=scheduler.d.ts.map