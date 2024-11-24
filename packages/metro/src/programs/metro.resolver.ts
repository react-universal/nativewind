import * as Chunk from 'effect/Chunk';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Stream from 'effect/Stream';
import { TwinFileSystem } from '@native-twin/compiler/node';

const setupPlatforms: Set<string> = new Set();

export const startTwinWatcher = (config: {
  platform: string;
  writeStylesToFS: boolean;
}) => {
  return Effect.gen(function* () {
    const watcher = yield* TwinFileSystem;
    if (setupPlatforms.has(config.platform)) return;

    const allFiles = yield* watcher.getAllFilesInProject;
    yield* watcher.runTwinForFiles(allFiles, config.platform);
    yield* startTwinCompilerWatcher(config.platform, allFiles).pipe(
      Effect.scoped,
      Effect.forkDaemon,
    );
    yield* Effect.yieldNow();
    yield* Effect.log(`Watcher started for [${config.platform}]`);
  });
};

const startTwinCompilerWatcher = (platform: string, allFiles: string[]) =>
  Effect.gen(function* () {
    const twinFS = yield* TwinFileSystem;
    const hasPlatform = setupPlatforms.has(platform);
    if (hasPlatform) return;

    // const currentSize = setupPlatforms.size;
    yield* Effect.log(`Initializing project \n`);
    yield* twinFS.runTwinForFiles(allFiles, platform);

    return yield* pipe(
      yield* twinFS.startWatcher,
      Stream.take(allFiles.length),
      Stream.chunks,
      Stream.runForEach((fs) =>
        twinFS.runTwinForFiles(
          Chunk.toArray(fs).map((x) => x.path),
          platform,
        ),
      ),
    );
  }).pipe(Effect.annotateLogs('platform', platform));
