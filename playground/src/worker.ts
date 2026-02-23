/**
 * Custom worker entrypoint for the playground.
 *
 * Wraps the Astro SSR createExports function to also expose the
 * community-rss scheduled sync and queue consumer handlers.
 *
 * Cloudflare Workers module format requires scheduled/queue to be
 * properties on the default export object ({ fetch, scheduled, queue })
 * rather than standalone named exports.
 */

import { createExports as astroCreateExports } from '@astrojs/cloudflare/entrypoints/server.js';
import { scheduled, queue } from '@community-rss/core/workers';
import type { SSRManifest } from 'astro';

export function createExports(manifest: SSRManifest) {
    const astroExports = astroCreateExports(manifest);
    return {
        ...astroExports,
        // Merge into default so Cloudflare Workers module format recognises them
        default: {
            ...astroExports.default,
            scheduled,
            queue,
        },
        // Also expose as named exports (belt-and-suspenders)
        scheduled,
        queue,
    };
}
