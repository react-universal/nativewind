// @ts-expect-error
globalThis['__DEV__'] = false;

export * as languagePrograms from './programs';
export { getCompletionsForTokens } from './utils/completion.pipes';
export { getDocumentationMarkdown } from './utils/language.utils';

export { getCompletionEntryDetailsDisplayParts } from './utils/language.utils';
