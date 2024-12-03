import { FileSystem, Path } from '@effect/platform';
import { PlatformError } from '@effect/platform/Error';
import { Context, Effect, Layer, Option, Queue } from 'effect';
import { UnknownException } from 'effect/Cause';
import ts from 'typescript';
import {
  BabelSourceMap,
  CompiledSource,
  TSCompilerOptions,
  TsEmitResult,
} from '../models/Compiler.models';
import { FsUtils, FsUtilsLive } from './FsUtils.service';

const make = Effect.gen(function* () {
  const path_ = yield* Path.Path;
  const fs = yield* FileSystem.FileSystem;
  const fsUtils = yield* FsUtils;
  const rootDir = process.cwd();
  const compiledFiles = yield* Queue.unbounded<TsEmitResult>();

  const tsSourcesDir = path_.join(rootDir, 'src');
  const buildOutDir = path_.join(rootDir, 'build');

  const compilerOptions: ts.CompilerOptions = {
    ...TSCompilerOptions,
    outDir: path_.join(buildOutDir, 'esm'),
    declarationDir: path_.join(buildOutDir, 'dts'),
  };

  yield* Effect.logInfo('[TS] Starting transpilation Program... \n');

  return {
    compiledFiles,
    reportDiagnostic,
    transpileFile,
    getDtsFile,
    buildOutDir,
    tsSourcesDir,
    getCompilerFile,
  };

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

  function getDtsFile(
    filePath: string,
  ): Effect.Effect<CompiledSource['dtsFile'], UnknownException | PlatformError> {
    return Effect.try(() => {
      const host = ts.createCompilerHost(compilerOptions);
      const dtsFile = {
        filePath: '',
        sourcemapFilePath: '',
        content: Option.none<string>(),
        sourcemap: Option.none<BabelSourceMap>(),
      };

      host.writeFile = (filename, contents) => {
        if (filename.endsWith('.d.ts')) {
          dtsFile.filePath = filename;
          dtsFile.content = Option.some(contents);
          return;
        }
        if (filename.endsWith('.d.ts.map')) {
          dtsFile.sourcemapFilePath = filename;
          dtsFile.sourcemap = Option.some(JSON.parse(contents));
        }
      };

      const program = ts.createProgram([filePath], compilerOptions, host);
      const sourceFile = program.getSourceFile(filePath);

      program.emit(sourceFile, undefined, undefined, true);
      host.readFile(filePath);

      return dtsFile;
    }).pipe(
      Effect.flatMap((dtsFile) => {
        return fsUtils
          .mkdirCached(path_.dirname(dtsFile.filePath))
          .pipe(Effect.andThen(() => dtsFile));
      }),
    );
  }

  function transpileFile(file: {
    filename: string;
    outFileName: string;
    content: string;
  }) {
    return Effect.try(() => {
      const transpiled = ts.transpileModule(file.content, {
        compilerOptions,
        fileName: file.filename,
        moduleName: file.outFileName,
        reportDiagnostics: true,
      });

      // if (res.diagnostics && res.diagnostics.length > 0) {
      //   console.log('DIAGNOSTIC; ', res.diagnostics);
      // }
      return transpiled;
    }).pipe(
      Effect.tapError((error) => {
        return Effect.logError(error, '\n\n ', {
          filename: file.filename,
          outFileName: file.outFileName,
        });
      }),
      // Effect.mapErrorCause((x) => {
      //   return x;
      // }),
      Effect.mapError((x) => `ERROR: ${x}`),
    );
  }

  function reportDiagnostic(diagnostic: ts.Diagnostic, filePath: string) {
    compiledFiles.unsafeOffer(TsEmitResult.Diagnostic({ value: diagnostic, filePath }));
  }
});

export interface TypescriptContext extends Effect.Effect.Success<typeof make> {}
export const TypescriptContext =
  Context.GenericTag<TypescriptContext>('TypescriptContext');
export const TypescriptContextLive = Layer.effect(TypescriptContext, make).pipe(
  Layer.provide(FsUtilsLive),
);
