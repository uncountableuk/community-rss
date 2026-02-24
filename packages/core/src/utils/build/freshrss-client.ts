import type { Env } from '../../types/env';
import type { FreshRssSubscriptionListResponse, FreshRssStreamResponse } from '../../types/freshrss';

/**
 * Client for interacting with the FreshRSS Google Reader API.
 *
 * Authentication uses the Google Reader ClientLogin flow:
 * 1. POST credentials to `/accounts/ClientLogin` to obtain an auth token
 * 2. Use the token in `Authorization: GoogleLogin auth=<token>` headers
 *
 * The token is obtained lazily on the first API call and cached for the
 * lifetime of the client instance.
 *
 * @since 0.2.0
 */
export class FreshRssClient {
    private baseUrl: string;
    private user: string;
    private apiPassword: string;
    private authToken: string | null = null;
    private cfAccessHeaders: { id: string; secret: string } | null = null;

    constructor(env: Env) {
        // Ensure URL doesn't end with a slash
        this.baseUrl = env.FRESHRSS_URL.replace(/\/$/, '');
        this.user = env.FRESHRSS_USER;
        this.apiPassword = env.FRESHRSS_API_PASSWORD;

        if (env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) {
            this.cfAccessHeaders = {
                id: env.CF_ACCESS_CLIENT_ID,
                secret: env.CF_ACCESS_CLIENT_SECRET,
            };
        }
    }

    /**
     * Authenticates with FreshRSS via the Google Reader ClientLogin endpoint.
     *
     * Posts `Email` and `Passwd` to `/api/greader.php/accounts/ClientLogin`
     * and parses the `Auth=<token>` line from the response body.
     *
     * @throws Error if authentication fails or the response is malformed.
     * @since 0.2.0
     */
    async login(): Promise<string> {
        if (this.authToken) {
            return this.authToken;
        }

        const url = `${this.baseUrl}/api/greader.php/accounts/ClientLogin`;
        const body = `Email=${encodeURIComponent(this.user)}&Passwd=${encodeURIComponent(this.apiPassword)}`;

        const headers = new Headers({
            'Content-Type': 'application/x-www-form-urlencoded',
        });

        if (this.cfAccessHeaders) {
            headers.set('CF-Access-Client-Id', this.cfAccessHeaders.id);
            headers.set('CF-Access-Client-Secret', this.cfAccessHeaders.secret);
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body,
        });

        if (!response.ok) {
            throw new Error(`FreshRSS login failed: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        const authLine = text.split('\n').find((line) => line.startsWith('Auth='));

        if (!authLine) {
            throw new Error('FreshRSS login response did not contain an Auth token');
        }

        this.authToken = authLine.substring('Auth='.length).trim();
        return this.authToken;
    }

    /**
     * Builds authenticated headers for API requests.
     * Calls `login()` if no auth token has been obtained yet.
     */
    private async getHeaders(): Promise<Headers> {
        const token = await this.login();

        const headers = new Headers({
            'Authorization': `GoogleLogin auth=${token}`,
            'Content-Type': 'application/json',
        });

        if (this.cfAccessHeaders) {
            headers.set('CF-Access-Client-Id', this.cfAccessHeaders.id);
            headers.set('CF-Access-Client-Secret', this.cfAccessHeaders.secret);
        }

        return headers;
    }

    /**
     * Fetches all subscribed feeds from FreshRSS.
     */
    async fetchFeeds(): Promise<FreshRssSubscriptionListResponse> {
        const url = `${this.baseUrl}/api/greader.php/reader/api/0/subscription/list?output=json`;
        const headers = await this.getHeaders();

        const response = await fetch(url, {
            method: 'GET',
            headers,
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

        const headers = await this.getHeaders();

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            throw new Error(`FreshRSS API error: ${response.status} ${response.statusText}`);
        }

        return response.json() as Promise<FreshRssStreamResponse>;
    }
}
