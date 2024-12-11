import { NodePath } from '@effect/platform-node';
import { type SheetEntry, sheetEntriesToCss } from '@native-twin/css';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as HashSet from 'effect/HashSet';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Ref from 'effect/Ref';
import * as Sink from 'effect/Sink';
import * as Stream from 'effect/Stream';
import * as SubscriptionRef from 'effect/SubscriptionRef';
import {
  TwinDocumentsContext,
  TwinDocumentsContextLive,
} from '../internal/TwinDocument/TwinDocuments.service.js';
import { FsUtils, FsUtilsLive } from '../internal/fs.utils.js';
import { FrequencyMetric } from '../models/Metrics.models.js';
import { listenForkedStreamChanges } from '../utils/effect.utils.js';
import { getNativeStylesJSOutput } from '../utils/native.utils.js';
import { extractTwinConfig } from '../utils/twin.utils.js';
import { BabelCompilerContextLive } from './BabelCompiler.service.js';
import { CompilerConfigContext } from './CompilerConfig.service.js';
import { TwinNodeContext } from './TwinNodeContext.service.js';

const providedFrequency = new FrequencyMetric(
  'Service',
  'metro/fs/service',
  'Twin FileSystem service',
  'Info',
);

export const TwinFSMake = Effect.gen(function* () {
  const ctx = yield* TwinNodeContext;
  const env = yield* CompilerConfigContext;
  const fs = yield* FsUtils;
  const { twinDocuments, compileDocument } = yield* TwinDocumentsContext;

  yield* createTwinFiles();

  yield* ctx.twinConfigRef.changes.pipe(
    Stream.mapEffect(() => SubscriptionRef.get(ctx.twinConfigRef)),
    Stream.map((x) => x.content),
    Stream.mapEffect((_) => ctx.scanAllowedPaths),
    Stream.runForEach((x) =>
      Ref.update(ctx.projectFilesRef, () => HashSet.fromIterable(x)),
    ),
    Effect.withSpanScoped('WATCHER', { attributes: { type: 'configFileRef' } }),
    Effect.forkDaemon,
  );

  const getWebCSS = ctx
    .getTwForPlatform('web')
    .pipe(Effect.map((x) => sheetEntriesToCss(x.target, false)));

  const twinWatcher = fs
    .createWatcher(env.projectRoot, ctx.twinConfig.content)
    .pipe(Stream.filterEffect((x) => ctx.isAllowedPath(x.path)));

  yield* listenForkedStreamChanges(twinWatcher, (event) =>
    Effect.gen(function* () {
      const currentFiles = yield* Ref.get(ctx.projectFilesRef);
      if (event._tag === 'Create') {
        if (!HashSet.has(currentFiles, event.path)) {
          yield* Ref.set(
            ctx.projectFilesRef,
            currentFiles.pipe(HashSet.add(event.path)),
          ).pipe(Effect.andThen(() => Effect.logDebug('Added file')));
        }
        return;
      }
      if (Option.isSome(env.twinConfigPath) && event.path === env.twinConfigPath.value) {
        if (event._tag === 'Update') {
          const newConfig = extractTwinConfig(env.twinConfigPath.value);
          // const filesToSet = HashSet.fromIterable(allowedFiles.files);
          // const shouldReplace = currentFiles.pipe(HashSet.isSubset(filesToSet));
          // watcher.unwatch(Object.keys(watcher.getWatched()));
          // watcher.add(ctx.getAllowedGlobPatterns(newConfig.content));
          yield* Ref.set(ctx.twinConfigRef, newConfig).pipe(
            Effect.andThen(() => Effect.log('TwinConfig updated!')),
          );
        }
        yield* Effect.log('TW_CONFIG_MODIFIED');
        return;
      }
      // yield* Effect.log('OTHER_EVENT: ', Object.keys(watcher.getWatched()));
    }).pipe(
      Effect.withSpanScoped('TwinFS', {
        attributes: {
          watcher: 'PROJECT_FILES',
        },
      }),
    ),
  );
  return {
    twinWatcher,
    getAllFiles: Ref.get(ctx.projectFilesRef),
    getWebCSS,
    readPlatformCSSFile,
    createTwinFiles,
    compileProjectFiles,
  };

  function readPlatformCSSFile(platform: string) {
    return fs.readFile(ctx.getOutputCSSPath(platform));
  }

  function createTwinFiles() {
    return Effect.gen(function* () {
      yield* fs
        .mkdirCached(env.outputDir)
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

  function compileProjectFiles(platform: string) {
    return twinDocuments.pipe(
      Stream.flatMap((file) =>
        Stream.fromIterableEffect(
          compileDocument(file, platform).pipe(
            Effect.map((compiled) => compiled.jsxElements),
          ),
        ),
      ),
      Stream.run(
        Sink.collectAllToMap(
          (x) => x.filename,
          (x) => x,
        ),
      ),
      Effect.flatMap((registry) =>
        Effect.gen(function* () {
          const platformOutput = ctx.getOutputCSSPath(platform);
          const tw = yield* ctx.getTwForPlatform(platform);
          if (platformOutput.endsWith('.css')) {
            return sheetEntriesToCss(tw.target, false);
          }
          return yield* getNativeStylesJSOutput(registry, platform);
        }),
      ),
      Effect.tap(() => Effect.logInfo('Build success!')),
      Effect.fork,
    );
  }

  // function compileFiles(files: Iterable<string>, platform: string) {
  //   return Stream.fromIterable(files).pipe(
  //     Stream.filterEffect((x) => ctx.isAllowedPath(x)),
  //     Stream.mapEffect((x) =>
  //       compiler.getBabelOutput({
  //         _tag: 'BabelFileEntry',
  //         filename: x,
  //         platform,
  //       }),
  //     ),
  //     Stream.runCollect,
  //     Effect.map((x) => RA.fromIterable(x)),
  //   );
  // }

  // function runTwinForFiles(files: Iterable<string>, platform: string) {
  //   return Effect.gen(function* () {
  //     yield* Effect.log('Building project...');
  //     const tw = yield* ctx.getTwForPlatform(platform);
  //     const outputPath = ctx.getOutputCSSPath(platform);

  //     twinDocuments.pipe(
  //       Stream.mapEffect((twinFile) => compileDocument(twinFile, platform)),
  //     );

  //     const twinResult = yield* compileFiles(files, platform);
  //     yield* refreshCSSOutput({
  //       filepath: outputPath,
  //       trees: RA.map(twinResult, (x) => x.treeNodes),
  //       platform,
  //     });
  //     yield* Effect.log(`Build success!`);
  //     pipe(
  //       tw.target,
  //       RA.appendAll(cachedEntries),
  //       RA.dedupeWith(
  //         (a, b) =>
  //           `${a.className}-${a.selectors.join('')}` ===
  //           `${b.className}-${b.selectors.join('')}`,
  //       ),
  //       (result) => {
  //         if (result.length > cachedEntries.length) {
  //           cachedEntries.splice(0, cachedEntries.length, ...result);
  //         }
  //       },
  //     );
  //     yield* Effect.log(`Added ${tw.target.length} classes`);
  //   });
  // }
});

export const cachedEntries: SheetEntry[] = [];

export class TwinFileSystem extends Context.Tag('metro/fs/service')<
  TwinFileSystem,
  Effect.Effect.Success<typeof TwinFSMake>
>() {
  static Live = Layer.scoped(TwinFileSystem, TwinFSMake).pipe(
    Layer.provideMerge(BabelCompilerContextLive),
    Layer.provideMerge(FsUtilsLive),
    Layer.provide(TwinNodeContext.Live),
    Layer.provideMerge(NodePath.layerPosix),
    Layer.provideMerge(TwinDocumentsContextLive),
  );
  static metrics = {
    providedFreq: providedFrequency,
  };
}
