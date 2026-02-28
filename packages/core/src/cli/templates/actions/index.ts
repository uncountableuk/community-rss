/**
 * Astro Actions — Community RSS
 *
 * Type-safe RPC handlers powered by @community-rss/core.
 * These Actions wrap the framework's business logic and can be called
 * from client-side code via `actions.fetchArticles(input)`.
 *
 * The existing /api/v1/* routes remain functional for backward
 * compatibility. Actions provide an additional typed layer on top.
 *
 * @see https://docs.astro.build/en/guides/actions/
 * @since 0.5.0
 */
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import {
  fetchArticlesHandler,
  checkEmailHandler,
  submitSignupHandler,
  updateProfileHandler,
  changeEmailHandler,
  confirmEmailChangeHandler,
} from '@community-rss/core/actions';

export const server = {
  fetchArticles: defineAction({
    input: z.object({
      page: z.number().optional(),
      limit: z.number().optional(),
      feedId: z.string().optional(),
      sort: z.string().optional(),
    }),
    handler: async (input, context) => {
      const app = context.locals.app;
      return fetchArticlesHandler(input, app);
    },
  }),

  checkEmail: defineAction({
    input: z.object({
      email: z.string().email(),
    }),
    handler: async (input, context) => {
      const app = context.locals.app;
      return checkEmailHandler(input, app);
    },
  }),

  submitSignup: defineAction({
    input: z.object({
      email: z.string().email(),
      name: z.string().min(1).max(100),
      termsAccepted: z.boolean(),
    }),
    handler: async (input, context) => {
      const app = context.locals.app;
      return submitSignupHandler(input, app);
    },
  }),

  updateProfile: defineAction({
    input: z.object({
      userId: z.string(),
      name: z.string().optional(),
      bio: z.string().optional(),
    }),
    handler: async (input, context) => {
      const app = context.locals.app;
      return updateProfileHandler(input, app);
    },
  }),

  changeEmail: defineAction({
    input: z.object({
      userId: z.string(),
      currentEmail: z.string().email(),
      currentName: z.string().optional(),
      newEmail: z.string().email(),
    }),
    handler: async (input, context) => {
      const app = context.locals.app;
      return changeEmailHandler(input, app);
    },
  }),

  confirmEmailChange: defineAction({
    input: z.object({
      token: z.string().min(1),
    }),
    handler: async (input, context) => {
      const app = context.locals.app;
      return confirmEmailChangeHandler(input, app);
    },
  }),
};
