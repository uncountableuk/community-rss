import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    eject,
    generateComponentProxy,
    generateLayoutProxy,
    parseEjectedFile,
    mergeSlotContent,
} from '@cli/eject.mjs';
import {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Re-eject (merge) logic', () => {
    describe('parseEjectedFile', () => {
        it('should detect uncommented Fragment slot overrides', () => {
            const content = `---
import CoreFeedCard from '@community-rss/core/components/FeedCard.astro';
const props = Astro.props;
---

<CoreFeedCard {...props}>
  <Fragment slot="before-unnamed-slot">
    <p>Custom content</p>
  </Fragment>

  <slot />
</CoreFeedCard>

<style>
  /* Add your custom styles here */
</style>
`;
            const parsed = parseEjectedFile(content);
            expect(parsed.activeSlots.size).toBe(1);
            expect(parsed.activeSlots.has('before-unnamed-slot')).toBe(true);
            expect(parsed.activeSlots.get('before-unnamed-slot')).toContain(
                'Custom content',
            );
        });

        it('should not detect commented Fragment blocks as active', () => {
            const proxy = generateComponentProxy('FeedCard');
            const parsed = parseEjectedFile(proxy);
            expect(parsed.activeSlots.size).toBe(0);
        });

        it('should detect custom style content', () => {
            const content = `---
import CoreFeedCard from '@community-rss/core/components/FeedCard.astro';
const props = Astro.props;
---

<CoreFeedCard {...props}>
  <slot />
</CoreFeedCard>

<style>
  .my-card { color: red; }
</style>
`;
            const parsed = parseEjectedFile(content);
            expect(parsed.styleContent).toContain('.my-card { color: red; }');
        });

        it('should ignore default style placeholder', () => {
            const proxy = generateComponentProxy('FeedCard');
            const parsed = parseEjectedFile(proxy);
            expect(parsed.styleContent).toBe('');
        });

        it('should detect developer-added imports', () => {
            const content = `---
import CoreFeedCard from '@community-rss/core/components/FeedCard.astro';
import MyHelper from '../utils/helper.ts';
const props = Astro.props;
---

<CoreFeedCard {...props}>
  <slot />
</CoreFeedCard>

<style>
  /* Add your custom styles here */
</style>
`;
            const parsed = parseEjectedFile(content);
            expect(parsed.extraImports).toHaveLength(1);
            expect(parsed.extraImports[0]).toContain('MyHelper');
        });

        it('should not detect core imports as extra', () => {
            const proxy = generateComponentProxy('FeedCard');
            const parsed = parseEjectedFile(proxy);
            expect(parsed.extraImports).toHaveLength(0);
        });

        it('should handle multiple active slots', () => {
            const content = `---
import CoreBaseLayout from '@community-rss/core/layouts/BaseLayout.astro';
const props = Astro.props;
---

<CoreBaseLayout {...props}>
  <Fragment slot="header">
    <nav>Custom Nav</nav>
  </Fragment>

  <Fragment slot="footer">
    <footer>Custom Footer</footer>
  </Fragment>

  <slot />
</CoreBaseLayout>

<style>
  /* Add your custom styles here */
</style>
`;
            const parsed = parseEjectedFile(content);
            expect(parsed.activeSlots.size).toBe(2);
            expect(parsed.activeSlots.has('header')).toBe(true);
            expect(parsed.activeSlots.has('footer')).toBe(true);
        });
    });

    describe('mergeSlotContent', () => {
        it('should replace commented block with active slot content', () => {
            const fresh = generateComponentProxy('FeedCard');
            const parsed = {
                activeSlots: new Map([
                    [
                        'before-unnamed-slot',
                        '<Fragment slot="before-unnamed-slot">\n    <p>Custom</p>\n  </Fragment>',
                    ],
                ]),
                styleContent: '',
                extraImports: [],
            };
            const merged = mergeSlotContent(fresh, parsed);

            // Active slot should be uncommented
            expect(merged).toContain('<Fragment slot="before-unnamed-slot">');
            expect(merged).toContain('<p>Custom</p>');
            // Other slots should still be commented
            expect(merged).toContain('SLOT: after-unnamed-slot');
            expect(merged).toContain('<Fragment slot="after-unnamed-slot">');
        });

        it('should preserve custom style content', () => {
            const fresh = generateLayoutProxy('BaseLayout');
            const parsed = {
                activeSlots: new Map(),
                styleContent: '\n  .custom { font-size: 2rem; }\n',
                extraImports: [],
            };
            const merged = mergeSlotContent(fresh, parsed);
            expect(merged).toContain('.custom { font-size: 2rem; }');
            expect(merged).not.toContain('Add your custom styles here');
        });

        it('should preserve extra imports', () => {
            const fresh = generateComponentProxy('FeedCard');
            const parsed = {
                activeSlots: new Map(),
                styleContent: '',
                extraImports: ['import MyHelper from "../utils/helper.ts";'],
            };
            const merged = mergeSlotContent(fresh, parsed);
            expect(merged).toContain('import MyHelper from "../utils/helper.ts"');
        });

        it('should always retain the default <slot />', () => {
            const fresh = generateComponentProxy('FeedCard');
            const parsed = {
                activeSlots: new Map([
                    [
                        'before-unnamed-slot',
                        '<Fragment slot="before-unnamed-slot"><p>X</p></Fragment>',
                    ],
                ]),
                styleContent: '.x { color: red; }',
                extraImports: [],
            };
            const merged = mergeSlotContent(fresh, parsed);
            expect(merged).toContain('<slot />');
        });

        it('should uncomment required additional imports when slots are active', () => {
            // Test with BaseLayout which has AuthButton as an additional import
            // required by the header slot
            const fresh = generateLayoutProxy('BaseLayout');
            const parsed = {
                activeSlots: new Map([
                    [
                        'header',
                        '<Fragment slot="header">\n    <header><AuthButton /></header>\n  </Fragment>',
                    ],
                ]),
                styleContent: '',
                extraImports: [],
            };
            const merged = mergeSlotContent(fresh, parsed);

            // AuthButton import should be present (always live in annotation-driven system)
            expect(merged).toContain('import AuthButton from \'@crss-lookup/components/AuthButton.astro\';');
            // Should not have the commented version
            expect(merged).not.toContain('// import AuthButton from \'@crss-lookup/components/AuthButton.astro\';');
            // Active header slot should be preserved
            expect(merged).toContain('<Fragment slot="header">');
            expect(merged).toContain('<AuthButton />');
        });

        it('should always include additional imports (unconditional in annotation-driven system)', () => {
            // In the new annotation-driven system, all additional imports
            // are always included live — they are never commented out.
            const fresh = generateLayoutProxy('BaseLayout');
            const parsed = {
                activeSlots: new Map([
                    [
                        'footer',
                        '<Fragment slot="footer"><footer>Custom</footer></Fragment>',
                    ],
                ]),
                styleContent: '',
                extraImports: [],
            };
            const merged = mergeSlotContent(fresh, parsed);

            // AuthButton import should always be present (unconditional)
            expect(merged).toContain('import AuthButton from \'@crss-lookup/components/AuthButton.astro\';');
            // Footer should be preserved
            expect(merged).toContain('<Fragment slot="footer">');
        });
    });

    describe('eject() re-eject behavior', () => {
        let tempDir: string;

        beforeEach(() => {
            tempDir = mkdtempSync(join(tmpdir(), 'crss-reeject-'));
            writeFileSync(join(tempDir, 'package.json'), '{}');
        });

        afterEach(() => {
            rmSync(tempDir, { recursive: true, force: true });
        });

        it('should re-eject when file exists with SLOT: markers (preserving customizations)', () => {
            // First eject
            eject({ target: 'components/FeedCard', cwd: tempDir });

            // Modify the file — uncomment a slot by replacing the commented block with an active fragment
            const filePath = join(tempDir, 'src/components/FeedCard.astro');
            let content = readFileSync(filePath, 'utf-8');
            content = content.replace(
                /\{\/\*[\s\S]*?SLOT: before-unnamed-slot[\s\S]*?<\/Fragment>\s*\*\/\}/,
                '<Fragment slot="before-unnamed-slot">\n    <p>My Override</p>\n  </Fragment>',
            );
            writeFileSync(filePath, content);

            // Re-eject without --force — should merge (re-eject)
            const { created, messages } = eject({
                target: 'components/FeedCard',
                cwd: tempDir,
            });

            // File should be in created (re-ejected), not skipped
            expect(created).toContain('src/components/FeedCard.astro');
            expect(messages.some((m: string) => m.includes('Re-ejected'))).toBe(true);

            // Developer override should be preserved
            const finalContent = readFileSync(filePath, 'utf-8');
            expect(finalContent).toContain('<p>My Override</p>');
            expect(finalContent).toContain('<Fragment slot="before-unnamed-slot">');
            // Managed imports should be present
            expect(finalContent).toContain('@start-eject-import');
            expect(finalContent).toContain('@end-eject-import');
        });

        it('should skip when file exists without SLOT: markers', () => {
            mkdirSync(join(tempDir, 'src/components'), { recursive: true });
            writeFileSync(
                join(tempDir, 'src/components/FeedCard.astro'),
                '<div>Legacy content</div>',
            );

            const { skipped } = eject({
                target: 'components/FeedCard',
                cwd: tempDir,
            });

            expect(skipped).toContain('src/components/FeedCard.astro');

            // Content unchanged
            const content = readFileSync(
                join(tempDir, 'src/components/FeedCard.astro'),
                'utf-8',
            );
            expect(content).toBe('<div>Legacy content</div>');
        });

        it('should overwrite with --force even with active customizations', () => {
            // First eject
            eject({ target: 'components/FeedCard', cwd: tempDir });

            // Modify
            const filePath = join(tempDir, 'src/components/FeedCard.astro');
            let content = readFileSync(filePath, 'utf-8');
            content = content.replace(
                /\{\/\*[\s\S]*?SLOT: before-unnamed-slot[\s\S]*?<\/Fragment>\s*\*\/\}/,
                '<Fragment slot="before-unnamed-slot">\n    <p>My Override</p>\n  </Fragment>',
            );
            writeFileSync(filePath, content);

            // Force eject
            eject({ target: 'components/FeedCard', cwd: tempDir, force: true });

            // Should be a fresh proxy with no active overrides
            const fresh = readFileSync(filePath, 'utf-8');
            expect(fresh).not.toContain('<p>My Override</p>');
            expect(fresh).toContain(
                '<Fragment slot="before-unnamed-slot">',
            );
        });
    });
});
