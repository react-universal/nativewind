import upstreamTransformer from '@expo/metro-config/babel-transformer';
import * as Effect from 'effect/Effect';
import * as LogLevel from 'effect/LogLevel';
import * as Logger from 'effect/Logger';
import {
  TwinNodeContext,
  makeNodeLayer,
  BuildConfig,
  makeBabelConfig,
} from '@native-twin/compiler/node';
import { compileReactCode } from '@native-twin/compiler/programs/react.program';
import type { BabelTransformerFn } from '../models/Metro.models.js';

const mainProgram = Effect.gen(function* () {
  const twin = yield* TwinNodeContext;
  const input = yield* BuildConfig;

  if (!twin.utils.isAllowedPath(input.filename)) {
    return input.code;
  }

  yield* compileReactCode;

  return input.code;
});

const babelRunnable = Effect.scoped(
  mainProgram.pipe(Logger.withMinimumLogLevel(LogLevel.All)),
);

export const transform: BabelTransformerFn = async (params) => {
  // console.log('[transform]: PARAMS: ', params);
  const nodeLayer = makeNodeLayer({
    projectRoot: params.options.projectRoot,
    configPath: params.options.customTransformOptions.twinConfigPath,
    debug: true,
    inputCSS: params.options.customTransformOptions.inputCSS,
  });
  console.log('OPTIONS: ', params.options);

  const babelConfigLayer = makeBabelConfig({
    code: params.src,
    filename: params.filename,
    inputCSS: params.options.customTransformOptions.inputCSS,
    outputCSS: params.options.customTransformOptions.outputCSS,
    platform: params.options.platform,
    projectRoot: params.options.projectRoot,
    twinConfigPath: params.options.customTransformOptions.twinConfigPath,
  });

  return babelRunnable.pipe(
    Effect.provide(nodeLayer),
    Effect.provide(babelConfigLayer),
    Effect.map((code) => {
      // @ts-expect-error untyped
      return upstreamTransformer.transform({
        src: code,
        options: {
          ...params.options,
          adsasda: 1,
        },
        filename: params.filename,
      });
    }),
    Effect.runPromise,
  );
};
