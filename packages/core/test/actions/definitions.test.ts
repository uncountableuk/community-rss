import { describe, it, expect } from 'vitest';
import { coreActions } from '@actions/definitions';
import { z } from 'zod';

describe('coreActions definitions', () => {
  it('should export all 6 expected action definitions', () => {
    const expectedActions = [
      'fetchArticles',
      'checkEmail',
      'submitSignup',
      'updateProfile',
      'changeEmail',
      'confirmEmailChange',
    ];

    const actionKeys = Object.keys(coreActions);
    expect(actionKeys).toEqual(expect.arrayContaining(expectedActions));
    expect(actionKeys).toHaveLength(expectedActions.length);
  });

  it('should have valid Zod schemas for each action input', () => {
    for (const [name, def] of Object.entries(coreActions)) {
      expect(def.input).toBeDefined();
      expect(def.input instanceof z.ZodType).toBe(true);
      expect(typeof def.handler).toBe('function');
    }
  });

  it('fetchArticles input should accept page, limit, feedId, sort', () => {
    const result = coreActions.fetchArticles.input.safeParse({
      page: 1,
      limit: 20,
      feedId: 'abc',
      sort: 'newest',
    });
    expect(result.success).toBe(true);
  });

  it('fetchArticles input should accept empty object', () => {
    const result = coreActions.fetchArticles.input.safeParse({});
    expect(result.success).toBe(true);
  });

  it('checkEmail input should require valid email', () => {
    const valid = coreActions.checkEmail.input.safeParse({ email: 'test@example.com' });
    expect(valid.success).toBe(true);

    const invalid = coreActions.checkEmail.input.safeParse({ email: 'not-an-email' });
    expect(invalid.success).toBe(false);
  });

  it('submitSignup input should validate all required fields', () => {
    const valid = coreActions.submitSignup.input.safeParse({
      email: 'test@example.com',
      name: 'Test User',
      termsAccepted: true,
    });
    expect(valid.success).toBe(true);

    const missing = coreActions.submitSignup.input.safeParse({
      email: 'test@example.com',
    });
    expect(missing.success).toBe(false);
  });

  it('updateProfile input should require userId', () => {
    const valid = coreActions.updateProfile.input.safeParse({
      userId: 'user-123',
      name: 'New Name',
    });
    expect(valid.success).toBe(true);

    const missing = coreActions.updateProfile.input.safeParse({
      name: 'New Name',
    });
    expect(missing.success).toBe(false);
  });

  it('changeEmail input should validate email fields', () => {
    const valid = coreActions.changeEmail.input.safeParse({
      userId: 'user-123',
      currentEmail: 'old@example.com',
      newEmail: 'new@example.com',
    });
    expect(valid.success).toBe(true);
  });

  it('confirmEmailChange input should require token', () => {
    const valid = coreActions.confirmEmailChange.input.safeParse({
      token: 'abc123',
    });
    expect(valid.success).toBe(true);

    const empty = coreActions.confirmEmailChange.input.safeParse({
      token: '',
    });
    expect(empty.success).toBe(false);
  });
});
