import { sheetEntriesToCss } from '@native-twin/css';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import { TwinPath } from '../internal/fs';
import { TwinFileContext } from '../services/TwinFile.service';
import { TwinNodeContext } from '../services/TwinNodeContext.service.js';

export const TwinCSSExtractor = (code: string, filename: string) =>
  Effect.gen(function* () {
    const ctx = yield* TwinNodeContext;
    const twinPath = yield* TwinPath.TwinPath;
    const { getTwinFile } = yield* TwinFileContext;
    const document = yield* getTwinFile(
      twinPath.make.absoluteFromString(filename),
      Option.some(code),
    );
    // const compiled = yield* getDocumentNodes(document, 'web');
    const tw = yield* ctx.getTwForPlatform('web');
    const cssOutput = sheetEntriesToCss(tw.target);

    return {
      // compiled,
      document,
      cssOutput,
      // codeOutput: Option.fromNullable(codeOutput),
    };
  });
