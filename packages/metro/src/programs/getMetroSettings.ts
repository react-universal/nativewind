import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import { CompilerConfigContext, TwinNodeContext } from '@native-twin/compiler';
import { BaseTwinTransformerOptions } from '../models/Metro.models.js';

export const getMetroSettings = Effect.gen(function* () {
  const env = yield* CompilerConfigContext;
  const ctx = yield* TwinNodeContext;

  const transformerOptions: BaseTwinTransformerOptions = {
    inputCSS: env.inputCSS,
    allowedPaths: (yield* ctx.scanAllowedPaths).directories,
    logLevel: env.logLevel._tag,
    allowedPathsGlob: yield* ctx.getAllowedGlobPatterns,
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
