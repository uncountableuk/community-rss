#!/usr/bin/env node
/**
 * CLI eject command for @community-rss/core.
 *
 * Generates proxy wrappers from annotation metadata embedded in .astro
 * source files. All registry data is derived at runtime from `@eject-module`
 * and `@eject-slot` annotations — no external registry file is needed.
 *
 * Usage: npx @community-rss/core eject <target>
 *
 * Targets:
 *   pages/<name>        — Eject a page proxy (e.g., pages/profile)
 *   components/<name>   — Eject a component proxy (e.g., components/FeedCard)
 *   layouts/<name>      — Eject a layout proxy (e.g., layouts/BaseLayout)
 *   actions             — Eject the actions scaffold
 *
 * @since 0.6.0
 */

import {
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    statSync,
    writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Absolute path to the CLI templates directory. */
const TEMPLATES_DIR = join(__dirname, 'templates');

/** Absolute path to the `src/` directory within the package. */
const SRC_DIR = join(__dirname, '..');

// ─── Annotation Parser ────────────────────────────────────────────────

/**
 * @typedef {Object} SlotAnnotation
 * @property {string} name - Slot name (e.g., 'header')
 * @property {string} description - Human-readable description
 * @property {string} defaultContent - Verbatim content between <slot name>…</slot>, empty for self-closing
 * @property {{ name: string, from: string }[]} additionalImports - Imports needed for this slot
 */

/**
 * @typedef {Object} ParsedAnnotations
 * @property {string} alias - Core component alias (e.g., 'CoreBaseLayout')
 * @property {string[]} dependencies - Eject dependency paths (e.g., ['components/AuthButton'])
 * @property {string} propsDefinition - Interface / type declarations from frontmatter
 * @property {SlotAnnotation[]} slots - All ejectable slots
 * @property {boolean} hasUnnamedSlot - Whether an unnamed `<slot />` exists
 * @property {string} corePath - Package import path (e.g., '@community-rss/core/layouts/BaseLayout.astro')
 */

/**
 * Parse `@eject-module` and `@eject-slot` annotations from an `.astro` file.
 *
 * Returns `null` when the file does not contain an `@eject-module` annotation
 * (i.e. the file is not ejectable).
 *
 * @param {string} filePath - Absolute path to the `.astro` source file
 * @returns {ParsedAnnotations | null}
 * @since 0.6.0
 */
export function parseAnnotations(filePath) {
    const content = readFileSync(filePath, 'utf-8');

    if (!content.includes('@eject-module')) {
        return null;
    }

    // ── Split frontmatter / template ──────────────────────────────────
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) return null;

    const frontmatter = fmMatch[1];
    const template = content.slice(fmMatch[0].length);

    // ── Extract @eject-module comment block ───────────────────────────
    const moduleBlockMatch = frontmatter.match(
        /\/\*[\s\S]*?@eject-module[\s\S]*?\*\//,
    );
    if (!moduleBlockMatch) return null;

    const moduleBlock = moduleBlockMatch[0];

    const aliasMatch = moduleBlock.match(/@alias\s+(\S+)/);
    const alias = aliasMatch ? aliasMatch[1] : '';

    const dependencies = [];
    const depRegex = /@eject-dependency\s+(\S+)/g;
    let depMatch;
    while ((depMatch = depRegex.exec(moduleBlock)) !== null) {
        dependencies.push(depMatch[1]);
    }

    // ── Extract props definition (type declarations only) ─────────────
    const propsLines = [];
    let inCommentBlock = false;

    for (const line of frontmatter.split('\n')) {
        const trimmed = line.trim();

        // Track comment blocks (skip JSDoc and annotation blocks)
        if (
            !inCommentBlock &&
            (trimmed.startsWith('/**') || trimmed.startsWith('/*'))
        ) {
            inCommentBlock = true;
        }
        if (inCommentBlock) {
            if (trimmed.includes('*/')) {
                inCommentBlock = false;
            }
            continue;
        }

        // Skip import statements
        if (trimmed.startsWith('import ')) continue;

        // Skip runtime statements (const, let, var assignments)
        if (/^(const|let|var)\s/.test(trimmed)) continue;

        // Skip empty leading lines
        if (!propsLines.length && !trimmed) continue;

        propsLines.push(line);
    }

    // Trim trailing blank lines
    while (propsLines.length && !propsLines[propsLines.length - 1].trim()) {
        propsLines.pop();
    }
    const propsDefinition = propsLines.join('\n');

    // ── Extract @eject-slot annotations ───────────────────────────────
    const slots = [];
    // Match JSX expression blocks containing @eject-slot:
    //   {/* @eject-slot ... */}       — inline form
    //   {\n  /* @eject-slot ... */\n} — multiline JSX expression form
    const slotAnnotationRegex = /\{\s*\/\*\s*@eject-slot\b([\s\S]*?)\*\/\s*\}/g;
    let slotMatch;

    while ((slotMatch = slotAnnotationRegex.exec(template)) !== null) {
        const annotationBody = slotMatch[1];
        const annotationEnd = slotMatch.index + slotMatch[0].length;

        // @description — everything until the next @-tag or end of body
        const descMatch = annotationBody.match(
            /@description\s+([\s\S]*?)(?=\s*@additionalimport\d|\s*$)/,
        );
        const description = descMatch
            ? descMatch[1].trim().replace(/\s+/g, ' ')
            : '';

        // @additionalimportN / @importfromN pairs
        const additionalImports = [];
        const importPairRegex =
            /@additionalimport(\d+)\s+(\S+)\s+@importfrom\1\s+(\S+)/g;
        let importMatch;
        while (
            (importMatch = importPairRegex.exec(annotationBody)) !== null
        ) {
            additionalImports.push({
                name: importMatch[2],
                from: importMatch[3],
            });
        }

        // Next <slot name="..."> tag after the annotation
        const afterAnnotation = template.slice(annotationEnd);
        const nextSlotMatch = afterAnnotation.match(
            /^\s*<slot\s+name="([^"]+)"(\s*\/>|>([\s\S]*?)<\/slot>)/,
        );

        if (nextSlotMatch) {
            const slotName = nextSlotMatch[1];
            const isSelfClosing = nextSlotMatch[2].trim() === '/>';
            let defaultContent = isSelfClosing
                ? ''
                : nextSlotMatch[3] || '';

            // Dedent default content
            if (defaultContent.trim()) {
                const lines = defaultContent.split('\n');
                // Remove leading/trailing empty lines
                while (lines.length && !lines[0].trim()) lines.shift();
                while (lines.length && !lines[lines.length - 1].trim())
                    lines.pop();
                // Find minimum indentation
                const minIndent = lines
                    .filter((l) => l.trim())
                    .reduce((min, l) => {
                        const indent = l.match(/^\s*/)[0].length;
                        return Math.min(min, indent);
                    }, Infinity);
                if (minIndent > 0 && minIndent !== Infinity) {
                    defaultContent = lines
                        .map((l) => l.slice(minIndent))
                        .join('\n');
                } else {
                    defaultContent = lines.join('\n');
                }
            } else {
                defaultContent = '';
            }

            slots.push({
                name: slotName,
                description,
                defaultContent,
                additionalImports,
            });
        }
    }

    // ── Detect unnamed <slot /> ───────────────────────────────────────
    const stripped = template
        .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '') // remove JSX comment expressions
        .replace(/<slot\s+name="[^"]*"[\s\S]*?(?:\/>|<\/slot>)/g, ''); // remove named slots
    const hasUnnamedSlot = /<slot\s*\/?>/.test(stripped);

    // ── Derive core import path from file location ────────────────────
    const relativeToSrc = relative(SRC_DIR, filePath).replace(/\\/g, '/');
    const corePath = `@community-rss/core/${relativeToSrc}`;

    return {
        alias,
        dependencies,
        propsDefinition,
        slots,
        hasUnnamedSlot,
        corePath,
    };
}

// ─── Filesystem Discovery ─────────────────────────────────────────────

/**
 * Recursively find all `.astro` files in a directory.
 * @param {string} dir
 * @param {string[]} [results]
 * @returns {string[]} Absolute paths
 */
function findAstroFiles(dir, results = []) {
    if (!existsSync(dir)) return results;
    for (const entry of readdirSync(dir)) {
        const fullPath = join(dir, entry);
        if (statSync(fullPath).isDirectory()) {
            findAstroFiles(fullPath, results);
        } else if (entry.endsWith('.astro')) {
            results.push(fullPath);
        }
    }
    return results;
}

/**
 * Discover all ejectable artefacts in a source category directory.
 * Returns names of files containing `@eject-module`.
 *
 * @param {string} category - Directory name under `src/` (e.g., 'components')
 * @param {(relPath: string) => boolean} [filter] - Optional filter
 * @returns {string[]}
 */
function discoverCategory(category, filter) {
    const dir = join(SRC_DIR, category);
    return findAstroFiles(dir)
        .filter((f) => {
            const rel = relative(dir, f).replace(/\\/g, '/');
            if (filter && !filter(rel)) return false;
            const content = readFileSync(f, 'utf-8');
            return content.includes('@eject-module');
        })
        .map((f) =>
            relative(dir, f)
                .replace(/\.astro$/, '')
                .replace(/\\/g, '/'),
        );
}

/**
 * Discover all ejectable components.
 * @returns {string[]} Component names
 * @since 0.6.0
 */
export function discoverComponents() {
    return discoverCategory('components');
}

/**
 * Discover all ejectable layouts.
 * @returns {string[]} Layout names
 * @since 0.6.0
 */
export function discoverLayouts() {
    return discoverCategory('layouts');
}

/**
 * Discover all ejectable pages (excludes `api/` directory).
 * @returns {string[]} Page names like ['index', 'profile', 'auth/signin']
 * @since 0.6.0
 */
export function discoverPages() {
    return discoverCategory('pages', (rel) => !rel.startsWith('api/'));
}

/**
 * Resolve the absolute source-file path for a registry key.
 * @param {string} registryKey - e.g., 'components/FeedCard' or 'pages/auth/signin'
 * @returns {string}
 */
function resolveSourcePath(registryKey) {
    return join(SRC_DIR, registryKey + '.astro');
}

// ─── Proxy Generation ─────────────────────────────────────────────────

/**
 * Generate a single commented-out slot block.
 * @param {SlotAnnotation} slot
 * @returns {string}
 */
function generateSlotBlock(slot) {
    const placeholder = slot.defaultContent
        ? `\n    ${slot.defaultContent.split('\n').join('\n    ')}\n  `
        : '\n  ';
    return `  {/* =========================================
    SLOT: ${slot.name}
    ${slot.description}
    =========================================
  */}

  {/* <Fragment slot="${slot.name}">${placeholder}</Fragment> */}`;
}

/**
 * Generate a proxy wrapper from parsed annotations.
 *
 * Produces:
 * - Frontmatter with `@start-eject-import` / `@end-eject-import` markers
 * - Commented slot blocks for all named slots
 * - Unnamed-slot passthrough (`<slot />`) when applicable
 * - Empty `<style>` block
 *
 * @param {ParsedAnnotations} annotations
 * @param {string} registryKey - Key like 'components/FeedCard'
 * @returns {string}
 * @since 0.6.0
 */
export function generateProxy(annotations, registryKey) {
    if (!annotations) {
        throw new Error(`No annotations found for: ${registryKey}`);
    }

    const category = registryKey.split('/')[0];
    const categoryLabel =
        category === 'layouts'
            ? 'layout'
            : category === 'pages'
                ? 'page'
                : 'component';
    const friendlyName = annotations.alias.replace('Core', '');

    // Collect all additional imports from all slots (unconditionally)
    /** @type {Map<string, string>} */
    const allAdditionalImports = new Map();
    for (const slot of annotations.slots) {
        for (const imp of slot.additionalImports) {
            allAdditionalImports.set(imp.name, imp.from);
        }
    }

    // Build import lines
    const importLines = [
        `import ${annotations.alias} from '${annotations.corePath}';`,
    ];
    for (const [name, from] of allAdditionalImports) {
        importLines.push(`import ${name} from '${from}';`);
    }

    const propsBlock = annotations.propsDefinition
        ? '\n' + annotations.propsDefinition + '\n'
        : '';

    const frontmatter = `---
/**
 * ${friendlyName} proxy wrapper — developer-owned wrapper around
 * the core ${friendlyName} ${categoryLabel}.
 *
 * Uncomment any slot below to override that section.
 * The core ${categoryLabel} handles all logic.
 *
 * @since 0.6.0
 */
/*
 * @start-eject-import
 */
${importLines.join('\n')}
${propsBlock}
const props = Astro.props;
/*
 * @end-eject-import
 */
---`;

    // Build slot blocks
    const slotParts = [];
    for (const slot of annotations.slots) {
        slotParts.push('\n' + generateSlotBlock(slot));
    }

    // Unnamed-slot passthrough
    if (annotations.hasUnnamedSlot) {
        slotParts.push('\n  <slot />');
    }

    const body = slotParts.join('\n');

    return `${frontmatter}

<${annotations.alias} {...props}>${body}
</${annotations.alias}>

<style>
  /* Add your custom styles here */
</style>
`;
}

/**
 * Convenience: generate a component proxy by name.
 * @param {string} name - Component name (e.g., 'FeedCard')
 * @returns {string}
 */
export function generateComponentProxy(name) {
    const key = `components/${name}`;
    const annotations = parseAnnotations(resolveSourcePath(key));
    return generateProxy(annotations, key);
}

/**
 * Convenience: generate a layout proxy by name.
 * @param {string} name - Layout name (e.g., 'BaseLayout')
 * @returns {string}
 */
export function generateLayoutProxy(name) {
    const key = `layouts/${name}`;
    const annotations = parseAnnotations(resolveSourcePath(key));
    return generateProxy(annotations, key);
}

/**
 * Convenience: generate a page proxy by name.
 * @param {string} pageName - e.g., 'profile', 'auth/signin'
 * @returns {string}
 */
export function generatePageProxy(pageName) {
    const key = `pages/${pageName}`;
    const annotations = parseAnnotations(resolveSourcePath(key));
    return generateProxy(annotations, key);
}

// ─── Ejected-File Parsing (retained for re-eject) ────────────────────

/**
 * Parse an ejected proxy file and extract developer customizations.
 *
 * Detects:
 * - Active (uncommented) `<Fragment slot="name">` overrides
 * - Developer-added style content (beyond the default comment)
 * - Developer-added imports (outside the `@start-eject-import` markers)
 *
 * @param {string} content - File content of the ejected proxy
 * @returns {{ activeSlots: Map<string, string>, styleContent: string, extraImports: string[] }}
 * @since 0.6.0
 */
export function parseEjectedFile(content) {
    /** @type {Map<string, string>} */
    const activeSlots = new Map();

    // Strip all {/* ... */} JSX comment blocks to isolate active content
    const withoutComments = content.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

    // Find all uncommented <Fragment slot="name">...</Fragment> blocks
    const fragmentRegex =
        /<Fragment slot="([^"]+)">([\s\S]*?)<\/Fragment>/g;
    let match;
    while ((match = fragmentRegex.exec(withoutComments)) !== null) {
        activeSlots.set(match[1], match[0]);
    }

    // Extract style content (if not just the default placeholder)
    let styleContent = '';
    const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch) {
        const trimmed = styleMatch[1].trim();
        if (trimmed && trimmed !== '/* Add your custom styles here */') {
            styleContent = styleMatch[1];
        }
    }

    // Extract developer-added import lines from frontmatter
    // Only imports OUTSIDE the @start-eject-import / @end-eject-import block
    const extraImports = [];
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
        const fm = fmMatch[1];
        // Remove the managed import block
        const withoutManaged = fm.replace(
            /\/\*[\s\S]*?@start-eject-import[\s\S]*?@end-eject-import[\s\S]*?\*\//gs,
            '',
        );
        for (const line of withoutManaged.split('\n')) {
            const trimmed = line.trim();
            if (
                trimmed.startsWith('import ') &&
                !trimmed.includes('@community-rss/core/')
            ) {
                extraImports.push(line);
            }
        }

        // Fallback: also capture imports in legacy proxies without markers
        if (
            !fm.includes('@start-eject-import') &&
            extraImports.length === 0
        ) {
            for (const line of fm.split('\n')) {
                const trimmed = line.trim();
                if (
                    trimmed.startsWith('import ') &&
                    !trimmed.includes('@community-rss/core/')
                ) {
                    extraImports.push(line);
                }
            }
        }
    }

    return { activeSlots, styleContent, extraImports };
}

/**
 * Merge developer customizations into a freshly generated proxy.
 *
 * For each active slot, the corresponding commented block in the fresh
 * proxy is replaced with the developer's uncommented content.
 *
 * @param {string} freshProxy - Freshly generated proxy content
 * @param {{ activeSlots: Map<string, string>, styleContent: string, extraImports: string[] }} parsed
 * @returns {string}
 * @since 0.6.0
 */
export function mergeSlotContent(freshProxy, parsed) {
    let result = freshProxy;

    // Replace commented slot blocks with active developer content
    for (const [slotName, fragmentHtml] of parsed.activeSlots) {
        const escapedName = slotName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const commentedBlockPattern = new RegExp(
            `\\s*\\{/\\*\\s*={3,}\\s*\\n\\s*SLOT:\\s*${escapedName}\\b[\\s\\S]*?={3,}\\s*\\*/\\}` +
            `\\s*\\{/\\*\\s*<Fragment slot="${escapedName}">[\\s\\S]*?</Fragment>\\s*\\*/\\}`,
        );

        const replacement = `\n  ${fragmentHtml.trim()}`;
        result = result.replace(commentedBlockPattern, replacement);
    }

    // Preserve developer's style content
    if (parsed.styleContent) {
        result = result.replace(
            /<style>\s*\/\*\s*Add your custom styles here\s*\*\/\s*<\/style>/,
            `<style>${parsed.styleContent}</style>`,
        );
    }

    // Preserve developer's extra imports — insert after @end-eject-import
    if (parsed.extraImports.length > 0) {
        const importBlock = parsed.extraImports.join('\n');
        if (result.includes('@end-eject-import')) {
            result = result.replace(
                /(@end-eject-import[\s\S]*?\*\/)/,
                `$1\n${importBlock}`,
            );
        } else {
            // Legacy fallback: insert after the core import
            result = result.replace(
                /(import\s+\w+\s+from\s+'@community-rss\/core\/[^']+';)/,
                `$1\n${importBlock}`,
            );
        }
    }

    return result;
}

// ─── Re-eject Algorithm ───────────────────────────────────────────────

/**
 * Re-eject an existing proxy file with updated annotations.
 *
 * Preserves:
 * - Active (uncommented) `<Fragment slot="name">` overrides for slots
 *   that still exist in current annotations
 * - Developer-added `<style>` content
 * - Developer-added imports (outside the `@start-eject-import` block)
 * - Developer-added frontmatter code (outside the managed block)
 *
 * Updates:
 * - Managed import block (`@start-eject-import` … `@end-eject-import`)
 * - Comment blocks for inactive/new slots refreshed from annotations
 * - Orphan live fragments (slot no longer in annotations) are removed
 *
 * @param {string} existingContent - Current proxy file content
 * @param {ParsedAnnotations} annotations - Current parsed annotations
 * @param {string} registryKey - Key like 'components/FeedCard'
 * @returns {string} Updated proxy content
 * @since 0.6.0
 */
export function reEject(existingContent, annotations, registryKey) {
    // ── 1. Parse existing developer customizations ────────────────────
    const parsed = parseEjectedFile(existingContent);

    // ── 2. Build the new frontmatter ──────────────────────────────────
    const category = registryKey.split('/')[0];
    const categoryLabel =
        category === 'layouts'
            ? 'layout'
            : category === 'pages'
                ? 'page'
                : 'component';
    const friendlyName = annotations.alias.replace('Core', '');

    // Collect all additional imports from all slots (unconditionally)
    /** @type {Map<string, string>} */
    const allAdditionalImports = new Map();
    for (const slot of annotations.slots) {
        for (const imp of slot.additionalImports) {
            allAdditionalImports.set(imp.name, imp.from);
        }
    }

    const importLines = [
        `import ${annotations.alias} from '${annotations.corePath}';`,
    ];
    for (const [name, from] of allAdditionalImports) {
        importLines.push(`import ${name} from '${from}';`);
    }

    const propsBlock = annotations.propsDefinition
        ? '\n' + annotations.propsDefinition + '\n'
        : '';

    // Developer's extra imports go after the managed block
    const extraImportBlock =
        parsed.extraImports.length > 0
            ? '\n' + parsed.extraImports.join('\n')
            : '';

    // Preserve developer frontmatter code outside managed block
    let extraFrontmatter = '';
    const fmMatch = existingContent.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
        const fm = fmMatch[1];
        // Remove the managed block
        const withoutManaged = fm.replace(
            /\/\*[\s\S]*?@start-eject-import[\s\S]*?@end-eject-import[\s\S]*?\*\//gs,
            '',
        );
        // Remove JSDoc blocks
        const withoutJSDoc = withoutManaged.replace(/\/\*\*[\s\S]*?\*\//g, '');
        // Remove import lines (both core and extra — we re-add them)
        const devLines = withoutJSDoc
            .split('\n')
            .filter((l) => {
                const t = l.trim();
                return t && !t.startsWith('import ') && !t.startsWith('const props');
            })
            .join('\n')
            .trim();
        if (devLines) {
            extraFrontmatter = '\n' + devLines;
        }
    }

    const frontmatter = `---
/**
 * ${friendlyName} proxy wrapper — developer-owned wrapper around
 * the core ${friendlyName} ${categoryLabel}.
 *
 * Uncomment any slot below to override that section.
 * The core ${categoryLabel} handles all logic.
 *
 * @since 0.6.0
 */
/*
 * @start-eject-import
 */
${importLines.join('\n')}
${propsBlock}
const props = Astro.props;
/*
 * @end-eject-import
 */${extraImportBlock}${extraFrontmatter}
---`;

    // ── 3. Build the body — preserve active slots, refresh comments ───
    const slotParts = [];

    for (const slot of annotations.slots) {
        if (parsed.activeSlots.has(slot.name)) {
            // Developer has an active override — keep it, add fresh comment
            const activeFragment = parsed.activeSlots.get(slot.name);
            slotParts.push(`
  {/* =========================================
    SLOT: ${slot.name}
    ${slot.description}
    =========================================
  */}

  ${activeFragment.trim()}`);
        } else {
            // No active override — generate commented block
            slotParts.push('\n' + generateSlotBlock(slot));
        }
    }

    // Unnamed-slot passthrough
    if (annotations.hasUnnamedSlot) {
        slotParts.push('\n  <slot />');
    }

    const body = slotParts.join('\n');

    // ── 4. Preserve style block ───────────────────────────────────────
    const styleContent = parsed.styleContent
        ? parsed.styleContent
        : '\n  /* Add your custom styles here */\n';

    return `${frontmatter}

<${annotations.alias} {...props}>${body}
</${annotations.alias}>

<style>${styleContent}</style>
`;
}

// ─── File Helpers ─────────────────────────────────────────────────────

/**
 * Walk up the directory tree to find the nearest `package.json`.
 * @param {string} startDir
 * @returns {string | null}
 */
function findProjectRoot(startDir) {
    let dir = startDir;
    while (dir !== dirname(dir)) {
        if (existsSync(join(dir, 'package.json'))) {
            return dir;
        }
        dir = dirname(dir);
    }
    return null;
}

// ─── Eject Command ───────────────────────────────────────────────────

/**
 * Run the eject command.
 *
 * @param {object} options
 * @param {string} options.target - What to eject (e.g., 'pages/profile')
 * @param {string} [options.cwd] - Working directory
 * @param {boolean} [options.force] - Overwrite existing files
 * @returns {{ created: string[], skipped: string[], messages: string[] }}
 */
export function eject({ target, cwd = process.cwd(), force = false }) {
    const projectRoot = findProjectRoot(cwd);
    if (!projectRoot) {
        throw new Error(
            'Could not find package.json. Please run this command from your project directory.',
        );
    }

    const created = [];
    const skipped = [];
    const messages = [];

    /**
     * Write a file (for auto-ejected dependencies — no re-eject).
     * @param {string} relPath
     * @param {string} content
     * @param {string} [reason]
     * @returns {boolean}
     */
    function writeFile(relPath, content, reason) {
        const absPath = join(projectRoot, relPath);
        if (existsSync(absPath) && !force) {
            skipped.push(relPath);
            return false;
        }
        mkdirSync(dirname(absPath), { recursive: true });
        writeFileSync(absPath, content);
        created.push(relPath);
        if (reason) {
            messages.push(`  ↳ Auto-created ${relPath} (${reason})`);
        }
        return true;
    }

    /**
     * Write, re-eject, or skip a proxy file.
     *
     * - New file: write the fresh proxy
     * - Existing + --force: overwrite with fresh proxy
     * - Existing ejected proxy: re-eject (merge developer content with
     *   updated annotations)
     * - Existing non-proxy file: skip
     *
     * @param {string} relPath
     * @param {string} freshProxy
     * @param {ParsedAnnotations} annotations
     * @param {string} registryKey
     * @returns {boolean}
     */
    function writeOrMerge(relPath, freshProxy, annotations, registryKey) {
        const absPath = join(projectRoot, relPath);

        if (!existsSync(absPath)) {
            mkdirSync(dirname(absPath), { recursive: true });
            writeFileSync(absPath, freshProxy);
            created.push(relPath);
            return true;
        }

        if (force) {
            writeFileSync(absPath, freshProxy);
            created.push(relPath);
            return true;
        }

        // File exists, no --force — check if already ejected
        const existing = readFileSync(absPath, 'utf-8');
        if (
            existing.includes('SLOT:') ||
            existing.includes('@start-eject-import')
        ) {
            // Re-eject: preserve developer customizations, update managed content
            const merged = reEject(existing, annotations, registryKey);
            writeFileSync(absPath, merged);
            created.push(relPath);
            messages.push(`  ↳ Re-ejected ${relPath} (preserved your customizations)`);
            return true;
        }

        // Legacy file without markers — skip
        skipped.push(relPath);
        return false;
    }

    // ── Actions (unchanged — template-based) ──────────────────────────
    if (target === 'actions') {
        const templatePath = join(TEMPLATES_DIR, 'actions/index.ts');
        if (!existsSync(templatePath)) {
            throw new Error('Actions template not found in core package.');
        }
        const content = readFileSync(templatePath, 'utf-8');
        writeFile('src/actions/index.ts', content);
        return { created, skipped, messages };
    }

    // ── Parse target ──────────────────────────────────────────────────
    const [category, ...nameParts] = target.split('/');
    const name = nameParts.join('/');

    if (category === 'pages') {
        const sourcePath = resolveSourcePath(`pages/${name}`);
        if (!existsSync(sourcePath)) {
            const available = discoverPages().join(', ');
            throw new Error(
                `Unknown page: ${name}. Available pages: ${available}`,
            );
        }

        const annotations = parseAnnotations(sourcePath);
        if (!annotations) {
            throw new Error(
                `Page ${name} exists but has no @eject-module annotation.`,
            );
        }

        const pageKey = `pages/${name}`;
        const pageFile = `pages/${name}.astro`;
        const proxy = generateProxy(annotations, pageKey);
        writeOrMerge(`src/${pageFile}`, proxy, annotations, pageKey);

        // Auto-eject dependencies from @eject-dependency annotations
        for (const dep of annotations.dependencies) {
            const [depCategory, ...depNameParts] = dep.split('/');
            const depName = depNameParts.join('/');

            if (depCategory === 'layouts') {
                const layoutPath = `src/layouts/${depName}.astro`;
                if (!existsSync(join(projectRoot, layoutPath))) {
                    const layoutProxy = generateLayoutProxy(depName);
                    writeFile(
                        layoutPath,
                        layoutProxy,
                        `layout proxy — ${name} imports this`,
                    );
                }
            } else if (depCategory === 'components') {
                const compPath = `src/components/${depName}.astro`;
                if (!existsSync(join(projectRoot, compPath))) {
                    const compProxy = generateComponentProxy(depName);
                    writeFile(
                        compPath,
                        compProxy,
                        `component proxy — ${name} imports this`,
                    );
                }
            }
        }

        return { created, skipped, messages };
    }

    if (category === 'components') {
        const sourcePath = resolveSourcePath(`components/${name}`);
        if (!existsSync(sourcePath)) {
            const available = discoverComponents().join(', ');
            throw new Error(
                `Unknown component: ${name}. Available: ${available}`,
            );
        }

        const annotations = parseAnnotations(sourcePath);
        if (!annotations) {
            throw new Error(
                `Component ${name} exists but has no @eject-module annotation.`,
            );
        }

        const compKey = `components/${name}`;
        const proxy = generateProxy(annotations, compKey);
        writeOrMerge(`src/components/${name}.astro`, proxy, annotations, compKey);
        return { created, skipped, messages };
    }

    if (category === 'layouts') {
        const sourcePath = resolveSourcePath(`layouts/${name}`);
        if (!existsSync(sourcePath)) {
            const available = discoverLayouts().join(', ');
            throw new Error(
                `Unknown layout: ${name}. Available: ${available}`,
            );
        }

        const annotations = parseAnnotations(sourcePath);
        if (!annotations) {
            throw new Error(
                `Layout ${name} exists but has no @eject-module annotation.`,
            );
        }

        const layoutKey = `layouts/${name}`;
        const proxy = generateProxy(annotations, layoutKey);
        writeOrMerge(`src/layouts/${name}.astro`, proxy, annotations, layoutKey);
        return { created, skipped, messages };
    }

    throw new Error(
        `Unknown eject target: ${target}. Use pages/<name>, components/<name>, layouts/<name>, or actions.`,
    );
}

/**
 * Eject every known target. Includes all pages, components, layouts,
 * and actions. Already-ejected files are skipped unless --force.
 *
 * @param {object} [options]
 * @param {string} [options.cwd]
 * @param {boolean} [options.force]
 * @returns {{ created: string[], skipped: string[], messages: string[] }}
 * @since 0.6.0
 */
export function ejectAll({ cwd = process.cwd(), force = false } = {}) {
    const allCreated = [];
    const allSkipped = [];
    const allMessages = [];

    function collect(result) {
        allCreated.push(...result.created);
        allSkipped.push(...result.skipped);
        allMessages.push(...result.messages);
    }

    // Layouts first (pages depend on them)
    for (const name of discoverLayouts()) {
        collect(eject({ target: `layouts/${name}`, cwd, force }));
    }

    // Components
    for (const name of discoverComponents()) {
        collect(eject({ target: `components/${name}`, cwd, force }));
    }

    // Pages
    for (const pageName of discoverPages()) {
        collect(eject({ target: `pages/${pageName}`, cwd, force }));
    }

    // Actions
    collect(eject({ target: 'actions', cwd, force }));

    return { created: allCreated, skipped: allSkipped, messages: allMessages };
}

/**
 * CLI entry point for the eject command.
 * @param {string[]} args - Command-line arguments after 'eject'
 */
export function runEject(args) {
    const target = args.find((a) => !a.startsWith('-'));
    const force = args.includes('--force');

    if (!target || args.includes('--help') || args.includes('-h')) {
        const pages = discoverPages();
        const components = discoverComponents();
        const layouts = discoverLayouts();

        console.log(`
  @community-rss/core eject <target>

  Generates a proxy wrapper for customization via named slots.
  Available targets are discovered from @eject-module annotations.

  Targets:
    pages/<name>        Eject a page proxy (e.g., pages/profile)
    components/<name>   Eject a component proxy (e.g., components/FeedCard)
    layouts/<name>      Eject a layout proxy (e.g., layouts/BaseLayout)
    actions             Eject the actions scaffold
    all                 Eject every known target

  Available pages: ${pages.join(', ')}
  Available components: ${components.join(', ')}
  Available layouts: ${layouts.join(', ')}

  Options:
    --force    Overwrite existing files
    --help     Show this help message
`);
        return;
    }

    console.log('\n  @community-rss/core — Ejecting...\n');

    try {
        let result;

        if (target === 'all') {
            result = ejectAll({ cwd: process.cwd(), force });
        } else {
            result = eject({ target, force });
        }

        const { created, skipped: skippedFiles, messages: msgs } = result;

        for (const file of created) {
            const msg = msgs.find((m) => m.includes(file));
            if (msg) {
                console.log(msg);
            } else {
                console.log(`  ✔ Created ${file}`);
            }
        }

        for (const msg of msgs) {
            if (!created.some((f) => msg.includes(f))) {
                console.log(msg);
            }
        }

        for (const file of skippedFiles) {
            console.log(
                `  SKIP  ${file} (already exists, use --force to overwrite)`,
            );
        }

        if (created.length > 0) {
            console.log(
                `\n  Your proxy wrappers are ready. Uncomment any slot block to`,
            );
            console.log(
                `  override that section. The core handles all logic.\n`,
            );
        }
    } catch (err) {
        console.error(`\n  ERROR  ${err.message}\n`);
        process.exit(1);
    }
}
