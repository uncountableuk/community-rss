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
 *
 * Pages and component proxies are NOT scaffolded — pages are injected
 * by the integration, and components are available via `eject`.
 * Signpost READMEs explain this to developers.
 */
const FILE_MAP = [
    // Signpost READMEs (explain injection / eject model)
    { template: 'pages/README.md', target: 'src/pages/README.md' },
    { template: 'components/README.md', target: 'src/components/README.md' },
    { template: 'layouts/README.md', target: 'src/layouts/README.md' },

    // Email templates (Astro — developer-owned, including shared layout)
    { template: 'email-templates/EmailLayout.astro', target: 'src/email-templates/EmailLayout.astro' },
    { template: 'email-templates/SignInEmail.astro', target: 'src/email-templates/SignInEmail.astro' },
    { template: 'email-templates/WelcomeEmail.astro', target: 'src/email-templates/WelcomeEmail.astro' },
    {
        template: 'email-templates/EmailChangeEmail.astro',
        target: 'src/email-templates/EmailChangeEmail.astro',
    },

    // Actions
    { template: 'actions/index.ts', target: 'src/actions/index.ts' },

    // Config files
    { template: 'astro.config.mjs', target: 'astro.config.mjs' },
    { template: 'env.example', target: '.env.example' },
    { template: 'docker-compose.yml', target: 'docker-compose.yml' },
    { template: 'theme.css', target: 'src/styles/theme.css' },

    // AI guidance (GitHub Copilot + Cursor IDE)
    { template: '.github/copilot-instructions.md', target: '.github/copilot-instructions.md' },
    { template: '.cursor/rules/community-rss.mdc', target: '.cursor/rules/community-rss.mdc' },
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
