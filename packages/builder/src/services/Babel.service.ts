import { transformAsync, TransformOptions } from '@babel/core';
import { FileSystem, Path } from '@effect/platform';
import { Array, Context, Effect, Layer, Logger, LogLevel, Option } from 'effect';
import { FsUtils } from './FsUtils.service.js';
import { TsEmitSource } from './Typescript.service.js';

const make = Effect.gen(function* () {
  const path_ = yield* Path.Path;
  const fsUtils = yield* FsUtils;
  const fs = yield* FileSystem.FileSystem;
  const babelPlugins = [
    '@babel/transform-export-namespace-from',
    '@babel/plugin-transform-modules-commonjs',
    '@babel/plugin-syntax-jsx',
  ];

  const getCJSPath = (path: string) => path.replace('/esm/', '/cjs/');

  const esmToCjs = (esmModules: TsEmitSource[], original: TsEmitSource) => {
    return Effect.gen(function* () {
      const emittedEsm = Array.findFirst(esmModules, (x) => x.path.endsWith('.js')).pipe(
        Option.getOrThrowWith(() => 'No ESM module where provided'),
      );

      const emittedSourcemaps = Array.findFirst(esmModules, (x) =>
        x.path.endsWith('.js.map'),
      ).pipe(Option.getOrThrowWith(() => 'No ESM module sourcemaps where provided'));

      const parseSourceMaps: TransformOptions['inputSourceMap'] = yield* Effect.try({
        try: () => JSON.parse(emittedSourcemaps.content),
        catch: () => new Error(`Cant parse sourcemaps: \n ${emittedSourcemaps}`),
      });

      const cjsFilePath = getCJSPath(emittedEsm.path);
      const cjsFileDir = path_.dirname(cjsFilePath);
      const cjsMapsFilePath = getCJSPath(emittedSourcemaps.path);
      const cjsMapsFileDir = path_.dirname(cjsMapsFilePath);
      const relativeSourceFile = path_.relative(
        path_.dirname(cjsMapsFilePath),
        original.path,
      );

      yield* fsUtils.mkDirIfNotExists(cjsFileDir);
      yield* fsUtils.mkDirIfNotExists(cjsMapsFileDir);
      const babelFile = yield* Effect.promise(() =>
        transformAsync(emittedEsm.content, {
          plugins: babelPlugins,
          ast: true,
          code: true,
          configFile: false,
          babelrc: false,
          filename: cjsFilePath,
          sourceType: 'module',
          sourceFileName: relativeSourceFile,
          sourceMaps: true,
          inputSourceMap: parseSourceMaps,
          generatorOpts: {
            filename: cjsFilePath,
            sourceMaps: true,
          },
        }),
      );

      if (babelFile?.code) {
        yield* fs.writeFileString(cjsFilePath, babelFile.code);
      }

      if (babelFile?.map) {
        yield* fs.writeFileString(
          cjsMapsFilePath,
          JSON.stringify(babelFile.map, null, 2),
        );
      }

      yield* Effect.logDebug('Created CJS with babel');
    }).pipe(Effect.annotateLogs('babel', 'esm-to-cjs'));
  };

  const addESMAnnotations = (esmModules: TsEmitSource[], original: TsEmitSource) => {
    return Effect.gen(function* () {
      const emittedEsm = Array.findFirst(esmModules, (x) => x.path.endsWith('.js')).pipe(
        Option.getOrThrowWith(() => 'No ESM module where provided'),
      );

      const emittedSourcemaps = Array.findFirst(esmModules, (x) =>
        x.path.endsWith('.js.map'),
      ).pipe(Option.getOrThrowWith(() => 'No ESM module sourcemaps where provided'));

      const parseSourceMaps: TransformOptions['inputSourceMap'] = yield* Effect.try({
        try: () => JSON.parse(emittedSourcemaps.content),
        catch: () => new Error(`Cant parse sourcemaps: \n ${emittedSourcemaps}`),
      });

      const cjsFilePath = emittedEsm.path;
      const cjsFileDir = path_.dirname(cjsFilePath);
      const cjsMapsFilePath = emittedSourcemaps.path;
      const cjsMapsFileDir = path_.dirname(cjsMapsFilePath);
      const relativeSourceFile = path_.relative(
        path_.dirname(cjsMapsFilePath),
        original.path,
      );

      yield* fsUtils.mkDirIfNotExists(cjsFileDir);
      yield* fsUtils.mkDirIfNotExists(cjsMapsFileDir);
      const babelFile = yield* Effect.promise(() =>
        transformAsync(emittedEsm.content, {
          plugins: ['annotate-pure-calls', '@babel/plugin-syntax-jsx'],
          ast: true,
          code: true,
          configFile: false,
          babelrc: false,
          filename: cjsFilePath,
          sourceType: 'module',
          sourceFileName: relativeSourceFile,
          sourceMaps: true,
          inputSourceMap: parseSourceMaps,
          generatorOpts: {
            filename: cjsFilePath,
            sourceMaps: true,
          },
        }),
      );

      const esmModule = Option.Do.pipe(
        Option.let('original', () => original),
        Option.bind('babelFile', () => Option.fromNullable(babelFile)),
        Option.bind('esmCode', ({ babelFile }) => Option.fromNullable(babelFile.code)),
        Option.bind('esmSourceMap', ({ babelFile }) =>
          Option.fromNullable(babelFile.map),
        ),
        Option.bind('esmMeta', ({ babelFile }) => Option.fromNullable(babelFile.map)),
        Option.let(
          'esmFile',
          ({ esmCode }): TsEmitSource => ({
            path: cjsFilePath,
            content: esmCode,
          }),
        ),
        Option.let(
          'sourcemapFile',
          ({ esmSourceMap }): TsEmitSource => ({
            path: cjsMapsFilePath,
            content: JSON.stringify(esmSourceMap, null, 2),
          }),
        ),
      ).pipe(
        Option.getOrThrowWith(() => `Cant add annotations to esm file ${cjsFilePath}`),
      );

      yield* fs.writeFileString(cjsFilePath, esmModule.esmCode);
      yield* fs.writeFileString(
        cjsMapsFilePath,
        JSON.stringify(esmModule.esmSourceMap, null, 2),
      );

      yield* Effect.logDebug('Added annotations to ESM with babel');

      return esmModule;
    }).pipe(Effect.annotateLogs('babel', 'annotations'));
  };

  const annotationsAndCjsCompose = (
    esmModules: TsEmitSource[],
    original: TsEmitSource,
  ) => {
    return addESMAnnotations(esmModules, original).pipe(
      Effect.flatMap((esmModule) =>
        esmToCjs([esmModule.esmFile, esmModule.sourcemapFile], original),
      ),
    );
  };

  return {
    esmToCjs,
    getCJSPath,
    annotationsAndCjsCompose,
  };
}).pipe(Logger.withMinimumLogLevel(LogLevel.None));

export interface BabelContext extends Effect.Effect.Success<typeof make> {}
export const BabelContext = Context.GenericTag<BabelContext>('runner/BabelContext');
export const BabelContextLive = Layer.effect(BabelContext, make);
