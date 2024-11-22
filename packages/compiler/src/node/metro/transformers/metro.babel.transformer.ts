import upstreamTransformer from '@expo/metro-config/babel-transformer';
import * as Effect from 'effect/Effect';
import * as LogLevel from 'effect/LogLevel';
import * as Logger from 'effect/Logger';
import { BuildConfig, makeBabelConfig } from '../../babel';
import { compileReactCode } from '../../babel/programs/react.program';
import { TwinNodeContext } from '../../services/TwinNodeContext.service';
import { makeNodeLayer } from '../../services/node.make';
import type { BabelTransformerFn } from '../models/metro.models';

const mainProgram = Effect.gen(function* () {
  const twin = yield* TwinNodeContext;
  const input = yield* BuildConfig;

  if (!twin.utils.isAllowedPath(input.filename)) {
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
  const nodeLayer = makeNodeLayer({
    projectRoot: params.options.projectRoot,
    configPath: params.options.customTransformOptions.twinConfigPath,
    debug: true,
    inputCSS: params.options.customTransformOptions.inputCSS,
  });

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
    Effect.provide(nodeLayer.MainLayer),
    Effect.provide(babelConfigLayer),
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
