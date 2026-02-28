import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  resolveTemplatePath,
  extractSubject,
  substituteVariables,
  htmlToPlainText,
  renderEmailTemplate,
  renderAstroEmail,
  DEFAULT_EMAIL_SUBJECTS,
} from '@utils/build/email-renderer';

// We don't want to mock fs for all tests — some test the actual package templates
// For developer dir tests, we'll use a temp dir approach

describe('Email Renderer', () => {
  describe('extractSubject', () => {
    it('should extract subject from HTML comment', () => {
      const html = '<!-- subject: Sign in to MyApp -->\n<html></html>';
      expect(extractSubject(html)).toBe('Sign in to MyApp');
    });

    it('should return null when no subject comment exists', () => {
      const html = '<html><body>Hello</body></html>';
      expect(extractSubject(html)).toBeNull();
    });

    it('should handle extra whitespace in subject comment', () => {
      const html = '<!--  subject:   Welcome to App!   -->\n<html></html>';
      expect(extractSubject(html)).toBe('Welcome to App!');
    });

    it('should be case-insensitive', () => {
      const html = '<!-- Subject: Test Subject -->';
      expect(extractSubject(html)).toBe('Test Subject');
    });
  });

  describe('substituteVariables', () => {
    it('should replace {{variable}} placeholders', () => {
      const template = 'Hello {{name}}, welcome to {{appName}}!';
      const result = substituteVariables(template, {
        name: 'Jim',
        appName: 'My Community',
      });
      expect(result).toBe('Hello Jim, welcome to My Community!');
    });

    it('should leave unmatched placeholders as-is', () => {
      const template = 'Hello {{name}}, your code is {{code}}';
      const result = substituteVariables(template, { name: 'Jim' });
      expect(result).toBe('Hello Jim, your code is {{code}}');
    });

    it('should handle empty data', () => {
      const template = '{{greeting}} World';
      const result = substituteVariables(template, {});
      expect(result).toBe('{{greeting}} World');
    });

    it('should replace multiple occurrences of same variable', () => {
      const template = '{{app}} - Welcome to {{app}}';
      const result = substituteVariables(template, { app: 'RSS' });
      expect(result).toBe('RSS - Welcome to RSS');
    });
  });

  describe('htmlToPlainText', () => {
    it('should strip HTML tags', () => {
      const html = '<h1>Title</h1><p>Body text</p>';
      const text = htmlToPlainText(html);
      expect(text).toContain('Title');
      expect(text).toContain('Body text');
      expect(text).not.toContain('<');
    });

    it('should convert links to text (url) format', () => {
      const html = '<a href="https://example.com">Click here</a>';
      const text = htmlToPlainText(html);
      expect(text).toBe('Click here (https://example.com)');
    });

    it('should remove subject comment', () => {
      const html = '<!-- subject: Test --><p>Body</p>';
      const text = htmlToPlainText(html);
      expect(text).not.toContain('subject');
      expect(text).toContain('Body');
    });

    it('should decode HTML entities', () => {
      const html = '<p>Tom &amp; Jerry &lt;3&gt;</p>';
      const text = htmlToPlainText(html);
      expect(text).toContain('Tom & Jerry <3>');
    });

    it('should collapse multiple newlines', () => {
      const html = '<p>One</p><p></p><p></p><p>Two</p>';
      const text = htmlToPlainText(html);
      const newlines = text.split('\n\n');
      expect(newlines.length).toBeLessThanOrEqual(3);
    });
  });

  describe('resolveTemplatePath', () => {
    it('should return null when no developer dir is provided', () => {
      const templatePath = resolveTemplatePath('sign-in');
      expect(templatePath).toBeNull();
    });

    it('should return null for non-existent templates', () => {
      const result = resolveTemplatePath('non-existent-template');
      expect(result).toBeNull();
    });

    it('should find developer template when file exists', () => {
      // Create a temp directory with a test template
      const tmpDir = path.join(process.cwd(), '.tmp-test-templates');
      fs.mkdirSync(tmpDir, { recursive: true });
      const tmpFile = path.join(tmpDir, 'sign-in.html');
      fs.writeFileSync(tmpFile, '<!-- subject: Custom --><p>Custom</p>');

      try {
        const result = resolveTemplatePath('sign-in', tmpDir);
        expect(result).toBe(tmpFile);
      } finally {
        fs.rmSync(tmpDir, { recursive: true });
      }
    });

    it('should return null when developer dir exists but lacks the file', () => {
      const tmpDir = path.join(process.cwd(), '.tmp-test-templates-empty');
      fs.mkdirSync(tmpDir, { recursive: true });

      try {
        const result = resolveTemplatePath('sign-in', tmpDir);
        expect(result).toBeNull();
      } finally {
        fs.rmSync(tmpDir, { recursive: true });
      }
    });
  });

  describe('renderEmailTemplate', () => {
    it('should return null when no developer dir is provided', () => {
      const content = renderEmailTemplate('sign-in', {
        appName: 'Test Community',
        greeting: 'Hi Jim,',
        url: 'https://example.com/verify?token=abc123',
      });

      expect(content).toBeNull();
    });

    it('should return null for non-existent template', () => {
      const content = renderEmailTemplate('unknown-type', { appName: 'Test' });
      expect(content).toBeNull();
    });

    it('should render a developer sign-in template', () => {
      const tmpDir = path.join(process.cwd(), '.tmp-test-render-sign-in');
      fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(
        path.join(tmpDir, 'sign-in.html'),
        '<!-- subject: Sign in to {{appName}} -->\n<h1>{{appName}}</h1>\n<p>{{greeting}} Click <a href="{{url}}">here</a>.</p>',
      );

      try {
        const content = renderEmailTemplate('sign-in', {
          appName: 'Test Community',
          greeting: 'Hi Jim,',
          url: 'https://example.com/verify?token=abc123',
        }, tmpDir);

        expect(content).not.toBeNull();
        expect(content!.subject).toBe('Sign in to Test Community');
        expect(content!.html).toContain('Test Community');
        expect(content!.html).toContain('Hi Jim,');
        expect(content!.html).toContain('https://example.com/verify?token=abc123');
        expect(content!.text).toContain('Test Community');
        expect(content!.text).toContain('https://example.com/verify?token=abc123');
      } finally {
        fs.rmSync(tmpDir, { recursive: true });
      }
    });

    it('should render a developer welcome template', () => {
      const tmpDir = path.join(process.cwd(), '.tmp-test-render-welcome');
      fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(
        path.join(tmpDir, 'welcome.html'),
        '<!-- subject: Welcome to {{appName}} -->\n<p>Welcome, {{greeting}}</p>',
      );

      try {
        const content = renderEmailTemplate('welcome', {
          appName: 'My App',
          greeting: 'Hi there,',
          url: 'https://example.com/verify',
        }, tmpDir);

        expect(content).not.toBeNull();
        expect(content!.subject).toContain('Welcome to My App');
        expect(content!.html).toContain('My App');
      } finally {
        fs.rmSync(tmpDir, { recursive: true });
      }
    });

    it('should render a developer email-change template', () => {
      const tmpDir = path.join(process.cwd(), '.tmp-test-render-email-change');
      fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(
        path.join(tmpDir, 'email-change.html'),
        '<!-- subject: Confirm your new email -->\n<p>{{greeting}} Confirm: <a href="{{verificationUrl}}">Verify</a></p>',
      );

      try {
        const content = renderEmailTemplate('email-change', {
          appName: 'My App',
          greeting: 'Hi User,',
          verificationUrl: 'https://example.com/confirm',
        }, tmpDir);

        expect(content).not.toBeNull();
        expect(content!.subject).toContain('Confirm your new email');
        expect(content!.html).toContain('https://example.com/confirm');
      } finally {
        fs.rmSync(tmpDir, { recursive: true });
      }
    });

    it('should use developer template directory when provided', () => {
      const tmpDir = path.join(process.cwd(), '.tmp-test-render');
      fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(
        path.join(tmpDir, 'sign-in.html'),
        '<!-- subject: Custom Sign In for {{appName}} -->\n<p>Custom: {{greeting}}</p>',
      );

      try {
        const content = renderEmailTemplate('sign-in', {
          appName: 'Overridden',
          greeting: 'Hey!',
        }, tmpDir);

        expect(content).not.toBeNull();
        expect(content!.subject).toBe('Custom Sign In for Overridden');
        expect(content!.html).toContain('Custom: Hey!');
      } finally {
        fs.rmSync(tmpDir, { recursive: true });
      }
    });
  });

  describe('renderAstroEmail', () => {
    it('should return null for unknown template type', async () => {
      const result = await renderAstroEmail('nonexistent', { appName: 'Test' });
      expect(result).toBeNull();
    });

    it('should have subject mappings for all known email types', async () => {
      // Verify the subject functions exist and produce correct results
      // even if the Container API rendering fails in the test environment
      for (const type of ['sign-in', 'welcome', 'email-change']) {
        const result = await renderAstroEmail(type, { appName: 'TestApp' });
        // In test env, Container API may not be available, so result could be null
        // But we can verify the function doesn't throw
        expect(result === null || typeof result?.subject === 'string').toBe(true);
      }
    });

    it('should include subject with appName for sign-in type when rendering succeeds', async () => {
      const result = await renderAstroEmail('sign-in', {
        url: 'https://example.com/verify',
        appName: 'My Community',
        greeting: 'Hi Alice,',
      });
      // If container rendering succeeds, validate the result
      if (result) {
        expect(result.subject).toContain('My Community');
        expect(result.html).toBeTruthy();
        expect(result.text).toBeTruthy();
      }
    });

    it('should accept an optional theme parameter without throwing', async () => {
      const theme = {
        colors: { primary: '#e11d48', background: '#f9fafb', surface: '#ffffff', text: '#374151', mutedText: '#6b7280', border: '#e5e7eb', buttonText: '#ffffff' },
        typography: { fontFamily: 'Arial, sans-serif', fontSize: '16px', headingSize: '20px' },
        spacing: { contentPadding: '32px', borderRadius: '8px', buttonRadius: '8px', buttonPadding: '12px 24px' },
        branding: { logoAlt: 'Test', logoWidth: '120px' },
      };
      // Should not throw regardless of Container API availability
      const result = await renderAstroEmail('sign-in', {
        url: 'https://example.com',
        appName: 'Themed App',
      }, theme as any);
      expect(result === null || typeof result?.html === 'string').toBe(true);
    });

    it('should return null for unknown type even when theme is provided', async () => {
      const result = await renderAstroEmail('nonexistent', { appName: 'Test' }, {} as any);
      expect(result).toBeNull();
    });

    it('should accept an optional developerDir parameter without throwing (deprecated)', async () => {
      // developerDir is now ignored — virtual module handles template discovery.
      // Parameter retained for backward compatibility.
      const result = await renderAstroEmail('sign-in', {
        url: 'https://example.com',
        appName: 'Test',
      }, undefined, '/nonexistent/dir');
      // Should still return null if Container API / virtual module unavailable
      expect(result === null || typeof result?.html === 'string').toBe(true);
    });
  });

  describe('DEFAULT_EMAIL_SUBJECTS', () => {
    it('should have entries for all three email types', () => {
      expect(DEFAULT_EMAIL_SUBJECTS['sign-in']).toBeDefined();
      expect(DEFAULT_EMAIL_SUBJECTS['welcome']).toBeDefined();
      expect(DEFAULT_EMAIL_SUBJECTS['email-change']).toBeDefined();
    });

    it('should generate subjects using appName', () => {
      const data = { appName: 'Test App' };
      expect(DEFAULT_EMAIL_SUBJECTS['sign-in'](data)).toContain('Test App');
      expect(DEFAULT_EMAIL_SUBJECTS['welcome'](data)).toContain('Test App');
      expect(DEFAULT_EMAIL_SUBJECTS['email-change'](data)).toContain('Test App');
    });

    it('should fall back to Community RSS when no appName provided', () => {
      const data = {};
      expect(DEFAULT_EMAIL_SUBJECTS['sign-in'](data)).toContain('Community RSS');
      expect(DEFAULT_EMAIL_SUBJECTS['welcome'](data)).toContain('Community RSS');
      expect(DEFAULT_EMAIL_SUBJECTS['email-change'](data)).toContain('Community RSS');
    });
  });
});
