import { Path, FileSystem } from '@effect/platform';
import { NodePath, NodeFileSystem } from '@effect/platform-node';
import { Stream } from 'effect';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Glob from 'glob';

const make = Effect.gen(function* (_) {
  const fs = yield* _(FileSystem.FileSystem);
  const path_ = yield* _(Path.Path);

  const glob = (pattern: string | ReadonlyArray<string>, options?: Glob.GlobOptions) =>
    Effect.tryPromise({
      try: () => Glob.glob(pattern as any, options as any),
      catch: (e) => new Error(`glob failed: ${e}`),
    }).pipe(Effect.withSpan('FsUtils.glob'));

  const globFiles = (
    pattern: string | ReadonlyArray<string>,
    options: Glob.GlobOptions = {},
  ) => glob(pattern, { ...options, nodir: true });

  const modifyFile = (path: string, f: (s: string, path: string) => string) =>
    fs.readFileString(path).pipe(
      Effect.bindTo('original'),
      Effect.let('modified', ({ original }) => f(original, path)),
      Effect.flatMap(({ modified, original }) =>
        original === modified
          ? Effect.void
          : fs.writeFile(path, new TextEncoder().encode(modified)),
      ),
      Effect.withSpan('FsUtils.modifyFile', { attributes: { path } }),
    );

  const mkdirCached_ = yield* _(
    Effect.cachedFunction((path: string) =>
      fs.makeDirectory(path).pipe(
        Effect.catchAllCause(() => Effect.void),
        Effect.withSpan('FsUtils.mkdirCached', { attributes: { path } }),
      ),
    ),
  );

  const mkdirCached = (path: string) => mkdirCached_(path_.resolve(path));

  const writeFileCached_ = yield* _(
    Effect.cachedFunction(
      (data: { path: string; contents?: string; override?: boolean }) =>
        Effect.if(fs.exists(data.path), {
          onFalse: () =>
            fs.writeFileString(data.path, data.contents ?? '').pipe(
              Effect.catchAllCause(() => Effect.void),
              Effect.withSpan('FsUtils.writeFileCached', { attributes: { data } }),
            ),
          onTrue: () => Effect.void,
        }),
    ),
  );

  const readFile = (path: string) =>
    fs
      .readFileString(path)
      .pipe(Effect.tapError(() => Effect.logError(`Cannot read file at: ${path}`)));

  const watch = (path: string) =>
    fs
      .watch(path)
      .pipe(Stream.tapError(() => Effect.logError(`Cannot watch file at: ${path}`)));

  const writeFileCached = (data: {
    path: string;
    contents?: string;
    override?: boolean;
  }) => writeFileCached_(data);

  const writeFileSource = (file: { path: string; content: string }) =>
    fs.writeFileString(file.path, file.content);

  return {
    glob,
    writeFileSource,
    watch,
    writeFileCached,
    globFiles,
    modifyFile,
    mkdirCached,
    readFile,
  } as const;
});

export interface FsUtils extends Effect.Effect.Success<typeof make> {}
export const FsUtils = Context.GenericTag<FsUtils>('twin/FsUtils');
export const FsUtilsLive = Layer.effect(FsUtils, make).pipe(
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(NodePath.layerPosix),
);
