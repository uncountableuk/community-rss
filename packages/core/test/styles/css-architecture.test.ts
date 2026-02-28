import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const COMPONENTS_DIR = join(__dirname, '../../src/components');
const LAYOUTS_DIR = join(__dirname, '../../src/layouts');
const TOKENS_FILE = join(__dirname, '../../src/styles/tokens/components.css');

/**
 * Extract all --crss-comp-* token declarations from components.css
 */
function getDefinedTokens(): string[] {
  const css = readFileSync(TOKENS_FILE, 'utf-8');
  const matches = css.match(/--crss-comp-[\w-]+/g) || [];
  // Deduplicate (definitions only, not var() references)
  return [...new Set(matches)];
}

/**
 * Read all .astro component files and extract all var(--crss-comp-*) references
 */
function getConsumedTokens(): Set<string> {
  const consumed = new Set<string>();

  for (const dir of [COMPONENTS_DIR, LAYOUTS_DIR]) {
    const files = readdirSync(dir).filter((f) => f.endsWith('.astro'));
    for (const file of files) {
      const content = readFileSync(join(dir, file), 'utf-8');
      const matches = content.match(/var\(--crss-comp-[\w-]+/g) || [];
      for (const match of matches) {
        consumed.add(match.replace('var(', ''));
      }
    }
  }

  return consumed;
}

/**
 * Get all .astro files from components + layouts
 */
function getAllAstroFiles(): Array<{ name: string; content: string }> {
  const files: Array<{ name: string; content: string }> = [];

  for (const dir of [COMPONENTS_DIR, LAYOUTS_DIR]) {
    const entries = readdirSync(dir).filter((f) => f.endsWith('.astro'));
    for (const entry of entries) {
      files.push({
        name: entry,
        content: readFileSync(join(dir, entry), 'utf-8'),
      });
    }
  }

  return files;
}

describe('CSS Architecture', () => {
  describe('Cascade Layer Usage', () => {
    it('should wrap all component styles in @layer crss-components', () => {
      const files = getAllAstroFiles();
      expect(files.length).toBeGreaterThanOrEqual(10); // 9 components + 1 layout

      for (const { name, content } of files) {
        // Every file with a <style> block should use @layer crss-components
        if (content.includes('<style')) {
          expect(content, `${name} should use @layer crss-components`).toContain(
            '@layer crss-components',
          );
        }
      }
    });

    it('should use <style is:global> for all component styles', () => {
      const files = getAllAstroFiles();

      for (const { name, content } of files) {
        if (content.includes('<style')) {
          expect(content, `${name} should use <style is:global>`).toMatch(
            /<style\s+is:global\s*>/,
          );
        }
      }
    });

    it('should not use :global() wrappers (made redundant by is:global)', () => {
      const files = getAllAstroFiles();

      for (const { name, content } of files) {
        // Extract only the CSS portion (between <style> and </style>)
        const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
        if (styleMatch) {
          expect(styleMatch[1], `${name} should not use :global()`).not.toContain(
            ':global(',
          );
        }
      }
    });

    it('should not contain hardcoded hex colour values in component styles', () => {
      const files = getAllAstroFiles();
      // Regex to match hex colours (#fff, #ffffff, #FF00FF, etc.)
      const hexPattern = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/;

      for (const { name, content } of files) {
        const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
        if (styleMatch) {
          const css = styleMatch[1];
          // Filter out comments
          const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
          // Allow #crss- id selectors — they're not colour values
          const cleaned = cssNoComments.replace(/#crss-[\w-]+/g, '');
          expect(cleaned, `${name} should not have hardcoded hex colours`).not.toMatch(
            hexPattern,
          );
        }
      }
    });
  });

  describe('Token Wiring Audit', () => {
    it('should define tokens in components.css', () => {
      const tokens = getDefinedTokens();
      expect(tokens.length).toBeGreaterThanOrEqual(40);
    });

    it('should consume every defined --crss-comp-* token in at least one component', () => {
      const defined = getDefinedTokens();
      const consumed = getConsumedTokens();

      const unconsumed: string[] = [];
      for (const token of defined) {
        if (!consumed.has(token)) {
          unconsumed.push(token);
        }
      }

      expect(
        unconsumed,
        `Dead tokens found in components.css that are not consumed by any component: ${unconsumed.join(', ')}`,
      ).toHaveLength(0);
    });

    it('should not reference undefined --crss-comp-* tokens in components', () => {
      const defined = new Set(getDefinedTokens());
      const consumed = getConsumedTokens();

      const undefined_refs: string[] = [];
      for (const token of consumed) {
        if (!defined.has(token)) {
          undefined_refs.push(token);
        }
      }

      expect(
        undefined_refs,
        `Components reference tokens not defined in components.css: ${undefined_refs.join(', ')}`,
      ).toHaveLength(0);
    });
  });

  describe('CSS Class Naming', () => {
    it('should use crss- prefixed class names for all component selectors', () => {
      const files = getAllAstroFiles();

      for (const { name, content } of files) {
        const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
        if (styleMatch) {
          let css = styleMatch[1];
          // Remove comments and @import / @layer declarations
          css = css.replace(/\/\*[\s\S]*?\*\//g, '');
          css = css.replace(/@import\s+[^;]+;/g, '');
          css = css.replace(/@layer\s+[\w-]+\s*\{/g, '{');
          // Match class selectors that appear in selector context (before {)
          const selectorBlocks = css.match(/[^{}]*\{/g) || [];
          for (const block of selectorBlocks) {
            const classSelectors = block.match(/\.[a-zA-Z][\w-]*/g) || [];
            for (const selector of classSelectors) {
              expect(selector, `${name} has non-prefixed class: ${selector}`).toMatch(
                /^\.crss-/,
              );
            }
          }
        }
      }
    });
  });
});
