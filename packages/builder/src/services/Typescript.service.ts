import { FileSystem, Path } from '@effect/platform';
import { PlatformError } from '@effect/platform/Error';
import { Context, Effect, Layer, Queue, Stream } from 'effect';
import ts from 'typescript';
import {
  CompiledSource,
  TSCompilerOptions,
  TsEmitResult,
} from '../models/Compiler.models';
import { FsUtils, FsUtilsLive } from './FsUtils.service';

const make = Effect.gen(function* () {
  const compiledFiles = yield* Queue.unbounded<TsEmitResult>();
  const path_ = yield* Path.Path;
  const fs = yield* FileSystem.FileSystem;
  const fsUtils = yield* FsUtils;
  const rootDir = process.cwd();
  const tsSourcesDir = path_.join(rootDir, 'src');
  const buildOutDir = path_.join(rootDir, 'build');
  const tsCompilerHost = ts.createCompilerHost(TSCompilerOptions, false);

  const sourceFiles = yield* fsUtils.globFiles('src/**/*.{!d.,ts,js}', {
    dot: false,
    absolute: false,
    follow: false,
    mark: false,
  });

  const compilerProgram = ts.createProgram(
    sourceFiles,
    TSCompilerOptions,
    tsCompilerHost,
  );

  yield* Effect.logInfo('[TS] Starting transpilation Program... \n');

  // const compileSources = (files: string[], content: string) => {
  //   compilerHost.writeFile = (outFilePath, outContent) => {};
  //   const compilerProgram = ts.createProgram(files, TSCompilerOptions, compilerHost);
  // };

  // const compileFile = (sourcePath: string) =>
  //   fs.readFileString(sourcePath, 'utf-8').pipe(
  //     Effect.map((content) => {
  //       const output = compileSources([sourcePath], content);
  //     }),
  //   );

  return {
    compiledFiles,
    sourceFiles,
    reportDiagnostic,
    buildOutDir,
    tsSourcesDir,
    makeSourcesCompiler,
    getCompilerFile,
    tsCompileSource,
  };

  function makeSourcesCompiler(sources: string[]) {
    return Stream.fromIterable(sources).pipe(
      Stream.onStart(Effect.logInfo('[twin] Compiler starting...', '\n')),
      Stream.onEnd(Effect.log('[twin] Compiler successfully finish!', '\n')),
      Stream.filter(x => !x.endsWith('.d.ts')),
      Stream.mapEffect((filePath) =>
        Effect.fromNullable(compilerProgram.getSourceFile(filePath)).pipe(
          Effect.tapError((x) =>
            Effect.logWarning('[TS] cant find sourcefile: ', x, '\n'),
          ),
        ),
      ),
      Stream.mapEffect((source) => tsCompileSource(source)),
      Stream.tap((x) => Effect.all(x.diagnostics.map(reportDiagnostic))),
    );
  }

  function tsCompileSource(source: ts.SourceFile) {
    return Effect.gen(function* () {
      const file = {
        sourcemaps: { path: '', content: '' },
        esm: { path: '', content: '' },
        dts: { path: '', content: '' },
        dtsMap: { path: '', content: '' },
      };
      tsCompilerHost.writeFile = (path, content) => {
        if (path.endsWith('d.ts')) {
          file.dtsMap = {
            content,
            path,
          };
        } else if (path.endsWith('.d.ts.map')) {
          file.dts = {
            content,
            path,
          };
        } else if (path.endsWith('.js.map')) {
          file.sourcemaps = {
            content,
            path,
          };
        } else {
          file.esm = {
            content,
            path,
          };
        }
      };
      const results = compilerProgram.emit(source);
      return {
        diagnostics: results.diagnostics,
        file,
        source,
      };
    });
  }

  function getCompilerFile(
    event: FileSystem.WatchEvent,
  ): Effect.Effect<CompiledSource['tsFile'], PlatformError> {
    return Effect.gen(function* () {
      const content = yield* fs.readFileString(event.path);
      return {
        content,
        path: event.path,
      };
    }).pipe(Effect.withSpan('[TS]: getCompilerFile'));
  }

  function reportDiagnostic(diagnostic: ts.Diagnostic) {
    return Effect.logWarning(
      `[TS] Error: ${diagnostic.code}`,
      ts.formatDiagnosticsWithColorAndContext([diagnostic], tsCompilerHost),
      '\n',
    );
  }

  // function getDtsFile(
  //   filePath: string,
  // ): Effect.Effect<CompiledSource['dtsFile'], UnknownException | PlatformError> {
  //   return Effect.try(() => {
  //     const host = ts.createCompilerHost(TSCompilerOptions);
  //     const dtsFile = {
  //       filePath: '',
  //       sourcemapFilePath: '',
  //       content: Option.none<string>(),
  //       sourcemap: Option.none<BabelSourceMap>(),
  //     };

  //     host.writeFile = (filename, contents) => {
  //       if (filename.endsWith('.d.ts')) {
  //         dtsFile.filePath = filename;
  //         dtsFile.content = Option.some(contents);
  //         return;
  //       }
  //       if (filename.endsWith('.d.ts.map')) {
  //         dtsFile.sourcemapFilePath = filename;
  //         dtsFile.sourcemap = Option.some(JSON.parse(contents));
  //       }
  //     };

  //     const program = ts.createProgram([filePath], TSCompilerOptions, host);
  //     const sourceFile = program.getSourceFile(filePath);

  //     program.emit(sourceFile, undefined, undefined, true);
  //     host.readFile(filePath);

  //     return dtsFile;
  //   }).pipe(
  //     Effect.flatMap((dtsFile) => {
  //       return fsUtils
  //         .mkdirCached(path_.dirname(dtsFile.filePath))
  //         .pipe(Effect.andThen(() => dtsFile));
  //     }),
  //   );
  // }

  // function transpileFile(file: {
  //   filename: string;
  //   outFileName: string;
  //   content: string;
  // }) {
  //   return Effect.try(() => {
  //     const transpiled = ts.transpileModule(file.content, {
  //       compilerOptions,
  //       fileName: file.filename,
  //       moduleName: file.outFileName,
  //       reportDiagnostics: true,
  //     });

  //     // if (res.diagnostics && res.diagnostics.length > 0) {
  //     //   console.log('DIAGNOSTIC; ', res.diagnostics);
  //     // }
  //     return transpiled;
  //   }).pipe(
  //     Effect.tapError((error) => {
  //       return Effect.logError(error, '\n\n ', {
  //         filename: file.filename,
  //         outFileName: file.outFileName,
  //       });
  //     }),
  //     // Effect.mapErrorCause((x) => {
  //     //   return x;
  //     // }),
  //     Effect.mapError((x) => `ERROR: ${x}`),
  //   );
  // }
});

export interface TypescriptContext extends Effect.Effect.Success<typeof make> {}
export const TypescriptContext =
  Context.GenericTag<TypescriptContext>('TypescriptContext');
export const TypescriptContextLive = Layer.effect(TypescriptContext, make).pipe(
  Layer.provide(FsUtilsLive),
);
