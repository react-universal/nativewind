import { sheetEntriesToCss } from '@native-twin/css';
import * as Effect from 'effect/Effect';
import { BabelCompilerContext } from '../services/BabelCompiler.service.js';

export const TwinCSSExtractor = (code: string, filename: string) =>
  Effect.flatMap(BabelCompilerContext, (babelBuilder) =>
    babelBuilder
      .getBabelOutput({
        _tag: 'BabelCodeEntry',
        code,
        filename,
        platform: 'web',
      })
      .pipe(
        Effect.bind('twinOutput', ({ treeNodes, platform }) =>
          babelBuilder.transformAST(treeNodes, platform),
        ),
        Effect.let('cssOutput', ({ tw }) => sheetEntriesToCss(tw.target)),
        Effect.bind('codeOutput', ({ ast }) => babelBuilder.mutateAST(ast)),
      ),
  );
