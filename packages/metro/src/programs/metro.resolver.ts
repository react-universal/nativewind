import * as Chunk from 'effect/Chunk';
import * as Effect from 'effect/Effect';
import * as Iterable from 'effect/Iterable';
import * as Stream from 'effect/Stream';
import { TwinFileSystem } from '@native-twin/compiler';

export const startTwinWatcher = (config: {
  platform: string;
  writeStylesToFS: boolean;
}) => {
  return Effect.gen(function* () {
    const watcher = yield* TwinFileSystem;

    const allFiles = yield* watcher.getAllFiles;
    yield* watcher.runTwinForFiles(allFiles, config.platform);
    yield* startTwinCompilerWatcher(config.platform, allFiles).pipe(
      Effect.scoped,
      Effect.forkDaemon,
    );
    yield* Effect.yieldNow();
    yield* Effect.log(`Watcher started for [${config.platform}]`);
  });
};

const startTwinCompilerWatcher = (platform: string, allFiles: Iterable<string>) =>
  Effect.gen(function* () {
    const twinFS = yield* TwinFileSystem;

    // const currentSize = setupPlatforms.size;
    yield* Effect.log(`Initializing project \n`);

    const runner = yield* twinFS.startWatcher;
    yield* runner.pipe(
      Stream.take(Iterable.size(allFiles)),
      Stream.chunks,
      Stream.runForEach((fs) =>
        twinFS.runTwinForFiles(
          Chunk.toArray(fs).map((x) => x.path),
          platform,
        ),
      ),
    );
  }).pipe(Effect.annotateLogs('platform', platform));
