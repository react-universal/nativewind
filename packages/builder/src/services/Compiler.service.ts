import { FileSystem, Path } from '@effect/platform';
import { NodeFileSystem, NodePath } from '@effect/platform-node';
import chokidar from 'chokidar';
import { Context, Effect, Layer, Option, Stream } from 'effect';
import { CompiledSource } from '../models/Compiler.models';
import { createChokidarWatcher } from '../utils/effect.utils';
import { FsUtils, FsUtilsLive } from './FsUtils.service';
import { TypescriptContext, TypescriptContextLive } from './Typescript.service';

const make = Effect.gen(function* () {
  const fsUtils = yield* FsUtils;
  const fs = yield* FileSystem.FileSystem;
  const path_ = yield* Path.Path;
  const tsRunner = yield* TypescriptContext;

  const rootDir = process.cwd();
  const buildDir = path_.join(rootDir, 'build');
  const cjsDir = path_.join(buildDir, 'cjs');
  const esmDir = path_.join(buildDir, 'esm');
  const dtsDir = path_.join(buildDir, 'dts');

  yield* fsUtils.mkdirCached('./build');
  yield* fsUtils.mkdirCached('./build/cjs');
  yield* fsUtils.mkdirCached('./build/esm');
  yield* fsUtils.mkdirCached('./build/dts');

  const createWatcher = Effect.sync(() =>
    createChokidarWatcher(
      rootDir,
      chokidar.watch(tsRunner.sourceFiles, {
        cwd: rootDir,
        followSymlinks: false,
        persistent: true,
      }),
    ).pipe(
      Stream.filter(
        (x) =>
          (!x.path.endsWith('.d.ts') && path_.extname(x.path) === '.ts') ||
          path_.extname(x.path) === '.tsx',
      ),
    ),
  );

  // const compilerStream = virtualFS.watcher.pipe(
  //   Stream.bindTo('event'),
  //   Stream.tapError((x) => Effect.logError(x)),
  //   Stream.bind('tsFile', ({ event }) => tsRunner.getCompilerFile(event)),
  //   Stream.bind('esmFile', ({ tsFile }) => transpileFileToESM(tsFile)),
  //   Stream.bind('dtsFile', ({ tsFile }) => tsRunner.getDtsFile(tsFile.path)),
  //   Stream.bind('annotatedESMFile', (data) => babelRunner.addAnnotationsToESM(data)),
  //   Stream.bind('cjsFile', (data) =>
  //     babelRunner.transpileESMToCJS({
  //       esmFile: data.annotatedESMFile,
  //       tsFile: data.tsFile,
  //     }),
  //   ),
  //   Stream.mapEffect((files) => virtualFS.createFiles(files)),
  // );

  return {
    config: {
      createWatcher,
      rootDir,
      cjsDir,
      esmDir,
      dtsDir,
    },
    sourcePathToESM,
    sourcePathToESMSourceMap,
    createFiles,
  };

  function sourcePathToESM(path: string) {
    return path.replace('/src/', '/build/esm/').replace(/.tsx?$/, '.js');
  }

  function sourcePathToESMSourceMap(path: string) {
    return path.replace('/src/', '/build/esm/').replace(/.tsx?$/, '.js.map');
  }

  // function transpileFileToESM(
  //   file: CompiledSource['tsFile'],
  // ): Effect.Effect<CompiledSource['esmFile'], string> {
  //   return Effect.gen(function* () {
  //     const moduleName = sourcePathToESM(file.path);
  //     const outputSourceMapPath = sourcePathToESMSourceMap(file.path);

  //     const output = yield* tsRunner.transpileFile({
  //       filename: file.path,
  //       content: file.content,
  //       outFileName: moduleName,
  //     });

  //     return {
  //       output,
  //       filePath: moduleName,
  //       sourcemapFilePath: outputSourceMapPath,
  //       sourcemap: Option.fromNullable(output.sourceMapText),
  //     };
  //   }).pipe(Effect.withSpan('[TS]: transpileFileToESM'));
  // }

  function writeCompiledSource(source: CompiledSource['cjsFile']) {
    return Effect.all(
      [
        fs.writeFileString(source.filePath, Option.getOrThrow(source.content)),
        fs.writeFileString(
          source.sourcemapFilePath,
          JSON.stringify(Option.getOrThrow(source.sourcemap), null, 2),
        ),
      ],
      { concurrency: 'inherit' },
    );
  }

  function createFiles(files: CompiledSource) {
    return Effect.gen(function* () {
      yield* writeCompiledSource(files.cjsFile);
      yield* writeCompiledSource(files.annotatedESMFile);
      yield* writeCompiledSource(files.dtsFile);
      return files;
    });
  }
});

export interface CompilerContext extends Effect.Effect.Success<typeof make> {}
export const CompilerContext = Context.GenericTag<CompilerContext>('CompilerContext');
export const CompilerContextLive = Layer.effect(CompilerContext, make).pipe(
  Layer.provide(TypescriptContextLive),
  Layer.provide(FsUtilsLive),
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(NodePath.layerPosix),
);
