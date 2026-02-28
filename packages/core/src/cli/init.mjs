#!/usr/bin/env node
/**
 * CLI scaffold command for @community-rss/core.
 *
 * Usage: npx @community-rss/core init [--force]
 *
 * Scaffolds a working project structure with default pages,
 * email templates, configuration, and Docker Compose.
 *
 * @since 0.4.0
 */

import {
    existsSync,
    mkdirSync,
    readFileSync,
    writeFileSync,
    readdirSync,
    statSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATES_DIR = join(__dirname, 'templates');

/**
 * File mapping: template path (relative to templates/) → target path (relative to project root).
 */
const FILE_MAP = [
    // Pages
    { template: 'pages/index.astro', target: 'src/pages/index.astro' },
    { template: 'pages/article/[id].astro', target: 'src/pages/article/[id].astro' },
    { template: 'pages/auth/signin.astro', target: 'src/pages/auth/signin.astro' },
    { template: 'pages/auth/signup.astro', target: 'src/pages/auth/signup.astro' },
    { template: 'pages/auth/verify.astro', target: 'src/pages/auth/verify.astro' },
    {
        template: 'pages/auth/verify-email-change.astro',
        target: 'src/pages/auth/verify-email-change.astro',
    },
    { template: 'pages/profile.astro', target: 'src/pages/profile.astro' },
    { template: 'pages/terms.astro', target: 'src/pages/terms.astro' },

    // Email templates
    { template: 'email-templates/sign-in.html', target: 'src/email-templates/sign-in.html' },
    { template: 'email-templates/welcome.html', target: 'src/email-templates/welcome.html' },
    {
        template: 'email-templates/email-change.html',
        target: 'src/email-templates/email-change.html',
    },

    // Actions
    { template: 'actions/index.ts', target: 'src/actions/index.ts' },

    // Component proxy wrappers (Proxy Pattern)
    { template: 'components/FeedCard.astro', target: 'src/components/FeedCard.astro' },
    { template: 'components/FeedGrid.astro', target: 'src/components/FeedGrid.astro' },
    { template: 'components/TabBar.astro', target: 'src/components/TabBar.astro' },

    // Config files
    { template: 'astro.config.mjs', target: 'astro.config.mjs' },
    { template: 'env.example', target: '.env.example' },
    { template: 'docker-compose.yml', target: 'docker-compose.yml' },
    { template: 'theme.css', target: 'src/styles/theme.css' },
];

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
 * Run the scaffold.
 * @param {object} options
 * @param {string} options.cwd - Working directory
 * @param {boolean} options.force - Overwrite existing files
 * @returns {{ created: string[], skipped: string[] }}
 */
export function scaffold({ cwd = process.cwd(), force = false } = {}) {
    const projectRoot = findProjectRoot(cwd);

    if (!projectRoot) {
        throw new Error(
            'Could not find package.json. Please run this command from your project directory.',
        );
    }

    const created = [];
    const skipped = [];

    for (const { template, target } of FILE_MAP) {
        const targetPath = join(projectRoot, target);

        if (existsSync(targetPath) && !force) {
            skipped.push(target);
            continue;
        }

        const templatePath = join(TEMPLATES_DIR, template);
        if (!existsSync(templatePath)) {
            console.error(`  WARNING  Template not found: ${template}`);
            continue;
        }

        const content = readFileSync(templatePath, 'utf-8');
        mkdirSync(dirname(targetPath), { recursive: true });
        writeFileSync(targetPath, content);
        created.push(target);
    }

    return { created, skipped };
}

/**
 * CLI entry point — only runs when executed directly.
 */
function main() {
    const args = process.argv.slice(2);

    // Handle --help
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
  @community-rss/core init

  Scaffolds a Community RSS project with default pages, email
  templates, configuration, and Docker Compose.

  Usage:
    npx @community-rss/core init [options]

  Options:
    --force    Overwrite existing files
    --help     Show this help message
`);
        return;
    }

    const force = args.includes('--force');

    console.log('\n  @community-rss/core — Scaffolding project...\n');

    try {
        const { created, skipped } = scaffold({ force });

        for (const file of created) {
            console.log(`  CREATE  ${file}`);
        }

        for (const file of skipped) {
            console.log(`  SKIP    ${file} (already exists)`);
        }

        console.log(`\n  Done! ${created.length} file(s) created.`);

        if (skipped.length > 0) {
            console.log(`  ${skipped.length} file(s) skipped (use --force to overwrite).`);
        }

        console.log(`
  Next steps:
    1. Copy .env.example to .env and fill in your values
    2. Run: docker-compose up -d
    3. Run: npm run dev
    4. Visit: http://localhost:4321
`);
    } catch (err) {
        console.error(`\n  ERROR  ${err.message}\n`);
        process.exit(1);
    }
}

// Run CLI when executed directly (not imported)
const isDirectRun =
    process.argv[1] &&
    (process.argv[1] === __filename || process.argv[1].endsWith('/community-rss'));

if (isDirectRun) {
    main();
}
