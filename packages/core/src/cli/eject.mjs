#!/usr/bin/env node
/**
 * CLI eject command for @community-rss/core.
 *
 * Copies a framework file to the developer's project so it can be
 * customized. For pages, imports are rewritten to use local proxies.
 * For components and layouts, a proxy wrapper is generated.
 *
 * Usage: npx @community-rss/core eject <target>
 *
 * Targets:
 *   pages/<name>        — Eject a page (e.g., pages/profile)
 *   components/<name>   — Eject a component proxy (e.g., components/FeedCard)
 *   layouts/<name>      — Eject a layout proxy (e.g., layouts/BaseLayout)
 *   actions             — Eject the actions scaffold
 *
 * @since 0.6.0
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Absolute path to the core package `src/` directory. */
const CORE_SRC = join(__dirname, '..');

/** Absolute path to the CLI templates directory. */
const TEMPLATES_DIR = join(__dirname, 'templates');

/**
 * Known page routes and which components/layouts they import.
 * Used for auto-ejecting dependencies.
 * @type {Record<string, { file: string, imports: { layouts: string[], components: string[] } }>}
 */
const PAGE_REGISTRY = {
    'index': {
        file: 'pages/index.astro',
        imports: { layouts: ['BaseLayout'], components: ['TabBar', 'FeedGrid', 'HomepageCTA'] },
    },
    'profile': {
        file: 'pages/profile.astro',
        imports: { layouts: ['BaseLayout'], components: [] },
    },
    'terms': {
        file: 'pages/terms.astro',
        imports: { layouts: ['BaseLayout'], components: [] },
    },
    'article/[id]': {
        file: 'pages/article/[id].astro',
        imports: { layouts: ['BaseLayout'], components: [] },
    },
    'auth/signin': {
        file: 'pages/auth/signin.astro',
        imports: { layouts: ['BaseLayout'], components: ['MagicLinkForm'] },
    },
    'auth/signup': {
        file: 'pages/auth/signup.astro',
        imports: { layouts: ['BaseLayout'], components: ['SignUpForm'] },
    },
    'auth/verify': {
        file: 'pages/auth/verify.astro',
        imports: { layouts: ['BaseLayout'], components: [] },
    },
    'auth/verify-email-change': {
        file: 'pages/auth/verify-email-change.astro',
        imports: { layouts: ['BaseLayout'], components: [] },
    },
};

/**
 * Available components that can be ejected.
 * @type {string[]}
 */
const KNOWN_COMPONENTS = [
    'AuthButton',
    'FeedCard',
    'FeedGrid',
    'TabBar',
    'ArticleModal',
    'MagicLinkForm',
    'SignUpForm',
    'ConsentModal',
    'HomepageCTA',
];

/**
 * Available layouts that can be ejected.
 * @type {string[]}
 */
const KNOWN_LAYOUTS = ['BaseLayout'];

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
 * Generate a component proxy wrapper.
 * @param {string} name - Component name (e.g., 'FeedCard')
 * @returns {string}
 */
function generateComponentProxy(name) {
    return `---
/**
 * ${name} proxy wrapper — developer-owned styling wrapper around
 * the core ${name} component.
 *
 * Edit the <style> block below to customise appearance.
 * The core component handles all logic.
 *
 * @since 0.6.0
 */
import Core${name} from '@community-rss/core/components/${name}.astro';

const props = Astro.props;
---

<Core${name} {...props}><slot /></Core${name}>

<style>
  /* Add your custom styles here */
</style>
`;
}

/**
 * Generate a layout proxy wrapper with named slot passthrough.
 * @param {string} name - Layout name (e.g., 'BaseLayout')
 * @returns {string}
 */
function generateLayoutProxy(name) {
    return `---
/**
 * ${name} proxy wrapper — developer-owned layout wrapper around
 * the core ${name}.
 *
 * Passes through all named slots. Add custom header, footer,
 * or head content by editing the slot passthrough below.
 *
 * @since 0.6.0
 */
import Core${name} from '@community-rss/core/layouts/${name}.astro';

const props = Astro.props;
---

<Core${name} {...props}>
  <slot name="head" slot="head" />
  <slot name="header" slot="header" />
  <slot />
  <slot name="footer" slot="footer" />
</Core${name}>
`;
}

/**
 * Rewrite a page's imports from package-internal relative paths to
 * local project paths.
 *
 * @param {string} content - Page file content
 * @param {string} pageFile - Page file path relative to src/ (e.g., 'pages/auth/signin.astro')
 * @returns {string}
 */
function rewritePageImports(content, pageFile) {
    // Calculate the relative prefix from the page's location to layouts/ and components/
    // Pages are in src/pages/ — layouts in src/layouts/, components in src/components/
    const depth = pageFile.split('/').length - 2; // subtract 'pages' directory and filename
    const prefix = depth > 0 ? '../'.repeat(depth + 1) : '../';

    // Replace relative layout imports (e.g., ../layouts/ or ../../layouts/)
    content = content.replace(
        /from\s+['"]\.\.\/(?:\.\.\/)*layouts\/([^'"]+)['"]/g,
        `from '${prefix}layouts/$1'`,
    );

    // Replace relative component imports (e.g., ../components/ or ../../components/)
    content = content.replace(
        /from\s+['"]\.\.\/(?:\.\.\/)*components\/([^'"]+)['"]/g,
        `from '${prefix}components/$1'`,
    );

    return content;
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
        // Eject a page
        const pageInfo = PAGE_REGISTRY[name];
        if (!pageInfo) {
            const available = Object.keys(PAGE_REGISTRY).join(', ');
            throw new Error(
                `Unknown page: ${name}. Available pages: ${available}`,
            );
        }

        // Read the page source from the core package
        const sourcePath = join(CORE_SRC, pageInfo.file);
        if (!existsSync(sourcePath)) {
            throw new Error(`Page source not found: ${sourcePath}`);
        }

        let content = readFileSync(sourcePath, 'utf-8');
        content = rewritePageImports(content, pageInfo.file);
        writeFile(`src/${pageInfo.file}`, content);

        // Auto-eject layout proxy if needed
        for (const layout of pageInfo.imports.layouts) {
            const layoutPath = `src/layouts/${layout}.astro`;
            if (!existsSync(join(projectRoot, layoutPath))) {
                const proxy = generateLayoutProxy(layout);
                writeFile(layoutPath, proxy, `layout proxy — ${name} imports this`);
            }
        }

        // Auto-eject component proxies if needed
        for (const component of pageInfo.imports.components) {
            const compPath = `src/components/${component}.astro`;
            if (!existsSync(join(projectRoot, compPath))) {
                const proxy = generateComponentProxy(component);
                writeFile(compPath, proxy, `component proxy — ${name} imports this`);
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

  Copies a framework file to your project for customization.

  Targets:
    pages/<name>        Eject a page (e.g., pages/profile)
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
            console.log(`\n  You can now customize these files. Proxies re-export the core`);
            console.log(`  component — edit the wrapper to change markup or styles.\n`);
        }
    } catch (err) {
        console.error(`\n  ERROR  ${err.message}\n`);
        process.exit(1);
    }
}
