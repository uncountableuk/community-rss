/**
 * Community RSS — Core Action Definitions
 *
 * Provides a `coreActions` map that consumers can spread into their
 * Astro Actions `server` export. Each entry defines `input` (a Zod
 * schema) and `handler` (the business logic function).
 *
 * Usage in consumer's `src/actions/index.ts`:
 * ```typescript
 * import { coreActions } from '@community-rss/core/actions';
 * export const server = {
 *   ...coreActions,
 *   // Your custom actions below
 * };
 * ```
 *
 * @since 0.6.0
 */
import { z } from 'zod';
import { fetchArticlesHandler } from './articles';
import { checkEmailHandler, submitSignupHandler } from './auth';
import {
  updateProfileHandler,
  changeEmailHandler,
  confirmEmailChangeHandler,
} from './profile';

/**
 * Creates a core action definition compatible with Astro's `defineAction`.
 *
 * Each entry contains:
 * - `input`: A Zod schema for input validation
 * - `handler`: An async function `(input, context) => result` that
 *   extracts `context.locals.app` and delegates to the core handler
 *
 * @since 0.6.0
 */
export const coreActions = {
  fetchArticles: {
    input: z.object({
      page: z.number().optional(),
      limit: z.number().optional(),
      feedId: z.string().optional(),
      sort: z.string().optional(),
    }),
    handler: async (input: any, context: any) => {
      const app = context.locals.app;
      return fetchArticlesHandler(input, app);
    },
  },

  checkEmail: {
    input: z.object({
      email: z.string().email(),
    }),
    handler: async (input: any, context: any) => {
      const app = context.locals.app;
      return checkEmailHandler(input, app);
    },
  },

  submitSignup: {
    input: z.object({
      email: z.string().email(),
      name: z.string().min(1).max(100),
      termsAccepted: z.boolean(),
    }),
    handler: async (input: any, context: any) => {
      const app = context.locals.app;
      return submitSignupHandler(input, app);
    },
  },

  updateProfile: {
    input: z.object({
      userId: z.string(),
      name: z.string().optional(),
      bio: z.string().optional(),
    }),
    handler: async (input: any, context: any) => {
      const app = context.locals.app;
      return updateProfileHandler(input, app);
    },
  },

  changeEmail: {
    input: z.object({
      userId: z.string(),
      currentEmail: z.string().email(),
      currentName: z.string().optional(),
      newEmail: z.string().email(),
    }),
    handler: async (input: any, context: any) => {
      const app = context.locals.app;
      return changeEmailHandler(input, app);
    },
  },

  confirmEmailChange: {
    input: z.object({
      token: z.string().min(1),
    }),
    handler: async (input: any, context: any) => {
      const app = context.locals.app;
      return confirmEmailChangeHandler(input, app);
    },
  },
} as const;

/**
 * Type for a single action definition entry.
 * @since 0.6.0
 */
export interface ActionDefinition {
  input: z.ZodType;
  handler: (input: any, context: any) => Promise<any>;
}
