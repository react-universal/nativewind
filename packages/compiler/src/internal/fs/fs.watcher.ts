import type fs from 'node:fs';
import * as Chokidar from 'chokidar';
import * as RA from 'effect/Array';
import * as Context from 'effect/Context';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Either from 'effect/Either';
import * as Layer from 'effect/Layer';
import * as Logger from 'effect/Logger';
import * as Option from 'effect/Option';
import * as PubSub from 'effect/PubSub';
import * as Ref from 'effect/Ref';
import * as Stream from 'effect/Stream';
import { CompilerConfigContext } from '../../services/CompilerConfig.service.js';
import * as TwinPath from './fs.path.js';

export interface FSFileEvent {
  readonly path: TwinPath.UnknownFilePath;
  readonly stats: Option.Option<fs.Stats>;
}

const createFileEvent = (
  path: string,
  stats: fs.Stats | undefined = undefined,
): FSFileEvent => ({
  path: TwinPath.unknownFilePath(path),
  stats: Option.fromNullable(stats),
});

export type FileSystemEvent = Data.TaggedEnum<{
  FileAdded: FSFileEvent;
  FileRemoved: FSFileEvent;
  FileChanged: FSFileEvent;
  DirectoryAdded: FSFileEvent;
  DirectoryRemoved: FSFileEvent;
}>;
export const FileSystemEvent = Data.taggedEnum<FileSystemEvent>();

export const WatchErrorTypeId = Symbol();
export type WatchErrorTypeId = typeof WatchErrorTypeId;

export class FileWatcherError extends Data.TaggedClass('FileWatcherError')<{
  readonly origin: Option.Option<unknown>;
}> {
  readonly [WatchErrorTypeId]: WatchErrorTypeId = WatchErrorTypeId;
}

const make = Effect.gen(function* () {
  const env = yield* CompilerConfigContext;
  const instance = yield* Ref.make<Chokidar.FSWatcher>(
    new Chokidar.FSWatcher({
      useFsEvents: true,
      persistent: true,
      alwaysStat: true,
    }),
  );
  const hub = yield* PubSub.unbounded<Either.Either<FileSystemEvent, FileWatcherError>>();

  return {
    instance: Ref.get(instance),
    hub,
    shutdown,
    subscribe,
    add,
    subscribeToEvents,
    remove,
  };

  function add(paths: Iterable<string>) {
    return Ref.get(instance).pipe(
      Effect.andThen((_) =>
        Effect.sync(() => {
          _.add(RA.fromIterable(paths));
        }),
      ),
    );
  }

  function shutdown() {
    return Ref.get(instance).pipe(
      Effect.andThen((_) => Effect.tryPromise(() => _.close())),
      Effect.catchAll((_) => Effect.void),
    );
  }

  function remove(paths: string[]) {
    return Ref.get(instance).pipe(
      Effect.andThen((_) =>
        Effect.sync(() => {
          _.unwatch(paths);
        }),
      ),
    );
  }

  function subscribe() {
    return PubSub.subscribe(hub).pipe(
      Effect.andThen((_) =>
        Effect.addFinalizer(() => _.shutdown).pipe(Effect.map(() => _)),
      ),
      Effect.tap(() => Effect.logDebug('Subscribe to fs events')),
      Effect.map(Stream.fromQueue),
      Logger.withMinimumLogLevel(env.logLevel),
    );
  }

  function subscribeToEvents() {
    return Effect.gen(function* () {
      const _ = yield* Ref.get(instance);
      Effect.sync(() => {
        _.on('error', (error) => {
          hub
            .publish(Either.left(new FileWatcherError({ origin: Option.some(error) })))
            .pipe(Effect.runSync);
        });
      });
      _.on('all', (eventName, path, stats) => {
        let event: FileSystemEvent;
        switch (eventName) {
          case 'add':
            event = FileSystemEvent.FileAdded(createFileEvent(path, stats));
            break;
          case 'unlink':
            event = FileSystemEvent.FileRemoved(createFileEvent(path, stats));
            break;
          case 'change':
            event = FileSystemEvent.FileChanged(createFileEvent(path, stats));
            break;
          case 'addDir':
            event = FileSystemEvent.DirectoryAdded(createFileEvent(path, stats));
            break;
          case 'unlinkDir':
            event = FileSystemEvent.DirectoryRemoved(createFileEvent(path, stats));
            break;
        }
        Effect.runSync(hub.publish(Either.right(event)));
      });
    });
  }
}).pipe(Effect.tap((x) => x.subscribeToEvents()));

export interface FSWatcherContext extends Effect.Effect.Success<typeof make> {}
export const FSWatcherContext = Context.GenericTag<FSWatcherContext>('FSWatcherContext');
export const FSWatcherContextLive = Layer.effect(FSWatcherContext, make);
