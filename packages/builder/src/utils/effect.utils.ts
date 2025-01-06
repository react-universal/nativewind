import * as path from 'path';
import type * as FileSystem from '@effect/platform/FileSystem';
import type { FSWatcher } from 'chokidar';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Runtime from 'effect/Runtime';
import * as Stream from 'effect/Stream';

export const createChokidarWatcher = (projectRoot: string, watcher: FSWatcher) => {
  return Stream.acquireRelease(Effect.succeed(watcher), (x) =>
    Effect.promise(() => x.close()).pipe(
      Effect.tap(() => Effect.log('WATCHER_RELEASED')),
    ),
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
                path: path.posix.join(projectRoot, filePath),
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
    return Effect.async((_resume) => {
      const run = Runtime.runFork(runtime);
      const fiber = stream.pipe(
        Stream.runForEach(f),
        Effect.catchAllCause((_) => Effect.log('unhandled defect in event listener', _)),
        run,
      );

      return Fiber.interrupt(fiber);
    });
  });
};

export const listenForkedStreamChanges = <A, E, R>(
  stream: Stream.Stream<A, E>,
  f: (data: A) => Effect.Effect<void, never, R>,
) => Effect.fork(listenStreamChanges(stream, f));
