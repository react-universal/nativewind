import { transformAsync, TransformOptions } from '@babel/core';
import { Path } from '@effect/platform';
import { NodeFileSystem, NodePath } from '@effect/platform-node';
import { Context, Effect, Layer, Option } from 'effect';
import { OutputFile } from 'ts-morph';
import type { BuildSourceWithMaps, CompilerOutput } from '../models/Compiler.models.js';
import { FsUtils, FsUtilsLive } from './FsUtils.service.js';

const make = Effect.gen(function* () {
  const path_ = yield* Path.Path;
  const fsUtils = yield* FsUtils;

  const getTranspilerPlugins = (
    originalFilename: string,
    purpose: 'esm-annotations' | 'esm-to-cjs',
  ) => {
    const plugins: string[] = [];
    if (originalFilename.endsWith('.tsx')) {
      plugins.push('@babel/plugin-syntax-jsx');
    }
    if (purpose === 'esm-annotations') {
      plugins.push('annotate-pure-calls');
    }
    if (purpose === 'esm-to-cjs') {
      plugins.push(
        '@babel/transform-export-namespace-from',
        '@babel/transform-modules-commonjs',
      );
    }

    return plugins;
  };

  const babelTranspile = (file: {
    content: string;
    filePath: string;
    relativeSourceFile: string;
    inputSourceMaps: TransformOptions['inputSourceMap'] | undefined;
    plugins: string[];
  }) => {
    return Effect.tryPromise(() =>
      transformAsync(file.content, {
        plugins: file.plugins,
        ast: true,
        code: true,
        configFile: false,
        babelrc: false,
        filename: file.filePath,
        sourceType: 'module',
        sourceFileName: file.relativeSourceFile,
        sourceMaps: true,
        inputSourceMap: file.inputSourceMaps,
        generatorOpts: {
          filename: file.filePath,
          sourceMaps: true,
        },
      }),
    );
  };

  const transpileESMToCJS = (esmFile: BuildSourceWithMaps, tsFilePath: string) => {
    return Effect.gen(function* () {
      // const emittedSourcemaps = esmFile.sourcemap;
      const sourcemapPath = fsUtils.getCJSPath(esmFile.sourcePath);
      const cjsFilePath = fsUtils.getCJSPath(esmFile.path);

      const relativeSourceFile = path_.relative(path_.dirname(sourcemapPath), tsFilePath);

      const cjsFileDir = path_.dirname(cjsFilePath);
      const cjsMapsFilePath = fsUtils.getCJSPath(esmFile.sourcemapPath);

      yield* fsUtils.mkdirCached(cjsFileDir);

      const babelFile = yield* babelTranspile({
        content: esmFile.content,
        filePath: cjsFilePath,
        inputSourceMaps: esmFile.sourcemap.pipe(
          Option.map(JSON.parse),
          Option.getOrUndefined,
        ),
        relativeSourceFile,
        plugins: getTranspilerPlugins(tsFilePath, 'esm-to-cjs'),
      });

      const result: BuildSourceWithMaps = {
        content: Option.fromNullable(babelFile?.code).pipe(Option.getOrElse(() => '')),
        sourcemapPath: cjsMapsFilePath,
        path: cjsFilePath,
        sourcemap: Option.fromNullable(babelFile?.map).pipe(Option.map(JSON.stringify)),
        sourcePath: tsFilePath,
      };

      return result;
    }).pipe(
      Effect.tapError((x) =>
        Effect.logWarning(`[BABEL] error transpiling to CJS `, x, '\n'),
      ),
      Effect.withLogSpan('BABEL/ESM-to-CJS'),
    );
  };

  const addAnnotationsToESM = (
    esmFile: OutputFile,
    sourcemaps: OutputFile,
    tsFilePath: string,
  ) => {
    return Effect.gen(function* () {
      const relativeSourceFile = path_.relative(
        path_.dirname(sourcemaps.getFilePath()),
        tsFilePath,
      );
      const inputSourceMaps = yield* Effect.try({
        try: () => JSON.parse(sourcemaps.getText()),
        catch: (x) => `Something bad happen ${x}`,
      }).pipe(
        Effect.tapError((x) =>
          Effect.logWarning(
            'Cant parse sourcemap: ',
            {
              sourcemapFilePath: sourcemaps.getFilePath(),
              sourcemap: sourcemaps.getText(),
            },
            '\n',
          ),
        ),
        Effect.catchAll(() => Effect.succeed(undefined)),
      );

      const cjsFileDir = path_.dirname(esmFile.getFilePath());

      yield* fsUtils.mkdirCached(cjsFileDir);

      const babelFile = yield* babelTranspile({
        content: esmFile.getText(),
        filePath: esmFile.getFilePath(),
        inputSourceMaps,
        relativeSourceFile,
        plugins: getTranspilerPlugins(tsFilePath, 'esm-annotations'),
      });

      const result: CompilerOutput['cjsFile'] = {
        content: Option.fromNullable(babelFile?.code).pipe(
          Option.getOrElse(() => esmFile.getText()),
        ),
        sourcemapPath: sourcemaps.getFilePath(),
        path: esmFile.getFilePath(),
        sourcemap: Option.fromNullable(babelFile?.map).pipe(Option.map(JSON.stringify)),
        sourcePath: tsFilePath,
      };

      return result;
    }).pipe(
      Effect.tapError((x) =>
        Effect.logWarning(`[BABEL] error adding annotations to ESM `, x, '\n'),
      ),
      Effect.withLogSpan('BABEL/ESM-annotations'),
    );
  };

  return {
    transpileESMToCJS,
    addAnnotationsToESM,
    getTranspilerPlugins,
    babelTranspile,
  };
});

export interface BabelContext extends Effect.Effect.Success<typeof make> {}
export const BabelContext = Context.GenericTag<BabelContext>('runner/BabelContext');
export const BabelContextLive = Layer.effect(BabelContext, make).pipe(
  Layer.provide(NodePath.layerPosix),
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(FsUtilsLive),
);
