import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration, AstroConfig } from 'astro';
import type { CommunityRssOptions } from './types/options';
import { resolveOptions } from './types/options';
import { startScheduler, stopScheduler } from './utils/build/scheduler';
import { createDatabase, closeDatabase } from './db/connection';
import { setGlobalConfig } from './config-store';
import type { EnvironmentVariables } from './types/context';

/**
 * Converts a PascalCase name to kebab-case.
 *
 * @example pascalToKebab('SignIn') → 'sign-in'
 * @internal
 * @since 0.5.0
 */
function pascalToKebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Generates the source code for the `virtual:crss-email-templates` module.
 *
 * Scans developer and package template directories for `*Email.astro` files,
 * generates static import statements, and exports `devTemplates` and
 * `packageTemplates` maps keyed by email type name (kebab-case).
 *
 * @param devDir - Absolute path to the developer's email template directory
 * @param pkgDir - Absolute path to the package's built-in email template directory
 * @returns JavaScript module source code
 * @internal
 * @since 0.5.0
 */
function generateEmailTemplateModule(devDir: string, pkgDir: string): string {
  const imports: string[] = [];
  const devEntries: string[] = [];
  const pkgEntries: string[] = [];

  // Scan developer directory for *Email.astro files
  if (existsSync(devDir)) {
    const files = readdirSync(devDir).filter((f) => f.endsWith('Email.astro'));
    for (const file of files) {
      const varName = `dev_${file.replace('.astro', '')}`;
      const typeName = pascalToKebab(file.replace('Email.astro', ''));
      const filePath = join(devDir, file).replace(/\\/g, '/');
      imports.push(`import ${varName} from '${filePath}';`);
      devEntries.push(`  '${typeName}': ${varName}`);
    }
  }

  // Scan package template directory for *Email.astro files
  if (existsSync(pkgDir)) {
    const files = readdirSync(pkgDir).filter((f) => f.endsWith('Email.astro'));
    for (const file of files) {
      const varName = `pkg_${file.replace('.astro', '')}`;
      const typeName = pascalToKebab(file.replace('Email.astro', ''));
      const filePath = join(pkgDir, file).replace(/\\/g, '/');
      imports.push(`import ${varName} from '${filePath}';`);
      pkgEntries.push(`  '${typeName}': ${varName}`);
    }
  }

  return [
    ...imports,
    '',
    'export const devTemplates = {',
    devEntries.join(',\n'),
    '};',
    '',
    'export const packageTemplates = {',
    pkgEntries.join(',\n'),
    '};',
  ].join('\n');
}

/**
 * Creates the Community RSS Astro integration.
 *
 * This is the main entry point for consumers. It accepts an optional
 * configuration object and returns an Astro integration that injects
 * API routes, page routes, middleware, and scheduler lifecycle hooks
 * into the consumer's project.
 *
 * Page routes are conditionally injected — if a developer has a local
 * file at the same path (e.g., `src/pages/profile.astro`), the
 * injected route is skipped so the developer's version takes priority.
 *
 * @param options - Framework configuration
 * @returns Astro integration instance
 * @since 0.1.0
 *
 * @example
 * ```js
 * // astro.config.mjs
 * import communityRss from '@community-rss/core';
 *
 * export default defineConfig({
 *   integrations: [communityRss({ maxFeeds: 10 })],
 * });
 * ```
 */
export function createIntegration(options: CommunityRssOptions = {}): AstroIntegration {
  const config = resolveOptions(options);
  let projectRoot: string = process.cwd();

  return {
    name: 'community-rss',
    hooks: {
      'astro:config:setup': ({ injectRoute, addMiddleware: registerMiddleware, injectScript, updateConfig, config: astroConfig, logger: setupLogger }) => {
        // Logger may not be available in test environments
        const logger = setupLogger ?? { info: () => { }, warn: () => { } };
        // Share resolved config with middleware via globalThis bridge
        setGlobalConfig(config);

        // Register middleware that creates AppContext on every request
        registerMiddleware({
          entrypoint: new URL('./middleware.ts', import.meta.url).pathname,
          order: 'pre',
        });

        // Inject design token CSS into every page via SSR script.
        // Developers no longer need to manually import token files.
        // layers.css declares @layer order and must be injected first.
        const tokenImport = [
          `import '${new URL('./styles/layers.css', import.meta.url).pathname}';`,
          `import '${new URL('./styles/tokens/reference.css', import.meta.url).pathname}';`,
          `import '${new URL('./styles/tokens/system.css', import.meta.url).pathname}';`,
          `import '${new URL('./styles/tokens/components.css', import.meta.url).pathname}';`,
        ].join('\n');
        injectScript('page-ssr', tokenImport);

        // Inject the consumer's theme.css (un-layered overrides) after all
        // framework styles so it wins the cascade automatically.
        const astroRoot = astroConfig.root instanceof URL
          ? fileURLToPath(astroConfig.root)
          : String(astroConfig.root);
        const cleanRoot = astroRoot.replace(/\/$/, '');
        const themeCssPath = join(cleanRoot, 'src', 'styles', 'theme.css');
        if (existsSync(themeCssPath)) {
          injectScript('page-ssr', `import '${themeCssPath}';`);
        }

        // --- Virtual module for Astro email templates ---
        // Scans the developer's email template directory and the package's
        // built-in templates, generating static imports that Vite compiles
        // through its pipeline (including the Astro transform). This allows
        // renderAstroEmail() to load .astro components at request time.
        const devTemplateDir = join(cleanRoot, config.emailTemplateDir);
        const pkgTemplateDir = fileURLToPath(new URL('./templates/email', import.meta.url));

        updateConfig({
          vite: {
            plugins: [{
              name: 'crss-email-templates',
              resolveId(id: string) {
                if (id === 'virtual:crss-email-templates') {
                  return '\0virtual:crss-email-templates';
                }
              },
              load(id: string) {
                if (id !== '\0virtual:crss-email-templates') return;
                return generateEmailTemplateModule(devTemplateDir, pkgTemplateDir);
              },
            }],
          },
        });

        // --- API Routes (injected — update automatically with package) ---

        // Health check route — validates integration wiring
        injectRoute({
          pattern: '/api/v1/health',
          entrypoint: new URL('./routes/api/v1/health.ts', import.meta.url).pathname,
        });

        // Articles API route
        injectRoute({
          pattern: '/api/v1/articles',
          entrypoint: new URL('./routes/api/v1/articles.ts', import.meta.url).pathname,
        });

        // Admin: manual sync trigger (local dev / operator use)
        injectRoute({
          pattern: '/api/v1/admin/sync',
          entrypoint: new URL('./routes/api/v1/admin/sync.ts', import.meta.url).pathname,
        });

        // Admin: feed management (CRUD)
        injectRoute({
          pattern: '/api/v1/admin/feeds',
          entrypoint: new URL('./routes/api/v1/admin/feeds.ts', import.meta.url).pathname,
        });

        // better-auth catch-all — handles sign-in, sign-out, session, magic link
        injectRoute({
          pattern: '/api/auth/[...all]',
          entrypoint: new URL('./routes/api/auth/[...all].ts', import.meta.url).pathname,
        });

        // Auth API: email pre-check for sign-in/sign-up routing
        injectRoute({
          pattern: '/api/v1/auth/check-email',
          entrypoint: new URL('./routes/api/v1/auth/check-email.ts', import.meta.url).pathname,
        });

        // Auth API: sign-up endpoint
        injectRoute({
          pattern: '/api/v1/auth/signup',
          entrypoint: new URL('./routes/api/v1/auth/signup.ts', import.meta.url).pathname,
        });

        // User profile API
        injectRoute({
          pattern: '/api/v1/profile',
          entrypoint: new URL('./routes/api/v1/profile.ts', import.meta.url).pathname,
        });

        // Email change request
        injectRoute({
          pattern: '/api/v1/profile/change-email',
          entrypoint: new URL('./routes/api/v1/profile/change-email.ts', import.meta.url).pathname,
        });

        // Email change confirmation
        injectRoute({
          pattern: '/api/v1/profile/confirm-email-change',
          entrypoint: new URL('./routes/api/v1/profile/confirm-email-change.ts', import.meta.url).pathname,
        });

        // Dev-only seed endpoint
        injectRoute({
          pattern: '/api/dev/seed',
          entrypoint: new URL('./routes/api/dev/seed.ts', import.meta.url).pathname,
        });

        // --- Page Routes (conditionally injected) ---
        // Pages are injected by default. If a developer has a local file
        // at the corresponding path, the injection is skipped so the
        // developer's version takes priority.
        const pageRoutes = [
          { pattern: '/', entrypoint: 'pages/index.astro', localPath: 'src/pages/index.astro' },
          { pattern: '/profile', entrypoint: 'pages/profile.astro', localPath: 'src/pages/profile.astro' },
          { pattern: '/terms', entrypoint: 'pages/terms.astro', localPath: 'src/pages/terms.astro' },
          { pattern: '/article/[id]', entrypoint: 'pages/article/[id].astro', localPath: 'src/pages/article/[id].astro' },
          { pattern: '/auth/signin', entrypoint: 'pages/auth/signin.astro', localPath: 'src/pages/auth/signin.astro' },
          { pattern: '/auth/signup', entrypoint: 'pages/auth/signup.astro', localPath: 'src/pages/auth/signup.astro' },
          { pattern: '/auth/verify', entrypoint: 'pages/auth/verify.astro', localPath: 'src/pages/auth/verify.astro' },
          { pattern: '/auth/verify-email-change', entrypoint: 'pages/auth/verify-email-change.astro', localPath: 'src/pages/auth/verify-email-change.astro' },
        ];

        for (const route of pageRoutes) {
          const userFile = new URL(`./${route.localPath}`, astroConfig.root);
          if (!existsSync(userFile)) {
            injectRoute({
              pattern: route.pattern,
              entrypoint: new URL(`./${route.entrypoint}`, import.meta.url).pathname,
            });
          } else {
            logger.info(`  Skipping injected page ${route.pattern} — developer override detected`);
          }
        }
      },

      'astro:config:done': ({ config: astroConfig, logger }) => {
        // astroConfig.root may be a URL or a string depending on Astro version
        const root = astroConfig.root;
        projectRoot = root instanceof URL ? fileURLToPath(root) : String(root);
        // Strip trailing slash for consistent join() behavior
        projectRoot = projectRoot.replace(/\/$/, '');

        logger.info(`Community RSS integration loaded`);
        logger.info(`  maxFeeds: ${config.maxFeeds}`);
        logger.info(`  commentTier: ${config.commentTier}`);
        logger.info(`  databasePath: ${config.databasePath}`);
        logger.info(`  syncSchedule: ${config.syncSchedule}`);
      },

      'astro:server:start': ({ logger }) => {
        // Load .env from project root into process.env.
        // process.loadEnvFile does NOT override already-set vars, so explicit
        // environment variables (e.g. from Docker/CI) take precedence.
        const envPath = join(projectRoot, '.env');
        try {
          process.loadEnvFile(envPath);
        } catch {
          logger.warn(`No .env file found at ${envPath} — using environment variables only`);
        }

        // Build environment variables from process.env
        const env: EnvironmentVariables = {
          DATABASE_PATH: process.env.DATABASE_PATH ?? config.databasePath,
          FRESHRSS_URL: process.env.FRESHRSS_URL ?? '',
          FRESHRSS_USER: process.env.FRESHRSS_USER ?? '',
          FRESHRSS_API_PASSWORD: process.env.FRESHRSS_API_PASSWORD ?? '',
          PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL ?? '',
          SMTP_HOST: process.env.SMTP_HOST ?? '',
          SMTP_PORT: process.env.SMTP_PORT ?? '',
          SMTP_FROM: process.env.SMTP_FROM ?? '',
          S3_ENDPOINT: process.env.S3_ENDPOINT ?? '',
          S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ?? '',
          S3_SECRET_KEY: process.env.S3_SECRET_KEY ?? '',
          S3_BUCKET: process.env.S3_BUCKET ?? '',
          MEDIA_BASE_URL: process.env.MEDIA_BASE_URL ?? '',
          RESEND_API_KEY: process.env.RESEND_API_KEY,
          EMAIL_TRANSPORT: process.env.EMAIL_TRANSPORT,
        };

        const db = createDatabase(env.DATABASE_PATH);
        startScheduler({ db, config, env });
      },

      'astro:server:done': () => {
        stopScheduler();
        closeDatabase();
      },
    },
  };
}
