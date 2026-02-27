import type { EnvironmentVariables } from '../../types/context';
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
export declare class FreshRssClient {
    private baseUrl;
    private user;
    private apiPassword;
    private authToken;
    private cfAccessHeaders;
    constructor(env: EnvironmentVariables);
    /**
     * Authenticates with FreshRSS via the Google Reader ClientLogin endpoint.
     *
     * Posts `Email` and `Passwd` to `/api/greader.php/accounts/ClientLogin`
     * and parses the `Auth=<token>` line from the response body.
     *
     * @throws Error if authentication fails or the response is malformed.
     * @since 0.2.0
     */
    login(): Promise<string>;
    /**
     * Builds authenticated headers for API requests.
     * Calls `login()` if no auth token has been obtained yet.
     */
    private getHeaders;
    /**
     * Fetches all subscribed feeds from FreshRSS.
     */
    fetchFeeds(): Promise<FreshRssSubscriptionListResponse>;
    /**
     * Fetches articles for a specific feed.
     *
     * @param feedId The FreshRSS feed ID (e.g., 'feed/123')
     * @param since Optional timestamp (in seconds) to fetch articles since
     */
    fetchArticles(feedId: string, since?: number): Promise<FreshRssStreamResponse>;
}
//# sourceMappingURL=freshrss-client.d.ts.map