/**
 * Email theme configuration types for Community RSS.
 *
 * Provides a structured way to brand transactional emails without
 * editing templates directly. All properties are optional with sensible
 * defaults matching the framework's built-in email styles.
 *
 * Theme values are passed as Astro props to email templates, which
 * interpolate them directly into inline `style=""` attributes — no
 * CSS custom property resolution needed.
 *
 * @since 0.5.0
 */

// ─── Color Configuration ─────────────────────────────────────

/**
 * Email colour palette.
 *
 * @since 0.5.0
 */
export interface EmailThemeColors {
  /** Primary brand colour (headings, buttons). @default '#4f46e5' */
  primary?: string;
  /** Outer background colour. @default '#f9fafb' */
  background?: string;
  /** Inner card/surface background. @default '#ffffff' */
  surface?: string;
  /** Body text colour. @default '#374151' */
  text?: string;
  /** Muted/secondary text colour (disclaimers, footers). @default '#6b7280' */
  mutedText?: string;
  /** Border colour. @default '#e5e7eb' */
  border?: string;
  /** Button label text colour. @default '#ffffff' */
  buttonText?: string;
}

// ─── Typography Configuration ────────────────────────────────

/**
 * Email typography settings.
 *
 * @since 0.5.0
 */
export interface EmailThemeTypography {
  /** Font family stack. @default "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" */
  fontFamily?: string;
  /** Body text font size. @default '16px' */
  fontSize?: string;
  /** Heading (h1) font size. @default '20px' */
  headingSize?: string;
}

// ─── Spacing Configuration ───────────────────────────────────

/**
 * Email spacing and border-radius settings.
 *
 * @since 0.5.0
 */
export interface EmailThemeSpacing {
  /** Inner content padding. @default '32px' */
  contentPadding?: string;
  /** Card/container border-radius. @default '8px' */
  borderRadius?: string;
  /** Button border-radius. @default '8px' */
  buttonRadius?: string;
  /** Button padding. @default '12px 24px' */
  buttonPadding?: string;
}

// ─── Branding Configuration ──────────────────────────────────

/**
 * Email branding/logo settings.
 *
 * @since 0.5.0
 */
export interface EmailThemeBranding {
  /** URL to a logo image displayed in the email header. Optional. */
  logoUrl?: string;
  /** Alt text for the logo image. @default appName */
  logoAlt?: string;
  /** Logo image width attribute. @default '120px' */
  logoWidth?: string;
}

// ─── Combined Theme Interface ────────────────────────────────

/**
 * Email theme configuration.
 *
 * All properties are optional. Unspecified values use sensible
 * defaults that match the framework's built-in email styles.
 *
 * @since 0.5.0
 *
 * @example
 * ```typescript
 * const theme: EmailThemeConfig = {
 *   colors: { primary: '#e11d48', background: '#0f172a' },
 *   branding: { logoUrl: 'https://example.com/logo.png' },
 * };
 * ```
 */
export interface EmailThemeConfig {
  /** Colour palette overrides. */
  colors?: EmailThemeColors;
  /** Typography overrides. */
  typography?: EmailThemeTypography;
  /** Spacing and border-radius overrides. */
  spacing?: EmailThemeSpacing;
  /** Branding/logo configuration. */
  branding?: EmailThemeBranding;
}

// ─── Resolved Theme (all fields required) ────────────────────

/**
 * Fully resolved email theme with all defaults applied.
 *
 * @since 0.5.0
 */
export interface ResolvedEmailTheme {
  colors: Required<EmailThemeColors>;
  typography: Required<EmailThemeTypography>;
  spacing: Required<EmailThemeSpacing>;
  branding: {
    logoUrl?: string;
    logoAlt: string;
    logoWidth: string;
  };
}

// ─── Defaults ────────────────────────────────────────────────

/**
 * Default email theme values.
 *
 * These match the framework's original hardcoded email styles exactly,
 * ensuring a zero-config upgrade produces identical output.
 *
 * @since 0.5.0
 */
export const DEFAULT_EMAIL_THEME: ResolvedEmailTheme = {
  colors: {
    primary: '#4f46e5',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#374151',
    mutedText: '#6b7280',
    border: '#e5e7eb',
    buttonText: '#ffffff',
  },
  typography: {
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: '16px',
    headingSize: '20px',
  },
  spacing: {
    contentPadding: '32px',
    borderRadius: '8px',
    buttonRadius: '8px',
    buttonPadding: '12px 24px',
  },
  branding: {
    logoAlt: 'Community RSS',
    logoWidth: '120px',
  },
};

// ─── Merge Utility ───────────────────────────────────────────

/**
 * Deep-merges a partial email theme with the defaults.
 *
 * @param config - Partial theme configuration from the user
 * @param appName - Application name (used as default logo alt text)
 * @returns Fully resolved theme with all defaults applied
 * @since 0.5.0
 */
export function mergeEmailTheme(
  config?: EmailThemeConfig,
  appName: string = 'Community RSS',
): ResolvedEmailTheme {
  if (!config) {
    return { ...DEFAULT_EMAIL_THEME, branding: { ...DEFAULT_EMAIL_THEME.branding, logoAlt: appName } };
  }

  return {
    colors: {
      primary: config.colors?.primary ?? DEFAULT_EMAIL_THEME.colors.primary,
      background: config.colors?.background ?? DEFAULT_EMAIL_THEME.colors.background,
      surface: config.colors?.surface ?? DEFAULT_EMAIL_THEME.colors.surface,
      text: config.colors?.text ?? DEFAULT_EMAIL_THEME.colors.text,
      mutedText: config.colors?.mutedText ?? DEFAULT_EMAIL_THEME.colors.mutedText,
      border: config.colors?.border ?? DEFAULT_EMAIL_THEME.colors.border,
      buttonText: config.colors?.buttonText ?? DEFAULT_EMAIL_THEME.colors.buttonText,
    },
    typography: {
      fontFamily: config.typography?.fontFamily ?? DEFAULT_EMAIL_THEME.typography.fontFamily,
      fontSize: config.typography?.fontSize ?? DEFAULT_EMAIL_THEME.typography.fontSize,
      headingSize: config.typography?.headingSize ?? DEFAULT_EMAIL_THEME.typography.headingSize,
    },
    spacing: {
      contentPadding: config.spacing?.contentPadding ?? DEFAULT_EMAIL_THEME.spacing.contentPadding,
      borderRadius: config.spacing?.borderRadius ?? DEFAULT_EMAIL_THEME.spacing.borderRadius,
      buttonRadius: config.spacing?.buttonRadius ?? DEFAULT_EMAIL_THEME.spacing.buttonRadius,
      buttonPadding: config.spacing?.buttonPadding ?? DEFAULT_EMAIL_THEME.spacing.buttonPadding,
    },
    branding: {
      logoUrl: config.branding?.logoUrl,
      logoAlt: config.branding?.logoAlt ?? appName,
      logoWidth: config.branding?.logoWidth ?? DEFAULT_EMAIL_THEME.branding.logoWidth,
    },
  };
}
