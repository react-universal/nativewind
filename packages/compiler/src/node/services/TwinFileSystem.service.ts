import { sheetEntriesToCss, type SheetEntry } from '@native-twin/css';
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as FileSystem from '@effect/platform/FileSystem';
import * as Path from '@effect/platform/Path';
import chokidar from 'chokidar';
import * as RA from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as HashMap from 'effect/HashMap';
import * as HashSet from 'effect/HashSet';
import * as Layer from 'effect/Layer';
import * as Queue from 'effect/Queue';
import * as Ref from 'effect/Ref';
import * as Stream from 'effect/Stream';
import * as SubscriptionRef from 'effect/SubscriptionRef';
import type { JSXElementNode } from '../models/JSXElement.model.js';
import { listenForkedStreamChanges } from '../utils/effect.utils.js';
import {
  createChokidarWatcher,
  readDirectoryRecursive,
} from '../utils/fileWatcher.util.js';
import { getNativeStylesJSOutput } from '../utils/native.utils.js';
import { extractTwinConfig } from '../utils/twin.utils.js';
import { BabelCompiler, BabelFileEntry } from './BabelCompiler.service.js';
import { CompilerConfig } from './Compiler.config.js';
import { TwinNodeContext } from './TwinNodeContext.service.js';

export const TwinFSMake = Effect.gen(function* () {
  const ctx = yield* TwinNodeContext;
  const compiler = yield* BabelCompiler;
  const env = yield* CompilerConfig;
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  // const setupPlatforms = yield* Ref.make(new Set<string>());
  const projectFilesQueue = yield* Queue.unbounded<BabelFileEntry>();

  const watcher = yield* Effect.sync(() =>
    chokidar.watch(ctx.twinConfig.content, {
      cwd: env.projectRoot,
      // awaitWriteFinish: true,
      alwaysStat: false,
      persistent: true,
    }),
  );

  const fsWatcher = createChokidarWatcher(env.projectRoot, watcher).pipe(
    Stream.filterEffect((x) => ctx.isAllowedPath(x.path)),
  );
  yield* listenForkedStreamChanges(fsWatcher, (event) =>
    Effect.gen(function* () {
      const currentFiles = yield* Ref.get(ctx.projectFilesRef);
      if (event._tag === 'Create') {
        if (!HashSet.has(currentFiles, event.path)) {
          yield* Ref.set(
            ctx.projectFilesRef,
            currentFiles.pipe(HashSet.add(event.path)),
          ).pipe(Effect.andThen(() => Effect.logDebug('Added file')));
        }
        return;
      }
      if (event.path === env.twinConfigPath) {
        if (event._tag === 'Update') {
          const newConfig = extractTwinConfig(env.twinConfigPath);
          // const filesToSet = HashSet.fromIterable(allowedFiles.files);
          // const shouldReplace = currentFiles.pipe(HashSet.isSubset(filesToSet));
          // watcher.unwatch(Object.keys(watcher.getWatched()));
          // watcher.add(ctx.getAllowedGlobPatterns(newConfig.content));
          yield* Ref.set(ctx.twinConfigRef, newConfig).pipe(
            Effect.andThen(() => Effect.log('TwinConfig updated!')),
          );
        }
        yield* Effect.log('TW_CONFIG_MODIFIED');
        return;
      }
      yield* Effect.log('OTHER_EVENT: ', Object.keys(watcher.getWatched()));
    }).pipe(
      Effect.withSpanScoped('TwinFS', {
        attributes: {
          watcher: 'PROJECT_FILES',
        },
      }),
    ),
  );

  // yield* fs.watch(env.twinConfigPath).pipe(
  //   Stream.tap((x) => Effect.log('TAILWIND_CONFIG_CHANGE: ', x)),
  //   Stream.runForEach((x) => {
  //     if (x._tag === 'Update') {
  //       const newConfig = extractTwinConfig({
  //         projectRoot: env.projectRoot,
  //         twinConfigPath: env.twinConfigPath,
  //       });

  //       return SubscriptionRef.set(configFileRef, newConfig.config);
  //     }
  //     return Effect.void;
  //   }),
  //   Effect.withSpanScoped('WATCHER', {
  //     attributes: { type: 'fs.watch(ctx.config.twinConfigPath)' },
  //   }),
  //   Effect.forkDaemon,
  // );

  yield* ctx.twinConfigRef.changes.pipe(
    Stream.mapEffect(() => SubscriptionRef.get(ctx.twinConfigRef)),
    Stream.map((x) => x.content),
    // Stream.tap((contents) => Effect.log('contents', contents)),
    Stream.mapEffect((_) => ctx.scanAllowedPaths),
    // Stream.tap((contents) => Effect.log('ALLOWED_PATHS', inspect(contents))),

    Stream.mapEffect((x) => {
      return Stream.fromIterable(x.directories).pipe(
        Stream.mapEffect((y) =>
          readDirectoryRecursive(y).pipe(
            Effect.orElse(() => Effect.succeed(RA.empty<string>())),
          ),
        ),
        Stream.flattenIterables,
        Stream.runCollect,
      );
    }),
    // Stream.tap((dirs) => Effect.log('DIRECTORIES', inspect(dirs))),
    Stream.runForEach((x) =>
      Ref.update(ctx.projectFilesRef, () => HashSet.fromIterable(x)),
    ),
    // Effect.tap(() => Effect.log('Config file changed.')),
    Effect.withSpanScoped('WATCHER', { attributes: { type: 'configFileRef' } }),
    Effect.forkDaemon,
  );

  const getWatchedDirectories = Ref.get(ctx.projectFilesRef).pipe(
    Effect.map((files) => HashSet.map(files, (x) => path.dirname(x))),
    // Effect.tap((x) => Effect.log('WATCHED_FOLDERS: ', x)),
  );

  const getWebCSS = ctx
    .getTwForPlatform('web')
    .pipe(Effect.map((x) => sheetEntriesToCss(x.target, false)));

  const readPlatformCSSFile = (platform: string) =>
    fs.readFile(ctx.getOutputCSSPath(platform));

  const directoryWatchers = getWatchedDirectories.pipe(
    Effect.map((x) => HashSet.map(x, (a) => fs.watch(a))),
    Effect.map((x) => Stream.mergeAll(x, { concurrency: 'unbounded' })),
  );

  const startWatcher = Effect.suspend(() => directoryWatchers);

  yield* Queue.take(projectFilesQueue).pipe(
    Effect.flatMap((x) => compiler.getBabelOutput(x)),
    Effect.tap(() => Effect.log('Rebuilding...')),
    Effect.flatMap((x) =>
      refreshCSSOutput({
        filepath: x.filename,
        trees: RA.make(x.treeNodes),
        platform: x.platform,
      }),
    ),
    Effect.forever,
    Effect.fork,
  );

  return {
    fsWatcher,
    refreshCSSOutput,
    getAllFiles: Ref.get(ctx.projectFilesRef),
    startWatcher,
    getWebCSS,
    readPlatformCSSFile,
    createWatcherFor,
    runTwinForFiles,
  };

  // function refreshProjectFiles() {
  //   ///asdasda  AAAAAAAAA
  //   return Stream.fromIterable(ctx.config.allowedPaths).pipe(
  //     Stream.mapEffect((x) =>
  //       readDirectoryRecursive(x).pipe(Effect.orElse(() => Effect.succeed([]))),
  //     ),
  //     Stream.flattenIterables,
  //     Stream.runCollect,
  //     Effect.flatMap((x) =>
  //       Ref.update(projectFiles, (current) =>
  //         HashSet.union(
  //           current,
  //           RA.filter(RA.dedupe(RA.fromIterable(x)), ctx.utils.isAllowedPath),
  //         ),
  //       ),
  //     ),
  //     Effect.andThen(() =>
  //       Ref.get(projectFiles).pipe(Effect.tap((x) => Effect.log('PROJECT_FILES: ', x))),
  //     ),
  //   );
  // }

  function createWatcherFor(basePath: string) {
    return fs.watch(basePath).pipe(
      Stream.map((watchEvent) => ({
        ...watchEvent,
        path: path.resolve(basePath, watchEvent.path),
      })),
      Stream.filterEffect((watchEvent) => ctx.isAllowedPath(watchEvent.path)),
      Stream.tap((x) => Effect.log(`File change detected: ${x.path} \n`)),
    );
  }

  function refreshCSSOutput(params: {
    filepath: string;
    platform: string;
    trees: HashMap.HashMap<string, JSXElementNode>[];
  }) {
    return Effect.gen(function* () {
      const jsOutput = yield* getTwinCssOutput(params);
      const output = new TextEncoder().encode(jsOutput);
      yield* fs.writeFile(params.filepath, output);
    });
  }

  function getTwinCssOutput(params: {
    filepath: string;
    platform: string;
    trees: HashMap.HashMap<string, JSXElementNode>[];
  }) {
    return Effect.gen(function* () {
      // yield* Effect.log('[getTwinCssOutput]: ', params.filepath);
      const tw = yield* ctx.getTwForPlatform(params.platform);

      if (params.filepath.endsWith('.css')) {
        return sheetEntriesToCss(tw.target, false);
      }

      const registry = yield* createCompilerRegistry(params.trees);
      return yield* getNativeStylesJSOutput(registry, params.platform);
    });
  }

  function compileFiles(files: Iterable<string>, platform: string) {
    return Stream.fromIterable(files).pipe(
      Stream.filterEffect((x) => ctx.isAllowedPath(x)),
      Stream.mapEffect((x) =>
        compiler.getBabelOutput({
          _tag: 'BabelFileEntry',
          filename: x,
          platform,
        }),
      ),
      // Stream.map((x) => x.entries),
      // Stream.flattenIterables,
      Stream.tapError((error) => Effect.log(error)),
      Stream.runCollect,
      Effect.map((x) => RA.fromIterable(x)),
    );
  }

  function runTwinForFiles(files: Iterable<string>, platform: string) {
    return Effect.gen(function* () {
      yield* Effect.log('Building project...');
      const tw = yield* ctx.getTwForPlatform(platform);
      const outputPath = ctx.getOutputCSSPath(platform);

      const twinResult = yield* compileFiles(files, platform);
      yield* refreshCSSOutput({
        filepath: outputPath,
        trees: RA.map(twinResult, (x) => x.treeNodes),
        platform,
      });
      yield* Effect.log(`Build success!`);
      pipe(
        tw.target,
        RA.appendAll(cachedEntries),
        RA.dedupeWith(
          (a, b) =>
            `${a.className}-${a.selectors.join('')}` ===
            `${b.className}-${b.selectors.join('')}`,
        ),
        (result) => {
          if (result.length > cachedEntries.length) {
            cachedEntries.splice(0, cachedEntries.length, ...result);
          }
        },
      );
      yield* Effect.log(`Added ${tw.target.length} classes`);
    });
  }
});

// const initialized: Set<string> = new Set();
export const cachedEntries: SheetEntry[] = [];

const createCompilerRegistry = (trees: HashMap.HashMap<string, JSXElementNode>[]) =>
  pipe(
    Stream.fromIterable(trees),
    Stream.runFold(HashMap.empty<string, JSXElementNode>(), (prev, current) => {
      return pipe(prev, HashMap.union(current));
    }),
  );

export const FSLive = Layer.mergeAll(NodeFileSystem.layer, NodePath.layer);
export class TwinFileSystem extends Context.Tag('metro/fs/service')<
  TwinFileSystem,
  Effect.Effect.Success<typeof TwinFSMake>
>() {
  static Live = Layer.scoped(TwinFileSystem, TwinFSMake)
    .pipe(Layer.provideMerge(BabelCompiler.Live))
    .pipe(Layer.provide(FSLive));
}

// function runPlatform(platform: string) {
//   return Effect.gen(function* () {
//     const current = yield* Ref.get(setupPlatforms);
//     const installed = current.has(platform);
//     if (installed) {
//       yield* Effect.log('already setup platform', platform);
//       return;
//     }
//     yield* Effect.log(`Initializing project \n`);

//     return (yield* directoryWatchers).pipe(
//       Stream.map((watchEvent) => {
//         console.log('PATH: ', watchEvent);
//         return {
//           ...watchEvent,
//           // path: path.resolve(basePath, watchEvent.path),
//         };
//       }),
//       Stream.filter((watchEvent) => ctx.utils.isAllowedPath(watchEvent.path)),
//       Stream.tap((x) => Effect.log(`File change detected: ${x.path} \n`)),
//       Stream.runDrain,
//       Effect.fork,
//     );
//   });
// }
