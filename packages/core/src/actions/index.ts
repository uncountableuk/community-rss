/**
 * Community RSS — Action Handlers (barrel export)
 *
 * Re-exports all action handlers for use with Astro Actions.
 * Consumers import these from `@community-rss/core` and wire
 * them into `defineAction()` in their scaffolded `src/actions/index.ts`.
 *
 * @since 0.5.0
 */

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
