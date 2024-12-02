import upstreamTransformer from '@expo/metro-config/babel-transformer';
import * as Effect from 'effect/Effect';
import { TwinEnvContextLive } from '@native-twin/compiler/TwinEnv';
import {
  NodeMainLayerSync,
  setConfigLayerFromUser,
  TwinNodeContext,
  BabelCompiler,
} from '@native-twin/compiler/node';
import type { BabelTransformerFn } from '../models/Metro.models.js';

export const transform: BabelTransformerFn = async (params) => {
  // console.log('[transform]: PARAMS: ', params);

  const program = Effect.gen(function* () {
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
    Effect.provide(setConfigLayerFromUser),
    Effect.provide(TwinEnvContextLive),
    Effect.runPromise,
  );

  return program;
};
