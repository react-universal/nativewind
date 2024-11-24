import { sheetEntriesToCss } from '@native-twin/css';
import * as Effect from 'effect/Effect';
import { BabelCompiler } from '../services/BabelCompiler.service.js';
import { ReactCompilerService } from '../services/ReactBabel.service.js';
import { TwinNodeContext } from '../services/TwinNodeContext.service.js';

export const TwinCSSExtractor = (code: string, filePath: string) =>
  Effect.gen(function* () {
    const twin = yield* TwinNodeContext;
    const reactBuilder = yield* ReactCompilerService;
    const babelBuilder = yield* BabelCompiler;

    return yield* Effect.Do.pipe(
      Effect.bind('ast', () => babelBuilder.getAST(code, filePath)),
      Effect.bind('trees', ({ ast }) => babelBuilder.getJSXElementTrees(ast, filePath)),
      Effect.bind('registry', ({ trees }) =>
        reactBuilder.getRegistry(trees, filePath, 'web'),
      ),
      Effect.bind('twinOutput', ({ registry }) =>
        reactBuilder.transformTress(registry, 'web'),
      ),
      Effect.let('cssOutput', () => sheetEntriesToCss(twin.tw.web.target)),
      Effect.bind('codeOutput', ({ ast }) => babelBuilder.buildFile(ast)),
    );
  });
