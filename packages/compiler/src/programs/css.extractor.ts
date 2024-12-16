import { sheetEntriesToCss } from '@native-twin/css';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import { TwinPath } from '../internal/fs';
import { BabelCompilerContext } from '../services/BabelCompiler.service.js';
import { TwinDocumentsContext } from '../services/TwinDocuments.service.js';
import { TwinNodeContext } from '../services/TwinNodeContext.service.js';

export const TwinCSSExtractor = (code: string, filename: string) =>
  Effect.gen(function* () {
    const compiler = yield* BabelCompilerContext;
    const ctx = yield* TwinNodeContext;
    const twinPath = yield* TwinPath.TwinPath;
    const { getDocumentNodes, createDocument } = yield* TwinDocumentsContext;
    const document = yield* createDocument(
      twinPath.make.absoluteFromString(filename),
      code,
    );
    const compiled = yield* getDocumentNodes(document, 'web');
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
