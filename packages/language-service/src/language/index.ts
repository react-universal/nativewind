import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { NativeTwinManagerService } from '../native-twin';
import { LanguageDiagnostics } from './diagnostics.service';
import { LanguageDocumentation } from './language-documentation.service';
import { LanguageCompletions } from './language.service';

// @ts-expect-error
globalThis['__DEV__'] = false;

export const createLanguageService = Effect.scoped(
  Effect.gen(function* () {
    const completions = yield* LanguageCompletions;
    const diagnostics = yield* LanguageDiagnostics;
    const documentation = yield* LanguageDocumentation;
    return {
      completions,
      diagnostics,
      documentation,
    };
  }),
);

export const LanguageServiceLive = Layer.mergeAll(
  LanguageCompletions.Live,
  LanguageDocumentation.Live,
  LanguageDiagnostics.Live,
).pipe(Layer.provideMerge(NativeTwinManagerService.Live));

export * from './programs';
export { getCompletionsForTokens } from './utils/completion.pipes';
export { getDocumentationMarkdown } from './utils/language.utils';
export { LanguageDocumentation, LanguageCompletions, LanguageDiagnostics };
export { getCompletionEntryDetailsDisplayParts } from './utils/language.utils';