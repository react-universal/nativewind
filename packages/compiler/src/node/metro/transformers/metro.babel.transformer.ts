import upstreamTransformer from '@expo/metro-config/babel-transformer';
import * as Effect from 'effect/Effect';
import * as LogLevel from 'effect/LogLevel';
import * as Logger from 'effect/Logger';
import { BuildConfig, makeBabelConfig, makeBabelLayer } from '../../babel';
import { compileReactCode } from '../../babel/programs/react.program';
import { NativeTwinServiceNode } from '../../native-twin';
import type { BabelTransformerFn } from '../models/metro.models';

const mainProgram = Effect.gen(function* () {
  const twin = yield* NativeTwinServiceNode;
  const input = yield* BuildConfig;

  if (!twin.isAllowedPath(input.filename)) {
    return input.filename;
  }

  const compiled = yield* compileReactCode;

  return compiled ?? input.code;
});

export const babelRunnable = Effect.scoped(
  mainProgram.pipe(Logger.withMinimumLogLevel(LogLevel.All)),
);

export const transform: BabelTransformerFn = async (params) => {
  // console.log('[transform]: PARAMS: ', params);
  return babelRunnable.pipe(
    Effect.provide(makeBabelLayer),
    Effect.provide(
      makeBabelConfig({
        code: params.src,
        filename: params.filename,
        inputCSS: params.options.customTransformOptions.inputCSS,
        outputCSS: params.options.customTransformOptions.outputCSS,
        platform: params.options.platform,
        projectRoot: params.options.projectRoot,
        twinConfigPath: params.options.customTransformOptions.twinConfigPath,
      }),
    ),
    Effect.provide(
      NativeTwinServiceNode.Live(
        params.options.customTransformOptions.twinConfigPath,
        params.options.projectRoot,
        params.options.platform,
      ),
    ),
    Effect.map((code) => {
      // @ts-expect-error untyped
      return upstreamTransformer.transform({
        src: code,
        options: params.options,
        filename: params.filename,
      });
    }),
    Effect.runPromise,
  );
};
