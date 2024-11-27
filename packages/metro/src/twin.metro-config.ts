import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as LogLevel from 'effect/LogLevel';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import path from 'node:path';
import { inspect } from 'node:util';
import {
  listenForkedStreamChanges,
  NodeMainLayer,
  NodeWithNativeTwinOptions,
  setConfigLayerFromUser,
  twinLoggerLayer,
} from '@native-twin/compiler/node';
import { TwinFileSystem } from '@native-twin/compiler/node';
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

  const runtime = ManagedRuntime.make(NodeMainLayer.pipe(Layer.provide(configLayer)));

  const metroSettings = runtime.runSync(getMetroSettings);

  const originalResolver = metroConfig.resolver.resolveRequest;
  const originalGetTransformerOptions = metroConfig.transformer.getTransformOptions;

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

          yield* listenForkedStreamChanges(watcher.fsWatcher, (event) => {
            return Effect.log('FILE_CHANGE_DETECTED', inspect(event, false, null, true));
          });
          yield* Effect.yieldNow();
          yield* Effect.log(`Watcher started for [${options.platform}]`);

          return result;
        }).pipe(
          Effect.annotateLogs('platform', options.platform),
          Effect.withSpan('Transformer', { attributes: { ...options } }),
          Effect.provide(twinLoggerLayer),
          Effect.scoped,
          runtime.runPromise,
        );
      },
    },
  };
}
