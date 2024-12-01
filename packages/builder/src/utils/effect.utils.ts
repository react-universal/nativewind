import * as FileSystem from '@effect/platform/FileSystem';
import type { FSWatcher } from 'chokidar';
import * as Effect from 'effect/Effect';
import * as Runtime from 'effect/Runtime';
import * as Stream from 'effect/Stream';
import * as path from 'path';

export const createChokidarWatcher = (projectRoot: string, watcher: FSWatcher) => {
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

const listenStreamChanges = <A, E, R>(
  stream: Stream.Stream<A, E>,
  f: (data: A) => Effect.Effect<void, never, R>,
): Effect.Effect<void, never, R> => {
  return Effect.flatMap(Effect.runtime<R>(), (runtime) => {
    const run = Runtime.runFork(runtime);
    return stream.pipe(
      Stream.mapEffect(f),
      Stream.runDrain,
      Effect.catchAllCause((_) => Effect.log('unhandled defect in event listener', _)),
      run,
    );
  });
};

export const listenForkedStreamChanges = <A, E, R>(
  stream: Stream.Stream<A, E>,
  f: (data: A) => Effect.Effect<void, never, R>,
) => Effect.forkScoped(listenStreamChanges(stream, f));
