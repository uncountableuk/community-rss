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
        writeFile(`src/${pageInfo.file}`, proxy);

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
        writeFile(`src/components/${name}.astro`, proxy);
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
        writeFile(`src/layouts/${name}.astro`, proxy);
        return { created, skipped, messages };
    }

    throw new Error(
        `Unknown eject target: ${target}. Use pages/<name>, components/<name>, layouts/<name>, or actions.`,
    );
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

  Available pages: ${Object.keys(PAGE_REGISTRY).join(', ')}
  Available components: ${KNOWN_COMPONENTS.join(', ')}
  Available layouts: ${KNOWN_LAYOUTS.join(', ')}

  Options:
    --force    Overwrite existing files
    --help     Show this help message
`);
        return;
    }

    console.log('\n  @community-rss/core — Ejecting...\n');

    try {
        const { created, skipped, messages } = eject({ target, force });

        for (const file of created) {
            // Find if there's a special message for this file
            const msg = messages.find((m) => m.includes(file));
            if (msg) {
                console.log(msg);
            } else {
                console.log(`  ✔ Created ${file}`);
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
