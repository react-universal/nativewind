import { FileSystem, Path } from '@effect/platform';
import { NodeFileSystem, NodePath } from '@effect/platform-node';
import { Context, Effect, Layer, Logger, LogLevel, Option, Queue, Stream } from 'effect';
import { CompiledSource, TsEmitSource } from '../models/Compiler.models';
import { BabelContext, BabelContextLive } from './Babel.service';
import { FsUtils, FsUtilsLive } from './FsUtils.service';
import { TypescriptContext, TypescriptContextLive } from './Typescript.service';
import { VirtualFS } from './VirtualFS.service';

const make = Effect.gen(function* () {
  const rootDir = process.cwd();
  const virtualFS = yield* VirtualFS;
  const fsUtils = yield* FsUtils;
  const fs = yield* FileSystem.FileSystem;
  const path_ = yield* Path.Path;
  const tsRunner = yield* TypescriptContext;
  const compilerReporter = yield* Queue.unbounded<any>();
  const babelRunner = yield* BabelContext;

  const compilerStream = virtualFS.watcher.pipe(
    Stream.bindTo('event'),
    Stream.tapError((x) => Effect.logError(x)),
    Stream.bind('tsFile', ({ event }) => tsRunner.getCompilerFile(event)),
    Stream.bind('esmFile', ({ tsFile }) => transpileFileToESM(tsFile)),
    Stream.bind('annotatedESMFile', (data) => babelRunner.addAnnotationsToESM(data)),
    Stream.bind('cjsFile', (data) =>
      babelRunner.transpileESMToCJS({
        esmFile: data.annotatedESMFile,
        tsFile: data.tsFile,
      }),
    ),
    Stream.mapEffect((files) => virtualFS.createFiles(files)),
  );

  return {
    config: {
      rootDir,
    },
    compilerReporter,
    compilerStream,
    sourcePathToESM,
    sourcePathToESMSourceMap,
    processTsResult,
  };

  function sourcePathToESM(path: string) {
    return path.replace('/src/', '/build/esm/').replace(/.tsx?$/, '.js');
  }

  function sourcePathToESMSourceMap(path: string) {
    return path.replace('/src/', '/build/esm/').replace(/.tsx?$/, '.js.map');
  }

  // function getTsFiles() {
  //   return fsUtils
  //     .glob('src/**/*.ts', {
  //       nodir: true,
  //       absolute: true,
  //       cwd: process.cwd(),
  //       dotRelative: true,
  //       ignore: '**/*.d.ts',
  //     })
  //     .pipe(Effect.map((x) => x.filter((file) => !file.endsWith('d.ts'))));
  // }

  function processTsResult(sources: TsEmitSource[], original: TsEmitSource) {
    return Effect.gen(function* () {
      yield* Effect.logDebug('Compiling file: ', original.path);

      yield* Effect.all(
        sources.map(({ content, path }) =>
          Effect.gen(function* () {
            yield* fsUtils.mkDirIfNotExists(path_.dirname(path));
            yield* fs.writeFileString(path, content);
          }),
        ),
      );

      // yield* babelRunner.annotationsAndCjsCompose(sources, original);
    }).pipe(Logger.withMinimumLogLevel(LogLevel.Debug));
  }

  function transpileFileToESM(
    file: CompiledSource['tsFile'],
  ): Effect.Effect<CompiledSource['esmFile'], string> {
    return Effect.gen(function* () {
      const moduleName = sourcePathToESM(file.path);
      const outputSourceMapPath = sourcePathToESMSourceMap(file.path);

      const output = yield* tsRunner.transpileFile({
        filename: file.path,
        content: file.content,
        outFileName: moduleName,
      });

      return {
        output,
        filePath: moduleName,
        sourcemapFilePath: outputSourceMapPath,
        sourcemap: Option.fromNullable(output.sourceMapText),
      };
    }).pipe(Effect.withSpan('[TS]: transpileFileToESM'));
  }
});

export interface CompilerContext extends Effect.Effect.Success<typeof make> {}
export const CompilerContext = Context.GenericTag<CompilerContext>('CompilerContext');
export const CompilerContextLive = Layer.effect(CompilerContext, make).pipe(
  Layer.provide(TypescriptContextLive),
  Layer.provide(BabelContextLive),
  Layer.provide(FsUtilsLive),
  Layer.provide(NodePath.layerPosix),
  Layer.provide(NodeFileSystem.layer),
);
