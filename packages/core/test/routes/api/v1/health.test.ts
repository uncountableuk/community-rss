import { describe, it, expect } from 'vitest';
import { GET } from '@routes/api/v1/health';

describe('Health Route', () => {
  describe('GET /api/v1/health', () => {
    it('should return a 200 status', () => {
      const response = GET({} as Parameters<typeof GET>[0]) as Response;

      expect(response.status).toBe(200);
    });

    it('should return JSON content type', () => {
      const response = GET({} as Parameters<typeof GET>[0]) as Response;

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should return body with status ok', async () => {
      const response = GET({} as Parameters<typeof GET>[0]) as Response;
      const body = (await response.json()) as Record<string, unknown>;

      expect(body.status).toBe('ok');
    });

    it('should include framework name', async () => {
      const response = GET({} as Parameters<typeof GET>[0]) as Response;
      const body = (await response.json()) as Record<string, unknown>;

      expect(body.framework).toBe('@community-rss/core');
    });

    it('should include timestamp', async () => {
      const response = GET({} as Parameters<typeof GET>[0]) as Response;
      const body = (await response.json()) as Record<string, unknown>;

      expect(body.timestamp).toBeDefined();
      expect(() => new Date(body.timestamp as string)).not.toThrow();
    });
  });
});
