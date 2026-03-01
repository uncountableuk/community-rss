import { describe, it, expect } from 'vitest';
import {
    SLOT_REGISTRY,
    KNOWN_COMPONENTS,
    KNOWN_LAYOUTS,
    PAGE_REGISTRY,
} from '@cli/slot-registry.mjs';

describe('Slot Registry', () => {
    describe('SLOT_REGISTRY', () => {
        it('should have entries for all components', () => {
            const componentKeys = Object.keys(SLOT_REGISTRY).filter((k) =>
                k.startsWith('components/'),
            );
            expect(componentKeys.length).toBeGreaterThanOrEqual(9);
        });

        it('should have entries for all layouts', () => {
            const layoutKeys = Object.keys(SLOT_REGISTRY).filter((k) =>
                k.startsWith('layouts/'),
            );
            expect(layoutKeys.length).toBeGreaterThanOrEqual(1);
        });

        it('should have entries for all pages', () => {
            const pageKeys = Object.keys(SLOT_REGISTRY).filter((k) =>
                k.startsWith('pages/'),
            );
            expect(pageKeys.length).toBeGreaterThanOrEqual(8);
        });

        it('should have valid corePath for each entry', () => {
            for (const [key, entry] of Object.entries(SLOT_REGISTRY)) {
                expect(entry.corePath).toContain('@community-rss/core/');
                expect(entry.corePath).toMatch(/\.astro$/);
            }
        });

        it('should have a valid alias for each entry', () => {
            for (const [key, entry] of Object.entries(SLOT_REGISTRY)) {
                expect(entry.alias).toMatch(/^Core[A-Z]/);
            }
        });

        it('should have at least one slot per entry', () => {
            for (const [key, entry] of Object.entries(SLOT_REGISTRY)) {
                expect(entry.slots.length).toBeGreaterThanOrEqual(1);
            }
        });

        it('should have unique slot names within each entry', () => {
            for (const [key, entry] of Object.entries(SLOT_REGISTRY)) {
                const names = entry.slots.map((s: { name: string }) => s.name);
                expect(new Set(names).size).toBe(names.length);
            }
        });

        it('should have exactly one default slot per entry', () => {
            for (const [key, entry] of Object.entries(SLOT_REGISTRY)) {
                const defaults = entry.slots.filter(
                    (s: { isDefault?: boolean }) => s.isDefault,
                );
                expect(defaults.length).toBe(1);
            }
        });

        it('should have valid slot types', () => {
            const validTypes = ['structural', 'extension', 'generic-wrapper', 'default'];
            for (const [key, entry] of Object.entries(SLOT_REGISTRY)) {
                for (const slot of entry.slots) {
                    expect(validTypes).toContain(slot.type);
                }
            }
        });

        it('should have descriptions for all named slots', () => {
            for (const [key, entry] of Object.entries(SLOT_REGISTRY)) {
                for (const slot of entry.slots) {
                    if (!slot.isDefault) {
                        expect(slot.description).toBeTruthy();
                    }
                }
            }
        });
    });

    describe('KNOWN_COMPONENTS', () => {
        it('should include expected components', () => {
            expect(KNOWN_COMPONENTS).toContain('AuthButton');
            expect(KNOWN_COMPONENTS).toContain('FeedCard');
            expect(KNOWN_COMPONENTS).toContain('FeedGrid');
            expect(KNOWN_COMPONENTS).toContain('TabBar');
            expect(KNOWN_COMPONENTS).toContain('ArticleModal');
            expect(KNOWN_COMPONENTS).toContain('MagicLinkForm');
            expect(KNOWN_COMPONENTS).toContain('SignUpForm');
            expect(KNOWN_COMPONENTS).toContain('ConsentModal');
            expect(KNOWN_COMPONENTS).toContain('HomepageCTA');
        });

        it('should be derived from SLOT_REGISTRY keys', () => {
            for (const name of KNOWN_COMPONENTS) {
                expect(SLOT_REGISTRY).toHaveProperty(`components/${name}`);
            }
        });
    });

    describe('KNOWN_LAYOUTS', () => {
        it('should include BaseLayout', () => {
            expect(KNOWN_LAYOUTS).toContain('BaseLayout');
        });

        it('should be derived from SLOT_REGISTRY keys', () => {
            for (const name of KNOWN_LAYOUTS) {
                expect(SLOT_REGISTRY).toHaveProperty(`layouts/${name}`);
            }
        });
    });

    describe('PAGE_REGISTRY', () => {
        it('should have entries for all pages', () => {
            const expectedPages = [
                'index',
                'profile',
                'terms',
                'article/[id]',
                'auth/signin',
                'auth/signup',
                'auth/verify',
                'auth/verify-email-change',
            ];
            for (const page of expectedPages) {
                expect(PAGE_REGISTRY).toHaveProperty(page);
            }
        });

        it('should have valid file paths', () => {
            for (const [name, info] of Object.entries(PAGE_REGISTRY)) {
                expect(info.file).toMatch(/^pages\/.*\.astro$/);
            }
        });

        it('should have layouts array', () => {
            for (const [name, info] of Object.entries(PAGE_REGISTRY)) {
                expect(Array.isArray(info.imports.layouts)).toBe(true);
            }
        });

        it('should have components array', () => {
            for (const [name, info] of Object.entries(PAGE_REGISTRY)) {
                expect(Array.isArray(info.imports.components)).toBe(true);
            }
        });

        it('should reference only known components', () => {
            for (const [name, info] of Object.entries(PAGE_REGISTRY)) {
                for (const comp of info.imports.components) {
                    expect(KNOWN_COMPONENTS).toContain(comp);
                }
            }
        });

        it('should reference only known layouts', () => {
            for (const [name, info] of Object.entries(PAGE_REGISTRY)) {
                for (const layout of info.imports.layouts) {
                    expect(KNOWN_LAYOUTS).toContain(layout);
                }
            }
        });
    });
});
