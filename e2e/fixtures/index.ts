/**
 * Combined Playwright fixture exports for E2E tests.
 *
 * @since 0.5.0
 */

export {
    TEST_USER,
    TEST_ARTICLES,
    seedTestData,
    type TestUser,
    type TestArticle,
} from './seed';

export {
    getMagicLinkFromMailpit,
    clearMailpit,
    signInWithMagicLink,
} from './auth';
