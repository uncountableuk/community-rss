/**
 * Module-level config bridge between the Astro integration
 * (`integration.ts`) and the runtime middleware (`middleware.ts`).
 *
 * The integration runs in Node.js during config loading, **before**
 * `astro:middleware` is available as a virtual module. The middleware
 * runs inside Vite's SSR module graph. Because they share the same
 * Node.js process, we use `globalThis` to pass the resolved config.
 *
 * This module deliberately has **no** Astro-specific imports so it
 * can be loaded safely at config-evaluation time.
 *
 * @internal
 * @since 0.4.0
 */
import { resolveOptions } from './types/options';
/** Well-known key on `globalThis` used to pass the resolved config. */
const CONFIG_KEY = '__communityRssConfig';
/**
 * Stores the resolved config on `globalThis` so the middleware can
 * read it at request-time.  Called by the integration in
 * `astro:config:setup`.
 *
 * @internal
 * @since 0.4.0
 */
export function setGlobalConfig(config) {
    globalThis[CONFIG_KEY] = config;
}
/**
 * Retrieves the resolved config previously stored by `setGlobalConfig`.
 * Falls back to `resolveOptions({})` (all defaults) if the integration
 * has not stored a config yet.
 *
 * @internal
 * @since 0.4.0
 */
export function getGlobalConfig() {
    return globalThis[CONFIG_KEY]
        ?? resolveOptions({});
}
//# sourceMappingURL=config-store.js.map