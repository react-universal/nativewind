import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { getDocumentLanguageLocations } from './extractors/classNames.extractor.js';

export interface LanguageInput {
  code: string;
}
export class LanguageCompiler extends Effect.Service<LanguageCompiler>()(
  'language/compiler',
  {
    effect: Effect.sync(() => getDocumentLanguageLocations),
  },
) {
  static Live = Layer.succeed(LanguageCompiler, LanguageCompiler.Service);
}
