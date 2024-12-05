import { FileSystem, Path } from '@effect/platform';
import { NodeFileSystem, NodePath } from '@effect/platform-node';
import { Config, Context, Effect, Layer } from 'effect';
import { BuildOutputFiles } from '../models/Compiler.models';
import { BabelContext, BabelContextLive } from './Babel.service';
import { FsUtils, FsUtilsLive } from './FsUtils.service';

const make = Effect.gen(function* () {
  const fsUtils = yield* FsUtils;
  const fs = yield* FileSystem.FileSystem;
  const path_ = yield* Path.Path;
  const babelRunner = yield* BabelContext;

  const rootDir = yield* Config.string('PROJECT_DIR');
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
    runCompiler,
    createSourceFile,
  };

  function createSourceFile(filePath: string, content: string, fromSource: string) {
    if (reported.has(fromSource)) return Effect.void;
    if (filePath === '') {
      reported.add(fromSource);
      return Effect.logWarning('Empty path cant emit this file for source: ', fromSource);
    }
    return Effect.all(
      [
        fsUtils.mkdirCached(path_.dirname(filePath)),
        fs.writeFileString(filePath, content),
      ],
      {
        concurrency: 'unbounded',
      },
    );
  }

  function runCompiler(
    { dts, dtsMap, esm, relativeSourcePath, sourcemaps }: BuildOutputFiles,
    sourcePath: string,
  ) {
    return Effect.gen(function* () {
      // yield* fsUtils.mkdirCached(path_.dirname(file.dts.path));
      // yield* fsUtils.mkdirCached(path_.dirname(file.esm.path));
      const esmFile = yield* babelRunner.addAnnotationsToESM(esm, sourcemaps, sourcePath);
      const cjs = yield* babelRunner.transpileESMToCJS(esmFile, sourcePath);
      return {
        cjs,
        esm: esmFile,
        dts,
        dtsMap,
        relativeSourcePath,
      };
    }).pipe(
      // Effect.tap(() => Effect.logDebug('[BABEL] compiled sources with babel')),
      Effect.withLogSpan('BABEL'),
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
