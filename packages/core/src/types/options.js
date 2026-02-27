/**
 * Resolves a partial options object into a fully-populated config
 * with all defaults applied.
 *
 * @param options - Partial user-supplied configuration
 * @returns Fully resolved configuration with defaults
 * @since 0.1.0
 */
export function resolveOptions(options = {}) {
    return {
        maxFeeds: options.maxFeeds ?? 5,
        commentTier: options.commentTier ?? 'registered',
        databasePath: options.databasePath ?? './data/community.db',
        syncSchedule: options.syncSchedule ?? '*/30 * * * *',
        emailTemplateDir: options.emailTemplateDir ?? './src/email-templates',
        email: {
            from: options.email?.from,
            appName: options.email?.appName ?? 'Community RSS',
            transport: options.email?.transport,
            templates: options.email?.templates,
            templateDir: options.email?.templateDir ?? './src/email-templates',
        },
    };
}
//# sourceMappingURL=options.js.map