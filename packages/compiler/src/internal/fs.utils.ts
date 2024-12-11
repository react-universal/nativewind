import { FileSystem, Path } from '@effect/platform';
import { NodeFileSystem, NodePath } from '@effect/platform-node';
import chokidar, { type FSWatcher } from 'chokidar';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Hash from 'effect/Hash';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';
import * as Glob from 'glob';

const make = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path_ = yield* Path.Path;

  const globFilesSync = (pattern: string | string[], options: Glob.GlobOptions = {}) =>
    Effect.sync(() =>
      Glob.globSync(pattern, { ...options, nodir: true }).filter(
        (x) => typeof x === 'string',
      ),
    );

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

  const mkdirCached_ = yield* Effect.cachedFunction((path: string) =>
    fs.makeDirectory(path).pipe(
      Effect.catchAllCause(() => Effect.void),
      Effect.withSpan('FsUtils.mkdirCached', { attributes: { path } }),
    ),
  );

  const mkdirCached = (path: string) => mkdirCached_(path_.resolve(path));

  const writeFileCached_ = yield* Effect.cachedFunction(
    (data: { path: string; contents?: string; override?: boolean }) =>
      Effect.if(fs.exists(data.path), {
        onFalse: () =>
          fs.writeFileString(data.path, data.contents ?? '').pipe(
            Effect.catchAllCause(() => Effect.void),
            Effect.withSpan('FsUtils.writeFileCached', { attributes: { data } }),
          ),
        onTrue: () => Effect.void,
      }),
  );

  const readFile = (path: string) =>
    fs
      .readFileString(path)
      .pipe(Effect.tapError(() => Effect.logError(`Cannot read file at: ${path}`)));

  const writeFileCached = (data: {
    path: string;
    contents?: string;
    override?: boolean;
  }) => writeFileCached_(data);

  const writeFileSource = (file: { path: string; content: string }) =>
    fs.writeFileString(file.path, file.content);

  const getFileMD5 = (filePath: string) =>
    fs
      .readFile(filePath)
      .pipe(Effect.map((x) => `${Hash.string(new TextDecoder().decode(x))}`));

  const mkEmptyFileCached = (path: string) =>
    Effect.cached(fs.writeFile(path_.resolve(path), new TextEncoder().encode('')));

  return {
    path_,
    glob,
    mkEmptyFileCached,
    writeFileSource,
    writeFileCached,
    globFilesSync,
    modifyFile,
    getFileMD5,
    mkdirCached,
    readFile,
    createWatcher,
  } as const;

  function glob(pattern: string | string[], options?: Glob.GlobOptions) {
    return Effect.tryPromise({
      try: () => Glob.glob(pattern, options ?? {}),
      catch: (e) => new Error(`glob failed: ${e}`),
    }).pipe(Effect.withSpan('FsUtils.glob'));
  }

  function createWatcher(rootDir: string, sourceFiles: string[]) {
    return createChokidarWatcher(
      rootDir,
      chokidar.watch(sourceFiles, {
        cwd: rootDir,
        followSymlinks: false,
        persistent: true,
        ignoreInitial: true,
      }),
    ).pipe(
      Stream.filter(
        (x) =>
          (!x.path.endsWith('.d.ts') && path_.extname(x.path) === '.ts') ||
          path_.extname(x.path) === '.tsx',
      ),
    );
  }

  function createChokidarWatcher(projectRoot: string, watcher: FSWatcher) {
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
                  path: path_.join(projectRoot, filePath),
                });
              case 'change':
                return emit.single({
                  _tag: 'Update',
                  path: path_.join(projectRoot, filePath),
                });
              case 'unlink':
              case 'unlinkDir':
                return emit.single({
                  _tag: 'Remove',
                  path: path_.join(projectRoot, filePath),
                });
            }
          });
        });
      }),
    );
  }
});

export interface FsUtils extends Effect.Effect.Success<typeof make> {}
export const FsUtils = Context.GenericTag<FsUtils>('twin/FsUtils');
export const FsUtilsLive = Layer.effect(FsUtils, make).pipe(
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(NodePath.layerPosix),
);
