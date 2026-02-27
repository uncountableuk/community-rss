import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
export declare function getArticles(db: BetterSQLite3Database, limit?: number, offset?: number): Promise<{
    title: string;
    content: string | null;
    summary: string | null;
    id: string;
    feedId: string;
    freshrssItemId: string;
    originalLink: string | null;
    authorName: string | null;
    publishedAt: Date | null;
    syncedAt: Date;
    mediaPending: boolean;
}[]>;
export declare function getArticleById(db: BetterSQLite3Database, id: string): Promise<{
    title: string;
    content: string | null;
    summary: string | null;
    id: string;
    feedId: string;
    freshrssItemId: string;
    originalLink: string | null;
    authorName: string | null;
    publishedAt: Date | null;
    syncedAt: Date;
    mediaPending: boolean;
}>;
export declare function upsertArticle(db: BetterSQLite3Database, article: {
    id: string;
    feedId: string;
    freshrssItemId: string;
    title: string;
    content: string;
    summary?: string;
    originalLink: string;
    authorName?: string;
    publishedAt: Date;
    mediaPending?: boolean;
}): Promise<{
    title: string;
    content: string | null;
    summary: string | null;
    id: string;
    feedId: string;
    freshrssItemId: string;
    originalLink: string | null;
    authorName: string | null;
    publishedAt: Date | null;
    syncedAt: Date;
    mediaPending: boolean;
}[]>;
//# sourceMappingURL=articles.d.ts.map