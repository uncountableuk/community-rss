/**
 * Mock feed data for tests.
 * @since 0.1.0
 */
export declare const mockFeeds: ({
    id: string;
    userId: string;
    feedUrl: string;
    title: string;
    description: string;
    category: string;
    status: "approved";
    consentAt: Date;
    createdAt: Date;
    updatedAt: Date;
} | {
    id: string;
    userId: string;
    feedUrl: string;
    title: string;
    description: string;
    category: string;
    status: "pending";
    consentAt: null;
    createdAt: Date;
    updatedAt: Date;
})[];
//# sourceMappingURL=feeds.d.ts.map