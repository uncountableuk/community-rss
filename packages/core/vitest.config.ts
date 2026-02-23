import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    name: 'core',
    root: '.',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/db/migrations/**',
        'src/db/queries/**',
        'src/db/schema.ts',
        'src/types/models.ts',
        'src/workers/index.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@routes': path.resolve(__dirname, 'src/routes'),
      '@db': path.resolve(__dirname, 'src/db'),
      '@core-types': path.resolve(__dirname, 'src/types'),
      '@layouts': path.resolve(__dirname, 'src/layouts'),
      '@fixtures': path.resolve(__dirname, 'test/fixtures'),
      '@test': path.resolve(__dirname, 'test'),
    },
  },
});
