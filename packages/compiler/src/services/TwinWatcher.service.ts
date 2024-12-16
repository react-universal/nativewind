import * as Effect from 'effect/Effect';
import * as HashSet from 'effect/HashSet';
import * as Layer from 'effect/Layer';
import * as Logger from 'effect/Logger';
import * as Option from 'effect/Option';
import * as Record from 'effect/Record';
import * as Stream from 'effect/Stream';
import { FSUtils, FSWatcher } from '../internal/fs';
import { TwinPathLive } from '../internal/fs/fs.path';
import { CompilerConfigContext } from '../services/CompilerConfig.service.js';
import { TwinFSContext, TwinFSContextLive } from '../services/TwinFileSystem.service.js';
import {
  TwinNodeContext,
  TwinNodeContextLive,
} from '../services/TwinNodeContext.service.js';
import {
  TwinDocumentsContext,
  TwinDocumentsContextLive,
} from './TwinDocuments.service.js';

export const TwinWatcherContextLive = Effect.gen(function* () {
  const ctx = yield* TwinNodeContext;
  const env = yield* CompilerConfigContext;
  const twinFS = yield* TwinFSContext;
  const fsWatcher = yield* FSWatcher.FSWatcherContext;
  const { createDocumentByPath, compileManyDocuments } = yield* TwinDocumentsContext;

  const watchEvents = yield* fsWatcher.subscribe();
  yield* watchEvents.pipe(
    Stream.filterMap(Option.getRight),
    Stream.tap((x) => Effect.log('HUB_FS_EVENT: ', x.path)),

    // Stream.mapEffect(
    //   FileSystemEvent.$match({
    //     DirectoryAdded: () => Effect.void,
    //     DirectoryRemoved: () => Effect.void,
    //     FileAdded: onCreateFile,
    //     FileChanged: (event) => Effect.void,
    //     FileRemoved: (event) => Effect.void,
    //   }),
    // ),
    Stream.flatMap((x) => {
      return Stream.fromEffect(fsWatcher.instance).pipe(
        Stream.map((x) => x.getWatched()),
        Stream.tap((files) => Effect.logDebug('Observing:', Record.keys(files))),
      );
    }),
    Stream.runDrain,
    Effect.tap(() => Effect.log('HUB_FS_EVENT_DRAINED')),
    Logger.withMinimumLogLevel(env.logLevel),
    Effect.forkDaemon,
  );

  const projectFilesEffect = yield* ctx.state.projectFiles.changes.pipe(
    // Stream.tap((paths) => Effect.logDebug('COMPILING_PATHS: ', paths)),
    // Stream.tap((paths) =>
    //   fsWatcher.add(
    //     HashSet.flatMap(paths, (file) => HashSet.make(file, fs.path_.dirname(file))),
    //   ),
    // ),
    Stream.mapEffect((paths) => Effect.all(HashSet.map(paths, createDocumentByPath))),
    Stream.filter((x) => x.length > 0),
    Stream.runForEach((files) =>
      Stream.fromIterableEffect(ctx.state.runningPlatforms.get).pipe(
        Stream.runForEach((platform) =>
          compileManyDocuments(files, platform).pipe(
            Effect.flatMap((registry) => twinFS.refreshCssOutput(platform, registry)),
            Effect.tap(() => Effect.logDebug('Finish compiling')),
            Effect.annotateLogs('platform', platform),
          ),
        ),
      ),
    ),
    Logger.withMinimumLogLevel(env.logLevel),
    Effect.forkDaemon,
  );

  // Watch Twin config ref
  const twinConfigEffect = yield* ctx.state.twinConfig.changes.pipe(
    Stream.tap(() => Effect.log('Refreshing twin config...')),
    Stream.runForEach(() =>
      ctx
        .onChangeTwinConfigFile()
        .pipe(Effect.tap(() => Effect.logDebug('Twin config refreshed'))),
    ),
    Logger.withMinimumLogLevel(env.logLevel),
    Effect.forkDaemon,
  );

  yield* Effect.forkAll([projectFilesEffect, twinConfigEffect], {
    discard: false,
  }).pipe(Effect.forkDaemon);

  return yield* Effect.succeed({});

}).pipe(
  Effect.forkDaemon,
  Effect.tapError((error) => Effect.logError('ERROR: ', error)),
  Effect.withLogSpan('TWIN_WATCHER'),
  Layer.scopedDiscard,
  Layer.provide(TwinFSContextLive),
  Layer.provide(FSUtils.FsUtilsLive),
  Layer.provide(FSWatcher.FSWatcherContextLive),
  Layer.provide(TwinDocumentsContextLive),
  Layer.provide(TwinNodeContextLive),
  Layer.provide(TwinPathLive),
);
