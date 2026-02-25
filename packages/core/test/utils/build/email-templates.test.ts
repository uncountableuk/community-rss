import { describe, it, expect } from 'vitest';
import {
    signInTemplate,
    welcomeTemplate,
    emailChangeTemplate,
    emailLayout,
    greeting,
    actionButton,
    disclaimer,
    defaultTemplates,
} from '@utils/build/email-templates';
import type { EmailTemplateContext } from '@core-types/email';

describe('email-templates', () => {
    const baseContext: EmailTemplateContext = {
        appName: 'Test App',
        email: 'user@example.com',
    };

    const contextWithProfile: EmailTemplateContext = {
        appName: 'Test App',
        email: 'jim@example.com',
        profile: {
            name: 'Jim',
            email: 'jim@example.com',
            avatarUrl: 'https://example.com/avatar.jpg',
        },
    };

    // ─── Layout Helpers ──────────────────────────────────────

    describe('emailLayout', () => {
        it('should wrap body in HTML document with charset and styling', () => {
            const html = emailLayout('<p>Hello</p>');
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('<meta charset="utf-8">');
            expect(html).toContain('font-family: system-ui');
            expect(html).toContain('max-width: 600px');
            expect(html).toContain('<p>Hello</p>');
        });
    });

    describe('greeting', () => {
        it('should use profile name when available', () => {
            expect(greeting(contextWithProfile)).toBe('Hi Jim,');
        });

        it('should fall back to generic greeting without profile', () => {
            expect(greeting(baseContext)).toBe('Hi there,');
        });

        it('should fall back when profile has no name', () => {
            const ctx: EmailTemplateContext = {
                ...baseContext,
                profile: { email: 'x@y.com' },
            };
            expect(greeting(ctx)).toBe('Hi there,');
        });
    });

    describe('actionButton', () => {
        it('should render a styled link button', () => {
            const html = actionButton('https://example.com/verify', 'Click Me');
            expect(html).toContain('href="https://example.com/verify"');
            expect(html).toContain('Click Me');
            expect(html).toContain('background-color: #4f46e5');
            expect(html).toContain('border-radius: 8px');
        });
    });

    describe('disclaimer', () => {
        it('should render muted text', () => {
            const html = disclaimer('This link expires soon.');
            expect(html).toContain('color: #6b7280');
            expect(html).toContain('font-size: 14px');
            expect(html).toContain('This link expires soon.');
        });
    });

    // ─── Sign-In Template ────────────────────────────────────

    describe('signInTemplate', () => {
        it('should generate email with sign-in subject', () => {
            const result = signInTemplate(baseContext, { url: 'https://example.com/verify?token=abc' });
            expect(result.subject).toBe('Sign in to Test App');
        });

        it('should include magic link URL in both html and text', () => {
            const url = 'https://example.com/verify?token=abc';
            const result = signInTemplate(baseContext, { url });
            expect(result.html).toContain(url);
            expect(result.text).toContain(url);
        });

        it('should use generic greeting without profile', () => {
            const result = signInTemplate(baseContext, { url: 'https://example.com/verify' });
            expect(result.html).toContain('Hi there,');
            expect(result.text).toContain('Hi there,');
        });

        it('should personalise greeting with profile name', () => {
            const result = signInTemplate(contextWithProfile, { url: 'https://example.com/verify' });
            expect(result.html).toContain('Hi Jim,');
            expect(result.text).toContain('Hi Jim,');
        });

        it('should mention 60-minute link expiry', () => {
            const result = signInTemplate(baseContext, { url: 'https://example.com' });
            expect(result.html).toContain('60 minutes');
            expect(result.text).toContain('60 minutes');
        });

        it('should include Sign In button in HTML', () => {
            const result = signInTemplate(baseContext, { url: 'https://example.com' });
            expect(result.html).toContain('Sign In');
        });

        it('should wrap content in email layout', () => {
            const result = signInTemplate(baseContext, { url: 'https://example.com' });
            expect(result.html).toContain('<!DOCTYPE html>');
            expect(result.html).toContain('<meta charset="utf-8">');
        });
    });

    // ─── Welcome Template ────────────────────────────────────

    describe('welcomeTemplate', () => {
        it('should generate email with welcome subject', () => {
            const result = welcomeTemplate(baseContext, { url: 'https://example.com/verify' });
            expect(result.subject).toBe('Welcome to Test App! Verify your account');
        });

        it('should include verification URL in both html and text', () => {
            const url = 'https://example.com/verify?token=abc';
            const result = welcomeTemplate(baseContext, { url });
            expect(result.html).toContain(url);
            expect(result.text).toContain(url);
        });

        it('should personalise greeting with profile name', () => {
            const result = welcomeTemplate(contextWithProfile, { url: 'https://example.com/verify' });
            expect(result.html).toContain('Hi Jim,');
            expect(result.text).toContain('Hi Jim,');
        });

        it('should use "Verify & Get Started" button label', () => {
            const result = welcomeTemplate(baseContext, { url: 'https://example.com' });
            expect(result.html).toContain('Verify & Get Started');
        });

        it('should mention account verification', () => {
            const result = welcomeTemplate(baseContext, { url: 'https://example.com' });
            expect(result.html).toContain('almost ready');
            expect(result.text).toContain('Welcome to Test App!');
        });
    });

    // ─── Email Change Template ───────────────────────────────

    describe('emailChangeTemplate', () => {
        it('should generate email with confirm subject', () => {
            const result = emailChangeTemplate(baseContext, { verificationUrl: 'https://example.com/confirm' });
            expect(result.subject).toBe('Confirm your new email address — Test App');
        });

        it('should include verification URL in both html and text', () => {
            const url = 'https://example.com/confirm?token=abc';
            const result = emailChangeTemplate(baseContext, { verificationUrl: url });
            expect(result.html).toContain(url);
            expect(result.text).toContain(url);
        });

        it('should personalise greeting with profile name', () => {
            const result = emailChangeTemplate(contextWithProfile, { verificationUrl: 'https://example.com' });
            expect(result.html).toContain('Hi Jim,');
            expect(result.text).toContain('Hi Jim,');
        });

        it('should mention 24-hour expiry', () => {
            const result = emailChangeTemplate(baseContext, { verificationUrl: 'https://example.com' });
            expect(result.html).toContain('24 hours');
            expect(result.text).toContain('24 hours');
        });

        it('should mention that current email remains active', () => {
            const result = emailChangeTemplate(baseContext, { verificationUrl: 'https://example.com' });
            expect(result.html).toContain('current email remains active');
            expect(result.text).toContain('current email remains active');
        });

        it('should include Confirm Email Change button', () => {
            const result = emailChangeTemplate(baseContext, { verificationUrl: 'https://example.com' });
            expect(result.html).toContain('Confirm Email Change');
        });
    });

    // ─── Default Templates Registry ─────────────────────────

    describe('defaultTemplates', () => {
        it('should include all three built-in email types', () => {
            expect(defaultTemplates['sign-in']).toBeDefined();
            expect(defaultTemplates['welcome']).toBeDefined();
            expect(defaultTemplates['email-change']).toBeDefined();
        });

        it('should map to the correct template functions', () => {
            expect(defaultTemplates['sign-in']).toBe(signInTemplate);
            expect(defaultTemplates['welcome']).toBe(welcomeTemplate);
            expect(defaultTemplates['email-change']).toBe(emailChangeTemplate);
        });
    });
});
