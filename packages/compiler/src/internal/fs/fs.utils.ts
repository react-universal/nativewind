import { FileSystem } from '@effect/platform';
import { NodeFileSystem, NodePath } from '@effect/platform-node';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Hash from 'effect/Hash';
import * as Layer from 'effect/Layer';
import * as TwinPath from './fs.path.js';

const make = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const twinPath = yield* TwinPath.TwinPath;

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

  const mkdirCached = (path: TwinPath.AbsoluteFilePath) => mkdirCached_(path);

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

  const mkEmptyFileCached = (path: TwinPath.AbsoluteFilePath) =>
    Effect.cached(fs.writeFile(path, new TextEncoder().encode('')));

  return {
    path_: twinPath,
    mkEmptyFileCached,
    writeFileSource,
    writeFileCached,
    modifyFile,
    getFileMD5,
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
