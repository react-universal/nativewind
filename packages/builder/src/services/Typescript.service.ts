import { Path } from '@effect/platform';
import {
  Array,
  Config,
  Context,
  Effect,
  GroupBy,
  Layer,
  Option,
  pipe,
  Stream,
} from 'effect';
import * as ts from 'typescript';
import { TSCompilerOptions } from '../models/Compiler.models';
import {
  createFileToEmit,
  EmittedFile,
  getEmittedFileKind,
} from '../models/CompilerFile.models';
import { FsUtils, FsUtilsLive } from './FsUtils.service';

const make = Effect.gen(function* () {
  const path_ = yield* Path.Path;
  const fsUtils = yield* FsUtils;
  const rootDir = yield* Config.string('PROJECT_DIR');
  const tsSourcesDir = path_.join(rootDir, 'src');
  const buildOutDir = path_.join(rootDir, 'build');
  const sourceFiles = yield* fsUtils.globFiles('src/**/*.{!d.,ts,js}', {
    dot: false,
    absolute: false,
    follow: false,
    mark: false,
  });

  const tsCompilerHost = ts.createCompilerHost(TSCompilerOptions, false);
  const compilerProgram = ts.createProgram(
    sourceFiles,
    TSCompilerOptions,
    tsCompilerHost,
  );

  // WATCH COMPILER

  const compiler = Stream.async<EmittedFile>((emit) => {
    const program = createWatcherProgram(
      (filename: string, content, _, __, sourceFiles) => {
        const source = pipe(
          sourceFiles ?? [],
          Array.head,
          Option.map((x) => x.fileName),
          Option.getOrElse(() => 'Unknown'),
        )
          .replace(rootDir, '')
          .replace(/^\//, '');

        emit.single({
          _tag: getEmittedFileKind(filename),
          path: filename,
          content,
          source,
        });
      },
    );

    program.getProgram().emit();
    // emit.end();
    return Effect.promise(() => emit.end());
  });

  const tsCompilerStream = compiler.pipe(
    Stream.groupBy((a) => Effect.succeed([a.source.replace(rootDir, ''), a] as const)),
    GroupBy.evaluate((key, stream) =>
      pipe(
        Stream.runCollect(stream),
        Effect.map((leftOver) => [key, createFileToEmit(leftOver)] as const),
        Stream.fromEffect,
      ),
    ),
  );

  return {
    sourceFiles,
    tsCompilerStream,
    reportDiagnostic,
    buildOutDir,
    tsSourcesDir,
    makeSourcesCompiler,
    getCompilerFile,
    tsCompileSource,
  };

  function createWatcherProgram(onWriteFile: ts.WriteFileCallback) {
    const createProgram = ts.createEmitAndSemanticDiagnosticsBuilderProgram;
    const tsWatchHost = ts.createWatchCompilerHost(
      sourceFiles,
      TSCompilerOptions,
      ts.sys,
      createProgram,
      () => {},
      (x, n, o, e) => {
        console.log(x);
      },
    );
    const origCreateProgram = tsWatchHost.createProgram;

    tsWatchHost.createProgram = (rootNames, options, host, oldProgram) => {
      if (host) {
        console.log('SET_COMPILER_HOST');
        host.writeFile = onWriteFile;
      }
      console.log("** We're about to create the program! **");
      return origCreateProgram(rootNames, options, host, oldProgram);
    };

    const origPostProgramCreate = tsWatchHost.afterProgramCreate;
    tsWatchHost.afterProgramCreate = (program) => {
      console.log('** We finished making the program! **');
      origPostProgramCreate!(program);
    };
    // `createWatchProgram` creates an initial program, watches files, and updates
    // the program over time.
    return ts.createWatchProgram(tsWatchHost);
  }

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
