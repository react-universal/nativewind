import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as LogLevel from 'effect/LogLevel';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import path from 'node:path';
import { inspect } from 'node:util';
import {
  listenForkedStreamChanges,
  NodeMainLayerSync,
  NodeMainLayerAsync,
  NodeWithNativeTwinOptions,
  setConfigLayerFromUser,
  twinLoggerLayer,
  TwinFileSystem,
} from '@native-twin/compiler/node';
import { LaunchTwinServer } from '@native-twin/compiler/server';
import { TwinMetroConfig } from './models/Metro.models';
import { getMetroSettings } from './programs/getMetroSettings';

export function withNativeTwin(
  metroConfig: TwinMetroConfig,
  nativeTwinConfig: NodeWithNativeTwinOptions = {
    logLevel: 'Info',
  },
): TwinMetroConfig {
  const configLayer = setConfigLayerFromUser({
    logLevel: LogLevel.fromLiteral(nativeTwinConfig.logLevel),
    inputCSS: nativeTwinConfig.inputCSS,
    outputDir: nativeTwinConfig.outputDir,
    projectRoot: nativeTwinConfig.projectRoot,
    twinConfigPath: nativeTwinConfig.twinConfigPath,
  });

  const runtimeSync = ManagedRuntime.make(
    NodeMainLayerSync.pipe(Layer.provide(configLayer)),
  );
  const runtimeAsync = ManagedRuntime.make(
    NodeMainLayerAsync.pipe(Layer.provide(configLayer)),
  );

  const metroSettings = runtimeSync.runSync(getMetroSettings);

  const originalResolver = metroConfig.resolver.resolveRequest;
  const originalGetTransformerOptions = metroConfig.transformer.getTransformOptions;

  runtimeAsync.runFork(LaunchTwinServer);

  return {
    ...metroConfig,
    transformerPath: path.join(__dirname, 'programs', 'metro.transformer.js'),
    resolver: {
      ...metroConfig.resolver,
      resolveRequest: (context, moduleName, platform) => {
        const resolver = originalResolver ?? context.resolveRequest;
        const resolved = resolver(context, moduleName, platform);
        if (!platform) return resolved;

        const platformOutput = metroSettings.ctx.getOutputCSSPath(platform);
        const platformInput = metroSettings.env.inputCSS;

        if ('filePath' in resolved && resolved.filePath === platformInput) {
          return {
            ...resolved,
            filePath: path.resolve(platformOutput),
          };
        }

        return resolved;
      },
    },
    transformer: {
      ...metroConfig.transformer,
      originalTransformerPath: metroConfig.transformerPath,
      twinConfig: metroSettings.transformerOptions,
      getTransformOptions: (entryPoints, options, getDeps) => {
        return Effect.gen(function* () {
          const result = yield* Effect.promise(() =>
            originalGetTransformerOptions(entryPoints, options, getDeps),
          );

          if (!options.platform) return result;
          const watcher = yield* TwinFileSystem;

          // const allFiles = yield* watcher.getAllFiles;
          // yield* watcher.runTwinForFiles(allFiles, config.platform);
          yield* Effect.logDebug('CHECK_DEBUG_LOGGER');

          yield* listenForkedStreamChanges(watcher.fsWatcher, (event) => {
            return Effect.logTrace(
              'FILE_CHANGE_DETECTED',
              inspect(event, false, null, true),
            );
          });
          yield* Effect.logTrace(`Watcher started for [${options.platform}]`);

          // const fsMetrics = yield* TwinFileSystem.metrics.providedFreq.value;

          return result;
        }).pipe(
          Effect.annotateLogs('platform', options.platform),
          Effect.withSpan('Transformer', { attributes: { ...options } }),
          Effect.provide(twinLoggerLayer),
          Effect.scoped,
          runtimeAsync.runPromise,
        );
      },
    },
  };
}
