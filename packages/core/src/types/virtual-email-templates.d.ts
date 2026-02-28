/**
 * Type declaration for the `virtual:crss-email-templates` Vite virtual module.
 *
 * This module is generated at dev/build time by the Vite plugin in
 * `integration.ts`. It provides pre-compiled Astro email template
 * components that have been properly transformed through Vite's pipeline.
 *
 * Developer templates (from `emailTemplateDir`) take priority over
 * package built-in templates.
 *
 * @since 0.5.0
 */
declare module 'virtual:crss-email-templates' {
    /** Developer-owned Astro email templates, keyed by email type name (kebab-case). */
    export const devTemplates: Record<string, any>;
    /** Package built-in Astro email templates, keyed by email type name (kebab-case). */
    export const packageTemplates: Record<string, any>;
}
