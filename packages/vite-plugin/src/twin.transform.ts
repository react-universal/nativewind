import * as Effect from 'effect/Effect';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import {
  CompilerConfig,
  NodeMainLayer,
  setConfigLayerFromUser,
} from '@native-twin/compiler/node';
import { TwinNodeContext } from '@native-twin/compiler/node';
import { TwinCSSExtractor } from '@native-twin/compiler/programs/css.extractor';

export interface TwinVitePluginConfig {
  inputCSS: string;
  outputCSS: string;
  projectRoot?: string;
  twinConfigPath: string;
}

const extractor = (config: TwinVitePluginConfig) => (code: string, filePath: string) =>
  Effect.gen(function* () {
    const ctx = yield* TwinNodeContext;
    const compilerConfig = yield* CompilerConfig;
    console.log('ALLOWED_PATHS: ', compilerConfig);

    if (!ctx.utils.isAllowedPath(filePath)) {
      return;
    }

    const compiled = yield* TwinCSSExtractor(code, filePath);
    yield* Effect.log('ALLOWED_PATH: ', filePath);
    const outputExists = fs.existsSync(config.outputCSS);

    if (!outputExists) {
      yield* Effect.promise(() => fsp.writeFile(config.outputCSS, ''));
    }

    yield* Effect.log('asdasdasd', config.outputCSS);

    yield* Effect.promise(() => fsp.writeFile(config.outputCSS, compiled.cssOutput));
    console.log('RESULT____: ', compiled.cssOutput);
    return compiled;
  });

export const createTwinExtractor = (viteConfig: TwinVitePluginConfig) => {
  const runExtractorEffect = extractor(viteConfig);

  return {
    viteConfig,
    extractor: async (code: string, filePath: string) => {
      return runExtractorEffect(code, filePath).pipe(
        Effect.provide(NodeMainLayer),
        Effect.provide(
          setConfigLayerFromUser({
            configPath: viteConfig.twinConfigPath,
            logLevel: 'Info',
            inputCSS: viteConfig.inputCSS,
            projectRoot: viteConfig.projectRoot,
          }),
        ),

        Effect.runPromise,
      );
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
