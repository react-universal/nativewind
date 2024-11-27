import type { PlatformError } from '@effect/platform/Error';
import * as FileSystem from '@effect/platform/FileSystem';
import * as Path from '@effect/platform/Path';
import chokidar from 'chokidar';
import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Stream from 'effect/Stream';
import path from 'path';

export function readDirectoryRecursive(
  currentPath: string,
): Effect.Effect<string[], PlatformError, FileSystem.FileSystem | Path.Path> {
  return Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    if (path.extname(currentPath) !== '') {
      return [currentPath];
    }
    const directories = yield* Effect.map(fs.readDirectory(currentPath), (baseNames) =>
      RA.map(baseNames, (name): string => path.resolve(currentPath, name)),
    );

    const entriesDict: Record<string, FileSystem.File.Info> = yield* pipe(
      Effect.reduceEffect(
        RA.map(directories, (dirPath) =>
          Effect.map(fs.stat(dirPath), (stat) => ({ [dirPath]: stat })),
        ),
        Effect.succeed({}),
        (prev, item) => ({ ...prev, ...item }),
        { concurrency: 10 },
      ),
    );

    const recursiveListings = RA.map(directories, (x) =>
      entriesDict[x]?.type === 'Directory'
        ? readDirectoryRecursive(x)
        : Effect.succeed([path.resolve(currentPath, x)]),
    );

    const entries = yield* Effect.map(
      Effect.allSuccesses(recursiveListings, { concurrency: 10 }),
      RA.flatten,
    );

    return entries;
  });
}

export const createChokidarWatcher = (
  projectRoot: string,
  watcher: chokidar.FSWatcher,
) => {
  return Stream.acquireRelease(Effect.succeed(watcher), (x) =>
    Effect.promise(() => x.close()),
  ).pipe(
    Stream.flatMap((watcher) => {
      return Stream.async<FileSystem.WatchEvent>((emit) => {
        watcher.on('all', (event, filePath) => {
          switch (event) {
            case 'addDir':
            case 'add':
              return emit.single({
                _tag: 'Create',
                path: path.posix.join(projectRoot, filePath),
              });
            case 'change':
              return emit.single({
                _tag: 'Update',
                path: path.posix.join(projectRoot, filePath),
              });
            case 'unlink':
            case 'unlinkDir':
              return emit.single({
                _tag: 'Remove',
                path: path.join(projectRoot, filePath),
              });
          }
        });
        // return Effect.promise(() => watcher.close());
      });
    }),
  );
};
