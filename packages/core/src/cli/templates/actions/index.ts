/**
 * Astro Actions — Community RSS
 *
 * Uses the `coreActions` spread pattern to wire all framework actions
 * automatically. Add your custom actions below the spread.
 *
 * When the framework adds new actions in future versions, they
 * appear here automatically after `npm update`.
 *
 * @see https://docs.astro.build/en/guides/actions/
 * @since 0.6.0
 */
import { defineAction } from 'astro:actions';
import { coreActions } from '@community-rss/core/actions';

/**
 * Transform coreActions into Astro defineAction calls.
 * Each entry has { input, handler } — we wrap them with defineAction.
 */
function wrapCoreActions(actions: Record<string, { input: any; handler: any }>) {
    const wrapped: Record<string, any> = {};
    for (const [name, def] of Object.entries(actions)) {
        wrapped[name] = defineAction({
            input: def.input,
            handler: def.handler,
        });
    }
    return wrapped;
}

export const server = {
    ...wrapCoreActions(coreActions),

    // === Your custom actions below ===
    // Example:
    // myCustomAction: defineAction({
    //     input: z.object({ ... }),
    //     handler: async (input, context) => { ... },
    // }),
};
