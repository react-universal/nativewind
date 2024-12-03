import { FileSystem, Path } from '@effect/platform';
import { NodeFileSystem, NodePath } from '@effect/platform-node';
import { Chunk, Context, Effect, Layer, Option } from 'effect';
import { TsCompilerOutput, TwinCompilerOutput } from '../models/Compiler.models';
import { BabelContext, BabelContextLive } from './Babel.service';
import { FsUtils, FsUtilsLive } from './FsUtils.service';

const make = Effect.gen(function* () {
  const fsUtils = yield* FsUtils;
  const fs = yield* FileSystem.FileSystem;
  const path_ = yield* Path.Path;
  const babelRunner = yield* BabelContext;

  const rootDir = process.cwd();
  const buildDir = path_.join(rootDir, 'build');
  const cjsDir = path_.join(buildDir, 'cjs');
  const esmDir = path_.join(buildDir, 'esm');
  const dtsDir = path_.join(buildDir, 'dts');

  yield* fsUtils.mkdirCached('./build');
  yield* fsUtils.mkdirCached('./build/cjs');
  yield* fsUtils.mkdirCached('./build/esm');
  yield* fsUtils.mkdirCached('./build/dts');

  const reported = new Set<string>();

  return {
    config: {
      rootDir,
      cjsDir,
      esmDir,
      dtsDir,
    },
    createCompilerSourceFiles,
    runCompiler,
    createSourceFile,
  };

  function createSourceFile(filePath: string, content: string, fromSource: string) {
    if (reported.has(fromSource)) return Effect.void;
    if (filePath === '') {
      reported.add(fromSource);
      return Effect.logWarning('Empty path cant emit this file for source: ', fromSource);
    }
    return Effect.all([
      fsUtils.mkdirCached(path_.dirname(filePath)),
      fs.writeFileString(filePath, content),
    ]);
  }

  function runCompiler({ file, source }: TsCompilerOutput) {
    return Effect.gen(function* () {
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
    });
  }

  function createCompilerSourceFiles(output: Chunk.Chunk<TwinCompilerOutput>) {
    return Effect.forEach(
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
      Effect.tap(() => Effect.logInfo('Compiling Success!', '\n')),
      Effect.tapError((error) => Effect.logError('[FS] cant write file: ', error, '\n')),
      Effect.catchAllCause(() => Effect.void),
      Effect.withLogSpan('WRITE_OUTPUTS'),
      Effect.withSpan('WRITE_OUTPUTS'),
    );
  }
});

export interface CompilerContext extends Effect.Effect.Success<typeof make> {}
export const CompilerContext = Context.GenericTag<CompilerContext>('CompilerContext');
export const CompilerContextLive = Layer.effect(CompilerContext, make).pipe(
  Layer.provide(BabelContextLive),
  Layer.provide(FsUtilsLive),
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(NodePath.layerPosix),
);
