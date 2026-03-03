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
      expect(existsSync(join(tempDir, 'src/pages/README.md'))).toBe(true);
      expect(existsSync(join(tempDir, 'astro.config.mjs'))).toBe(true);
      expect(existsSync(join(tempDir, '.env.example'))).toBe(true);
      expect(existsSync(join(tempDir, 'docker-compose.yml'))).toBe(true);
      expect(existsSync(join(tempDir, 'src/styles/theme.css'))).toBe(true);

      // Pages are NOT scaffolded (they are injected by the integration)
      expect(existsSync(join(tempDir, 'src/pages/index.astro'))).toBe(false);
      expect(existsSync(join(tempDir, 'src/pages/profile.astro'))).toBe(false);
    });

    it('should create all 14 expected files', () => {
      const { created } = scaffold({ cwd: tempDir });

      expect(created).toHaveLength(14);
    });

    it('should create actions scaffold with coreActions spread', () => {
      scaffold({ cwd: tempDir });

      const actionsFile = readFileSync(
        join(tempDir, 'src/actions/index.ts'),
        'utf-8',
      );
      expect(actionsFile).toContain('@community-rss/core');
      expect(actionsFile).toContain('coreActions');
      expect(actionsFile).toContain('defineAction');
    });

    it('should create signpost READMEs instead of page/component files', () => {
      scaffold({ cwd: tempDir });

      // Signpost READMEs exist
      const pagesReadme = readFileSync(
        join(tempDir, 'src/pages/README.md'),
        'utf-8',
      );
      expect(pagesReadme).toContain('eject');
      expect(pagesReadme).toContain('Available Pages');

      const componentsReadme = readFileSync(
        join(tempDir, 'src/components/README.md'),
        'utf-8',
      );
      expect(componentsReadme).toContain('eject');
      expect(componentsReadme).toContain('Available Components');

      const layoutsReadme = readFileSync(
        join(tempDir, 'src/layouts/README.md'),
        'utf-8',
      );
      expect(layoutsReadme).toContain('eject');
      expect(layoutsReadme).toContain('BaseLayout');

      // Component proxies are NOT scaffolded
      expect(existsSync(join(tempDir, 'src/components/FeedCard.astro'))).toBe(false);
      expect(existsSync(join(tempDir, 'src/components/FeedGrid.astro'))).toBe(false);
      expect(existsSync(join(tempDir, 'src/components/TabBar.astro'))).toBe(false);
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

    it('should create page signpost README with correct content', () => {
      scaffold({ cwd: tempDir });

      const pagesReadme = readFileSync(
        join(tempDir, 'src/pages/README.md'),
        'utf-8',
      );
      expect(pagesReadme).toContain('index.astro');
      expect(pagesReadme).toContain('profile.astro');
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
        join(tempDir, 'src/pages/README.md'),
        'custom content',
      );

      const { created, skipped } = scaffold({ cwd: tempDir });

      expect(skipped).toContain('src/pages/README.md');
      expect(created).not.toContain('src/pages/README.md');

      // Verify original content preserved
      const content = readFileSync(
        join(tempDir, 'src/pages/README.md'),
        'utf-8',
      );
      expect(content).toBe('custom content');
    });

    it('should overwrite existing files with force=true', () => {
      // Pre-create a file
      mkdirSync(join(tempDir, 'src/pages'), { recursive: true });
      writeFileSync(
        join(tempDir, 'src/pages/README.md'),
        'custom content',
      );

      const { created, skipped } = scaffold({ cwd: tempDir, force: true });

      expect(created).toContain('src/pages/README.md');
      expect(skipped).toHaveLength(0);

      // Verify content was overwritten
      const content = readFileSync(
        join(tempDir, 'src/pages/README.md'),
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

      // Signpost READMEs create the directories
      expect(existsSync(join(tempDir, 'src/pages/README.md'))).toBe(true);
      expect(existsSync(join(tempDir, 'src/components/README.md'))).toBe(true);
      expect(existsSync(join(tempDir, 'src/layouts/README.md'))).toBe(true);
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
      expect(theme).toContain('LEVEL 1');
      expect(theme).toContain('LEVEL 2');
      expect(theme).toContain('.crss-feed-card');
      expect(theme).toContain('prefers-color-scheme: dark');
    });
  });
});
