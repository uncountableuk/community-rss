export default {
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: 'sqlite',
    dbCredentials: {
        url: process.env.DATABASE_PATH ?? './data/community.db',
    },
};
//# sourceMappingURL=drizzle.config.js.map