import { describe, it, expect } from 'vitest';
import { parseAnnotations } from '@cli/eject.mjs';
import { join } from 'node:path';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const SRC_DIR = join(__dirname, '../../src');

describe('parseAnnotations', () => {
    describe('real source files', () => {
        it('should parse BaseLayout annotations correctly', () => {
            const result = parseAnnotations(
                join(SRC_DIR, 'layouts/BaseLayout.astro'),
            );

            expect(result).not.toBeNull();
            expect(result!.alias).toBe('CoreBaseLayout');
            expect(result!.corePath).toBe(
                '@community-rss/core/layouts/BaseLayout.astro',
            );
            expect(result!.hasUnnamedSlot).toBe(true);

            const slotNames = result!.slots.map(
                (s: { name: string }) => s.name,
            );
            expect(slotNames).toContain('head');
            expect(slotNames).toContain('header');
            expect(slotNames).toContain('below-header');
            expect(slotNames).toContain('before-unnamed-slot');
            expect(slotNames).toContain('after-unnamed-slot');
            expect(slotNames).toContain('footer');
        });

        it('should parse FeedCard annotations correctly', () => {
            const result = parseAnnotations(
                join(SRC_DIR, 'components/FeedCard.astro'),
            );

            expect(result).not.toBeNull();
            expect(result!.alias).toBe('CoreFeedCard');
            expect(result!.corePath).toBe(
                '@community-rss/core/components/FeedCard.astro',
            );
        });

        it('should parse page annotations with dependencies', () => {
            const result = parseAnnotations(
                join(SRC_DIR, 'pages/index.astro'),
            );

            expect(result).not.toBeNull();
            expect(result!.alias).toBe('CoreIndex');
            expect(result!.dependencies.length).toBeGreaterThan(0);
            expect(result!.dependencies).toContain('layouts/BaseLayout');
        });

        it('should parse nested auth page annotations', () => {
            const result = parseAnnotations(
                join(SRC_DIR, 'pages/auth/signin.astro'),
            );

            expect(result).not.toBeNull();
            expect(result!.alias).toBe('CoreSignin');
            expect(result!.corePath).toBe(
                '@community-rss/core/pages/auth/signin.astro',
            );
        });

        it('should detect additional imports on slots', () => {
            const result = parseAnnotations(
                join(SRC_DIR, 'layouts/BaseLayout.astro'),
            );

            expect(result).not.toBeNull();
            const headerSlot = result!.slots.find(
                (s: { name: string }) => s.name === 'header',
            );
            expect(headerSlot).toBeDefined();
            expect(headerSlot!.additionalImports.length).toBeGreaterThan(0);
            expect(headerSlot!.additionalImports[0].name).toBe('AuthButton');
            expect(headerSlot!.additionalImports[0].from).toBe(
                '@crss-lookup/components/AuthButton.astro',
            );
        });

        it('should extract slot descriptions', () => {
            const result = parseAnnotations(
                join(SRC_DIR, 'layouts/BaseLayout.astro'),
            );

            expect(result).not.toBeNull();
            const headSlot = result!.slots.find(
                (s: { name: string }) => s.name === 'head',
            );
            expect(headSlot).toBeDefined();
            expect(headSlot!.description).toBeTruthy();
            expect(headSlot!.description.length).toBeGreaterThan(0);
        });

        it('should handle self-closing slots with empty default content', () => {
            const result = parseAnnotations(
                join(SRC_DIR, 'layouts/BaseLayout.astro'),
            );

            expect(result).not.toBeNull();
            const headSlot = result!.slots.find(
                (s: { name: string }) => s.name === 'head',
            );
            expect(headSlot).toBeDefined();
            // Self-closing slot should have empty default content
            expect(headSlot!.defaultContent).toBe('');
        });

        it('should handle block-form slots with default content', () => {
            const result = parseAnnotations(
                join(SRC_DIR, 'layouts/BaseLayout.astro'),
            );

            expect(result).not.toBeNull();
            const headerSlot = result!.slots.find(
                (s: { name: string }) => s.name === 'header',
            );
            expect(headerSlot).toBeDefined();
            // Block-form slot should have non-empty default content
            expect(headerSlot!.defaultContent.length).toBeGreaterThan(0);
        });
    });

    describe('synthetic files', () => {
        let tempDir: string;

        beforeEach(() => {
            tempDir = mkdtempSync(join(tmpdir(), 'crss-parse-'));
        });

        afterEach(() => {
            rmSync(tempDir, { recursive: true, force: true });
        });

        it('should return null for files without @eject-module', () => {
            const filePath = join(tempDir, 'NoAnnotation.astro');
            writeFileSync(
                filePath,
                '---\nimport Foo from "./Foo.astro";\n---\n<div>Hello</div>',
            );

            expect(parseAnnotations(filePath)).toBeNull();
        });

        it('should return null for files without frontmatter', () => {
            const filePath = join(tempDir, 'NoFrontmatter.astro');
            writeFileSync(filePath, '<div>No frontmatter</div>');

            expect(parseAnnotations(filePath)).toBeNull();
        });

        it('should parse multiple @eject-dependency annotations', () => {
            const filePath = join(tempDir, 'MultiDep.astro');
            writeFileSync(
                filePath,
                `---
/*
 * @eject-module
 * @alias CoreMultiDep
 * @eject-dependency layouts/BaseLayout
 * @eject-dependency components/AuthButton
 * @eject-dependency components/FeedCard
 */
---
<div>Content</div>`,
            );

            const result = parseAnnotations(filePath);
            expect(result).not.toBeNull();
            expect(result!.dependencies).toEqual([
                'layouts/BaseLayout',
                'components/AuthButton',
                'components/FeedCard',
            ]);
        });

        it('should parse multiple @additionalimport pairs on a slot', () => {
            const filePath = join(tempDir, 'MultiImport.astro');
            writeFileSync(
                filePath,
                `---
/*
 * @eject-module
 * @alias CoreMultiImport
 */
---
{/* @eject-slot
    @description A slot needing multiple imports.
    @additionalimport1 CompA
    @importfrom1 @community-rss/core/components/CompA.astro
    @additionalimport2 CompB
    @importfrom2 @community-rss/core/components/CompB.astro */}
<slot name="multi">Default</slot>`,
            );

            const result = parseAnnotations(filePath);
            expect(result).not.toBeNull();
            expect(result!.slots).toHaveLength(1);
            expect(result!.slots[0].additionalImports).toEqual([
                {
                    name: 'CompA',
                    from: '@community-rss/core/components/CompA.astro',
                },
                {
                    name: 'CompB',
                    from: '@community-rss/core/components/CompB.astro',
                },
            ]);
        });

        it('should detect unnamed slot correctly', () => {
            const filePath = join(tempDir, 'Unnamed.astro');
            writeFileSync(
                filePath,
                `---
/*
 * @eject-module
 * @alias CoreUnnamed
 */
---
{/* @eject-slot
    @description A named slot. */}
<slot name="header" />
<slot />`,
            );

            const result = parseAnnotations(filePath);
            expect(result).not.toBeNull();
            expect(result!.hasUnnamedSlot).toBe(true);
            expect(result!.slots).toHaveLength(1);
            expect(result!.slots[0].name).toBe('header');
        });

        it('should not detect unnamed slot when only named slots exist', () => {
            const filePath = join(tempDir, 'NamedOnly.astro');
            writeFileSync(
                filePath,
                `---
/*
 * @eject-module
 * @alias CoreNamedOnly
 */
---
{/* @eject-slot
    @description A named slot. */}
<slot name="header" />`,
            );

            const result = parseAnnotations(filePath);
            expect(result).not.toBeNull();
            expect(result!.hasUnnamedSlot).toBe(false);
        });
    });
});

// Need to import beforeEach and afterEach
import { beforeEach, afterEach } from 'vitest';
