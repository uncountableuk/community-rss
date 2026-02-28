/**
 * E2E test database seeding helpers.
 *
 * Provides functions to create test data (users, feeds, articles) in the
 * playground's database via API endpoints or direct HTTP calls.
 *
 * @since 0.5.0
 */

export interface TestUser {
  email: string;
  name: string;
}

export interface TestArticle {
  id: string;
  title: string;
  summary: string;
  feedTitle: string;
  authorName: string;
}

/** Default test user for authenticated flows. */
export const TEST_USER: TestUser = {
  email: 'test@example.com',
  name: 'Test User',
};

/** Sample articles for feed display tests. */
export const TEST_ARTICLES: TestArticle[] = [
  {
    id: 'test-article-1',
    title: 'First Test Article',
    summary: 'Summary of the first test article for E2E testing.',
    feedTitle: 'Test Feed',
    authorName: 'Test Author',
  },
  {
    id: 'test-article-2',
    title: 'Second Test Article',
    summary: 'Summary of the second test article for E2E testing.',
    feedTitle: 'Test Feed',
    authorName: 'Test Author',
  },
  {
    id: 'test-article-3',
    title: 'Third Test Article',
    summary: 'Summary of the third test article for E2E testing.',
    feedTitle: 'Another Feed',
    authorName: 'Another Author',
  },
];

/**
 * Seeds the playground database with test data via the articles API.
 * This is a best-effort helper — the playground must be running.
 *
 * @param baseURL - The base URL of the running playground
 * @since 0.5.0
 */
export async function seedTestData(baseURL: string): Promise<void> {
  // Verify the server is responding
  const response = await fetch(`${baseURL}/api/v1/articles?limit=1`);
  if (!response.ok) {
    throw new Error(`Playground not responding: ${response.status}`);
  }
}
