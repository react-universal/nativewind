import { Path } from '@effect/platform';
import * as chokidar from 'chokidar';
import { Context, Data, Effect, Layer, Option, Queue, Ref } from 'effect';
import ts from 'typescript';
import { resolveTSConfig } from '../runners/esbuild/plugins/utils/dts.utils.js';
import {
  createChokidarWatcher,
  listenForkedStreamChanges,
} from '../utils/effect.utils.js';
import { BuilderLoggerService } from './BuildLogger.service.js';
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

const CompilerOptions: ts.CompilerOptions = {
  declaration: true,
  sourceMap: true,
  declarationMap: true,
  emitDecoratorMetadata: true,
  experimentalDecorators: true,
  noEmitOnError: false,
  downlevelIteration: true,
  removeComments: false,
  module: ts.ModuleKind.NodeNext,
  target: ts.ScriptTarget.ES2022,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  moduleDetection: ts.ModuleDetectionKind.Force,
  esModuleInterop: false,
  types: ['node'],
  skipLibCheck: true,
  skipDefaultLibCheck: true,
  allowSyntheticDefaultImports: true,
  resolveJsonModule: true,
  allowJs: false,
  checkJs: false,
  strict: true,
  strictFunctionTypes: true,
  noFallthroughCasesInSwitch: true,
  noPropertyAccessFromIndexSignature: true,
  strictNullChecks: true,
  noUncheckedIndexedAccess: false,
  alwaysStrict: true,
  forceConsistentCasingInFileNames: true,
  allowUnreachableCode: false,
  noImplicitReturns: false,
  exactOptionalPropertyTypes: false,
  noImplicitAny: true,
  noImplicitThis: true,
  noImplicitOverride: true,
  noErrorTruncation: false,
  noUnusedParameters: false,
  noUnusedLocals: true,
  isolatedModules: true,
};
export type TsEmitResult = Data.TaggedEnum<{
  File: { readonly value: TsEmitSource[]; original: TsEmitSource };
  Diagnostic: { readonly value: ts.Diagnostic; readonly filePath: string };
  Message: { readonly value: string };
}>;
export const TsEmitResult = Data.taggedEnum<TsEmitResult>();

const make = Effect.gen(function* () {
  const path_ = yield* Path.Path;
  const fs = yield* FsUtils;
  const logger = yield* BuilderLoggerService;
  const diagnosticsQueue = yield* Queue.unbounded<ts.Diagnostic>();
  const compiledFiles = yield* Queue.unbounded<TsEmitResult>();
  const rootFiles = yield* Ref.make(yield* fs.getTsFiles());

  const allFiles = yield* fs
    .glob('src/**/*.ts', {
      nodir: true,
    })
    .pipe(Effect.map((x) => x.filter((file) => !file.endsWith('d.ts'))));

  const configPath = Option.fromNullable(
    ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.json'),
  ).pipe(Option.getOrThrowWith(() => 'TSCONFIG_FILE_NOT_FOUND'));

  const rootDir = path_.dirname(configPath);
  const buildOutDir = path_.join(rootDir, 'build');

  const compilerOptions: ts.CompilerOptions = {
    ...CompilerOptions,
    outDir: path_.join(buildOutDir, 'esm'),
    declarationDir: path_.join(buildOutDir, 'dts'),
  };

  yield* Ref.get(rootFiles).pipe(Effect.tap(Effect.logDebug));

  yield* Effect.logDebug('OPTIONS: ', compilerOptions);

  const compilerHost = ts.createCompilerHost(compilerOptions);

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
          yield* Ref.update(rootFiles, (files) => files.filter((x) => x !== data.path));
          return yield* compiledFiles
            .offer(
              TsEmitResult.Message({
                value: `File: ${relativePath} removed`,
              }),
            )
            .pipe(Effect.asVoid);
        }
        const compilerProgram = yield* getCompilerProgram([data.path]);

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

        const diagnostics = ts.getPreEmitDiagnostics(compilerProgram, sourceFile);

        diagnostics.map((x) => {
          compiledFiles.unsafeOffer(
            TsEmitResult.Message({
              value: `ERROR: ${x.code} \n File: ${data.path} \n Message: ${x.messageText}`,
            }),
          );
        });

        yield* Effect.promise<TsEmitSource[]>(
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
        ).pipe(
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
          Effect.catchAllDefect((x) =>
            compiledFiles.offer(
              TsEmitResult.Message({ value: `Unhandled Error: ${x} ${data.path}` }),
            ),
          ),
        );

        return yield* Effect.void;
      }),
  );

  return {
    diagnosticsQueue,
    compiledFiles,
    reportDiagnostic,
    formatHost,
    buildOutDir,
  };

  function getCompilerProgram(fileRoots: string[]) {
    return Effect.sync(() =>
      ts.createProgram({
        host: compilerHost,
        options: compilerOptions,
        rootNames: fileRoots,
      }),
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
