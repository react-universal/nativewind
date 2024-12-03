import { Context, Effect, Layer, Option, Queue, Stream } from 'effect';
import { CompiledSource } from '../models/Compiler.models';
import { BabelContext, BabelContextLive } from './Babel.service';
import { TypescriptContext, TypescriptContextLive } from './Typescript.service';
import { VirtualFS, VirtualFSLive } from './VirtualFS.service';

const make = Effect.gen(function* () {
  const rootDir = process.cwd();
  const virtualFS = yield* VirtualFS;
  const tsRunner = yield* TypescriptContext;
  const compilerReporter = yield* Queue.unbounded<any>();
  const babelRunner = yield* BabelContext;

  const compilerStream = virtualFS.watcher.pipe(
    Stream.bindTo('event'),
    Stream.tapError((x) => Effect.logError(x)),
    Stream.bind('tsFile', ({ event }) => tsRunner.getCompilerFile(event)),
    Stream.bind('esmFile', ({ tsFile }) => transpileFileToESM(tsFile)),
    Stream.bind('dtsFile', ({ tsFile }) => tsRunner.getDtsFile(tsFile.path)),
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
  };

  function sourcePathToESM(path: string) {
    return path.replace('/src/', '/build/esm/').replace(/.tsx?$/, '.js');
  }

  function sourcePathToESMSourceMap(path: string) {
    return path.replace('/src/', '/build/esm/').replace(/.tsx?$/, '.js.map');
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
  Layer.provide(VirtualFSLive),
);
