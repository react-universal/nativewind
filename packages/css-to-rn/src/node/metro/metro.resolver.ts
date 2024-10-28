import * as Chunk from 'effect/Chunk';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';
import type { GetTransformOptions, ExtraTransformOptions } from 'metro-config';
import type { CustomResolver } from 'metro-resolver';
import path from 'node:path';
import { makeBabelLayer } from '../babel';
import { TwinFSService } from '../file-system';
import { NativeTwinServiceNode } from '../native-twin';
import { twinLoggerLayer } from '../services/Logger.service';

const setupPlatforms: Set<string> = new Set();

export const twinMetroRequestResolver = (
  originalResolver: CustomResolver | undefined,
  twinConfig: NativeTwinServiceNode['Type'],
): CustomResolver => {
  return (context, moduleName, platform) => {
    const resolver = originalResolver ?? context.resolveRequest;
    const resolved = resolver(context, moduleName, platform);

    platform ??= 'native';
    const platformOutput = twinConfig.getPlatformOutput(platform);
    const platformInput = twinConfig.getPlatformInput();

    if ('filePath' in resolved && resolved.filePath === platformInput) {
      console.log('INPUT_FILE_FOUND: ', resolved);
      return {
        ...resolved,
        filePath: path.resolve(platformOutput),
      };
    }

    return resolved;
  };
};

/** @category Programs */
export const twinGetTransformerOptions =
  (config: {
    originalGetTransformerOptions: GetTransformOptions;
    twinConfigPath: string;
    projectRoot: string;
    inputCSS: string;
  }) =>
  (...[entryPoints, options, getDeps]: Parameters<GetTransformOptions>) => {
    const platform = options.platform ?? 'native';
    console.debug('Not platform specified on getTransformerOptions');

    const mainLayer = makeBabelLayer.pipe(
      Layer.provideMerge(TwinFSService.Live),
      Layer.provideMerge(
        NativeTwinServiceNode.Live(
          config.twinConfigPath,
          config.projectRoot,
          platform,
          config.inputCSS,
        ),
      ),
      Layer.provideMerge(twinLoggerLayer),
    );

    return Effect.gen(function* () {
      const twin = yield* NativeTwinServiceNode;
      const watcher = yield* TwinFSService;

      const writeStylesToFS = !options.dev;

      console.debug(`getTransformOptions.dev ${options.dev}`);
      console.debug(`getTransformOptions.writeStylesToFS ${writeStylesToFS}`);

      // We can skip writing to the filesystem if this instance patched Metro
      if (writeStylesToFS) {
        const outputPath = twin.getPlatformOutput(platform);

        console.debug(`getTransformOptions.platform ${platform}`);
        console.debug(`getTransformOptions.output ${outputPath}`);

        const allFiles = yield* watcher.getAllFilesInProject;
        yield* watcher.runTwinForFiles(allFiles, platform);
      }

      if (!writeStylesToFS && options.platform && !setupPlatforms.has(options.platform)) {
        const allFiles = yield* watcher.getAllFilesInProject;
        yield* startTwinCompilerWatcher(platform, allFiles).pipe(
          Effect.scoped,
          Effect.forkDaemon,
        );
        yield* Effect.yieldNow();
        yield* Effect.log(`Watcher started for [${platform}]`);
      }

      const result: Partial<ExtraTransformOptions> = yield* Effect.promise(() =>
        config.originalGetTransformerOptions(entryPoints, options, getDeps),
      );

      // 32159
      return result;

      // 30146
      // return {
      //   ...result,
      //   transform: {
      //     ...result.transform,
      //     experimentalImportSupport: true,
      //     inlineRequires: true,
      //     unstable_disableES6Transforms: true,
      //   },
      // } as Partial<ExtraTransformOptions>;
    }).pipe(Effect.provide(mainLayer));
  };

const startTwinCompilerWatcher = (platform: string, allFiles: string[]) =>
  Effect.gen(function* () {
    const twinFS = yield* TwinFSService;
    const hasPlatform = setupPlatforms.has(platform);
    if (hasPlatform) return;

    // const currentSize = setupPlatforms.size;
    yield* Effect.log(`Initializing project \n`);
    yield* twinFS.runTwinForFiles(allFiles, platform);

    return yield* pipe(
      yield* twinFS.startWatcher,
      Stream.take(allFiles.length),
      Stream.chunks,
      Stream.runForEach((fs) =>
        twinFS.runTwinForFiles(
          Chunk.toArray(fs).map((x) => x.path),
          platform,
        ),
      ),
    );
  });
