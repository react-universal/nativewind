import { win32 as win32Path } from 'node:path';
import * as NodePath from '@effect/platform-node/NodePath';
import * as Path from '@effect/platform/Path';
import * as RA from 'effect/Array';
import * as Branded from 'effect/Brand';
import * as Context from 'effect/Context';
import * as Data from 'effect/Data';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Glob from 'glob';
import { CompilerConfigContext } from '../../services/CompilerConfig.service.js';

export type AbsoluteFilePath = Branded.Branded<string, 'paths/AbsoluteFilePath'>;
export type RelativeFilePath = Branded.Branded<string, 'paths/RelativeFilePath'>;
export type TSFilePath = Branded.Branded<string, 'paths/TSFilePath'>;
export type TSXFilePath = Branded.Branded<string, 'paths/TSXFilePath'>;
export type GlobPath = Branded.Branded<string, 'paths/GlobPath'>;
export type UnknownFilePath = Branded.Branded<string, 'paths/UnknownFilePath'>;
export const unknownFilePath = Branded.nominal<UnknownFilePath>();

export class TwinPathError extends Data.TaggedError('paths/TwinPathError')<{
  path: string;
  cause: Error;
}> {}
export class TwinGlobsError extends Data.TaggedError('paths/TwinGlobsError')<{
  globs: GlobPath[];
  cause: Error;
}> {}

export type AnyTwinPath =
  | AbsoluteFilePath
  | RelativeFilePath
  | TSFilePath
  | TSXFilePath
  | GlobPath
  | UnknownFilePath;

const make = Effect.gen(function* () {
  const isPosixFilePathString = (path_: string) => !path_.includes(path.sep);

  const path = yield* Path.Path;
  const env = yield* CompilerConfigContext;
  const cwd = yield* Effect.sync(() => absoluteFromString(env.projectRoot));
  const globOptions: Glob.GlobOptionsWithFileTypesFalse = {
    absolute: true,
    withFileTypes: false,
    cwd: env.projectRoot,
  };

  const absolutePath = Branded.refined<AbsoluteFilePath>(
    (path_) => isPosixFilePathString(path_) && path.isAbsolute(path_),
    (path_) =>
      Branded.error(
        `Expected an absolute path (i.e. starting with '/' or '\\'), but got ${path_}`,
      ),
  );
  const relativePath = Branded.refined<RelativeFilePath>(
    (path_) => isPosixFilePathString(path_) && !path.isAbsolute(path_),
    (path_) => Branded.error(`Expected a Posix file path, got ${path_}`),
  );
  const tsFilePath = Branded.refined<TSFilePath>(
    (path_) => path.extname(path_).endsWith('.ts'),
    (path_) => Branded.error(`expecting a .ts file but got ${path_}`),
  );
  const tsxFilePath = Branded.refined<TSXFilePath>(
    (path_) => path.extname(path_).endsWith('.tsx'),
    (path_) => Branded.error(`expecting a .tsx file but got ${path_}`),
  );
  const globPath = Branded.nominal<GlobPath>();

  return {
    make: {
      absolute: absolutePath,
      relative: relativePath,
      unknown: unknownFilePath,
      glob: globPath,
      ts: tsFilePath,
      tsx: tsxFilePath,
      relativeFromString,
      absoluteFromString,
    },
    glob,
    relative,
    filePathJoin,
    isPosixFilePathString,
    getExt: path.extname,
    dirname: path.dirname,
  };

  function glob(
    pattern: Iterable<GlobPath>,
  ): Effect.Effect<AbsoluteFilePath[], TwinGlobsError>;
  function glob(
    pattern: Iterable<GlobPath>,
    mode: 'sync' | 'async',
  ): Effect.Effect<AbsoluteFilePath[], TwinGlobsError>;
  function glob(
    pattern: Iterable<GlobPath>,
    mode: 'sync' | 'async' = 'async',
    options: Glob.GlobOptionsWithFileTypesFalse = globOptions,
  ): Effect.Effect<AbsoluteFilePath[], TwinGlobsError> {
    return Effect.if(mode === 'sync', {
      onTrue: () => Effect.try(() => Glob.globSync(RA.fromIterable(pattern), options)),
      onFalse: () =>
        Effect.tryPromise(() => Glob.glob(RA.fromIterable(pattern), options)),
    }).pipe(
      Effect.map((paths) => RA.map(paths, absoluteFromString)),
      Effect.mapError(
        (error) =>
          new TwinGlobsError({
            globs: RA.fromIterable(pattern),
            cause: new Error(`glob failed: ${error.message}`),
          }),
      ),
      Effect.withSpan('FsUtils.glob'),
    );
  }

  function absoluteFromString(path_: string): AbsoluteFilePath {
    if (!path.isAbsolute(path_)) {
      if (cwd === undefined) {
        throw new Error(
          `Expected an absolute path (i.e. starting with '/' or '\\'), but got ${path_}`,
        );
      }
      return filePathJoin(cwd, path_);
    }
    if (isPosixFilePathString(path_)) {
      return absolutePath(path_);
    }

    return absolutePath(path_.split(win32Path.sep).join(path.sep));
  }

  function relativeFromString(path_: string): RelativeFilePath {
    if (path.isAbsolute(path_)) {
      if (cwd === undefined) {
        throw new Error(`Expected a relative path, got ${path_}`);
      }

      return relative(cwd, path_);
    }

    if (isPosixFilePathString(path_)) {
      return relativePath(path_);
    }

    return relativePath(path_.split(win32Path.sep).join(path.sep));
  }

  function filePathJoin(...paths: RelativeFilePath[]): RelativeFilePath;
  function filePathJoin(...paths: [AbsoluteFilePath, ...string[]]): AbsoluteFilePath;
  function filePathJoin(...paths: string[]): RelativeFilePath | AbsoluteFilePath {
    if (paths.length > 0 && path.isAbsolute(paths[0]!)) {
      if (paths.slice(1).some(path.isAbsolute)) {
        throw new Error(
          `All path segments except the first are expected to be relative, got ${paths}`,
        );
      }

      return absoluteFromString(path.join(...paths));
    }

    return relativeFromString(path.join(...paths));
  }

  function relative(from: AbsoluteFilePath, to: AbsoluteFilePath): RelativeFilePath;
  function relative(from: AbsoluteFilePath, to: string): RelativeFilePath;
  function relative(
    from: AbsoluteFilePath | string,
    to: AbsoluteFilePath | string,
  ): RelativeFilePath {
    return relativeFromString(path.relative(from, to));
  }
});

export interface TwinPath extends Effect.Effect.Success<typeof make> {}
export const TwinPath = Context.GenericTag<TwinPath>('compiler/fs/path/service');
export const TwinPathLive = Layer.effect(TwinPath, make).pipe(
  Layer.provide(NodePath.layerPosix),
);
