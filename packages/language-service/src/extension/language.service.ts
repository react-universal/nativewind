import { Effect, Layer } from 'effect';
import { getDocumentLanguageLocations } from './extractors/classNames.extractor';

export interface LanguageInput {
  code: string;
}
export class LanguageCompiler extends Effect.Service<LanguageCompiler>()(
  'language/compiler',
  {
    effect: Effect.gen(function* () {
      return {
        getDocumentLanguageLocations,
      };
    }),
  },
) {
  static Live = Layer.succeed(LanguageCompiler, LanguageCompiler.Service);
}
