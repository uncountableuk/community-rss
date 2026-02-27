import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
// This file requires `astro sync` to generate type definitions.
// If you see "Cannot find module 'astro:content'" errors, run `astro sync` in the docs directory.
export const collections = {
    docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
//# sourceMappingURL=content.config.js.map