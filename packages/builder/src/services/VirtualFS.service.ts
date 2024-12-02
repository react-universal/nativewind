import { Path } from '@effect/platform';
import { NodeFileSystem, NodePath } from '@effect/platform-node';
import { FileSystem } from '@effect/platform/FileSystem';
import chokidar from 'chokidar';
import { Array, Context, Effect, Layer, Option, Stream } from 'effect';
import { CompiledSource } from '../models/Compiler.models';
import { createChokidarWatcher } from '../utils/effect.utils';
import { FsUtils, FsUtilsLive } from './FsUtils.service';
import { PackageContext, PackageContextLive } from './Package.service';

const make = Effect.gen(function* () {
  const path_ = yield* Path.Path;
  yield* PackageContext;
  const fs = yield* FileSystem;
  const fsUtils = yield* FsUtils;

  yield* fsUtils.mkdirCached('./build');
  yield* fsUtils.mkdirCached('./build/cjs');
  yield* fsUtils.mkdirCached('./build/esm');
  yield* fsUtils.mkdirCached('./build/dts');

  const rootDir = process.cwd();
  const buildDir = path_.join(rootDir, 'build');
  const cjsDir = path_.join(buildDir, 'cjs');
  const esmDir = path_.join(buildDir, 'esm');
  const dtsDir = path_.join(buildDir, 'dts');
  // const tempDirPath = path_.join(buildDir);

  // yield* fs.makeTempDirectoryScoped({
  //   directory: tempDirPath,
  //   prefix: '.temp-scoped',
  // });
  // const virtualFolder = yield* fs.makeTempDirectory({
  //   directory: tempDirPath,
  //   prefix: '.temp-',
  // });

  const srcFolder = yield* fsUtils
    .glob('src/**/*.{!d.,ts,js}', {
      dot: false,
      absolute: false,
      follow: false,
      mark: false,
    })
    .pipe(
      Effect.map((x) => {
        return {
          files: x,
          folders: Array.dedupe(Array.map(x, (file) => path_.dirname(file))),
        };
      }),
      Effect.tap((x) => Effect.logDebug('[FS] Scanned files: ', x.folders)),
    );
  const watcher = createChokidarWatcher(
    rootDir,
    chokidar.watch(srcFolder.folders, {
      cwd: rootDir,
      followSymlinks: false,
      persistent: true,
    }),
  ).pipe(
    // Stream.tap((x) => Effect.logDebug('[FS] EVENT: ', x)),
    Stream.filter(
      (x) =>
        (!x.path.endsWith('.d.ts') && path_.extname(x.path) === '.ts') ||
        path_.extname(x.path) === '.tsx',
    ),
  );

  const writeCompiledSource = (source: CompiledSource['cjsFile']) => {
    return Effect.all(
      [
        fs.writeFileString(source.filePath, Option.getOrThrow(source.content)),
        fs.writeFileString(
          source.sourcemapFilePath,
          JSON.stringify(Option.getOrThrow(source.sourcemap), null, 2),
        ),
      ],
      { concurrency: 'inherit' },
    );
  };

  const createFiles = (files: CompiledSource) => {
    return Effect.gen(function* () {
      yield* writeCompiledSource(files.cjsFile);
      // yield* writeCompiledSource({
      //   content: Option.some(files.esmFile.output.outputText),
      //   sourcemap: files.esmFile.sourcemap.pipe(Option.map((x) => JSON.parse(x))),
      //   filePath: files.esmFile.filePath,
      //   sourcemapFilePath: files.esmFile.sourcemapFilePath,
      // });
      yield* writeCompiledSource(files.annotatedESMFile);
    });
  };

  return {
    createFiles,
    srcFolder,
    watcher,
    // virtualFolder,
    folders: {
      cjs: cjsDir,
      esm: esmDir,
      dts: dtsDir,
    },
  };
});

export interface VirtualFS extends Effect.Effect.Success<typeof make> {}
export const VirtualFS = Context.GenericTag<VirtualFS>('VirtualFS');

export const VirtualFSLive = Layer.effect(VirtualFS, make).pipe(
  Layer.provide(FsUtilsLive),
  Layer.provide(PackageContextLive),
  Layer.provide(NodePath.layerPosix),
  Layer.provide(NodeFileSystem.layer),
);
