#!/usr/bin/env node
/**
 * CLI eject command for @community-rss/core.
 *
 * Generates proxy wrappers for framework artefacts (components, layouts,
 * pages) using the Proxy Ejection Pattern. All available named slots
 * are included as commented-out blocks. Developers uncomment only what
 * they need to customise.
 *
 * For pages: generates a proxy that imports the core page component
 * and exposes its slots, replacing the old "full copy" model.
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

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    SLOT_REGISTRY,
    KNOWN_COMPONENTS,
    KNOWN_LAYOUTS,
    PAGE_REGISTRY,
} from './slot-registry.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Absolute path to the CLI templates directory. */
const TEMPLATES_DIR = join(__dirname, 'templates');

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

/**
 * Generate a single commented-out slot block.
 * @param {import('./slot-registry.mjs').SlotDefinition} slot
 * @returns {string}
 */
function generateSlotBlock(slot) {
    const placeholder = slot.placeholder
        ? `\n${slot.placeholder}\n  `
        : '\n  ';
    return `  {/* =========================================
    SLOT: ${slot.name}
    ${slot.description}
    =========================================
  */}

  {/* <Fragment slot="${slot.name}">${placeholder}</Fragment> */}`;
}

/**
 * Parse an ejected proxy file and extract developer customizations.
 *
 * Detects:
 * - Active (uncommented) `<Fragment slot="name">` overrides
 * - Developer-added style content (beyond the default comment)
 * - Developer-added imports (beyond the core import)
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
    const fragmentRegex = /<Fragment slot="([^"]+)">([\s\S]*?)<\/Fragment>/g;
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
    const extraImports = [];
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
        for (const line of fmMatch[1].split('\n')) {
            const trimmed = line.trim();
            // Capture imports that aren't the core framework import
            // and aren't already-commented imports
            if (
                trimmed.startsWith('import ') &&
                !trimmed.includes('@community-rss/core/')
            ) {
                extraImports.push(line);
            }
        }
    }

    return { activeSlots, styleContent, extraImports };
}

/**
 * Merge developer customizations from a parsed ejected file into a
 * freshly generated proxy.
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
        // Pattern: the comment header block + the commented Fragment block
        // We replace both with the developer's uncommented Fragment
        const escapedName = slotName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const commentedBlockPattern = new RegExp(
            // Match the SLOT: comment header + the commented Fragment
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

    // Preserve developer's extra imports
    if (parsed.extraImports.length > 0) {
        const importBlock = parsed.extraImports.join('\n');
        // Insert after the last uncommented import line in frontmatter
        result = result.replace(
            /(import\s+\w+\s+from\s+'@community-rss\/core\/[^']+';)/,
            `$1\n${importBlock}`,
        );
    }

    return result;
}

/**
 * Generate a proxy wrapper from a registry entry.
 *
 * Produces:
 * - Frontmatter with core import + commented additional imports
 * - Commented slot blocks for all named slots
 * - Default slot passthrough (`<slot />`)
 * - Empty style block
 *
 * @param {string} registryKey - Key in SLOT_REGISTRY (e.g., 'components/FeedCard')
 * @returns {string}
 */
export function generateProxy(registryKey) {
    const entry = SLOT_REGISTRY[registryKey];
    if (!entry) {
        throw new Error(`No registry entry for: ${registryKey}`);
    }

    const category = registryKey.split('/')[0];
    const name = registryKey.replace(/^(components|layouts|pages)\//, '');

    // Build frontmatter
    const additionalImportLines = (entry.additionalImports || [])
        .map((imp) => `// import ${imp.name} from '${imp.from}';`)
        .join('\n');

    const frontmatter = `---
/**
 * ${entry.alias.replace('Core', '')} proxy wrapper — developer-owned wrapper around
 * the core ${entry.alias.replace('Core', '')}${category === 'layouts' ? ' layout' : category === 'pages' ? ' page' : ' component'}.
 *
 * Uncomment any slot below to override that section.
 * The core ${category === 'layouts' ? 'layout' : category === 'pages' ? 'page' : 'component'} handles all logic.
 *
 * @since 0.6.0
 */
import ${entry.alias} from '${entry.corePath}';
${additionalImportLines ? additionalImportLines + '\n' : ''}
const props = Astro.props;
---`;

    // Build slot blocks
    const slotParts = [];
    for (const slot of entry.slots) {
        if (slot.isDefault) {
            slotParts.push('\n  <slot />');
        } else {
            slotParts.push('\n' + generateSlotBlock(slot));
        }
    }

    const body = slotParts.join('\n');

    return `${frontmatter}

<${entry.alias} {...props}>${body}
</${entry.alias}>

<style>
  /* Add your custom styles here */
</style>
`;
}

/**
 * Generate a component proxy wrapper.
 * @param {string} name - Component name (e.g., 'FeedCard')
 * @returns {string}
 */
export function generateComponentProxy(name) {
    return generateProxy(`components/${name}`);
}

/**
 * Generate a layout proxy wrapper.
 * @param {string} name - Layout name (e.g., 'BaseLayout')
 * @returns {string}
 */
export function generateLayoutProxy(name) {
    return generateProxy(`layouts/${name}`);
}

/**
 * Generate a page proxy wrapper.
 * @param {string} pageName - Page name (e.g., 'profile', 'auth/signin')
 * @returns {string}
 */
export function generatePageProxy(pageName) {
    return generateProxy(`pages/${pageName}`);
}

/**
 * Run the eject command.
 *
 * @param {object} options
 * @param {string} options.target - What to eject (e.g., 'pages/profile', 'components/FeedCard')
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
     * Write a file, handling directory creation and force/skip logic.
     * Used for auto-ejected dependencies — does NOT re-eject.
     * @param {string} relPath - Path relative to project root
     * @param {string} content - File content
     * @param {string} [reason] - Why this file was created (for auto-ejected deps)
     * @returns {boolean} Whether the file was created
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
     * Write or merge a proxy file. If the file exists and contains
     * SLOT: markers, re-ejects by merging developer customizations
     * into the fresh proxy. If --force is set, always overwrites.
     *
     * @param {string} relPath - Path relative to project root
     * @param {string} freshProxy - Freshly generated proxy content
     * @returns {boolean} Whether the file was created/merged
     */
    function writeOrMerge(relPath, freshProxy) {
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

        // File exists, no --force — try re-eject
        const existing = readFileSync(absPath, 'utf-8');
        if (existing.includes('SLOT:')) {
            const parsed = parseEjectedFile(existing);
            const merged = mergeSlotContent(freshProxy, parsed);
            writeFileSync(absPath, merged);
            created.push(relPath);
            messages.push(`  ↳ Re-ejected ${relPath} (preserved your customizations)`);
            return true;
        }

        // Legacy file without markers — skip
        skipped.push(relPath);
        return false;
    }

    // --- Parse target ---
    if (target === 'actions') {
        // Eject the actions scaffold
        const templatePath = join(TEMPLATES_DIR, 'actions/index.ts');
        if (!existsSync(templatePath)) {
            throw new Error('Actions template not found in core package.');
        }
        const content = readFileSync(templatePath, 'utf-8');
        writeFile('src/actions/index.ts', content);
        return { created, skipped, messages };
    }

    const [category, ...nameParts] = target.split('/');
    const name = nameParts.join('/');

    if (category === 'pages') {
        // Eject a page proxy
        const pageInfo = PAGE_REGISTRY[name];
        if (!pageInfo) {
            const available = Object.keys(PAGE_REGISTRY).join(', ');
            throw new Error(
                `Unknown page: ${name}. Available pages: ${available}`,
            );
        }

        const proxy = generatePageProxy(name);
        writeOrMerge(`src/${pageInfo.file}`, proxy);

        // Auto-eject layout proxy if needed
        for (const layout of pageInfo.imports.layouts) {
            const layoutPath = `src/layouts/${layout}.astro`;
            if (!existsSync(join(projectRoot, layoutPath))) {
                const layoutProxy = generateLayoutProxy(layout);
                writeFile(layoutPath, layoutProxy, `layout proxy — ${name} imports this`);
            }
        }

        // Auto-eject component proxies if needed
        for (const component of pageInfo.imports.components) {
            const compPath = `src/components/${component}.astro`;
            if (!existsSync(join(projectRoot, compPath))) {
                const compProxy = generateComponentProxy(component);
                writeFile(compPath, compProxy, `component proxy — ${name} imports this`);
            }
        }

        return { created, skipped, messages };
    }

    if (category === 'components') {
        // Eject a component proxy
        if (!KNOWN_COMPONENTS.includes(name)) {
            throw new Error(
                `Unknown component: ${name}. Available: ${KNOWN_COMPONENTS.join(', ')}`,
            );
        }

        const proxy = generateComponentProxy(name);
        writeOrMerge(`src/components/${name}.astro`, proxy);
        return { created, skipped, messages };
    }

    if (category === 'layouts') {
        // Eject a layout proxy
        if (!KNOWN_LAYOUTS.includes(name)) {
            throw new Error(
                `Unknown layout: ${name}. Available: ${KNOWN_LAYOUTS.join(', ')}`,
            );
        }

        const proxy = generateLayoutProxy(name);
        writeOrMerge(`src/layouts/${name}.astro`, proxy);
        return { created, skipped, messages };
    }

    throw new Error(
        `Unknown eject target: ${target}. Use pages/<name>, components/<name>, layouts/<name>, or actions.`,
    );
}

/**
 * Scan the developer's project for previously ejected files and re-eject
 * them, preserving active slot customizations while refreshing stubs
 * from the current framework version.
 *
 * Also replaces signpost READMEs in components/, layouts/, and pages/
 * directories with fresh copies from templates.
 *
 * @param {object} options
 * @param {string} [options.cwd] - Working directory
 * @returns {{ created: string[], skipped: string[], messages: string[] }}
 * @since 0.6.0
 */
export function ejectUpgrade({ cwd = process.cwd() } = {}) {
    const projectRoot = findProjectRoot(cwd);
    if (!projectRoot) {
        throw new Error(
            'Could not find package.json. Please run this command from your project directory.',
        );
    }

    const allCreated = [];
    const allSkipped = [];
    const allMessages = [];

    // Scan for existing ejected files
    const dirs = [
        { dir: 'src/components', registry: KNOWN_COMPONENTS, prefix: 'components' },
        { dir: 'src/layouts', registry: KNOWN_LAYOUTS, prefix: 'layouts' },
    ];

    for (const { dir, registry, prefix } of dirs) {
        const absDir = join(projectRoot, dir);
        if (!existsSync(absDir)) continue;

        for (const name of registry) {
            const filePath = join(absDir, `${name}.astro`);
            if (existsSync(filePath)) {
                // Re-eject (merge) — force=false triggers the merge path
                const result = eject({ target: `${prefix}/${name}`, cwd, force: false });
                allCreated.push(...result.created);
                allSkipped.push(...result.skipped);
                allMessages.push(...result.messages);
            }
        }
    }

    // Scan for ejected pages
    for (const [pageName, pageInfo] of Object.entries(PAGE_REGISTRY)) {
        const filePath = join(projectRoot, 'src', pageInfo.file);
        if (existsSync(filePath)) {
            const result = eject({ target: `pages/${pageName}`, cwd, force: false });
            allCreated.push(...result.created);
            allSkipped.push(...result.skipped);
            allMessages.push(...result.messages);
        }
    }

    // Replace signpost READMEs with fresh copies from templates
    const readmeDirs = ['components', 'layouts', 'pages'];
    for (const dir of readmeDirs) {
        const templateReadme = join(TEMPLATES_DIR, dir, 'README.md');
        const targetReadme = join(projectRoot, 'src', dir, 'README.md');

        if (existsSync(templateReadme) && existsSync(join(projectRoot, 'src', dir))) {
            const content = readFileSync(templateReadme, 'utf-8');
            mkdirSync(dirname(targetReadme), { recursive: true });
            writeFileSync(targetReadme, content);
            allMessages.push(`  ↳ Updated ${`src/${dir}/README.md`} (signpost)`);
        }
    }

    return { created: allCreated, skipped: allSkipped, messages: allMessages };
}

/**
 * Eject every known target (fresh or re-eject depending on state).
 * Includes all pages, components, layouts, and actions.
 *
 * @param {object} options
 * @param {string} [options.cwd] - Working directory
 * @param {boolean} [options.force] - Overwrite every file
 * @returns {{ created: string[], skipped: string[], messages: string[] }}
 * @since 0.6.0
 */
export function ejectAll({ cwd = process.cwd(), force = false } = {}) {
    const allCreated = [];
    const allSkipped = [];
    const allMessages = [];

    /** Accumulate results from a sub-eject. */
    function collect(result) {
        allCreated.push(...result.created);
        allSkipped.push(...result.skipped);
        allMessages.push(...result.messages);
    }

    // Eject all layouts first (pages depend on them)
    for (const name of KNOWN_LAYOUTS) {
        collect(eject({ target: `layouts/${name}`, cwd, force }));
    }

    // Eject all components
    for (const name of KNOWN_COMPONENTS) {
        collect(eject({ target: `components/${name}`, cwd, force }));
    }

    // Eject all pages
    for (const pageName of Object.keys(PAGE_REGISTRY)) {
        collect(eject({ target: `pages/${pageName}`, cwd, force }));
    }

    // Eject actions
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
        console.log(`
  @community-rss/core eject <target>

  Generates a proxy wrapper for customization via named slots.

  Targets:
    pages/<name>        Eject a page proxy (e.g., pages/profile)
    components/<name>   Eject a component proxy (e.g., components/FeedCard)
    layouts/<name>      Eject a layout proxy (e.g., layouts/BaseLayout)
    actions             Eject the actions scaffold
    upgrade             Re-eject all existing proxies (preserves customizations)
    all                 Eject every known target

  Available pages: ${Object.keys(PAGE_REGISTRY).join(', ')}
  Available components: ${KNOWN_COMPONENTS.join(', ')}
  Available layouts: ${KNOWN_LAYOUTS.join(', ')}

  Options:
    --force    Overwrite existing files (full reset on upgrade/all)
    --help     Show this help message
`);
        return;
    }

    console.log('\n  @community-rss/core — Ejecting...\n');

    try {
        let result;

        if (target === 'upgrade') {
            result = ejectUpgrade({ cwd: process.cwd() });
        } else if (target === 'all') {
            result = ejectAll({ cwd: process.cwd(), force });
        } else {
            result = eject({ target, force });
        }

        const { created, skipped, messages } = result;

        for (const file of created) {
            const msg = messages.find((m) => m.includes(file));
            if (msg) {
                console.log(msg);
            } else {
                console.log(`  ✔ Created ${file}`);
            }
        }

        // Print messages that aren't file-specific (e.g., README updates)
        for (const msg of messages) {
            if (!created.some((f) => msg.includes(f))) {
                console.log(msg);
            }
        }

        for (const file of skipped) {
            console.log(`  SKIP  ${file} (already exists, use --force to overwrite)`);
        }

        if (created.length > 0) {
            console.log(`\n  Your proxy wrappers are ready. Uncomment any slot block to`);
            console.log(`  override that section. The core handles all logic.\n`);
        }
    } catch (err) {
        console.error(`\n  ERROR  ${err.message}\n`);
        process.exit(1);
    }
}
