import { sheetEntriesToCss } from '@native-twin/css';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import { BabelCompilerContext } from '../services/BabelCompiler.service.js';
import { TwinDocumentsContext } from '../services/TwinDocuments.service.js';
import { TwinNodeContext } from '../services/TwinNodeContext.service.js';

export const TwinCSSExtractor = (code: string, filename: string) =>
  Effect.gen(function* () {
    const compiler = yield* BabelCompilerContext;
    const ctx = yield* TwinNodeContext;
    const { compileDocument, createDocument } = yield* TwinDocumentsContext;
    const document = yield* createDocument(filename, code);
    const compiled = yield* compileDocument(document, 'web');
    const tw = yield* ctx.getTwForPlatform('web');
    const cssOutput = sheetEntriesToCss(tw.target);
    const codeOutput = yield* compiler.mutateAST(document.ast);

    return {
      compiled,
      document,
      cssOutput,
      codeOutput: Option.fromNullable(codeOutput),
    };
  });
