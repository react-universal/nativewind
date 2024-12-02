import { FileSystem, Path } from '@effect/platform';
import { PlatformError } from '@effect/platform/Error';
import { Context, Effect, Layer, Queue } from 'effect';
import ts from 'typescript';
import {
  CompiledSource,
  TSCompilerOptions,
  TsEmitResult,
} from '../models/Compiler.models';

const make = Effect.gen(function* () {
  const path_ = yield* Path.Path;
  const fs = yield* FileSystem.FileSystem;
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

  function transpileFile(file: {
    filename: string;
    outFileName: string;
    content: string;
  }) {
    return Effect.try(() => {
      const res = ts.transpileModule(file.content, {
        compilerOptions,
        fileName: file.filename,
        moduleName: file.outFileName,
        reportDiagnostics: true,
      });

      if (res.diagnostics && res.diagnostics.length > 0) {
        console.log('DIAGNOSTIC; ', res.diagnostics);
      }
      return res;
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
export const TypescriptContextLive = Layer.effect(TypescriptContext, make);
