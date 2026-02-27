/**
 * Astro middleware that creates the AppContext and sets it on
 * `context.locals.app` for all route handlers.
 *
 * The resolved config is shared from the integration via
 * `globalThis.__communityRssConfig` (set in `astro:config:setup`).
 * Both the integration and middleware run in the same Node.js process,
 * so `globalThis` safely bridges the Vite module-graph boundary.
 *
 * @since 0.4.0
 */
/**
 * Astro middleware — exported as `onRequest` so that Astro's
 * `addMiddleware` picks it up automatically.
 *
 * @since 0.4.0
 */
export declare const onRequest: any;
//# sourceMappingURL=middleware.d.ts.map