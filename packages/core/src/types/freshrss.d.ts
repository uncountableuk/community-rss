/**
 * FreshRSS (Google Reader API) Response Types
 */
export interface FreshRssCategory {
    id: string;
    label: string;
}
export interface FreshRssSubscription {
    id: string;
    title: string;
    categories: FreshRssCategory[];
    url: string;
    htmlUrl: string;
    iconUrl: string;
}
export interface FreshRssSubscriptionListResponse {
    subscriptions: FreshRssSubscription[];
}
export interface FreshRssItemOrigin {
    streamId: string;
    title: string;
    htmlUrl: string;
}
export interface FreshRssItemContent {
    direction: string;
    content: string;
}
export interface FreshRssItemAlternate {
    href: string;
    type: string;
}
export interface FreshRssItem {
    id: string;
    crawlTimeMsec: string;
    timestampUsec: string;
    categories: string[];
    title: string;
    published: number;
    updated: number;
    canonical: FreshRssItemAlternate[];
    alternate: FreshRssItemAlternate[];
    summary: FreshRssItemContent;
    content?: FreshRssItemContent;
    author: string;
    origin: FreshRssItemOrigin;
}
export interface FreshRssStreamResponse {
    direction: string;
    id: string;
    title: string;
    description: string;
    self: {
        href: string;
    };
    updated: number;
    updatedUsec: string;
    items: FreshRssItem[];
    continuation?: string;
}
//# sourceMappingURL=freshrss.d.ts.map