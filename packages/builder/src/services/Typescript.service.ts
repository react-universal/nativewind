import { Path } from '@effect/platform';
import { Context, Effect, Layer, Queue, Stream } from 'effect';
import ts from 'typescript';
import { TSCompilerOptions, TsEmitResult } from '../models/Compiler.models';
import { FsUtils, FsUtilsLive } from './FsUtils.service';

const make = Effect.gen(function* () {
  const compiledFiles = yield* Queue.unbounded<TsEmitResult>();
  const path_ = yield* Path.Path;
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
      Stream.onEnd(Effect.logInfo('[twin] Compiler successfully finish!', '\n')),
      Stream.filter((x) => !x.endsWith('.d.ts')),
      Stream.mapEffect((filePath) => getCompilerFile(filePath)),
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

  function getCompilerFile(filePath: string) {
    return Effect.fromNullable(compilerProgram.getSourceFile(filePath))
      .pipe(
        Effect.tapError((x) => Effect.logWarning('[TS] cant find sourcefile: ', x, '\n')),
      )
      .pipe(Effect.withSpan('[TS]: getCompilerFile'));
  }

  function reportDiagnostic(diagnostic: ts.Diagnostic) {
    return Effect.logWarning(
      `[TS] Error: ${diagnostic.code}`,
      ts.formatDiagnosticsWithColorAndContext([diagnostic], tsCompilerHost),
      '\n',
    );
  }
});

export interface TypescriptContext extends Effect.Effect.Success<typeof make> {}
export const TypescriptContext =
  Context.GenericTag<TypescriptContext>('TypescriptContext');
export const TypescriptContextLive = Layer.effect(TypescriptContext, make).pipe(
  Layer.provide(FsUtilsLive),
);
