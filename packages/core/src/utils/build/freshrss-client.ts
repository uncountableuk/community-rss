import type { Env } from '../../types/env';
import type { FreshRssSubscriptionListResponse, FreshRssStreamResponse } from '../../types/freshrss';

/**
 * Client for interacting with the FreshRSS Google Reader API.
 *
 * @since 0.2.0
 */
export class FreshRssClient {
    private baseUrl: string;
    private headers: Headers;

    constructor(env: Env) {
        // Ensure URL doesn't end with a slash
        this.baseUrl = env.FRESHRSS_URL.replace(/\/$/, '');

        this.headers = new Headers({
            'Authorization': `GoogleLogin auth=${env.FRESHRSS_USER}/${env.FRESHRSS_API_PASSWORD}`,
            'Content-Type': 'application/json',
        });

        if (env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) {
            this.headers.set('CF-Access-Client-Id', env.CF_ACCESS_CLIENT_ID);
            this.headers.set('CF-Access-Client-Secret', env.CF_ACCESS_CLIENT_SECRET);
        }
    }

    /**
     * Fetches all subscribed feeds from FreshRSS.
     */
    async fetchFeeds(): Promise<FreshRssSubscriptionListResponse> {
        const url = `${this.baseUrl}/api/greader.php/reader/api/0/subscription/list?output=json`;

        const response = await fetch(url, {
            method: 'GET',
            headers: this.headers,
        });

        if (!response.ok) {
            throw new Error(`FreshRSS API error: ${response.status} ${response.statusText}`);
        }

        return response.json() as Promise<FreshRssSubscriptionListResponse>;
    }

    /**
     * Fetches articles for a specific feed.
     * 
     * @param feedId The FreshRSS feed ID (e.g., 'feed/123')
     * @param since Optional timestamp (in seconds) to fetch articles since
     */
    async fetchArticles(feedId: string, since?: number): Promise<FreshRssStreamResponse> {
        const url = new URL(`${this.baseUrl}/api/greader.php/reader/api/0/stream/contents/${encodeURIComponent(feedId)}`);
        url.searchParams.set('output', 'json');
        url.searchParams.set('n', '100'); // Max items per page

        if (since) {
            url.searchParams.set('ot', since.toString());
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: this.headers,
        });

        if (!response.ok) {
            throw new Error(`FreshRSS API error: ${response.status} ${response.statusText}`);
        }

        return response.json() as Promise<FreshRssStreamResponse>;
    }
}
