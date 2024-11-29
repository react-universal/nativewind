import * as Effect from 'effect/Effect';
import { CompilerConfig, TwinNodeContext } from '@native-twin/compiler/node';
import { BaseTwinTransformerOptions } from '../models/Metro.models.js';

export const getMetroSettings = Effect.gen(function* () {
  const ctx = yield* TwinNodeContext;
  const env = yield* CompilerConfig;
  const transformerOptions: BaseTwinTransformerOptions = {
    allowedPaths: (yield* ctx.scanAllowedPaths).directories,
    logLevel: env.logLevel._tag,
    allowedPathsGlob: yield* ctx.getAllowedGlobPatterns,
    outputDir: env.outputDir,
    projectRoot: env.projectRoot,
    inputCSS: env.inputCSS,
    platformOutputs: Array.from(Object.values(env.platformPaths)),
    twinConfigPath: env.twinConfigPath,
    runtimeEntries: [],
  };

  return {
    transformerOptions,
    ctx,
    env,
  };
});
