import { sheetEntriesToCss, type SheetEntry } from '@native-twin/css';
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as FileSystem from '@effect/platform/FileSystem';
import * as Path from '@effect/platform/Path';
import chokidar from 'chokidar';
import { Option } from 'effect';
import * as RA from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as HashMap from 'effect/HashMap';
import * as HashSet from 'effect/HashSet';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';
import * as Stream from 'effect/Stream';
import * as SubscriptionRef from 'effect/SubscriptionRef';
import type { JSXElementNode } from '../models/JSXElement.model.js';
import { FrequencyMetric } from '../models/Metrics.models.js';
import { listenForkedStreamChanges } from '../utils/effect.utils.js';
import {
  createChokidarWatcher,
  readDirectoryRecursive,
} from '../utils/fileWatcher.util.js';
import { getNativeStylesJSOutput } from '../utils/native.utils.js';
import { extractTwinConfig } from '../utils/twin.utils.js';
import { BabelCompiler } from './BabelCompiler.service.js';
import { CompilerConfigContext } from './CompilerConfig.service.js';
import { TwinNodeContext } from './TwinNodeContext.service.js';

const providedFrequency = new FrequencyMetric(
  'Service',
  'metro/fs/service',
  'Twin FileSystem service',
  'Info',
);

export const TwinFSMake = Effect.gen(function* () {
  const ctx = yield* TwinNodeContext;
  const compiler = yield* BabelCompiler;
  const config = yield* CompilerConfigContext;
  const env = yield* config.env;
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  yield* fs
    .makeDirectory(env.outputDir, { recursive: true })
    .pipe(Effect.tap(() => Effect.logInfo('TWIN_OUTPUT_CREATED')));

  yield* fs.exists(env.platformPaths.ios).pipe(
    Effect.flatMap((x) => {
      if (!x) {
        return fs.writeFileString(env.platformPaths.ios, '');
      }
      return Effect.void;
    }),
    Effect.tap(() => Effect.logInfo('TWIN_IOS_CREATED')),
  );

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
      if (Option.isSome(env.twinConfigPath) && event.path === env.twinConfigPath.value) {
        if (event._tag === 'Update') {
          const newConfig = extractTwinConfig(env.twinConfigPath.value);
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

  yield* providedFrequency.track(Effect.succeed('FS - provided'));
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
    }).pipe(Effect.provide(NodePath.layerPosix));
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
  static metrics = {
    providedFreq: providedFrequency,
  };
}
