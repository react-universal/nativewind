import { Path } from '@effect/platform';
import * as chokidar from 'chokidar';
import { Context, Data, Effect, Layer, Option, Queue } from 'effect';
import ts from 'typescript';
import { resolveTSConfig } from '../runners/esbuild/plugins/utils/dts.utils.js';
import {
  createChokidarWatcher,
  listenForkedStreamChanges,
} from '../utils/effect.utils.js';
import { FsUtils } from './FsUtils.service.js';

const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
};

export interface TsEmitSource {
  path: string;
  content: string;
}

export type TsEmitResult = Data.TaggedEnum<{
  File: { readonly value: TsEmitSource[]; original: TsEmitSource };
  Diagnostic: { readonly value: ts.Diagnostic };
  Message: { readonly value: string };
}>;
export const TsEmitResult = Data.taggedEnum<TsEmitResult>();

const make = Effect.gen(function* () {
  const path_ = yield* Path.Path;
  const fs = yield* FsUtils;
  const diagnosticsQueue = yield* Queue.unbounded<ts.Diagnostic>();
  const compiledFiles = yield* Queue.unbounded<TsEmitResult>();
  const rootFiles = yield* fs.glob('src/*.ts', {
    nodir: true,
  });
  const allFiles = yield* fs.glob('src/**/*.ts', {
    nodir: true,
  });

  const configPath = Option.fromNullable(
    ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.build.json'),
  ).pipe(Option.getOrThrowWith(() => 'TSCONFIG_FILE_NOT_FOUND'));
  const rootDir = path_.dirname(configPath);
  const buildOutDir = path_.join(rootDir, 'build');
  const tsConfig = yield* Effect.sync(() =>
    resolveTSConfig({
      configName: 'tsconfig.build.json',
      searchPath: process.cwd(),
    }),
  );
  const compilerOptions = ts.convertCompilerOptionsFromJson(
    tsConfig.config.compilerOptions,
    process.cwd(),
    'tsconfig.build.json',
  );

  compilerOptions.options['module'] = ts.ModuleKind.ESNext;

  const compilerHost = ts.createCompilerHost(compilerOptions.options);
  const compilerProgram = ts.createProgram({
    host: compilerHost,
    options: compilerOptions.options,
    rootNames: rootFiles,
  });

  const emitFileSources = (sourceFile: ts.SourceFile, filePath: string) =>
    Effect.promise<TsEmitSource[]>(
      () =>
        new Promise((emit) => {
          const results: TsEmitSource[] = [];
          compilerProgram.emit(
            sourceFile,
            (filename, content, _mark, _onError, _sourceFiles) => {
              results.push({
                content,
                path: filename,
              });

              if (results.length === 4) {
                emit(results);
              }
            },
          );
        }),
    );

  yield* listenForkedStreamChanges(
    createChokidarWatcher(
      rootDir,
      chokidar.watch(allFiles, {
        cwd: rootDir,
        persistent: true,
      }),
    ),
    (data) =>
      Effect.gen(function* () {
        const relativePath = path_.relative(rootDir, data.path);
        if (data._tag === 'Remove') {
          return yield* compiledFiles
            .offer(
              TsEmitResult.Message({
                value: `File: ${relativePath} removed`,
              }),
            )
            .pipe(Effect.asVoid);
        }

        const maybeSource = Option.fromNullable(compilerProgram.getSourceFile(data.path));

        if (Option.isNone(maybeSource)) {
          return yield* compiledFiles
            .offer(
              TsEmitResult.Message({
                value: `File: ${relativePath} couldn't be found`,
              }),
            )
            .pipe(Effect.asVoid);
        }

        const sourceFile = maybeSource.value;

        yield* emitFileSources(sourceFile, data.path).pipe(
          Effect.flatMap((x) =>
            compiledFiles.offer(
              TsEmitResult.File({
                value: x,
                original: {
                  content: sourceFile.text,
                  path: data.path,
                },
              }),
            ),
          ),
        );

        return yield* Effect.void;
      }),
  );

  return {
    diagnosticsQueue,
    compiledFiles,
    reportWatchStatusChanged,
    reportDiagnostic,
    formatHost,
    buildOutDir,
  };

  function reportWatchStatusChanged(
    diagnostic: ts.Diagnostic,
    newLine: string,
    options: ts.CompilerOptions,
    errorCount?: number,
  ) {
    // watcherQueue.unsafeOffer({
    //   ...diagnostic,
    // });
    // return ts.formatDiagnostic(diagnostic, formatHost);
  }

  function reportDiagnostic(diagnostic: ts.Diagnostic) {
    // watcherQueue.unsafeOffer(diagnostic);
    // console.error(
    //   'Error',
    //   diagnostic.code,
    //   ':',
    //   ts.flattenDiagnosticMessageText(diagnostic.messageText, formatHost.getNewLine()),
    // );
  }
});

export interface TypescriptContext extends Effect.Effect.Success<typeof make> {}
export const TypescriptContext =
  Context.GenericTag<TypescriptContext>('TypescriptContext');
export const TypescriptContextLive = Layer.effect(TypescriptContext, make);
