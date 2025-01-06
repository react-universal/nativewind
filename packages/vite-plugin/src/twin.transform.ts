import * as fs from 'fs';
import { TwinEnvContextLive } from '@native-twin/compiler/TwinEnv';
import { CompilerConfig, NodeMainLayerAsync } from '@native-twin/compiler/node';
import { TwinNodeContext } from '@native-twin/compiler/node';
import { TwinCSSExtractor } from '@native-twin/compiler/programs/css.extractor';
import * as Effect from 'effect/Effect';
import * as fsp from 'fs/promises';

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
    yield* Effect.log('ALLOWED_PATHS: ', compilerConfig);

    if (!(yield* ctx.isAllowedPath(filePath))) {
      return;
    }

    const compiled = yield* TwinCSSExtractor(code, filePath);
    yield* Effect.log('ALLOWED_PATH: ', filePath);
    const outputExists = fs.existsSync(config.outputCSS);

    if (!outputExists) {
      yield* Effect.promise(() => fsp.writeFile(config.outputCSS, ''));
    }

    yield* Effect.promise(() => fsp.writeFile(config.outputCSS, compiled.cssOutput));
    // console.log('RESULT____: ', compiled.cssOutput);
    return compiled;
  });

export const createTwinExtractor = (viteConfig: TwinVitePluginConfig) => {
  const runExtractorEffect = extractor(viteConfig);

  return {
    viteConfig,
    extractor: async (code: string, filePath: string) => {
      return runExtractorEffect(code, filePath).pipe(
        Effect.provide(NodeMainLayerAsync),
        Effect.provide(
          TwinEnvContextLive,
          // setConfigLayerFromUser({
          //   twinConfigPath: viteConfig.twinConfigPath,
          //   logLevel: LogLevel.Info,
          //   inputCSS: viteConfig.inputCSS,
          //   projectRoot: viteConfig.projectRoot,
          // }),
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
