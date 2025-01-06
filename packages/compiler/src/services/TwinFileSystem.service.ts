import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { FSUtils, TwinPath } from '../internal/fs';
import { CompilerConfigContext } from './CompilerConfig.service.js';
import { TwinNodeContext, TwinNodeContextLive } from './TwinNodeContext.service.js';

const make = Effect.gen(function* () {
  const ctx = yield* TwinNodeContext;
  const env = yield* CompilerConfigContext;
  const fs = yield* FSUtils.FsUtils;
  const twinPath = yield* TwinPath.TwinPath;

  return {
    readPlatformCSSFile,
    createTwinFiles,
  };

  function readPlatformCSSFile(platform: string) {
    return fs.readFile(twinPath.make.absoluteFromString(ctx.getOutputCSSPath(platform)));
  }

  function createTwinFiles() {
    return Effect.gen(function* () {
      yield* fs
        .mkdirCached(twinPath.make.absoluteFromString(env.outputDir))
        .pipe(Effect.tapError(() => Effect.logError('cant create twin output')));

      yield* fs.writeFileCached({ path: env.platformPaths.ios, override: false });
      yield* fs.writeFileCached({
        path: env.platformPaths.android,
        override: false,
      });
      yield* fs.writeFileCached({
        path: env.platformPaths.defaultFile,
        override: false,
      });
      yield* fs.writeFileCached({ path: env.platformPaths.native, override: false });
      yield* fs.writeFileCached({ path: env.platformPaths.web, override: false });
    });
  }
});

export interface TwinFSContext extends Effect.Effect.Success<typeof make> {}

export const TwinFSContext = Context.GenericTag<TwinFSContext>('metro/fs/service');

export const TwinFSContextLive = Layer.scoped(TwinFSContext, make).pipe(
  Layer.provide(FSUtils.FsUtilsLive),
  Layer.provide(TwinNodeContextLive),
  Layer.provide(TwinPath.TwinPathLive),
);
