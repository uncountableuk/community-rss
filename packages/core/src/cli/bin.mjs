#!/usr/bin/env node
/**
 * CLI entry point for @community-rss/core.
 *
 * Routes subcommands:
 *   init   — Scaffold a new project
 *   eject  — Eject a framework file for customization
 *
 * If no subcommand is given, defaults to `init` for backward
 * compatibility.
 *
 * @since 0.6.0
 */

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);

const args = process.argv.slice(2);
const subcommand = args[0];

if (subcommand === 'eject') {
  const { runEject } = await import('./eject.mjs');
  runEject(args.slice(1));
} else if (subcommand === 'init' || !subcommand || subcommand.startsWith('-')) {
  // Default to init (backward compatible)
  // Dynamically import and run the init main function
  const initArgs = subcommand === 'init' ? args.slice(1) : args;

  // Import scaffold and run
  const { scaffold } = await import('./init.mjs');

  // Handle --help
  if (initArgs.includes('--help') || initArgs.includes('-h')) {
    console.log(`
  @community-rss/core init

  Scaffolds a Community RSS project with email templates,
  configuration, and Docker Compose.

  Usage:
    npx @community-rss/core init [options]

  Options:
    --force    Overwrite existing files
    --help     Show this help message
`);
    process.exit(0);
  }

  const force = initArgs.includes('--force');
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
} else {
  console.error(`\n  Unknown command: ${subcommand}`);
  console.error(`  Available commands: init, eject\n`);
  process.exit(1);
}
