import { FileSystem, Path } from '@effect/platform';
import { NodeFileSystem, NodePath } from '@effect/platform-node';
import chokidar from 'chokidar';
import { Config, Context, Effect, Layer, Stream } from 'effect';
import * as Glob from 'glob';
import { createChokidarWatcher } from '../utils/effect.utils';

const make = Effect.gen(function* (_) {
  const rootDir = yield* Config.string('PROJECT_DIR');
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

  const createWatcher = (sourceFiles: string[]) =>
    Effect.sync(() =>
      createChokidarWatcher(
        rootDir,
        chokidar.watch(sourceFiles, {
          cwd: rootDir,
          useFsEvents: true,
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
      ),
    );

  const getRelativePath = (path: string) => path.replace(rootDir, '').replace(/^\//, '');

  const getCJSPath = (path: string) => path.replace('/esm/', '/cjs/');

  const getOriginalSourceForESM = (path: string) =>
    path.replace('/build/esm/', '/src/').replace(/.js$/, '.ts');

  return {
    glob,
    globFiles,
    modifyFile,
    mkdirCached,
    createWatcher,
    getRelativePath,
    getCJSPath,
    getOriginalSourceForESM,
  } as const;
});

export interface FsUtils extends Effect.Effect.Success<typeof make> {}
export const FsUtils = Context.GenericTag<FsUtils>('twin/FsUtils');
export const FsUtilsLive = Layer.effect(FsUtils, make).pipe(
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(NodePath.layerPosix),
);
