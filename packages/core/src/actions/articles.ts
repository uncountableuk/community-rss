/**
 * Article action handlers.
 *
 * Encapsulates article query business logic for use with Astro Actions.
 * These handlers accept validated input and return typed output, decoupled
 * from HTTP request/response handling.
 *
 * @since 0.5.0
 */

import { getArticles } from '../db/queries/articles';
import type { AppContext } from '../types/context';

/**
 * Input for the fetchArticles action.
 * @since 0.5.0
 */
export interface FetchArticlesInput {
  /** Page number (default: 1) */
  page?: number;
  /** Items per page (default: 20, max: 100) */
  limit?: number;
  /** Filter by feed ID */
  feedId?: string;
  /** Sort order: 'newest' | 'oldest' */
  sort?: string;
}

/**
 * Output for the fetchArticles action.
 * @since 0.5.0
 */
export interface FetchArticlesOutput {
  data: Array<Record<string, unknown>>;
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

/**
 * Fetches a paginated list of articles.
 *
 * Wraps the existing article query logic from the `/api/v1/articles`
 * route into a typed handler suitable for Astro Actions.
 *
 * @param input - Query parameters
 * @param app - Application context with database access
 * @returns Paginated article list
 * @since 0.5.0
 */
export async function fetchArticlesHandler(
  input: FetchArticlesInput,
  app: AppContext,
): Promise<FetchArticlesOutput> {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(100, Math.max(1, input.limit ?? 20));
  const offset = (page - 1) * limit;

  const articles = await getArticles(app.db, limit, offset);

  return {
    data: articles,
    pagination: {
      page,
      limit,
      hasMore: articles.length === limit,
    },
  };
}
