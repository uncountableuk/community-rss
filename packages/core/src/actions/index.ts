/**
 * Community RSS — Action Handlers (barrel export)
 *
 * Re-exports all action handlers for use with Astro Actions.
 * Consumers import these from `@community-rss/core` and wire
 * them into `defineAction()` in their scaffolded `src/actions/index.ts`.
 *
 * The recommended approach (0.6.0+) is to use `coreActions` spread:
 * ```typescript
 * import { coreActions } from '@community-rss/core/actions';
 * export const server = { ...coreActions };
 * ```
 *
 * @since 0.5.0
 */

export { coreActions, type ActionDefinition } from './definitions';

export {
    fetchArticlesHandler,
    type FetchArticlesInput,
    type FetchArticlesOutput,
} from './articles';

export {
    checkEmailHandler,
    submitSignupHandler,
    type CheckEmailInput,
    type CheckEmailOutput,
    type SubmitSignupInput,
    type SubmitSignupOutput,
} from './auth';

export {
    updateProfileHandler,
    changeEmailHandler,
    confirmEmailChangeHandler,
    type UpdateProfileInput,
    type UpdateProfileOutput,
    type ChangeEmailInput,
    type ChangeEmailOutput,
    type ConfirmEmailChangeInput,
    type ConfirmEmailChangeOutput,
} from './profile';
