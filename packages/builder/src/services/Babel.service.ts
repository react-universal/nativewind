import { transformAsync, TransformOptions } from '@babel/core';
import { FileSystem, Path } from '@effect/platform';
import { NodeFileSystem, NodePath } from '@effect/platform-node';
import { Context, Effect, Layer, Logger, LogLevel, Option } from 'effect';
import type { CompiledSource } from '../models/Compiler.models.js';
import { FsUtils, FsUtilsLive } from './FsUtils.service.js';

const make = Effect.gen(function* () {
  const path_ = yield* Path.Path;
  const fsUtils = yield* FsUtils;
  const fs = yield* FileSystem.FileSystem;

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

  const transpileESMToCJS = ({
    esmFile,
    tsFile,
  }: {
    esmFile: CompiledSource['annotatedESMFile'];
    tsFile: CompiledSource['tsFile'];
  }) => {
    return Effect.gen(function* () {
      // const emittedSourcemaps = esmFile.sourcemap;
      const sourcemapPath = getCJSPath(esmFile.sourcemapFilePath);
      const cjsFilePath = getCJSPath(esmFile.filePath);

      const relativeSourceFile = path_.relative(
        path_.dirname(sourcemapPath),
        tsFile.path,
      );

      const cjsFileDir = path_.dirname(cjsFilePath);
      const cjsMapsFilePath = getCJSPath(esmFile.sourcemapFilePath);

      yield* fsUtils.mkDirIfNotExists(cjsFileDir);

      const babelFile = yield* babelTranspile({
        content: esmFile.content.pipe(Option.getOrThrow),
        filePath: cjsFilePath,
        inputSourceMaps: Option.getOrUndefined(esmFile.sourcemap),
        relativeSourceFile,
        plugins: getTranspilerPlugins(tsFile.path, 'esm-to-cjs'),
      });

      const result: CompiledSource['cjsFile'] = {
        content: Option.fromNullable(babelFile?.code),
        sourcemapFilePath: cjsMapsFilePath,
        filePath: cjsFilePath,
        sourcemap: Option.fromNullable(babelFile?.map),
      };

      return result;
    });
  };

  const addAnnotationsToESM = ({
    esmFile,
    tsFile,
  }: {
    esmFile: CompiledSource['esmFile'];
    tsFile: CompiledSource['tsFile'];
  }) => {
    return Effect.gen(function* () {
      const emittedSourcemaps = esmFile.sourcemap;

      const relativeSourceFile = path_.relative(
        path_.dirname(esmFile.sourcemapFilePath),
        tsFile.path,
      );
      const inputSourceMaps = yield* Effect.try({
        try: () =>
          Option.map(esmFile.sourcemap, (x): TransformOptions['inputSourceMap'] =>
            JSON.parse(x),
          ).pipe(Option.getOrUndefined),
        catch: () => new Error(`Cant parse sourcemaps: \n ${emittedSourcemaps}`),
      });

      const cjsFileDir = path_.dirname(esmFile.filePath);

      yield* fsUtils.mkDirIfNotExists(cjsFileDir);

      const babelFile = yield* babelTranspile({
        content: esmFile.output.outputText,
        filePath: esmFile.filePath,
        inputSourceMaps,
        relativeSourceFile,
        plugins: getTranspilerPlugins(tsFile.path, 'esm-annotations'),
      });

      const result: CompiledSource['cjsFile'] = {
        content: Option.fromNullable(babelFile?.code),
        sourcemapFilePath: esmFile.sourcemapFilePath,
        filePath: esmFile.filePath,
        sourcemap: Option.fromNullable(babelFile?.map),
      };

      return result;
    });
  };

  // const annotationsAndCjsCompose = (
  //   esmModules: TsEmitSource[],
  //   original: TsEmitSource,
  // ) => {
  //   return addESMAnnotations(esmModules, original).pipe(
  //     Effect.flatMap((esmModule) =>
  //       esmToCjs([esmModule.esmFile, esmModule.sourcemapFile], original),
  //     ),
  //   );
  // };

  return {
    getCJSPath,
    transpileESMToCJS,
    addAnnotationsToESM,
    fs,
  };

  // function addESMAnnotations(esmModules: TsEmitSource[], original: TsEmitSource) {
  //   return Effect.gen(function* () {
  //     const emittedEsm = Array.findFirst(esmModules, (x) => x.path.endsWith('.js')).pipe(
  //       Option.getOrThrowWith(() => 'No ESM module where provided'),
  //     );

  //     const emittedSourcemaps = Array.findFirst(esmModules, (x) =>
  //       x.path.endsWith('.js.map'),
  //     ).pipe(Option.getOrThrowWith(() => 'No ESM module sourcemaps where provided'));

  //     const parseSourceMaps: TransformOptions['inputSourceMap'] = yield* Effect.try({
  //       try: () => JSON.parse(emittedSourcemaps.content),
  //       catch: () => new Error(`Cant parse sourcemaps: \n ${emittedSourcemaps}`),
  //     });

  //     const cjsFilePath = emittedEsm.path;
  //     const cjsFileDir = path_.dirname(cjsFilePath);
  //     const cjsMapsFilePath = emittedSourcemaps.path;
  //     const cjsMapsFileDir = path_.dirname(cjsMapsFilePath);
  //     const relativeSourceFile = path_.relative(
  //       path_.dirname(cjsMapsFilePath),
  //       original.path,
  //     );

  //     yield* fsUtils.mkDirIfNotExists(cjsFileDir);
  //     yield* fsUtils.mkDirIfNotExists(cjsMapsFileDir);
  //     const babelFile = yield* Effect.promise(() =>
  //       transformAsync(emittedEsm.content, {
  //         plugins: ['annotate-pure-calls', '@babel/plugin-syntax-jsx'],
  //         ast: true,
  //         code: true,
  //         configFile: false,
  //         babelrc: false,
  //         filename: cjsFilePath,
  //         sourceType: 'module',
  //         sourceFileName: relativeSourceFile,
  //         sourceMaps: true,
  //         inputSourceMap: parseSourceMaps,
  //         generatorOpts: {
  //           filename: cjsFilePath,
  //           sourceMaps: true,
  //         },
  //       }),
  //     );

  //     const esmModule = Option.Do.pipe(
  //       Option.let('original', () => original),
  //       Option.bind('babelFile', () => Option.fromNullable(babelFile)),
  //       Option.bind('esmCode', ({ babelFile }) => Option.fromNullable(babelFile.code)),
  //       Option.bind('esmSourceMap', ({ babelFile }) =>
  //         Option.fromNullable(babelFile.map),
  //       ),
  //       Option.bind('esmMeta', ({ babelFile }) => Option.fromNullable(babelFile.map)),
  //       Option.let(
  //         'esmFile',
  //         ({ esmCode }): TsEmitSource => ({
  //           path: cjsFilePath,
  //           content: esmCode,
  //         }),
  //       ),
  //       Option.let(
  //         'sourcemapFile',
  //         ({ esmSourceMap }): TsEmitSource => ({
  //           path: cjsMapsFilePath,
  //           content: JSON.stringify(esmSourceMap, null, 2),
  //         }),
  //       ),
  //     ).pipe(
  //       Option.getOrThrowWith(() => `Cant add annotations to esm file ${cjsFilePath}`),
  //     );

  //     yield* fs.writeFileString(cjsFilePath, esmModule.esmCode);
  //     yield* fs.writeFileString(
  //       cjsMapsFilePath,
  //       JSON.stringify(esmModule.esmSourceMap, null, 2),
  //     );

  //     // yield* Effect.logDebug('Added annotations to ESM with babel');

  //     return esmModule;
  //   }).pipe(Effect.annotateLogs('babel', 'annotations'));
  // }

  // function esmToCjs(esmModules: TsEmitSource[], original: TsEmitSource) {
  //   return Effect.gen(function* () {
  //     const emittedEsm = Array.findFirst(esmModules, (x) => x.path.endsWith('.js')).pipe(
  //       Option.getOrThrowWith(() => 'No ESM module where provided'),
  //     );

  //     const emittedSourcemaps = Array.findFirst(esmModules, (x) =>
  //       x.path.endsWith('.js.map'),
  //     ).pipe(Option.getOrThrowWith(() => 'No ESM module sourcemaps where provided'));

  //     const parseSourceMaps: TransformOptions['inputSourceMap'] = yield* Effect.try({
  //       try: () => JSON.parse(emittedSourcemaps.content),
  //       catch: () => new Error(`Cant parse sourcemaps: \n ${emittedSourcemaps}`),
  //     });

  //     const cjsFilePath = getCJSPath(emittedEsm.path);
  //     const cjsFileDir = path_.dirname(cjsFilePath);
  //     const cjsMapsFilePath = getCJSPath(emittedSourcemaps.path);
  //     const cjsMapsFileDir = path_.dirname(cjsMapsFilePath);
  //     const relativeSourceFile = path_.relative(
  //       path_.dirname(cjsMapsFilePath),
  //       original.path,
  //     );

  //     yield* fsUtils.mkDirIfNotExists(cjsFileDir);
  //     yield* fsUtils.mkDirIfNotExists(cjsMapsFileDir);
  //     const babelFile = yield* Effect.promise(() =>
  //       transformAsync(emittedEsm.content, {
  //         plugins: [],
  //         ast: true,
  //         code: true,
  //         configFile: false,
  //         babelrc: false,
  //         filename: cjsFilePath,
  //         sourceType: 'module',
  //         sourceFileName: relativeSourceFile,
  //         sourceMaps: true,
  //         inputSourceMap: parseSourceMaps,
  //         generatorOpts: {
  //           filename: cjsFilePath,
  //           sourceMaps: true,
  //         },
  //       }),
  //     );

  //     if (babelFile?.code) {
  //       yield* fs.writeFileString(cjsFilePath, babelFile.code);
  //     }

  //     if (babelFile?.map) {
  //       yield* fs.writeFileString(
  //         cjsMapsFilePath,
  //         JSON.stringify(babelFile.map, null, 2),
  //       );
  //     }

  //     // yield* Effect.logDebug('Created CJS with babel');
  //   }).pipe(Effect.annotateLogs('babel', 'esm-to-cjs'));
  // }
}).pipe(Logger.withMinimumLogLevel(LogLevel.None));

export interface BabelContext extends Effect.Effect.Success<typeof make> {}
export const BabelContext = Context.GenericTag<BabelContext>('runner/BabelContext');
export const BabelContextLive = Layer.effect(BabelContext, make).pipe(
  Layer.provide(NodePath.layerPosix),
  Layer.provide(NodeFileSystem.layer),
  Layer.provide(FsUtilsLive),
);
