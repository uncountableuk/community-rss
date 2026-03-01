/**
 * Slot registry — central data source for all ejectable artefacts.
 *
 * Each entry defines the core import path, alias name, available slots
 * (with type, description, and placeholder content), and additional
 * imports needed when specific slots are overridden.
 *
 * Consumed by the eject CLI proxy generators and re-eject merge logic.
 *
 * @since 0.6.0
 */

/**
 * @typedef {'structural' | 'extension' | 'generic-wrapper' | 'default'} SlotType
 */

/**
 * @typedef {Object} SlotDefinition
 * @property {string} name - Slot name (e.g., 'header', 'before-unnamed-slot')
 * @property {SlotType} type - Slot category
 * @property {string} description - Human-readable description for the ejected proxy comment
 * @property {string} [placeholder] - Placeholder content for the commented-out slot block
 * @property {boolean} [isDefault] - If true, this is the default (unnamed) slot — rendered as `<slot />`
 */

/**
 * @typedef {Object} AdditionalImport
 * @property {string} name - Import identifier (e.g., 'AuthButton')
 * @property {string} from - Import path (e.g., '@community-rss/core/components/AuthButton.astro')
 * @property {string} usedBy - Which slot needs this import (e.g., 'header')
 */

/**
 * @typedef {Object} RegistryEntry
 * @property {string} corePath - Import path from the package (e.g., '@community-rss/core/layouts/BaseLayout.astro')
 * @property {string} alias - Core component alias used in the proxy (e.g., 'CoreBaseLayout')
 * @property {SlotDefinition[]} slots - Ordered list of slots
 * @property {AdditionalImport[]} [additionalImports] - Imports needed for slot placeholder content
 */

/**
 * Slot registry for all ejectable artefacts.
 *
 * Keys follow the format: `components/<Name>`, `layouts/<Name>`, `pages/<name>`.
 * @type {Record<string, RegistryEntry>}
 */
export const SLOT_REGISTRY = {
  // ─── Layouts ───────────────────────────────────────────────────────

  'layouts/BaseLayout': {
    corePath: '@community-rss/core/layouts/BaseLayout.astro',
    alias: 'CoreBaseLayout',
    additionalImports: [
      {
        name: 'AuthButton',
        from: '@community-rss/core/components/AuthButton.astro',
        usedBy: 'header',
      },
    ],
    slots: [
      {
        name: 'head',
        type: 'structural',
        description: 'Add custom <meta>, <link>, or <script> tags to <head>',
        placeholder: '    <meta name="custom" content="value" />',
      },
      {
        name: 'header',
        type: 'structural',
        description:
          'Replace the default header/nav bar.\n    Import AuthButton above if you want it in your custom header.',
        placeholder: `    <header class="crss-header">
      <nav class="crss-nav">
        <a href="/" class="crss-nav-brand">Community RSS</a>
        <AuthButton server:defer>
          <div slot="fallback" class="crss-auth-skeleton" aria-hidden="true" />
        </AuthButton>
      </nav>
    </header>`,
      },
      {
        name: 'below-header',
        type: 'extension',
        description:
          'Inject content between the header and the main page content.\n    Useful for banners, announcements, or breadcrumbs.',
      },
      {
        name: 'before-unnamed-slot',
        type: 'generic-wrapper',
        description: 'Content injected before the main content area.',
      },
      {
        name: 'default',
        type: 'default',
        isDefault: true,
        description: 'Page content (default slot)',
      },
      {
        name: 'after-unnamed-slot',
        type: 'generic-wrapper',
        description: 'Content injected after the main content area.',
      },
      {
        name: 'footer',
        type: 'structural',
        description: 'Replace the default footer.',
        placeholder: '    <p>&copy; 2026 My Community</p>',
      },
    ],
  },

  // ─── Components ────────────────────────────────────────────────────

  'components/AuthButton': {
    corePath: '@community-rss/core/components/AuthButton.astro',
    alias: 'CoreAuthButton',
    slots: [
      {
        name: 'before-unnamed-slot',
        type: 'generic-wrapper',
        description: 'Content injected before the auth button.',
      },
      {
        name: 'default',
        type: 'default',
        isDefault: true,
        description: 'Default content (auth button)',
      },
      {
        name: 'after-unnamed-slot',
        type: 'generic-wrapper',
        description: 'Content injected after the auth button.',
      },
    ],
  },

  'components/FeedCard': {
    corePath: '@community-rss/core/components/FeedCard.astro',
    alias: 'CoreFeedCard',
    slots: [
      {
        name: 'before-unnamed-slot',
        type: 'generic-wrapper',
        description: 'Content injected before the article card.',
      },
      {
        name: 'default',
        type: 'default',
        isDefault: true,
        description: 'Default content (article card)',
      },
      {
        name: 'after-unnamed-slot',
        type: 'generic-wrapper',
        description: 'Content injected after the article card.',
      },
    ],
  },

  'components/FeedGrid': {
    corePath: '@community-rss/core/components/FeedGrid.astro',
    alias: 'CoreFeedGrid',
    slots: [
      {
        name: 'before-unnamed-slot',
        type: 'generic-wrapper',
        description: 'Content injected before the feed grid.',
      },
      {
        name: 'default',
        type: 'default',
        isDefault: true,
        description: 'Default content (feed grid)',
      },
      {
        name: 'after-unnamed-slot',
        type: 'generic-wrapper',
        description: 'Content injected after the feed grid.',
      },
    ],
  },

  'components/TabBar': {
    corePath: '@community-rss/core/components/TabBar.astro',
    alias: 'CoreTabBar',
    slots: [
      {
        name: 'before-unnamed-slot',
        type: 'generic-wrapper',
        description: 'Content injected before the tab bar.',
      },
      {
        name: 'default',
        type: 'default',
        isDefault: true,
        description: 'Default content (tab bar)',
      },
      {
        name: 'after-unnamed-slot',
        type: 'generic-wrapper',
        description: 'Content injected after the tab bar.',
      },
    ],
  },

  'components/ArticleModal': {
    corePath: '@community-rss/core/components/ArticleModal.astro',
    alias: 'CoreArticleModal',
    slots: [
      {
        name: 'header',
        type: 'structural',
        description: 'Replace the modal header (meta info + close button).',
        placeholder: `    <header class="crss-modal__header">
      <div class="crss-modal__meta">
        <span class="crss-modal__source">Feed Title</span>
      </div>
      <button class="crss-modal__close" data-modal-close>×</button>
    </header>`,
      },
      {
        name: 'body',
        type: 'structural',
        description: 'Replace the article title + content area.',
        placeholder: `    <h1 class="crss-modal__title">Article Title</h1>
    <div class="crss-modal__content">Your content here</div>`,
      },
      {
        name: 'before-unnamed-slot',
        type: 'generic-wrapper',
        description: 'Content injected before the default slot.',
      },
      {
        name: 'default',
        type: 'default',
        isDefault: true,
        description: 'Default content slot',
      },
      {
        name: 'after-unnamed-slot',
        type: 'generic-wrapper',
        description: 'Content injected after the default slot.',
      },
      {
        name: 'footer',
        type: 'structural',
        description: 'Replace the modal footer (original link + navigation).',
        placeholder: `    <footer class="crss-modal__footer">
      <nav class="crss-modal__nav">
        <button class="crss-modal__nav-btn" data-modal-prev>← Previous</button>
        <button class="crss-modal__nav-btn" data-modal-next>Next →</button>
      </nav>
    </footer>`,
      },
    ],
  },

  'components/MagicLinkForm': {
    corePath: '@community-rss/core/components/MagicLinkForm.astro',
    alias: 'CoreMagicLinkForm',
    slots: [
      {
        name: 'before-unnamed-slot',
        type: 'generic-wrapper',
        description: 'Content injected before the magic link form.',
      },
      {
        name: 'default',
        type: 'default',
        isDefault: true,
        description: 'Default content (magic link form)',
      },
      {
        name: 'after-unnamed-slot',
        type: 'generic-wrapper',
        description: 'Content injected after the magic link form.',
      },
    ],
  },

  'components/SignUpForm': {
    corePath: '@community-rss/core/components/SignUpForm.astro',
    alias: 'CoreSignUpForm',
    slots: [
      {
        name: 'form',
        type: 'structural',
        description:
          'Replace the sign-up form.\n    Warning: The <script> block relies on specific element IDs.\n    If you replace this slot, re-implement the same IDs or provide your own script.',
        placeholder: `    <form class="crss-signup-form" id="crss-signup-form">
      <!-- Your custom form fields here -->
      <button type="submit" class="crss-btn crss-btn--primary">Create Account</button>
    </form>`,
      },
      {
        name: 'before-unnamed-slot',
        type: 'generic-wrapper',
        description: 'Content injected before the default slot.',
      },
      {
        name: 'default',
        type: 'default',
        isDefault: true,
        description: 'Default content slot',
      },
      {
        name: 'after-unnamed-slot',
        type: 'generic-wrapper',
        description: 'Content injected after the default slot.',
      },
      {
        name: 'confirmation',
        type: 'structural',
        description:
          'Replace the post-submission confirmation panel.\n    Warning: The <script> block relies on specific element IDs.\n    If you replace this slot, re-implement the same IDs or provide your own script.',
        placeholder: `    <div class="crss-signup-confirm" id="crss-signup-confirm" role="status">
      <h2>Thanks for signing up!</h2>
      <p>Check your email for a verification link.</p>
    </div>`,
      },
    ],
  },

  'components/ConsentModal': {
    corePath: '@community-rss/core/components/ConsentModal.astro',
    alias: 'CoreConsentModal',
    slots: [
      {
        name: 'before-unnamed-slot',
        type: 'generic-wrapper',
        description: 'Content injected before the consent modal.',
      },
      {
        name: 'default',
        type: 'default',
        isDefault: true,
        description: 'Default content (consent modal)',
      },
      {
        name: 'after-unnamed-slot',
        type: 'generic-wrapper',
        description: 'Content injected after the consent modal.',
      },
    ],
  },

  'components/HomepageCTA': {
    corePath: '@community-rss/core/components/HomepageCTA.astro',
    alias: 'CoreHomepageCTA',
    slots: [
      {
        name: 'before-unnamed-slot',
        type: 'generic-wrapper',
        description: 'Content injected before the CTA banner.',
      },
      {
        name: 'default',
        type: 'default',
        isDefault: true,
        description: 'Default content (CTA banner)',
      },
      {
        name: 'after-unnamed-slot',
        type: 'generic-wrapper',
        description: 'Content injected after the CTA banner.',
      },
    ],
  },

  // ─── Pages ─────────────────────────────────────────────────────────

  'pages/index': {
    corePath: '@community-rss/core/pages/index.astro',
    alias: 'CoreIndex',
    additionalImports: [
      { name: 'TabBar', from: '@community-rss/core/components/TabBar.astro', usedBy: 'content' },
      {
        name: 'FeedGrid',
        from: '@community-rss/core/components/FeedGrid.astro',
        usedBy: 'content',
      },
      {
        name: 'HomepageCTA',
        from: '@community-rss/core/components/HomepageCTA.astro',
        usedBy: 'content',
      },
    ],
    slots: [
      {
        name: 'content',
        type: 'structural',
        description:
          'Replace the entire page content.\n    The core page\'s default <main> block will be hidden.',
        placeholder: `    <main class="crss-homepage">
      <h1>My Custom Homepage</h1>
    </main>`,
      },
      {
        name: 'before-unnamed-slot',
        type: 'generic-wrapper',
        description: "Content injected before the page's main area.",
      },
      {
        name: 'default',
        type: 'default',
        isDefault: true,
        description: 'Default content slot',
      },
      {
        name: 'after-unnamed-slot',
        type: 'generic-wrapper',
        description: "Content injected after the page's main area.",
      },
    ],
  },

  'pages/profile': {
    corePath: '@community-rss/core/pages/profile.astro',
    alias: 'CoreProfile',
    slots: [
      {
        name: 'content',
        type: 'structural',
        description:
          'Replace the entire page content.\n    The core page\'s default <main> block will be hidden.',
        placeholder: `    <main class="crss-profile-page">
      <h1>My Custom Profile</h1>
    </main>`,
      },
      {
        name: 'before-unnamed-slot',
        type: 'generic-wrapper',
        description: "Content injected before the page's main area.",
      },
      {
        name: 'default',
        type: 'default',
        isDefault: true,
        description: 'Default content slot',
      },
      {
        name: 'after-unnamed-slot',
        type: 'generic-wrapper',
        description: "Content injected after the page's main area.",
      },
    ],
  },

  'pages/terms': {
    corePath: '@community-rss/core/pages/terms.astro',
    alias: 'CoreTerms',
    slots: [
      {
        name: 'content',
        type: 'structural',
        description:
          'Replace the entire page content.\n    The core page\'s default <main> block will be hidden.',
        placeholder: `    <main class="crss-terms-page">
      <h1>My Terms of Service</h1>
    </main>`,
      },
      {
        name: 'before-unnamed-slot',
        type: 'generic-wrapper',
        description: "Content injected before the page's main area.",
      },
      {
        name: 'default',
        type: 'default',
        isDefault: true,
        description: 'Default content slot',
      },
      {
        name: 'after-unnamed-slot',
        type: 'generic-wrapper',
        description: "Content injected after the page's main area.",
      },
    ],
  },

  'pages/article/[id]': {
    corePath: '@community-rss/core/pages/article/[id].astro',
    alias: 'CoreArticle',
    slots: [
      {
        name: 'content',
        type: 'structural',
        description:
          'Replace the entire page content.\n    The core page\'s default <main> block will be hidden.',
        placeholder: `    <main class="crss-article-page">
      <h1>My Custom Article Page</h1>
    </main>`,
      },
      {
        name: 'before-unnamed-slot',
        type: 'generic-wrapper',
        description: "Content injected before the page's main area.",
      },
      {
        name: 'default',
        type: 'default',
        isDefault: true,
        description: 'Default content slot',
      },
      {
        name: 'after-unnamed-slot',
        type: 'generic-wrapper',
        description: "Content injected after the page's main area.",
      },
    ],
  },

  'pages/auth/signin': {
    corePath: '@community-rss/core/pages/auth/signin.astro',
    alias: 'CoreSignin',
    additionalImports: [
      {
        name: 'MagicLinkForm',
        from: '@community-rss/core/components/MagicLinkForm.astro',
        usedBy: 'content',
      },
    ],
    slots: [
      {
        name: 'content',
        type: 'structural',
        description:
          'Replace the entire page content.\n    The core page\'s default <main> block will be hidden.',
        placeholder: `    <main class="crss-signin-page">
      <h1>My Custom Sign In</h1>
      <MagicLinkForm />
    </main>`,
      },
      {
        name: 'before-unnamed-slot',
        type: 'generic-wrapper',
        description: "Content injected before the page's main area.",
      },
      {
        name: 'default',
        type: 'default',
        isDefault: true,
        description: 'Default content slot',
      },
      {
        name: 'after-unnamed-slot',
        type: 'generic-wrapper',
        description: "Content injected after the page's main area.",
      },
    ],
  },

  'pages/auth/signup': {
    corePath: '@community-rss/core/pages/auth/signup.astro',
    alias: 'CoreSignup',
    additionalImports: [
      {
        name: 'SignUpForm',
        from: '@community-rss/core/components/SignUpForm.astro',
        usedBy: 'content',
      },
    ],
    slots: [
      {
        name: 'content',
        type: 'structural',
        description:
          'Replace the entire page content.\n    The core page\'s default <main> block will be hidden.',
        placeholder: `    <main class="crss-signup-page">
      <h1>My Custom Sign Up</h1>
      <SignUpForm />
    </main>`,
      },
      {
        name: 'before-unnamed-slot',
        type: 'generic-wrapper',
        description: "Content injected before the page's main area.",
      },
      {
        name: 'default',
        type: 'default',
        isDefault: true,
        description: 'Default content slot',
      },
      {
        name: 'after-unnamed-slot',
        type: 'generic-wrapper',
        description: "Content injected after the page's main area.",
      },
    ],
  },

  'pages/auth/verify': {
    corePath: '@community-rss/core/pages/auth/verify.astro',
    alias: 'CoreVerify',
    slots: [
      {
        name: 'content',
        type: 'structural',
        description:
          'Replace the entire page content.\n    The core page\'s default <main> block will be hidden.',
        placeholder: `    <main class="crss-verify-page">
      <h1>Verifying...</h1>
    </main>`,
      },
      {
        name: 'before-unnamed-slot',
        type: 'generic-wrapper',
        description: "Content injected before the page's main area.",
      },
      {
        name: 'default',
        type: 'default',
        isDefault: true,
        description: 'Default content slot',
      },
      {
        name: 'after-unnamed-slot',
        type: 'generic-wrapper',
        description: "Content injected after the page's main area.",
      },
    ],
  },

  'pages/auth/verify-email-change': {
    corePath: '@community-rss/core/pages/auth/verify-email-change.astro',
    alias: 'CoreVerifyEmailChange',
    slots: [
      {
        name: 'content',
        type: 'structural',
        description:
          'Replace the entire page content.\n    The core page\'s default <main> block will be hidden.',
        placeholder: `    <main class="crss-verify-page">
      <h1>Confirm Email Change</h1>
    </main>`,
      },
      {
        name: 'before-unnamed-slot',
        type: 'generic-wrapper',
        description: "Content injected before the page's main area.",
      },
      {
        name: 'default',
        type: 'default',
        isDefault: true,
        description: 'Default content slot',
      },
      {
        name: 'after-unnamed-slot',
        type: 'generic-wrapper',
        description: "Content injected after the page's main area.",
      },
    ],
  },
};

/**
 * Known components that can be ejected.
 * Derived from the registry.
 * @type {string[]}
 */
export const KNOWN_COMPONENTS = Object.keys(SLOT_REGISTRY)
  .filter((k) => k.startsWith('components/'))
  .map((k) => k.replace('components/', ''));

/**
 * Known layouts that can be ejected.
 * Derived from the registry.
 * @type {string[]}
 */
export const KNOWN_LAYOUTS = Object.keys(SLOT_REGISTRY)
  .filter((k) => k.startsWith('layouts/'))
  .map((k) => k.replace('layouts/', ''));

/**
 * Page registry — maps page name to its file path and component imports.
 * Derived from SLOT_REGISTRY + additional metadata.
 * @type {Record<string, { file: string, imports: { layouts: string[], components: string[] } }>}
 */
export const PAGE_REGISTRY = {
  index: {
    file: 'pages/index.astro',
    imports: {
      layouts: ['BaseLayout'],
      components: ['TabBar', 'FeedGrid', 'HomepageCTA'],
    },
  },
  profile: {
    file: 'pages/profile.astro',
    imports: { layouts: ['BaseLayout'], components: [] },
  },
  terms: {
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
