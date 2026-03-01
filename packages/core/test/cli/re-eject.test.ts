import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    reEject,
    parseAnnotations,
    generateProxy,
    generateComponentProxy,
    generateLayoutProxy,
} from '@cli/eject.mjs';
import { join } from 'node:path';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const SRC_DIR = join(__dirname, '../../src');

describe('reEject', () => {
    describe('slot preservation', () => {
        it('should preserve active fragment overrides', () => {
            const fresh = generateComponentProxy('FeedCard');
            const annotations = parseAnnotations(
                join(SRC_DIR, 'components/FeedCard.astro'),
            );

            // Simulate an active slot override
            const modified = fresh.replace(
                /\{\/\*\s*<Fragment slot="before-unnamed-slot">[\s\S]*?<\/Fragment>\s*\*\/\}/,
                '<Fragment slot="before-unnamed-slot">\n    <p>My Custom Content</p>\n  </Fragment>',
            );

            const result = reEject(modified, annotations!, 'components/FeedCard');

            expect(result).toContain('<p>My Custom Content</p>');
            expect(result).toContain(
                '<Fragment slot="before-unnamed-slot">',
            );
        });

        it('should include SLOT: comment above active fragments', () => {
            const fresh = generateComponentProxy('FeedCard');
            const annotations = parseAnnotations(
                join(SRC_DIR, 'components/FeedCard.astro'),
            );

            const modified = fresh.replace(
                /\{\/\*\s*<Fragment slot="before-unnamed-slot">[\s\S]*?<\/Fragment>\s*\*\/\}/,
                '<Fragment slot="before-unnamed-slot">\n    <p>Override</p>\n  </Fragment>',
            );

            const result = reEject(modified, annotations!, 'components/FeedCard');

            // The SLOT: comment should appear before the active fragment
            const slotCommentIdx = result.indexOf(
                'SLOT: before-unnamed-slot',
            );
            const fragmentIdx = result.indexOf(
                '<Fragment slot="before-unnamed-slot">',
            );
            expect(slotCommentIdx).toBeGreaterThan(-1);
            expect(fragmentIdx).toBeGreaterThan(slotCommentIdx);
        });

        it('should keep commented blocks for inactive slots', () => {
            const fresh = generateLayoutProxy('BaseLayout');
            const annotations = parseAnnotations(
                join(SRC_DIR, 'layouts/BaseLayout.astro'),
            );

            // Only activate one slot, leave others commented
            const modified = fresh.replace(
                /\{\/\*\s*<Fragment slot="footer">[\s\S]*?<\/Fragment>\s*\*\/\}/,
                '<Fragment slot="footer"><footer>My Footer</footer></Fragment>',
            );

            const result = reEject(modified, annotations!, 'layouts/BaseLayout');

            // Active footer should be present
            expect(result).toContain('<footer>My Footer</footer>');

            // Other slots should remain as commented blocks
            expect(result).toContain('SLOT: head');
            expect(result).toContain('SLOT: header');
            expect(result).toContain('{/* <Fragment slot="head">');
        });
    });

    describe('orphan removal', () => {
        it('should remove live fragments for slots no longer in annotations', () => {
            // Create a synthetic annotation set with only one slot
            const annotations = {
                alias: 'CoreTest',
                dependencies: [],
                propsDefinition: '',
                slots: [
                    {
                        name: 'header',
                        description: 'The header slot.',
                        defaultContent: '',
                        additionalImports: [],
                    },
                ],
                hasUnnamedSlot: false,
                corePath: '@community-rss/core/components/Test.astro',
            };

            // Create a proxy with two active slots (one is now an orphan)
            const existingContent = `---
/**
 * Test proxy wrapper
 */
/*
 * @start-eject-import
 */
import CoreTest from '@community-rss/core/components/Test.astro';

const props = Astro.props;
/*
 * @end-eject-import
 */
---

<CoreTest {...props}>
  <Fragment slot="header"><h1>My Header</h1></Fragment>
  <Fragment slot="removed-slot"><p>This slot no longer exists</p></Fragment>
</CoreTest>

<style>
  /* Add your custom styles here */
</style>
`;

            const result = reEject(existingContent, annotations, 'components/Test');

            // Header should be preserved
            expect(result).toContain('<Fragment slot="header">');
            expect(result).toContain('<h1>My Header</h1>');

            // Removed slot should not be present
            expect(result).not.toContain('removed-slot');
            expect(result).not.toContain('This slot no longer exists');
        });
    });

    describe('new slot addition', () => {
        it('should add commented blocks for new slots', () => {
            const annotations = {
                alias: 'CoreTest',
                dependencies: [],
                propsDefinition: '',
                slots: [
                    {
                        name: 'header',
                        description: 'Existing header slot.',
                        defaultContent: '',
                        additionalImports: [],
                    },
                    {
                        name: 'new-slot',
                        description: 'A brand new slot added in update.',
                        defaultContent: '<p>New default</p>',
                        additionalImports: [],
                    },
                ],
                hasUnnamedSlot: false,
                corePath: '@community-rss/core/components/Test.astro',
            };

            const existingContent = `---
/**
 * Test proxy wrapper
 */
/*
 * @start-eject-import
 */
import CoreTest from '@community-rss/core/components/Test.astro';

const props = Astro.props;
/*
 * @end-eject-import
 */
---

<CoreTest {...props}>
  {/* =========================================
    SLOT: header
    Existing header slot.
    =========================================
  */}

  {/* <Fragment slot="header">
  </Fragment> */}
</CoreTest>

<style>
  /* Add your custom styles here */
</style>
`;

            const result = reEject(existingContent, annotations, 'components/Test');

            // Both slots should be present
            expect(result).toContain('SLOT: header');
            expect(result).toContain('SLOT: new-slot');
            expect(result).toContain('{/* <Fragment slot="new-slot">');
            expect(result).toContain('A brand new slot added in update.');
        });
    });

    describe('managed import block', () => {
        it('should regenerate the managed import block', () => {
            const fresh = generateComponentProxy('FeedCard');
            const annotations = parseAnnotations(
                join(SRC_DIR, 'components/FeedCard.astro'),
            );

            const result = reEject(fresh, annotations!, 'components/FeedCard');

            expect(result).toContain('@start-eject-import');
            expect(result).toContain('@end-eject-import');
            expect(result).toContain(
                "import CoreFeedCard from '@community-rss/core/components/FeedCard.astro'",
            );
        });

        it('should preserve developer imports outside managed block', () => {
            const fresh = generateComponentProxy('FeedCard');
            const annotations = parseAnnotations(
                join(SRC_DIR, 'components/FeedCard.astro'),
            );

            // Add a developer import after the managed block
            const withDevImport = fresh.replace(
                '@end-eject-import\n */',
                "@end-eject-import\n */\nimport MyHelper from '../utils/helper';",
            );

            const result = reEject(
                withDevImport,
                annotations!,
                'components/FeedCard',
            );

            expect(result).toContain("import MyHelper from '../utils/helper'");
        });
    });

    describe('style preservation', () => {
        it('should preserve developer style content', () => {
            const fresh = generateComponentProxy('FeedCard');
            const annotations = parseAnnotations(
                join(SRC_DIR, 'components/FeedCard.astro'),
            );

            const withStyles = fresh.replace(
                '/* Add your custom styles here */',
                '.my-override { color: red; }',
            );

            const result = reEject(withStyles, annotations!, 'components/FeedCard');

            expect(result).toContain('.my-override { color: red; }');
            expect(result).not.toContain('Add your custom styles here');
        });

        it('should keep default style placeholder when no customizations', () => {
            const fresh = generateComponentProxy('FeedCard');
            const annotations = parseAnnotations(
                join(SRC_DIR, 'components/FeedCard.astro'),
            );

            const result = reEject(fresh, annotations!, 'components/FeedCard');

            expect(result).toContain('Add your custom styles here');
        });
    });

    describe('force path', () => {
        it('should produce clean output identical to fresh proxy when no customizations', () => {
            const annotations = parseAnnotations(
                join(SRC_DIR, 'components/FeedCard.astro'),
            );
            const fresh = generateProxy(annotations!, 'components/FeedCard');

            // Force eject is just generateProxy — verify it has no active fragments
            expect(fresh).not.toMatch(
                /<Fragment slot="[^"]+">[\s\S]*?<\/Fragment>(?!\s*\*\/\})/,
            );
            expect(fresh).toContain('{/* <Fragment slot=');
        });
    });
});
