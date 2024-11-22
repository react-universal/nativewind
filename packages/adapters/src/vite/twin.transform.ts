import { sheetEntriesToCss } from '@native-twin/css';
import * as Effect from 'effect/Effect';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import { BabelCompiler, ReactCompilerService } from '@native-twin/compiler/babel';
import { makeNodeLayer, TwinNodeContext } from '@native-twin/compiler/node';

export interface TwinVitePluginConfig {
  inputCSS: string;
  outputCSS: string;
  projectRoot?: string;
  twinConfigPath: string;
}

const extractor = (config: TwinVitePluginConfig) => (code: string, filePath: string) =>
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
      Effect.flatMap((compiled) =>
        Effect.gen(function* () {
          const outputExists = fs.existsSync(config.outputCSS);
          if (!outputExists) return compiled;

          yield* Effect.promise(() =>
            fsp.writeFile(config.outputCSS, compiled.cssOutput),
          );
          console.log('RESULT____: ', compiled.cssOutput);
          return compiled;
        }),
      ),
    );
  });

export const createTwinExtractor = (viteConfig: TwinVitePluginConfig) => {
  const nodeLayer = makeNodeLayer({
    configPath: viteConfig.twinConfigPath,
    debug: true,
    inputCSS: viteConfig.inputCSS,
    projectRoot: viteConfig.projectRoot,
  });
  const runExtractorEffect = extractor(viteConfig);

  const runtime = nodeLayer.executor;
  return {
    viteConfig,
    runtime,
    extractor: async (code: string, filePath: string) => {
      return runExtractorEffect(code, filePath).pipe(runtime.runPromise);
    },
  };
};

// const config = makeBabelConfig({
//   code,
//   filename: filepath,
//   inputCSS: `${projectRoot}/input.css`,
//   outputCSS: `${projectRoot}/public/output.css`,
//   platform: 'web',
//   projectRoot,
//   twinConfigPath: 'tailwind.config.ts',
// });
