import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { eject, ejectAll, discoverComponents, discoverLayouts, discoverPages } from '@cli/eject.mjs';
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

        for (const layout of discoverLayouts()) {
            expect(created).toContain(`src/layouts/${layout}.astro`);
        }
    });

    it('should eject all known components', () => {
        const { created } = ejectAll({ cwd: tempDir });

        for (const comp of discoverComponents()) {
            expect(created).toContain(`src/components/${comp}.astro`);
        }
    });

    it('should eject all known pages', () => {
        const { created } = ejectAll({ cwd: tempDir });

        for (const page of discoverPages()) {
            expect(created).toContain(`src/pages/${page}.astro`);
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

    it('should re-eject already-ejected files without --force (preserving customizations)', () => {
        // First eject all
        ejectAll({ cwd: tempDir });

        // Customize a file
        const filePath = join(tempDir, 'src/components/FeedCard.astro');
        let content = readFileSync(filePath, 'utf-8');
        content = content.replace(
            /\{\/\*[\s\S]*?SLOT: before-unnamed-slot[\s\S]*?<\/Fragment>\s*\*\/\}/,
            '<Fragment slot="before-unnamed-slot">\n    <p>My Override</p>\n  </Fragment>',
        );
        writeFileSync(filePath, content);

        // Eject all again without force — should re-eject, not skip
        const { created, messages } = ejectAll({ cwd: tempDir, force: false });

        // File should be re-ejected (in created, not skipped)
        expect(created).toContain('src/components/FeedCard.astro');

        // Developer customization should be preserved
        const finalContent = readFileSync(filePath, 'utf-8');
        expect(finalContent).toContain('<p>My Override</p>');
        expect(finalContent).toContain('<Fragment slot="before-unnamed-slot">');
        // Managed imports should be refreshed
        expect(finalContent).toContain('@start-eject-import');
    });
});
