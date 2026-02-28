import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import communityRss from '@community-rss/core';

export default defineConfig({
    output: 'server',
    adapter: node({ mode: 'standalone' }),
    integrations: [
        communityRss({
            // maxFeeds: 5,
            // commentTier: 'registered',
            // databasePath: './data/community.db',
            // syncSchedule: '*/30 * * * *',
            email: {
                transport: 'smtp',
                // theme: {
                //     colors: {
                //         primary: '#4f46e5',
                //         background: '#f9fafb',
                //         surface: '#ffffff',
                //         text: '#374151',
                //         mutedText: '#6b7280',
                //         border: '#e5e7eb',
                //         buttonText: '#ffffff',
                //     },
                //     typography: {
                //         fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
                //         fontSize: '16px',
                //         headingSize: '20px',
                //     },
                //     spacing: {
                //         contentPadding: '32px',
                //         borderRadius: '8px',
                //         buttonRadius: '8px',
                //         buttonPadding: '12px 24px',
                //     },
                //     branding: {
                //         logoUrl: undefined,
                //         logoAlt: 'My Community',
                //         logoWidth: '120px',
                //     },
                // },
            },
        }),
    ],
});
