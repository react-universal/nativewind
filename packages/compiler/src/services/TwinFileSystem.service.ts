import { sheetEntriesToCss } from '@native-twin/css';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as HashMap from 'effect/HashMap';
import * as Layer from 'effect/Layer';
import { FSUtils, TwinPath } from '../internal/fs';
import type { JSXElementNode } from '../models/JSXElement.model.js';
import { getNativeStylesJSOutput } from '../utils/native.utils.js';
import { CompilerConfigContext } from './CompilerConfig.service.js';
import { TwinNodeContext, TwinNodeContextLive } from './TwinNodeContext.service.js';

const make = Effect.gen(function* () {
  const ctx = yield* TwinNodeContext;
  const env = yield* CompilerConfigContext;
  const fs = yield* FSUtils.FsUtils;
  const twinPath = yield* TwinPath.TwinPath;

  yield* createTwinFiles();

  return {
    readPlatformCSSFile,
    createTwinFiles,
    refreshCssOutput,
  };

  function readPlatformCSSFile(platform: string) {
    return fs.readFile(ctx.getOutputCSSPath(platform));
  }

  function refreshCssOutput(
    platform: string,
    registry: HashMap.HashMap<string, JSXElementNode>,
  ) {
    return Effect.gen(function* () {
      const platformOutput = ctx.getOutputCSSPath(platform);
      const { tw } = yield* ctx.getTwinRuntime(platform);
      let code = '';
      if (platformOutput.endsWith('.css')) {
        code = sheetEntriesToCss(tw.target, false);
      } else {
        code = yield* getNativeStylesJSOutput(registry, platform);
      }
      yield* fs.modifyFile(platformOutput, () => code);
      return {
        compiledEntries: tw.target.length,
        registrySize: HashMap.size(registry),
      };
    }).pipe(
      Effect.annotateLogs('platform', platform),
      Effect.tap(({ compiledEntries, registrySize }) =>
        Effect.logInfo(
          `Build success: ${registrySize} Files. ${compiledEntries} Utilities added.`,
        ),
      ),
    );
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
