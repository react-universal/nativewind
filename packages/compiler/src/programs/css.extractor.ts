import { sheetEntriesToCss } from '@native-twin/css';
import * as Effect from 'effect/Effect';
import { BabelCompiler } from '../node/services/BabelCompiler.service.js';

export const TwinCSSExtractor = (code: string, filePath: string) =>
  Effect.flatMap(BabelCompiler, (babelBuilder) =>
    babelBuilder
      .getBabelOutput({
        _tag: 'BabelCodeEntry',
        code,
        filename: filePath,
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
