import { transformAsync, TransformOptions } from '@babel/core';
import { Path } from '@effect/platform';
import { NodeFileSystem, NodePath } from '@effect/platform-node';
import { Context, Effect, Layer, Option } from 'effect';
import type { BabelSourceMap, CompiledSource } from '../models/Compiler.models.js';
import { FsUtils, FsUtilsLive } from './FsUtils.service.js';

const make = Effect.gen(function* () {
  const path_ = yield* Path.Path;
  const fsUtils = yield* FsUtils;

  const getCJSPath = (path: string) => path.replace('/esm/', '/cjs/');

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

  const transpileESMToCJS = (
    esmFile: CompiledSource['annotatedESMFile'],
    tsFilePath: string,
  ) => {
    return Effect.gen(function* () {
      // const emittedSourcemaps = esmFile.sourcemap;
      const sourcemapPath = getCJSPath(esmFile.sourcemapFilePath);
      const cjsFilePath = getCJSPath(esmFile.filePath);

      const relativeSourceFile = path_.relative(path_.dirname(sourcemapPath), tsFilePath);

      const cjsFileDir = path_.dirname(cjsFilePath);
      const cjsMapsFilePath = getCJSPath(esmFile.sourcemapFilePath);

      yield* fsUtils.mkdirCached(cjsFileDir);

      const babelFile = yield* babelTranspile({
        content: esmFile.content.pipe(Option.getOrThrow),
        filePath: cjsFilePath,
        inputSourceMaps: Option.getOrUndefined(esmFile.sourcemap),
        relativeSourceFile,
        plugins: getTranspilerPlugins(tsFilePath, 'esm-to-cjs'),
      });

      const result: CompiledSource['cjsFile'] = {
        content: Option.fromNullable(babelFile?.code),
        sourcemapFilePath: cjsMapsFilePath,
        filePath: cjsFilePath,
        sourcemap: Option.fromNullable(babelFile?.map),
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
    esmFile: CompiledSource['esmFile'],
    tsFilePath: string,
  ) => {
    return Effect.gen(function* () {
      const relativeSourceFile = path_.relative(
        path_.dirname(esmFile.sourcemapFilePath),
        tsFilePath,
      );
      const inputSourceMaps: BabelSourceMap = yield* Effect.try({
        try: () => JSON.parse(esmFile.sourcemap),
        catch: (x) => `Something bad happen ${x}`,
      }).pipe(
        Effect.tapError((x) =>
          Effect.logWarning(
            'Cant parse sourcemap: ',
            {
              sourcemapFilePath: esmFile.sourcemapFilePath,
              sourcemap: esmFile.sourcemap,
            },
            '\n',
          ),
        ),
        Effect.catchAll(() => Effect.succeed(undefined)),
      );

      const cjsFileDir = path_.dirname(esmFile.filePath);

      yield* fsUtils.mkdirCached(cjsFileDir);

      const babelFile = yield* babelTranspile({
        content: esmFile.content,
        filePath: esmFile.filePath,
        inputSourceMaps,
        relativeSourceFile,
        plugins: getTranspilerPlugins(tsFilePath, 'esm-annotations'),
      });

      const result: CompiledSource['cjsFile'] = {
        content: Option.fromNullable(babelFile?.code),
        sourcemapFilePath: esmFile.sourcemapFilePath,
        filePath: esmFile.filePath,
        sourcemap: Option.fromNullable(babelFile?.map),
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
    getCJSPath,
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
