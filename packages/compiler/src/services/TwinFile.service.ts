import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import { FSUtils, type TwinPath } from '../internal/fs';
import { TwinFileTree } from '../models/TwinFile.model.js';
import { TwinNodeContext, TwinNodeContextLive } from './TwinNodeContext.service.js';

const make = Effect.gen(function* () {
  const { getTwForPlatform } = yield* TwinNodeContext;
  const fs = yield* FSUtils.FsUtils;

  const transformFile = (file: TwinFileTree, platform: string) =>
    Effect.gen(function* () {
      const ctx = yield* getTwForPlatform(platform);
      const elements = yield* file.transformBabelPaths(ctx);
      return elements;
    });

  return {
    getTwinFile,
    transformFile,
  };

  function getTwinFile(filename: TwinPath.AbsoluteFilePath, code: Option.Option<string>) {
    return Effect.fromNullable(code.pipe(Option.getOrNull)).pipe(
      Effect.catchAll(() => fs.readFile(filename)),
      Effect.map((code) => new TwinFileTree(filename, code)),
    );
  }
});

export interface TwinFileContext extends Effect.Effect.Success<typeof make> {}
export const TwinFileContext = Context.GenericTag<TwinFileContext>(
  'compiler/TwinFileContext',
);

export const TwinFileContextLive = Layer.effect(TwinFileContext, make).pipe(
  Layer.provide(TwinNodeContextLive),
  Layer.provide(FSUtils.FsUtilsLive),
);
