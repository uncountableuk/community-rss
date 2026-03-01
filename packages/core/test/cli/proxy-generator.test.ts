import { describe, it, expect } from 'vitest';
import {
    generateProxy,
    generateComponentProxy,
    generateLayoutProxy,
    generatePageProxy,
    parseAnnotations,
    discoverComponents,
    discoverLayouts,
    discoverPages,
} from '@cli/eject.mjs';
import { join } from 'node:path';

const SRC_DIR = join(__dirname, '../../src');

describe('generateProxy', () => {
    describe('import markers', () => {
        it('should include @start-eject-import and @end-eject-import markers', () => {
            const proxy = generateComponentProxy('FeedCard');
            expect(proxy).toContain('@start-eject-import');
            expect(proxy).toContain('@end-eject-import');
        });

        it('should have managed block in correct order', () => {
            const proxy = generateComponentProxy('FeedCard');
            const startIdx = proxy.indexOf('@start-eject-import');
            const endIdx = proxy.indexOf('@end-eject-import');
            expect(startIdx).toBeLessThan(endIdx);
        });

        it('should include core import inside managed block', () => {
            const proxy = generateComponentProxy('FeedCard');
            const startIdx = proxy.indexOf('@start-eject-import');
            const endIdx = proxy.indexOf('@end-eject-import');
            const importIdx = proxy.indexOf(
                "import CoreFeedCard from '@community-rss/core/components/FeedCard.astro'",
            );
            expect(importIdx).toBeGreaterThan(startIdx);
            expect(importIdx).toBeLessThan(endIdx);
        });
    });

    describe('additional imports', () => {
        it('should include additional imports unconditionally for BaseLayout', () => {
            const proxy = generateLayoutProxy('BaseLayout');
            expect(proxy).toContain(
                "import AuthButton from '@community-rss/core/components/AuthButton.astro'",
            );
        });

        it('should include additional imports for pages with component slots', () => {
            const proxy = generatePageProxy('index');
            // The homepage should have imports for components used in slot defaults
            const annotations = parseAnnotations(
                join(SRC_DIR, 'pages/index.astro'),
            );
            if (annotations) {
                const allImports = annotations.slots.flatMap(
                    (s: { additionalImports: { name: string }[] }) =>
                        s.additionalImports.map((i) => i.name),
                );
                for (const name of allImports) {
                    expect(proxy).toContain(`import ${name}`);
                }
            }
        });
    });

    describe('slot blocks', () => {
        it('should include SLOT: markers for all named slots', () => {
            const proxy = generateLayoutProxy('BaseLayout');
            expect(proxy).toContain('SLOT: head');
            expect(proxy).toContain('SLOT: header');
            expect(proxy).toContain('SLOT: below-header');
            expect(proxy).toContain('SLOT: before-unnamed-slot');
            expect(proxy).toContain('SLOT: after-unnamed-slot');
            expect(proxy).toContain('SLOT: footer');
        });

        it('should include commented Fragment blocks for each slot', () => {
            const proxy = generateLayoutProxy('BaseLayout');
            expect(proxy).toContain('{/* <Fragment slot="head">');
            expect(proxy).toContain('{/* <Fragment slot="header">');
            expect(proxy).toContain('{/* <Fragment slot="footer">');
        });

        it('should include slot descriptions', () => {
            const proxy = generateLayoutProxy('BaseLayout');
            // The header slot should have its description
            const annotations = parseAnnotations(
                join(SRC_DIR, 'layouts/BaseLayout.astro'),
            );
            const headerSlot = annotations!.slots.find(
                (s: { name: string }) => s.name === 'header',
            );
            expect(proxy).toContain(headerSlot!.description);
        });

        it('should include default content in block-form slots', () => {
            const proxy = generateLayoutProxy('BaseLayout');
            // Header slot should show default header content
            const annotations = parseAnnotations(
                join(SRC_DIR, 'layouts/BaseLayout.astro'),
            );
            const headerSlot = annotations!.slots.find(
                (s: { name: string }) => s.name === 'header',
            );
            if (headerSlot!.defaultContent) {
                // Default content should appear somewhere in the proxy
                const firstLine = headerSlot!.defaultContent.split('\n')[0].trim();
                if (firstLine) {
                    expect(proxy).toContain(firstLine);
                }
            }
        });
    });

    describe('unnamed slot passthrough', () => {
        it('should include <slot /> for components/layouts with unnamed slot', () => {
            const proxy = generateLayoutProxy('BaseLayout');
            expect(proxy).toContain('<slot />');
        });

        it('should include <slot /> for FeedCard proxy', () => {
            const proxy = generateComponentProxy('FeedCard');
            const annotations = parseAnnotations(
                join(SRC_DIR, 'components/FeedCard.astro'),
            );
            if (annotations!.hasUnnamedSlot) {
                expect(proxy).toContain('<slot />');
            }
        });
    });

    describe('style block', () => {
        it('should include an empty style block', () => {
            const proxy = generateComponentProxy('FeedCard');
            expect(proxy).toContain('<style>');
            expect(proxy).toContain('/* Add your custom styles here */');
            expect(proxy).toContain('</style>');
        });
    });

    describe('frontmatter structure', () => {
        it('should include JSDoc comment with component name', () => {
            const proxy = generateComponentProxy('FeedCard');
            expect(proxy).toContain('FeedCard proxy wrapper');
        });

        it('should include props definition when present', () => {
            const proxy = generateLayoutProxy('BaseLayout');
            // BaseLayout has a Props interface
            const annotations = parseAnnotations(
                join(SRC_DIR, 'layouts/BaseLayout.astro'),
            );
            if (annotations!.propsDefinition) {
                expect(proxy).toContain('const props = Astro.props;');
            }
        });

        it('should wrap core component with spread props', () => {
            const proxy = generateComponentProxy('FeedCard');
            expect(proxy).toContain('<CoreFeedCard {...props}>');
            expect(proxy).toContain('</CoreFeedCard>');
        });
    });

    describe('error handling', () => {
        it('should throw when annotations are null', () => {
            expect(() => generateProxy(null as any, 'components/Foo')).toThrow(
                'No annotations found',
            );
        });
    });

    describe('convenience functions', () => {
        it('generateComponentProxy should work for all discovered components', () => {
            for (const name of discoverComponents()) {
                const proxy = generateComponentProxy(name);
                expect(proxy).toContain('@start-eject-import');
                expect(proxy).toContain(`Core`);
            }
        });

        it('generateLayoutProxy should work for all discovered layouts', () => {
            for (const name of discoverLayouts()) {
                const proxy = generateLayoutProxy(name);
                expect(proxy).toContain('@start-eject-import');
            }
        });

        it('generatePageProxy should work for all discovered pages', () => {
            for (const name of discoverPages()) {
                const proxy = generatePageProxy(name);
                expect(proxy).toContain('@start-eject-import');
            }
        });
    });
});
