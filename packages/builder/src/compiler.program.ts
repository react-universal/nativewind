import { FileSystem, Path } from '@effect/platform';
import { NodeFileSystem, NodePath } from '@effect/platform-node';
import { Effect, Layer, Option, Stream } from 'effect';
import { BabelContext, BabelContextLive } from './services/Babel.service.js';
import { FsUtils, FsUtilsLive } from './services/FsUtils.service.js';
import {
  TypescriptContext,
  TypescriptContextLive,
} from './services/Typescript.service.js';

const MainLive = Layer.empty.pipe(
  // Layer.provideMerge(CompilerContextLive),
  Layer.provideMerge(BabelContextLive),
  Layer.provideMerge(TypescriptContextLive),
  Layer.provideMerge(FsUtilsLive),
  Layer.provideMerge(NodeFileSystem.layer),
  Layer.provideMerge(NodePath.layerPosix),
);

export const CompilerRun = Effect.gen(function* () {
  const babelRunner = yield* BabelContext;
  const path_ = yield* Path.Path;
  const tsRunner = yield* TypescriptContext;
  const fsUtils = yield* FsUtils;
  const fs = yield* FileSystem.FileSystem;

  const output = yield* tsRunner.makeSourcesCompiler(tsRunner.sourceFiles).pipe(
    Stream.mapEffect(({ file, source }) =>
      Effect.gen(function* () {
        const esm = yield* babelRunner.addAnnotationsToESM(
          {
            filePath: file.esm.path,
            content: file.esm.content,
            sourcemap: file.sourcemaps.content,
            sourcemapFilePath: file.sourcemaps.path,
          },
          source.fileName,
        );
        const cjs = yield* babelRunner.transpileESMToCJS(esm, source.fileName);
        return {
          cjs,
          esm,
          dts: file.dts,
          dtsMaps: file.dtsMap,
          sourcePath: source.fileName,
        };
      }),
    ),
    Stream.runCollect,
    Effect.withLogSpan('COMPILER'),
  );

  const reported = new Set<string>();
  const createSourceFile = (filePath: string, content: string, fromSource: string) => {
    if (reported.has(fromSource)) return Effect.void;
    if (filePath === '') {
      reported.add(fromSource);
      return Effect.logWarning('Empty path cant emit this file for source: ', fromSource);
    }
    return Effect.all([
      fsUtils.mkdirCached(path_.dirname(filePath)),
      fs.writeFileString(filePath, content),
    ]);
  };

  yield* Effect.forEach(
    output,
    ({ cjs, dts, dtsMaps, esm, sourcePath }) => {
      return Effect.all([
        createSourceFile(dts.path, dts.content, sourcePath),
        createSourceFile(dtsMaps.path, dtsMaps.content, sourcePath),
        createSourceFile(esm.filePath, esm.content.pipe(Option.getOrThrow), sourcePath),
        createSourceFile(
          esm.sourcemapFilePath,
          esm.sourcemap.pipe(Option.map(JSON.stringify), Option.getOrThrow),
          sourcePath,
        ),
        createSourceFile(cjs.filePath, cjs.content.pipe(Option.getOrThrow), sourcePath),
        createSourceFile(
          cjs.sourcemapFilePath,
          cjs.sourcemap.pipe(Option.map(JSON.stringify), Option.getOrThrow),
          sourcePath,
        ),
      ]);
    },
    { concurrency: 'inherit' },
  ).pipe(
    Effect.tap(() => Effect.logDebug('Compiling Success!', '\n')),
    Effect.tapError((error) => Effect.logError('[FS] cant write file: ', error, '\n')),
    Effect.catchAllCause(() => Effect.void),
    Effect.withLogSpan('WRITE_OUTPUTS'),
    Effect.withSpan('WRITE_OUTPUTS'),
  );
}).pipe(
  Effect.catchAllDefect((x) => Effect.logError('UNHANDLED_ERROR; ', x, '\n')),
  Effect.provide(MainLive),
  // Effect.provide(BuilderLoggerService.Default),
);
