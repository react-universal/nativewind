import { Path, FileSystem } from '@effect/platform';
import { NodePath, NodeFileSystem } from '@effect/platform-node';
import { Context, Effect, Layer } from 'effect';
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
      fs
        .makeDirectory(path, { recursive: true })
        .pipe(Effect.withSpan('FsUtils.mkdirCached', { attributes: { path } })),
    ),
  );

  const mkdirCached = (path: string) => mkdirCached_(path_.resolve(path));

  const readJson = (path: string) =>
    Effect.tryMap(fs.readFileString(path), {
      try: (_) => JSON.parse(_),
      catch: (e) => new Error(`readJson failed (${path}): ${e}`),
    });

  const writeJson = (path: string, json: unknown) =>
    fs.writeFileString(path, JSON.stringify(json, null, 2) + '\n');

  const mkDirIfNotExists = (path: string) =>
    fs.exists(path).pipe(
      Effect.if({
        onTrue: () => Effect.void,
        onFalse: () => fs.makeDirectory(path, { recursive: true }),
      }),
    );

  const writeFileSource = (file: { path: string; content: string }) =>
    fs.writeFileString(file.path, file.content);

  return {
    glob,
    writeFileSource,
    globFiles,
    modifyFile,
    mkDirIfNotExists,
    mkdirCached,
    readJson,
    writeJson,
  } as const;
});

export interface FsUtils extends Effect.Effect.Success<typeof make> {}
export const FsUtils = Context.GenericTag<FsUtils>('@effect/build-tools/FsUtils');
export const FsUtilsLive = Layer.effect(FsUtils, make).pipe(
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(NodePath.layerPosix),
);
