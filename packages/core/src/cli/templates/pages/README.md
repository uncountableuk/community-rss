# Pages

This directory is for **page overrides**. By default, all pages are
served automatically by the `@community-rss/core` integration — no
files needed here.

## How It Works

The framework injects page routes at build time. If you place a file
here with the same name, your version takes priority and the framework's
version is skipped.

## Available Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `index.astro` | Homepage with article feed grid |
| `/profile` | `profile.astro` | User profile page |
| `/terms` | `terms.astro` | Terms of Service |
| `/article/[id]` | `article/[id].astro` | Article detail page |
| `/auth/signin` | `auth/signin.astro` | Sign-in page |
| `/auth/signup` | `auth/signup.astro` | Sign-up page |
| `/auth/verify` | `auth/verify.astro` | Magic link verification |
| `/auth/verify-email-change` | `auth/verify-email-change.astro` | Email change verification |

## Ejecting a Page

To customize a specific page, use the eject command:

```bash
npx @community-rss/core eject pages/profile
```

This copies the framework's page to your project with correct imports.
You can then edit it freely. The framework will no longer inject that
route — your version takes over.

## Learn More

See the [Progressive Customization guide](https://community-rss.dev/guides/customisation)
for the full customization hierarchy.
