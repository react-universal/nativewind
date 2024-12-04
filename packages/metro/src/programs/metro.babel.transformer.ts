import upstreamTransformer from '@expo/metro-config/babel-transformer';
import { Layer } from 'effect';
import * as Effect from 'effect/Effect';
import {
  TwinNodeContext,
  BabelCompiler,
  TwinFileSystem,
  CompilerConfigContextLive,
} from '@native-twin/compiler';
import type { BabelTransformerFn } from '../models/Metro.models.js';

const NodeMainLayerSync = TwinFileSystem.Live.pipe(
  Layer.provideMerge(TwinNodeContext.Live),
  Layer.provideMerge(CompilerConfigContextLive),
);

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
    Effect.runPromise,
  );

  return program;
};
