/**
 * Health check endpoint.
 *
 * Returns a simple JSON response confirming the integration is
 * wired correctly and the API is reachable.
 *
 * @since 0.1.0
 */
export const GET = () => {
    return new Response(JSON.stringify({
        status: 'ok',
        framework: '@community-rss/core',
        timestamp: new Date().toISOString(),
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
};
//# sourceMappingURL=health.js.map