import { Option } from 'effect';
import * as Effect from 'effect/Effect';
import { CompilerConfigContext, TwinNodeContext } from '@native-twin/compiler';
import { BaseTwinTransformerOptions } from '../models/Metro.models.js';

export const getMetroSettings = Effect.gen(function* () {
  const config = yield* CompilerConfigContext;
  const env = yield* config.env;
  const ctx = yield* TwinNodeContext;
  
  const transformerOptions: BaseTwinTransformerOptions = {
    allowedPaths: (yield* ctx.scanAllowedPaths).directories,
    logLevel: env.logLevel._tag,
    allowedPathsGlob: yield* ctx.getAllowedGlobPatterns,
    outputDir: env.outputDir,
    projectRoot: env.projectRoot,
    inputCSS: env.inputCSS.pipe(Option.getOrThrow),
    platformOutputs: Array.from(Object.values(env.platformPaths)),
    twinConfigPath: env.twinConfigPath.pipe(Option.getOrThrow),
    runtimeEntries: [],
  };

  return {
    transformerOptions,
    ctx,
    env,
  };
});
