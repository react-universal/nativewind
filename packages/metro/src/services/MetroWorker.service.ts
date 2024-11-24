import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import worker from 'metro-transform-worker';
import { BuildConfig } from '@native-twin/compiler/node';
import { TwinNodeContext } from '@native-twin/compiler/node';
import { ensureBuffer } from '@native-twin/helpers/server';
import type { MetroWorkerInput, NativeTwinTransformerOpts } from '../models/Metro.models';

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
    const buildConfig = yield* BuildConfig;
    const ctx = yield* TwinNodeContext;
    console.log('ORIGINAL: ', input.config.originalTransformerPath);
    const transform: MetroTransformFn = input.config.originalTransformerPath
      ? require(input.config.originalTransformerPath).transform
      : worker.transform;

    return {
      input,
      runWorker: (config) => {
        return Effect.promise(() =>
          transform(config.config, config.projectRoot, config.filename, config.data, {
            ...config.options,
            customTransformOptions: {
              ...config.options.customTransformOptions,
              outputDir: ctx.config.outputDir,
              allowedPaths: ctx.config.allowedPaths,
              allowedPathsGlob: ctx.config.allowedPathsGlob,
              debug: ctx.config.debug,
              inputCSS: ctx.config.inputCSS,
              projectRoot: ctx.config.projectRoot,
              twinConfigPath: ctx.config.twinConfigPath,
              outputCSS: buildConfig.outputCSS,
              platform: buildConfig.platform,
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
