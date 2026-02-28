import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { eject } from '@cli/eject.mjs';
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

describe('CLI eject', () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'crss-eject-'));
        writeFileSync(join(tempDir, 'package.json'), '{}');
    });

    afterEach(() => {
        rmSync(tempDir, { recursive: true, force: true });
    });

    describe('eject pages', () => {
        it('should eject a page with rewritten imports', () => {
            const { created } = eject({ target: 'pages/profile', cwd: tempDir });

            expect(created).toContain('src/pages/profile.astro');

            const content = readFileSync(
                join(tempDir, 'src/pages/profile.astro'),
                'utf-8',
            );
            // Import should point to local layout, not package-internal path
            expect(content).toContain('../layouts/BaseLayout.astro');
            expect(content).not.toContain('@community-rss/core');
        });

        it('should auto-eject layout proxy when ejecting a page', () => {
            const { created, messages } = eject({ target: 'pages/profile', cwd: tempDir });

            expect(created).toContain('src/layouts/BaseLayout.astro');
            expect(messages.some((m: string) => m.includes('layout proxy'))).toBe(true);

            const layout = readFileSync(
                join(tempDir, 'src/layouts/BaseLayout.astro'),
                'utf-8',
            );
            expect(layout).toContain('@community-rss/core/layouts/BaseLayout.astro');
            expect(layout).toContain('<slot />');
        });

        it('should auto-eject component proxies for pages that import components', () => {
            const { created, messages } = eject({ target: 'pages/index', cwd: tempDir });

            expect(created).toContain('src/pages/index.astro');
            expect(created).toContain('src/layouts/BaseLayout.astro');
            expect(created).toContain('src/components/TabBar.astro');
            expect(created).toContain('src/components/FeedGrid.astro');
            expect(created).toContain('src/components/HomepageCTA.astro');

            expect(messages.some((m: string) => m.includes('component proxy'))).toBe(true);
        });

        it('should not auto-eject layout if it already exists', () => {
            mkdirSync(join(tempDir, 'src/layouts'), { recursive: true });
            writeFileSync(
                join(tempDir, 'src/layouts/BaseLayout.astro'),
                'custom layout',
            );

            const { created } = eject({ target: 'pages/profile', cwd: tempDir });

            expect(created).toContain('src/pages/profile.astro');
            expect(created).not.toContain('src/layouts/BaseLayout.astro');

            // Verify custom layout not overwritten
            const content = readFileSync(
                join(tempDir, 'src/layouts/BaseLayout.astro'),
                'utf-8',
            );
            expect(content).toBe('custom layout');
        });

        it('should eject nested auth pages with correct import depth', () => {
            const { created } = eject({ target: 'pages/auth/signin', cwd: tempDir });

            expect(created).toContain('src/pages/auth/signin.astro');

            const content = readFileSync(
                join(tempDir, 'src/pages/auth/signin.astro'),
                'utf-8',
            );
            expect(content).toContain('../../layouts/BaseLayout.astro');
            expect(content).toContain('../../components/MagicLinkForm.astro');
        });

        it('should throw for unknown page', () => {
            expect(() => eject({ target: 'pages/nonexistent', cwd: tempDir })).toThrow(
                'Unknown page',
            );
        });
    });

    describe('eject components', () => {
        it('should create a component proxy wrapper', () => {
            const { created } = eject({ target: 'components/FeedCard', cwd: tempDir });

            expect(created).toContain('src/components/FeedCard.astro');

            const content = readFileSync(
                join(tempDir, 'src/components/FeedCard.astro'),
                'utf-8',
            );
            expect(content).toContain('@community-rss/core/components/FeedCard.astro');
            expect(content).toContain('CoreFeedCard');
            expect(content).toContain('<slot />');
        });

        it('should throw for unknown component', () => {
            expect(() => eject({ target: 'components/NonExistent', cwd: tempDir })).toThrow(
                'Unknown component',
            );
        });
    });

    describe('eject layouts', () => {
        it('should create a layout proxy with slot passthrough', () => {
            const { created } = eject({ target: 'layouts/BaseLayout', cwd: tempDir });

            expect(created).toContain('src/layouts/BaseLayout.astro');

            const content = readFileSync(
                join(tempDir, 'src/layouts/BaseLayout.astro'),
                'utf-8',
            );
            expect(content).toContain('@community-rss/core/layouts/BaseLayout.astro');
            expect(content).toContain('slot name="head"');
            expect(content).toContain('slot name="header"');
            expect(content).toContain('slot name="footer"');
            expect(content).toContain('<slot />');
        });

        it('should throw for unknown layout', () => {
            expect(() => eject({ target: 'layouts/NonExistent', cwd: tempDir })).toThrow(
                'Unknown layout',
            );
        });
    });

    describe('eject actions', () => {
        it('should copy the actions scaffold template', () => {
            const { created } = eject({ target: 'actions', cwd: tempDir });

            expect(created).toContain('src/actions/index.ts');

            const content = readFileSync(
                join(tempDir, 'src/actions/index.ts'),
                'utf-8',
            );
            expect(content).toContain('@community-rss/core');
        });
    });

    describe('force and skip behavior', () => {
        it('should skip existing files without --force', () => {
            mkdirSync(join(tempDir, 'src/components'), { recursive: true });
            writeFileSync(
                join(tempDir, 'src/components/FeedCard.astro'),
                'custom content',
            );

            const { created, skipped } = eject({
                target: 'components/FeedCard',
                cwd: tempDir,
            });

            expect(skipped).toContain('src/components/FeedCard.astro');
            expect(created).toHaveLength(0);

            const content = readFileSync(
                join(tempDir, 'src/components/FeedCard.astro'),
                'utf-8',
            );
            expect(content).toBe('custom content');
        });

        it('should overwrite existing files with force=true', () => {
            mkdirSync(join(tempDir, 'src/components'), { recursive: true });
            writeFileSync(
                join(tempDir, 'src/components/FeedCard.astro'),
                'custom content',
            );

            const { created, skipped } = eject({
                target: 'components/FeedCard',
                cwd: tempDir,
                force: true,
            });

            expect(created).toContain('src/components/FeedCard.astro');
            expect(skipped).toHaveLength(0);
        });
    });

    describe('error handling', () => {
        it('should throw when no package.json found', () => {
            const emptyDir = mkdtempSync(join(tmpdir(), 'crss-eject-empty-'));

            expect(() => eject({ target: 'components/FeedCard', cwd: emptyDir })).toThrow(
                'Could not find package.json',
            );

            rmSync(emptyDir, { recursive: true, force: true });
        });

        it('should throw for unknown target category', () => {
            expect(() => eject({ target: 'unknown/thing', cwd: tempDir })).toThrow(
                'Unknown eject target',
            );
        });
    });
});
