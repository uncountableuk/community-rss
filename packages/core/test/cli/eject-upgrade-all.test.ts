import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { eject, ejectUpgrade, ejectAll } from '@cli/eject.mjs';
import { KNOWN_COMPONENTS, KNOWN_LAYOUTS, PAGE_REGISTRY } from '@cli/slot-registry.mjs';
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

describe('eject upgrade', () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'crss-upgrade-'));
        writeFileSync(join(tempDir, 'package.json'), '{}');
    });

    afterEach(() => {
        rmSync(tempDir, { recursive: true, force: true });
    });

    it('should re-eject all existing ejected components', () => {
        // Eject two components
        eject({ target: 'components/FeedCard', cwd: tempDir });
        eject({ target: 'components/TabBar', cwd: tempDir });

        const { created } = ejectUpgrade({ cwd: tempDir });

        // Both should be re-ejected (they have SLOT: markers)
        expect(created).toContain('src/components/FeedCard.astro');
        expect(created).toContain('src/components/TabBar.astro');
    });

    it('should re-eject existing ejected layouts', () => {
        eject({ target: 'layouts/BaseLayout', cwd: tempDir });

        const { created } = ejectUpgrade({ cwd: tempDir });

        expect(created).toContain('src/layouts/BaseLayout.astro');
    });

    it('should re-eject existing ejected pages', () => {
        eject({ target: 'pages/profile', cwd: tempDir });

        const { created } = ejectUpgrade({ cwd: tempDir });

        expect(created).toContain('src/pages/profile.astro');
    });

    it('should not eject components that do not exist yet', () => {
        // Only eject FeedCard
        eject({ target: 'components/FeedCard', cwd: tempDir });

        const { created } = ejectUpgrade({ cwd: tempDir });

        // TabBar was not previously ejected — should not appear
        expect(created).not.toContain('src/components/TabBar.astro');
    });

    it('should preserve active slot customizations during upgrade', () => {
        // Eject and customize
        eject({ target: 'components/FeedCard', cwd: tempDir });
        const filePath = join(tempDir, 'src/components/FeedCard.astro');
        let content = readFileSync(filePath, 'utf-8');
        content = content.replace(
            '{/* <Fragment slot="before-unnamed-slot">\n  </Fragment> */}',
            '<Fragment slot="before-unnamed-slot">\n    <p>My Custom</p>\n  </Fragment>',
        );
        writeFileSync(filePath, content);

        // Upgrade
        ejectUpgrade({ cwd: tempDir });

        // Verify customization preserved
        const upgraded = readFileSync(filePath, 'utf-8');
        expect(upgraded).toContain('<p>My Custom</p>');
    });

    it('should skip legacy files without SLOT: markers', () => {
        mkdirSync(join(tempDir, 'src/components'), { recursive: true });
        writeFileSync(
            join(tempDir, 'src/components/FeedCard.astro'),
            '<div>Legacy</div>',
        );

        const { skipped } = ejectUpgrade({ cwd: tempDir });

        expect(skipped).toContain('src/components/FeedCard.astro');
    });
});

describe('eject all', () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'crss-eject-all-'));
        writeFileSync(join(tempDir, 'package.json'), '{}');
    });

    afterEach(() => {
        rmSync(tempDir, { recursive: true, force: true });
    });

    it('should eject all known layouts', () => {
        const { created } = ejectAll({ cwd: tempDir });

        for (const layout of KNOWN_LAYOUTS) {
            expect(created).toContain(`src/layouts/${layout}.astro`);
        }
    });

    it('should eject all known components', () => {
        const { created } = ejectAll({ cwd: tempDir });

        for (const comp of KNOWN_COMPONENTS) {
            expect(created).toContain(`src/components/${comp}.astro`);
        }
    });

    it('should eject all known pages', () => {
        const { created } = ejectAll({ cwd: tempDir });

        for (const [, info] of Object.entries(PAGE_REGISTRY)) {
            expect(created).toContain(`src/${info.file}`);
        }
    });

    it('should eject actions', () => {
        const { created } = ejectAll({ cwd: tempDir });

        expect(created).toContain('src/actions/index.ts');
    });

    it('should not duplicate auto-ejected layouts when ejecting all', () => {
        const { created } = ejectAll({ cwd: tempDir });

        // BaseLayout.astro should appear exactly once — from the explicit
        // layouts eject, NOT duplicated by page auto-eject
        const layoutEntries = created.filter(
            (f: string) => f === 'src/layouts/BaseLayout.astro',
        );
        expect(layoutEntries).toHaveLength(1);
    });

    it('should overwrite existing files with force', () => {
        // First eject
        ejectAll({ cwd: tempDir });

        // Modify a file
        const filePath = join(tempDir, 'src/components/FeedCard.astro');
        writeFileSync(filePath, '<div>Custom</div>');

        // Force eject all
        const { created } = ejectAll({ cwd: tempDir, force: true });

        // Should contain the file (overwritten)
        expect(created).toContain('src/components/FeedCard.astro');

        const content = readFileSync(filePath, 'utf-8');
        expect(content).toContain('CoreFeedCard');
    });
});
