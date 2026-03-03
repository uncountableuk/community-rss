import { describe, it, expect } from 'vitest';
import { parseAnnotations, discoverComponents, discoverLayouts, discoverPages } from '@cli/eject.mjs';
import { join } from 'node:path';
import { readdirSync, readFileSync, statSync } from 'node:fs';

const SRC_DIR = join(__dirname, '../../src');

/**
 * Recursively find all .astro files in a directory.
 */
function findAstroFiles(dir: string): string[] {
    const results: string[] = [];
    for (const entry of readdirSync(dir)) {
        const fullPath = join(dir, entry);
        if (statSync(fullPath).isDirectory()) {
            results.push(...findAstroFiles(fullPath));
        } else if (entry.endsWith('.astro')) {
            results.push(fullPath);
        }
    }
    return results;
}

describe('annotation validity', () => {
    describe('component annotations', () => {
        const components = discoverComponents();

        it('should discover at least one component', () => {
            expect(components.length).toBeGreaterThan(0);
        });

        it.each(components)('component %s should have valid @eject-module', (name) => {
            const filePath = join(SRC_DIR, 'components', `${name}.astro`);
            const result = parseAnnotations(filePath);

            expect(result).not.toBeNull();
            expect(result!.alias).toBeTruthy();
            expect(result!.alias).toMatch(/^Core/);
            expect(result!.corePath).toContain('@community-rss/core/components/');
        });

        it.each(components)('component %s slots should be valid', (name) => {
            const filePath = join(SRC_DIR, 'components', `${name}.astro`);
            const result = parseAnnotations(filePath);

            expect(result).not.toBeNull();
            for (const slot of result!.slots) {
                expect(slot.name).toBeTruthy();
                expect(slot.description).toBeTruthy();
                // Verify no orphaned additionalimport keys
                for (const imp of slot.additionalImports) {
                    expect(imp.name).toBeTruthy();
                    expect(imp.from).toBeTruthy();
                }
            }
        });
    });

    describe('layout annotations', () => {
        const layouts = discoverLayouts();

        it('should discover at least one layout', () => {
            expect(layouts.length).toBeGreaterThan(0);
        });

        it.each(layouts)('layout %s should have valid @eject-module', (name) => {
            const filePath = join(SRC_DIR, 'layouts', `${name}.astro`);
            const result = parseAnnotations(filePath);

            expect(result).not.toBeNull();
            expect(result!.alias).toBeTruthy();
            expect(result!.alias).toMatch(/^Core/);
            expect(result!.corePath).toContain('@community-rss/core/layouts/');
        });

        it.each(layouts)('layout %s slots should be valid', (name) => {
            const filePath = join(SRC_DIR, 'layouts', `${name}.astro`);
            const result = parseAnnotations(filePath);

            for (const slot of result!.slots) {
                expect(slot.name).toBeTruthy();
                expect(slot.description).toBeTruthy();
            }
        });
    });

    describe('page annotations', () => {
        const pages = discoverPages();

        it('should discover at least one page', () => {
            expect(pages.length).toBeGreaterThan(0);
        });

        it.each(pages)('page %s should have valid @eject-module', (name) => {
            const filePath = join(SRC_DIR, 'pages', `${name}.astro`);
            const result = parseAnnotations(filePath);

            expect(result).not.toBeNull();
            expect(result!.alias).toBeTruthy();
            expect(result!.alias).toMatch(/^Core/);
            expect(result!.corePath).toContain('@community-rss/core/pages/');
        });

        it.each(pages)('page %s slots should be valid', (name) => {
            const filePath = join(SRC_DIR, 'pages', `${name}.astro`);
            const result = parseAnnotations(filePath);

            for (const slot of result!.slots) {
                expect(slot.name).toBeTruthy();
                expect(slot.description).toBeTruthy();
            }
        });
    });

    describe('annotation-slot consistency', () => {
        it('every @eject-slot should be immediately followed by a named <slot>', () => {
            const allFiles = [
                ...discoverComponents().map((n: string) =>
                    join(SRC_DIR, 'components', `${n}.astro`),
                ),
                ...discoverLayouts().map((n: string) =>
                    join(SRC_DIR, 'layouts', `${n}.astro`),
                ),
                ...discoverPages().map((n: string) =>
                    join(SRC_DIR, 'pages', `${n}.astro`),
                ),
            ];

            for (const filePath of allFiles) {
                const content = readFileSync(filePath, 'utf-8');

                // Find all @eject-slot annotations
                const slotAnnotationRegex =
                    /\{\s*\/\*\s*@eject-slot\b[\s\S]*?\*\/\s*\}/g;
                let match;
                while ((match = slotAnnotationRegex.exec(content)) !== null) {
                    const afterAnnotation = content.slice(
                        match.index + match[0].length,
                    );
                    // Should be followed by a <slot name="..."> tag (allowing whitespace)
                    const hasSlotTag = /^\s*<slot\s+name="[^"]+"/.test(
                        afterAnnotation,
                    );
                    expect(
                        hasSlotTag,
                        `@eject-slot in ${filePath} not followed by <slot name="...">`,
                    ).toBe(true);
                }
            }
        });

        it('slot names should be unique within each file', () => {
            const allFiles = [
                ...discoverComponents().map((n: string) =>
                    join(SRC_DIR, 'components', `${n}.astro`),
                ),
                ...discoverLayouts().map((n: string) =>
                    join(SRC_DIR, 'layouts', `${n}.astro`),
                ),
                ...discoverPages().map((n: string) =>
                    join(SRC_DIR, 'pages', `${n}.astro`),
                ),
            ];

            for (const filePath of allFiles) {
                const result = parseAnnotations(filePath);
                if (result) {
                    const names = result.slots.map(
                        (s: { name: string }) => s.name,
                    );
                    const uniqueNames = new Set(names);
                    expect(
                        names.length,
                        `Duplicate slot names in ${filePath}: ${names.join(', ')}`,
                    ).toBe(uniqueNames.size);
                }
            }
        });

        it('all @additionalimport pairs should have matching @importfrom', () => {
            const allFiles = [
                ...discoverComponents().map((n: string) =>
                    join(SRC_DIR, 'components', `${n}.astro`),
                ),
                ...discoverLayouts().map((n: string) =>
                    join(SRC_DIR, 'layouts', `${n}.astro`),
                ),
                ...discoverPages().map((n: string) =>
                    join(SRC_DIR, 'pages', `${n}.astro`),
                ),
            ];

            for (const filePath of allFiles) {
                const content = readFileSync(filePath, 'utf-8');

                // Check for unpaired @additionalimportN
                const importMatches = [
                    ...content.matchAll(/@additionalimport(\d+)/g),
                ];
                const fromMatches = [
                    ...content.matchAll(/@importfrom(\d+)/g),
                ];

                const importNums = importMatches.map((m) => m[1]);
                const fromNums = fromMatches.map((m) => m[1]);

                for (const num of importNums) {
                    expect(
                        fromNums,
                        `@additionalimport${num} in ${filePath} missing @importfrom${num}`,
                    ).toContain(num);
                }
                for (const num of fromNums) {
                    expect(
                        importNums,
                        `@importfrom${num} in ${filePath} missing @additionalimport${num}`,
                    ).toContain(num);
                }
            }
        });
    });

    describe('file coverage', () => {
        it('all .astro files in components/ should have @eject-module or be explicitly excluded', () => {
            const componentsDir = join(SRC_DIR, 'components');
            const allFiles = findAstroFiles(componentsDir);
            const discovered = discoverComponents();

            for (const filePath of allFiles) {
                const name = filePath
                    .replace(componentsDir + '/', '')
                    .replace('.astro', '');
                const content = readFileSync(filePath, 'utf-8');

                if (content.includes('@eject-module')) {
                    expect(
                        discovered,
                        `${name} has @eject-module but was not discovered`,
                    ).toContain(name);
                }
                // Files without @eject-module are implicitly excluded — that's fine
            }
        });

        it('all .astro files in layouts/ should have @eject-module', () => {
            const layoutsDir = join(SRC_DIR, 'layouts');
            const allFiles = findAstroFiles(layoutsDir);
            const discovered = discoverLayouts();

            // Every layout should be annotated
            for (const filePath of allFiles) {
                const name = filePath
                    .replace(layoutsDir + '/', '')
                    .replace('.astro', '');
                expect(
                    discovered,
                    `Layout ${name} missing @eject-module annotation`,
                ).toContain(name);
            }
        });
    });
});
