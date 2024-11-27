import upstreamTransformer from '@expo/metro-config/babel-transformer';
import { LogLevel } from 'effect';
import * as Effect from 'effect/Effect';
import {
  NodeMainLayerSync,
  setConfigLayerFromUser,
  TwinNodeContext,
} from '@native-twin/compiler/node';
import { BabelCompiler } from '@native-twin/compiler/node';
import type { BabelTransformerFn } from '../models/Metro.models.js';

export const transform: BabelTransformerFn = async (params) => {
  // console.log('[transform]: PARAMS: ', params);

  return Effect.gen(function* () {
    const ctx = yield* TwinNodeContext;
    const compiler = yield* BabelCompiler;
    let code = params.src;

    if (yield* ctx.isAllowedPath(params.filename)) {
      const output = yield* compiler.getBabelOutput({
        _tag: 'BabelCodeEntry',
        filename: params.filename,
        code: params.src,
        platform: params.options.platform,
      });

      const result = yield* compiler.mutateAST(output.ast);

      if (result?.code) {
        console.log('OPTIONS: ', params.options);
        code = result.code;
      }
    }

    // @ts-expect-error untyped
    return upstreamTransformer.transform({
      src: code,
      options: {
        ...params.options,
        adsasda: 1,
      },
      filename: params.filename,
    });
  }).pipe(
    Effect.provide(NodeMainLayerSync),
    Effect.provide(
      setConfigLayerFromUser({
        projectRoot: params.options.projectRoot,
        twinConfigPath: params.options.customTransformOptions.twinConfigPath,
        logLevel: LogLevel.fromLiteral(params.options.customTransformOptions.logLevel),
        inputCSS: params.options.customTransformOptions.inputCSS,
        outputDir: params.options.customTransformOptions.outputDir,
      }),
    ),
    Effect.runPromise,
  );
};
