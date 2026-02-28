import { describe, it, expect } from 'vitest';
import {
    DEFAULT_EMAIL_THEME,
    mergeEmailTheme,
} from '@core-types/email-theme';
import type { EmailThemeConfig, ResolvedEmailTheme } from '@core-types/email-theme';

describe('email-theme', () => {
    describe('DEFAULT_EMAIL_THEME', () => {
        it('should have all required colour fields', () => {
            expect(DEFAULT_EMAIL_THEME.colors.primary).toBe('#4f46e5');
            expect(DEFAULT_EMAIL_THEME.colors.background).toBe('#f9fafb');
            expect(DEFAULT_EMAIL_THEME.colors.surface).toBe('#ffffff');
            expect(DEFAULT_EMAIL_THEME.colors.text).toBe('#374151');
            expect(DEFAULT_EMAIL_THEME.colors.mutedText).toBe('#6b7280');
            expect(DEFAULT_EMAIL_THEME.colors.border).toBe('#e5e7eb');
            expect(DEFAULT_EMAIL_THEME.colors.buttonText).toBe('#ffffff');
        });

        it('should have all required typography fields', () => {
            expect(DEFAULT_EMAIL_THEME.typography.fontFamily).toContain('system-ui');
            expect(DEFAULT_EMAIL_THEME.typography.fontSize).toBe('16px');
            expect(DEFAULT_EMAIL_THEME.typography.headingSize).toBe('20px');
        });

        it('should have all required spacing fields', () => {
            expect(DEFAULT_EMAIL_THEME.spacing.contentPadding).toBe('32px');
            expect(DEFAULT_EMAIL_THEME.spacing.borderRadius).toBe('8px');
            expect(DEFAULT_EMAIL_THEME.spacing.buttonRadius).toBe('8px');
            expect(DEFAULT_EMAIL_THEME.spacing.buttonPadding).toBe('12px 24px');
        });

        it('should have branding fields with defaults', () => {
            expect(DEFAULT_EMAIL_THEME.branding.logoUrl).toBeUndefined();
            expect(DEFAULT_EMAIL_THEME.branding.logoAlt).toBe('Community RSS');
            expect(DEFAULT_EMAIL_THEME.branding.logoWidth).toBe('120px');
        });
    });

    describe('mergeEmailTheme', () => {
        it('should return defaults when no config provided', () => {
            const result = mergeEmailTheme();
            expect(result).toEqual(DEFAULT_EMAIL_THEME);
        });

        it('should return defaults when undefined config provided', () => {
            const result = mergeEmailTheme(undefined);
            expect(result).toEqual(DEFAULT_EMAIL_THEME);
        });

        it('should return defaults when empty config provided', () => {
            const result = mergeEmailTheme({});
            expect(result).toEqual(DEFAULT_EMAIL_THEME);
        });

        it('should merge partial colour overrides', () => {
            const config: EmailThemeConfig = {
                colors: { primary: '#e11d48' },
            };
            const result = mergeEmailTheme(config);
            expect(result.colors.primary).toBe('#e11d48');
            expect(result.colors.background).toBe('#f9fafb'); // default preserved
            expect(result.colors.surface).toBe('#ffffff'); // default preserved
        });

        it('should merge partial typography overrides', () => {
            const config: EmailThemeConfig = {
                typography: { fontSize: '14px' },
            };
            const result = mergeEmailTheme(config);
            expect(result.typography.fontSize).toBe('14px');
            expect(result.typography.fontFamily).toContain('system-ui');
        });

        it('should merge partial spacing overrides', () => {
            const config: EmailThemeConfig = {
                spacing: { borderRadius: '4px' },
            };
            const result = mergeEmailTheme(config);
            expect(result.spacing.borderRadius).toBe('4px');
            expect(result.spacing.contentPadding).toBe('32px');
        });

        it('should merge branding overrides', () => {
            const config: EmailThemeConfig = {
                branding: { logoUrl: 'https://example.com/logo.png', logoAlt: 'My Logo' },
            };
            const result = mergeEmailTheme(config);
            expect(result.branding.logoUrl).toBe('https://example.com/logo.png');
            expect(result.branding.logoAlt).toBe('My Logo');
            expect(result.branding.logoWidth).toBe('120px'); // default preserved
        });

        it('should use appName as default logoAlt', () => {
            const result = mergeEmailTheme({}, 'My Community');
            expect(result.branding.logoAlt).toBe('My Community');
        });

        it('should prefer explicit logoAlt over appName', () => {
            const config: EmailThemeConfig = {
                branding: { logoAlt: 'Custom Alt' },
            };
            const result = mergeEmailTheme(config, 'My Community');
            expect(result.branding.logoAlt).toBe('Custom Alt');
        });

        it('should merge all categories simultaneously', () => {
            const config: EmailThemeConfig = {
                colors: { primary: '#000000', background: '#111111' },
                typography: { fontSize: '18px' },
                spacing: { buttonPadding: '16px 32px' },
                branding: { logoUrl: 'https://example.com/logo.svg' },
            };
            const result = mergeEmailTheme(config, 'TestApp');

            expect(result.colors.primary).toBe('#000000');
            expect(result.colors.background).toBe('#111111');
            expect(result.colors.text).toBe('#374151'); // default
            expect(result.typography.fontSize).toBe('18px');
            expect(result.typography.headingSize).toBe('20px'); // default
            expect(result.spacing.buttonPadding).toBe('16px 32px');
            expect(result.spacing.borderRadius).toBe('8px'); // default
            expect(result.branding.logoUrl).toBe('https://example.com/logo.svg');
            expect(result.branding.logoAlt).toBe('TestApp');
        });

        it('should not mutate input config', () => {
            const config: EmailThemeConfig = {
                colors: { primary: '#e11d48' },
            };
            const configCopy = JSON.parse(JSON.stringify(config));
            mergeEmailTheme(config);
            expect(config).toEqual(configCopy);
        });

        it('should return a new object each call', () => {
            const a = mergeEmailTheme();
            const b = mergeEmailTheme();
            expect(a).not.toBe(b);
            expect(a).toEqual(b);
        });
    });
});
