import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { scaffold } from '@cli/init.mjs';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('CLI scaffold', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'crss-cli-'));
    // Create a package.json so findProjectRoot succeeds
    writeFileSync(join(tempDir, 'package.json'), '{}');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('scaffold()', () => {
    it('should create all template files in an empty project', () => {
      const { created, skipped } = scaffold({ cwd: tempDir });

      expect(created.length).toBeGreaterThan(0);
      expect(skipped).toHaveLength(0);

      // Verify key files exist
      expect(existsSync(join(tempDir, 'src/pages/index.astro'))).toBe(true);
      expect(existsSync(join(tempDir, 'astro.config.mjs'))).toBe(true);
      expect(existsSync(join(tempDir, '.env.example'))).toBe(true);
      expect(existsSync(join(tempDir, 'docker-compose.yml'))).toBe(true);
      expect(existsSync(join(tempDir, 'src/styles/theme.css'))).toBe(true);
    });

    it('should create all 22 expected files', () => {
      const { created } = scaffold({ cwd: tempDir });

      expect(created).toHaveLength(22);
    });

    it('should create actions scaffold with handler imports', () => {
      scaffold({ cwd: tempDir });

      const actionsFile = readFileSync(
        join(tempDir, 'src/actions/index.ts'),
        'utf-8',
      );
      expect(actionsFile).toContain('@community-rss/core');
      expect(actionsFile).toContain('defineAction');
    });

    it('should create component proxy wrappers', () => {
      scaffold({ cwd: tempDir });

      const feedCard = readFileSync(
        join(tempDir, 'src/components/FeedCard.astro'),
        'utf-8',
      );
      expect(feedCard).toContain('@community-rss/core/components/FeedCard.astro');
      expect(feedCard).toContain('CoreFeedCard');

      expect(existsSync(join(tempDir, 'src/components/FeedGrid.astro'))).toBe(true);
      expect(existsSync(join(tempDir, 'src/components/TabBar.astro'))).toBe(true);
    });

    it('should create AI guidance files for both Copilot and Cursor', () => {
      scaffold({ cwd: tempDir });

      const copilotFile = readFileSync(
        join(tempDir, '.github/copilot-instructions.md'),
        'utf-8',
      );
      expect(copilotFile).toContain('Community RSS');
      expect(copilotFile).toContain('Protected Areas');
      expect(copilotFile).toContain('--crss-');

      const cursorFile = readFileSync(
        join(tempDir, '.cursor/rules/community-rss.mdc'),
        'utf-8',
      );
      expect(cursorFile).toContain('globs:');
      expect(cursorFile).toContain('Protected Areas');
    });

    it('should create page files with correct imports', () => {
      scaffold({ cwd: tempDir });

      const indexPage = readFileSync(
        join(tempDir, 'src/pages/index.astro'),
        'utf-8',
      );
      expect(indexPage).toContain('@community-rss/core');
    });

    it('should create Astro email templates with local layout import', () => {
      scaffold({ cwd: tempDir });

      const signIn = readFileSync(
        join(tempDir, 'src/email-templates/SignInEmail.astro'),
        'utf-8',
      );
      expect(signIn).toContain('./EmailLayout.astro');
      expect(signIn).toContain('theme');

      expect(existsSync(join(tempDir, 'src/email-templates/WelcomeEmail.astro'))).toBe(true);
      expect(existsSync(join(tempDir, 'src/email-templates/EmailChangeEmail.astro'))).toBe(true);
    });

    it('should scaffold EmailLayout.astro into email-templates', () => {
      scaffold({ cwd: tempDir });

      const layout = readFileSync(
        join(tempDir, 'src/email-templates/EmailLayout.astro'),
        'utf-8',
      );
      expect(layout).toContain('appName');
      expect(layout).toContain('theme');
      expect(layout).toContain('<slot />');
    });

    it('should create astro.config.mjs with node adapter and email theme comments', () => {
      scaffold({ cwd: tempDir });

      const config = readFileSync(
        join(tempDir, 'astro.config.mjs'),
        'utf-8',
      );
      expect(config).toContain("@astrojs/node");
      expect(config).toContain('communityRss');
      expect(config).toContain('// theme:');
    });

    it('should create .env.example with all required vars', () => {
      scaffold({ cwd: tempDir });

      const env = readFileSync(join(tempDir, '.env.example'), 'utf-8');
      expect(env).toContain('DATABASE_PATH');
      expect(env).toContain('FRESHRSS_URL');
      expect(env).toContain('PUBLIC_SITE_URL');
      expect(env).toContain('SMTP_HOST');
      expect(env).toContain('S3_ENDPOINT');
    });

    it('should skip existing files without --force', () => {
      // Pre-create a file
      mkdirSync(join(tempDir, 'src/pages'), { recursive: true });
      writeFileSync(
        join(tempDir, 'src/pages/index.astro'),
        'custom content',
      );

      const { created, skipped } = scaffold({ cwd: tempDir });

      expect(skipped).toContain('src/pages/index.astro');
      expect(created).not.toContain('src/pages/index.astro');

      // Verify original content preserved
      const content = readFileSync(
        join(tempDir, 'src/pages/index.astro'),
        'utf-8',
      );
      expect(content).toBe('custom content');
    });

    it('should overwrite existing files with force=true', () => {
      // Pre-create a file
      mkdirSync(join(tempDir, 'src/pages'), { recursive: true });
      writeFileSync(
        join(tempDir, 'src/pages/index.astro'),
        'custom content',
      );

      const { created, skipped } = scaffold({ cwd: tempDir, force: true });

      expect(created).toContain('src/pages/index.astro');
      expect(skipped).toHaveLength(0);

      // Verify content was overwritten
      const content = readFileSync(
        join(tempDir, 'src/pages/index.astro'),
        'utf-8',
      );
      expect(content).not.toBe('custom content');
    });

    it('should throw when no package.json found', () => {
      // Create a temp dir WITHOUT package.json
      const emptyDir = mkdtempSync(join(tmpdir(), 'crss-cli-empty-'));

      expect(() => scaffold({ cwd: emptyDir })).toThrow(
        'Could not find package.json',
      );

      rmSync(emptyDir, { recursive: true, force: true });
    });

    it('should create nested directory structures', () => {
      scaffold({ cwd: tempDir });

      expect(existsSync(join(tempDir, 'src/pages/auth/signin.astro'))).toBe(
        true,
      );
      expect(existsSync(join(tempDir, 'src/pages/article/[id].astro'))).toBe(
        true,
      );
      expect(
        existsSync(join(tempDir, 'src/email-templates/WelcomeEmail.astro')),
      ).toBe(true);
    });

    it('should create valid docker-compose.yml', () => {
      scaffold({ cwd: tempDir });

      const compose = readFileSync(
        join(tempDir, 'docker-compose.yml'),
        'utf-8',
      );
      expect(compose).toContain('freshrss');
      expect(compose).toContain('minio');
      expect(compose).toContain('mailpit');
    });

    it('should create theme.css with CSS custom property overrides', () => {
      scaffold({ cwd: tempDir });

      const theme = readFileSync(
        join(tempDir, 'src/styles/theme.css'),
        'utf-8',
      );
      expect(theme).toContain('--crss-');
    });
  });
});
