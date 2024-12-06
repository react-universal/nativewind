import { transformAsync } from '@babel/core';
import { Path } from '@effect/platform';
import { NodeFileSystem, NodePath } from '@effect/platform-node';
import { Cause, Context, Effect, Layer, Option } from 'effect';
import { OutputFile } from 'ts-morph';
import {
  BabelSourceMapSchemaType,
  BabelTranspilerResult,
  BuildSourceWithMaps,
  CompilerOutput,
} from '../models/Compiler.models.js';
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
    inputSourceMaps: Option.Option<string>;
    plugins: string[];
  }) => {
    return Effect.gen(function* () {
      const sourcemaps = yield* parseSourceMapsFile(file.inputSourceMaps);
      return yield* Effect.promise(() =>
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
          inputSourceMap: sourcemaps.pipe(
            Option.map((x) => ({
              ...x,
              sourcesContent: x.sourcesContent?.filter(Boolean),
            })),
            Option.getOrUndefined,
          ),
          generatorOpts: {
            filename: file.filePath,
            sourceMaps: true,
          },
        }),
      ).pipe(
        Effect.flatMap((value) =>
          Effect.gen(function* () {
            if (!value) return Option.none<BabelTranspilerResult>();

            const sourceMaps = yield* encodeSourceMapsFile(
              Option.fromNullable(value.map),
            );
            return Option.some<BabelTranspilerResult>({
              ...value,
              code: value.code ?? file.content,
              map: sourceMaps,
            });
          }),
        ),
      );
    });
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
        inputSourceMaps: esmFile.sourcemap,
        relativeSourceFile,
        plugins: getTranspilerPlugins(tsFilePath, 'esm-to-cjs'),
      });

      return babelFile.pipe(
        Option.map(
          (result): BuildSourceWithMaps => ({
            content: result.code,
            sourcemapPath: cjsMapsFilePath,
            path: cjsFilePath,
            sourcemap: result.map,
            sourcePath: tsFilePath,
          }),
        ),
        Option.getOrThrow,
      );
    }).pipe(
      Effect.catchAllCause((x) => {
        return Effect.die(x).pipe(
          Effect.tap(() =>
            Effect.logError(
              () => '[BABEL] Cant emit CJS files, reason: ',
              Cause.prettyErrors(x),
            ),
          ),
        );
      }),
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

      const cjsFileDir = path_.dirname(esmFile.getFilePath());

      yield* fsUtils.mkdirCached(cjsFileDir);

      const babelFile = yield* babelTranspile({
        content: esmFile.getText(),
        filePath: esmFile.getFilePath(),
        inputSourceMaps: Option.some(sourcemaps.getText()),
        relativeSourceFile,
        plugins: getTranspilerPlugins(tsFilePath, 'esm-annotations'),
      });

      return babelFile.pipe(
        Option.map((x): CompilerOutput['cjsFile'] => ({
          content: x.code,
          sourcemapPath: sourcemaps.getFilePath(),
          path: esmFile.getFilePath(),
          sourcemap: x.map,
          sourcePath: tsFilePath,
        })),
        Option.getOrThrow,
      );
    }).pipe(
      Effect.tapError((x) =>
        Effect.logWarning(`[BABEL] error adding annotations to ESM `, x, '\n'),
      ),
      Effect.withLogSpan('BABEL/ESM-annotations'),
      Effect.catchAllCause((x) => {
        return Effect.gen(function* () {
          const result: CompilerOutput['cjsFile'] = {
            content: esmFile.getText(),
            path: esmFile.getFilePath(),
            sourcemap: Option.some(sourcemaps.getText()),
            sourcemapPath: sourcemaps.getFilePath(),
            sourcePath: tsFilePath,
          };

          return result;
        });
      }),
    );
  };

  function encodeSourceMapsFile(content: Option.Option<BabelSourceMapSchemaType>) {
    return Effect.try(() => content.pipe(Option.map(JSON.stringify)));
  }

  function parseSourceMapsFile(content: Option.Option<string>) {
    return Effect.try(() => Option.map(content, JSON.parse));
  }

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
