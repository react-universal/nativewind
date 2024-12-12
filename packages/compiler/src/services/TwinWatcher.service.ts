import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as HashSet from 'effect/HashSet';
import * as Layer from 'effect/Layer';
import * as Logger from 'effect/Logger';
import * as Option from 'effect/Option';
import * as Ref from 'effect/Ref';
import * as Stream from 'effect/Stream';
import { FsUtils, FsUtilsLive } from '../internal/fs.utils.js';
import { CompilerConfigContext } from '../services/CompilerConfig.service.js';
import { TwinFileSystem } from '../services/TwinFileSystem.service.js';
import { TwinNodeContext } from '../services/TwinNodeContext.service.js';
import { listenForkedStreamChanges } from '../utils/effect.utils.js';
import {
  TwinDocumentsContext,
  TwinDocumentsContextLive,
} from './TwinDocuments.service.js';

export const TwinWatcherContextLive = Effect.gen(function* () {
  const { state, onChangeTwinConfigFile } = yield* TwinNodeContext;
  const env = yield* CompilerConfigContext;
  const twinFS = yield* TwinFileSystem;
  const { createDocumentByPath, compileManyDocuments } = yield* TwinDocumentsContext;

  yield* state.projectFiles.changes.pipe(
    Stream.mapEffect((paths) => Effect.all(HashSet.map(paths, createDocumentByPath))),
    Stream.filter((x) => x.length > 0),
    Stream.runForEach((files) =>
      Stream.fromIterableEffect(state.runningPlatforms.get).pipe(
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
  yield* state.twinConfig.changes.pipe(
    Stream.tap(() => Effect.log('Refreshing twin config...')),
    Stream.runForEach(() =>
      onChangeTwinConfigFile().pipe(
        Effect.tap(() => Effect.logDebug('Twin config refreshed')),
      ),
    ),
    Logger.withMinimumLogLevel(env.logLevel),
    Effect.forkDaemon,
  );

  yield* watchProjectFiles.pipe(
    Logger.withMinimumLogLevel(env.logLevel),
    Effect.forkDaemon,
  );

  return yield* Effect.succeed({});
}).pipe(
  Layer.scopedDiscard,
  Layer.provide(TwinFileSystem.Live),
  Layer.provide(FsUtilsLive),
  Layer.provide(TwinDocumentsContextLive),
  Layer.provide(TwinNodeContext.Live),
);

const watchProjectFiles = Effect.gen(function* () {
  const fs = yield* FsUtils;
  const env = yield* CompilerConfigContext;
  const { isAllowedPath, state, getProjectFilesFromConfig, onChangeTwinConfigFile } =
    yield* TwinNodeContext;

  const allowedPaths = yield* state.twinConfig.get.pipe(
    Effect.flatMap((config) => getProjectFilesFromConfig(config)),
  );
  const twinWatcher = fs
    .createWatcher(
      env.projectRoot,
      pipe(
        RA.map(allowedPaths, (x) => fs.path_.dirname(x)),
        RA.dedupe,
      ),
    )
    .pipe(Stream.filterEffect((x) => isAllowedPath(x.path)));

  return yield* listenForkedStreamChanges(twinWatcher, (event) =>
    Effect.gen(function* () {
      const relativePath = fs.path_.relative(env.projectRoot, event.path);

      if (event._tag === 'Create') {
        yield* Effect.logDebug('[watcher]: File added:', relativePath);
        return yield* onCreateOrUpdateFile(event.path);
      }

      if (event._tag === 'Update') {
        if (
          Option.isSome(env.twinConfigPath) &&
          event.path === env.twinConfigPath.value
        ) {
          yield* Effect.logDebug('[watcher]: Twin config file changed', relativePath);
          return yield* onChangeTwinConfigFile();
        }

        yield* Effect.logDebug('[watcher]: File updated:', relativePath);
        return yield* onCreateOrUpdateFile(event.path);
      }

      if (event._tag === 'Remove') {
        return yield* onRemoveFile(event.path).pipe(
          Effect.tap(() => Effect.logDebug('[watcher]: File removed:', relativePath)),
        );
      }
    }),
  );

  function onRemoveFile(path: string) {
    return Effect.gen(function* () {
      return yield* Ref.update(state.projectFiles.ref, (x) => HashSet.remove(x, path));
    });
  }

  function onCreateOrUpdateFile(filePath: string) {
    return Effect.gen(function* () {
      const currentFiles = yield* state.projectFiles.get;
      if (!HashSet.has(currentFiles, filePath)) {
        yield* Ref.set(state.projectFiles.ref, currentFiles.pipe(HashSet.add(filePath)));
      }
    });
  }
});
