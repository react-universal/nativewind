import { CompilerConfigContext, TwinNodeContext } from '@native-twin/compiler';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import type { BaseTwinTransformerOptions } from '../models/Metro.models.js';

export const getMetroSettings = Effect.gen(function* () {
  const env = yield* CompilerConfigContext;
  const ctx = yield* TwinNodeContext;
  const allowedFiles = yield* ctx.state.twinConfig.get.pipe(
    Effect.flatMap((config) => ctx.getProjectFilesFromConfig(config, 'sync')),
  );

  const transformerOptions: BaseTwinTransformerOptions = {
    inputCSS: env.inputCSS,
    allowedPaths: allowedFiles,
    logLevel: env.logLevel._tag,
    allowedPathsGlob: allowedFiles,
    outputDir: env.outputDir,
    projectRoot: env.projectRoot,
    platformOutputs: env.platformPaths,
    twinConfigPath: env.twinConfigPath.pipe(Option.getOrThrow),
    runtimeEntries: [],
  };

  return {
    transformerOptions,
    ctx,
    env,
  };
});
