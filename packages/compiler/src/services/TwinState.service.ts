import { sheetEntriesToCss } from '@native-twin/css';
import { RuntimeSheetEntry } from '@native-twin/css/build/dts/jsx';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';
import { FSUtils, TwinPath } from '../internal/fs';
import { TwinNodeContext, TwinNodeContextLive } from './TwinNodeContext.service';

const make = Effect.gen(function* () {
  const ctx = yield* TwinNodeContext;
  const fs = yield* FSUtils.FsUtils;
  const twinPath = yield* TwinPath.TwinPath;
  const cssFilePath = yield* fs
    .createTempFile()
    .pipe(Effect.map(twinPath.make.absoluteFromString));
  const nativeFilePath = yield* fs
    .createTempFile()
    .pipe(Effect.map(twinPath.make.absoluteFromString));

  return {
    refreshCSSFile,
    refreshNativeFile,
    makeTwRunner,
  };

  function refreshCSSFile() {
    return Effect.gen(function* () {
      const tw = yield* ctx.getTwForPlatform('web');
      const code = sheetEntriesToCss(tw.target, false);
      yield* fs.modifyFile(cssFilePath, () => code);

      return code;
    });
  }

  function refreshNativeFile() {
    return Effect.gen(function* () {
      const tw = yield* ctx.getTwForPlatform('web');
      const code = sheetEntriesToCss(tw.target, false);
      yield* fs.modifyFile(nativeFilePath, () => code);

      return code;
    });
  }

  function makeTwRunner(platform: string) {
    return Effect.gen(function* () {
      const { compilerContext, tw } = yield* ctx.getTwinRuntime(platform);
      return (tokens: string) =>
        Stream.fromIterable(tw(tokens)).pipe(
          Stream.map((entry) => new RuntimeSheetEntry(entry, compilerContext)),
          Stream.runCollect,
        );
    });
  }
});

export interface TwinStateContext extends Effect.Effect.Success<typeof make> {}
export const TwinStateContext =
  Context.GenericTag<TwinStateContext>('node/shared/context');

export const TwinStateContextLive = Layer.effect(TwinStateContext, make).pipe(
  Layer.provide(TwinPath.TwinPathLive),
  Layer.provide(TwinNodeContextLive),
  Layer.provide(FSUtils.FsUtilsLive),
);
