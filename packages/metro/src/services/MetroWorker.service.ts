import { CompilerConfigContext, TwinNodeContext } from '@native-twin/compiler';
import { ensureBuffer } from '@native-twin/helpers/server';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as worker from 'metro-transform-worker';
import type {
  MetroWorkerInput,
  NativeTwinTransformerOpts,
} from '../models/Metro.models.js';

export class MetroWorkerService extends Context.Tag('metro/worker/context')<
  MetroWorkerService,
  {
    input: MetroWorkerInput;
    runWorker: (config: MetroWorkerInput) => Effect.Effect<worker.TransformResponse>;
  }
>() {
  static make = (input: MetroWorkerInput) =>
    Layer.scoped(MetroWorkerService, createWorkerService(input));
}

type MetroTransformFn = typeof worker.transform;
export const createWorkerService = (input: MetroWorkerInput) => {
  return Effect.gen(function* () {
    const ctx = yield* TwinNodeContext;
    const env = yield* CompilerConfigContext;
    const config = yield* ctx.state.twinConfig.get;
    const allowedPaths = yield* ctx.getProjectFilesFromConfig(config);
    const allowedPathsGlob = allowedPaths;
    const transform: MetroTransformFn = input.config.twinConfig.originalTransformerPath
      ? require(input.config.twinConfig.originalTransformerPath).transform
      : worker.transform;

    return {
      input,
      runWorker: (config) => {
        return Effect.promise(() =>
          transform(config.config, config.projectRoot, config.filename, config.data, {
            ...config.options,
            customTransformOptions: {
              ...config.options.customTransformOptions,
              outputDir: env.outputDir,
              allowedPaths: allowedPaths,
              allowedPathsGlob: allowedPathsGlob,
              debug: env.logLevel,
              inputCSS: env.inputCSS,
              projectRoot: env.projectRoot,
              twinConfigPath: env.twinConfigPath,
              outputCSS: ctx.getOutputCSSPath(config.options.platform ?? 'native'),
              platform: config.options.platform ?? 'native',
            },
          }),
        );
      },
    } as MetroWorkerService['Type'];
  });
};

export const makeWorkerLayers = (
  config: NativeTwinTransformerOpts,
  projectRoot: string,
  filename: string,
  data: Buffer | string,
  options: worker.JsTransformOptions,
) => {
  return MetroWorkerService.make({
    config,
    data: ensureBuffer(data),
    filename,
    options,
    projectRoot,
  });
  // MetroCompilerContext.make(ctx.options, ctx.generate),
};
