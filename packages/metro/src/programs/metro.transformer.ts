import { LogLevel } from 'effect';
import * as Effect from 'effect/Effect';
import type { TransformResponse } from 'metro-transform-worker';
import worker from 'metro-transform-worker';
import path from 'node:path';
import {
  TwinNodeContext,
  BabelCompiler,
  NodeMainLayerSync,
  setConfigLayerFromUser,
} from '@native-twin/compiler/node';
import { matchCss } from '@native-twin/helpers/server';
import type { TwinMetroTransformFn } from '../models/Metro.models.js';
import { transformCSSExpo } from '../utils/css.utils.js';

type MetroTransformFn = typeof worker.transform;

export const transform: TwinMetroTransformFn = async (
  config,
  projectRoot,
  filename,
  data,
  options,
) => {
  const twinConfig = config.twinConfig;
  const platform = options.platform ?? 'native';

  return Effect.gen(function* () {
    const ctx = yield* TwinNodeContext;
    const compiler = yield* BabelCompiler;
    const platformOutput = ctx.getOutputCSSPath(platform);

    const transform: MetroTransformFn = twinConfig.originalTransformerPath
      ? require(twinConfig.originalTransformerPath).transform
      : worker.transform;

    if (
      platformOutput &&
      matchCss(filename) &&
      filename.includes(path.basename(platformOutput))
    ) {
      // console.log('[METRO_TRANSFORMER]: Detect css file', input.filename);
      const result: TransformResponse = yield* Effect.promise(() =>
        transformCSSExpo(config, projectRoot, filename, data, options),
      );
      return result;
    }

    if (!(yield* ctx.isAllowedPath(filename))) {
      return yield* Effect.promise(() =>
        transform(config, projectRoot, filename, data, options),
      );
    }

    let code = data.toString('utf-8');
    const output = yield* compiler.getBabelOutput({
      _tag: 'BabelCodeEntry',
      filename: filename,
      code,
      platform,
    });

    const result = yield* compiler.mutateAST(output.ast);

    if (result?.code) {
      // console.log('OPTIONS: ', params.options);
      code = result.code;
    }

    const transformed = yield* Effect.promise(() =>
      transform(config, projectRoot, filename, Buffer.from(code, 'utf-8'), options),
    );

    return transformed;
  }).pipe(
    Effect.provide(NodeMainLayerSync),
    Effect.provide(
      setConfigLayerFromUser({
        twinConfigPath: config.twinConfig.twinConfigPath,
        outputDir: config.twinConfig.outputDir,
        projectRoot: config.twinConfig.projectRoot,
        logLevel: LogLevel.fromLiteral(config.twinConfig.logLevel),
        inputCSS: config.twinConfig.inputCSS,
      }),
    ),
    Effect.runPromise,
  );

  // return metroRunnable.pipe(Effect.provide(layer), Effect.runPromise).catch((error) => {
  //   console.log('ERROR: ', error);
  //   throw new Error(error);
  // });
};
