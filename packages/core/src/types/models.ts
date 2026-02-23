/**
 * Domain model interfaces for the Community RSS framework.
 *
 * These interfaces represent the application-level data structures.
 * They are NOT direct database row types — those are derived from
 * the Drizzle schema. These are used in business logic, API responses,
 * and component props.
 *
 * @since 0.1.0
 */

/**
 * User tiers in the progressive engagement model.
 * @since 0.1.0
 */
export type UserTier = 'guest' | 'registered' | 'verified' | 'admin';

/**
 * Feed approval status.
 * @since 0.1.0
 */
export type FeedStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

/**
 * Comment moderation status.
 * @since 0.1.0
 */
export type CommentStatus = 'pending' | 'approved' | 'rejected';

/**
 * Interaction types for articles.
 * @since 0.1.0
 */
export type InteractionType = 'heart' | 'star';

/**
 * Structured error returned by public API endpoints.
 * Error codes are part of the public API contract.
 *
 * @since 0.1.0
 */
export interface CommunityRssError {
  /** Machine-readable error code (e.g., 'FEED_NOT_FOUND') */
  code: string;
  /** Human-readable error description */
  message: string;
  /** Optional diagnostic payload */
  details?: unknown;
}
