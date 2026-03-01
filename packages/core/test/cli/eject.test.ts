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
        it('should eject a page as a proxy wrapper', () => {
            const { created } = eject({ target: 'pages/profile', cwd: tempDir });

            expect(created).toContain('src/pages/profile.astro');

            const content = readFileSync(
                join(tempDir, 'src/pages/profile.astro'),
                'utf-8',
            );
            // Page proxy imports from core package
            expect(content).toContain('@community-rss/core/pages/profile.astro');
            expect(content).toContain('CoreProfile');
            // Has commented slot blocks
            expect(content).toContain('SLOT: content');
            expect(content).toContain('<slot />');
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

        it('should eject nested auth pages as proxy wrappers', () => {
            const { created } = eject({ target: 'pages/auth/signin', cwd: tempDir });

            expect(created).toContain('src/pages/auth/signin.astro');

            const content = readFileSync(
                join(tempDir, 'src/pages/auth/signin.astro'),
                'utf-8',
            );
            // Proxy imports from core, no depth-relative paths
            expect(content).toContain('@community-rss/core/pages/auth/signin.astro');
            expect(content).toContain('CoreSignin');
            expect(content).toContain('SLOT: content');
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
        it('should create a layout proxy with commented slot blocks', () => {
            const { created } = eject({ target: 'layouts/BaseLayout', cwd: tempDir });

            expect(created).toContain('src/layouts/BaseLayout.astro');

            const content = readFileSync(
                join(tempDir, 'src/layouts/BaseLayout.astro'),
                'utf-8',
            );
            expect(content).toContain('@community-rss/core/layouts/BaseLayout.astro');
            expect(content).toContain('<slot />');
            // All slots present as commented blocks with SLOT: markers
            expect(content).toContain('SLOT: head');
            expect(content).toContain('SLOT: header');
            expect(content).toContain('SLOT: below-header');
            expect(content).toContain('SLOT: before-unnamed-slot');
            expect(content).toContain('SLOT: after-unnamed-slot');
            expect(content).toContain('SLOT: footer');
            // All slot blocks are commented out by default
            expect(content).toContain('{/* <Fragment slot="header">');
            expect(content).toContain('{/* <Fragment slot="footer">');
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
