import path from 'node:path';
import {
  type NodeWithNativeTwinOptions,
  TwinNodeContext,
  TwinWatcherContextLive,
  twinLoggerLayer,
} from '@native-twin/compiler';
import * as Effect from 'effect/Effect';
import * as HashSet from 'effect/HashSet';
import * as Layer from 'effect/Layer';
import * as Logger from 'effect/Logger';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import * as Ref from 'effect/Ref';
import type { GetTransformOptions } from 'metro-config';
import type { CustomResolver } from 'metro-resolver';
import type { TwinMetroConfig } from './models/Metro.models.js';
import { getMetroSettings } from './programs/getMetroSettings.js';
import { createMetroInnerLayer } from './services/Metro.layers.js';

export function withNativeTwin(
  metroConfig: TwinMetroConfig,
  nativeTwinConfig: NodeWithNativeTwinOptions,
): TwinMetroConfig {
  const MetroLive = createMetroInnerLayer(nativeTwinConfig);
  const runtimeSync = ManagedRuntime.make(MetroLive);

  const runtimeAsync = ManagedRuntime.make(
    TwinWatcherContextLive.pipe(
      Layer.provideMerge(MetroLive),
      Layer.provide(twinLoggerLayer),
    ),
  );

  const originalResolver = metroConfig.resolver.resolveRequest;
  const originalGetTransformerOptions = metroConfig.transformer.getTransformOptions;

  const metroSettings = runtimeSync.runSync(getMetroSettings);

  return {
    ...metroConfig,
    transformerPath: require.resolve('./programs/metro.transformer'),
    resolver: {
      ...metroConfig.resolver,
      resolveRequest: resolveMetroRequest,
    },
    transformer: {
      ...metroConfig.transformer,
      originalTransformerPath: metroConfig.transformerPath,
      twinConfig: metroSettings.transformerOptions,
      getTransformOptions: getTransformerOptions,
    },
  };

  function resolveMetroRequest(
    ...[context, moduleName, platform]: Parameters<CustomResolver>
  ) {
    return Effect.gen(function* () {
      const metroSettings = yield* getMetroSettings;
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
    }).pipe(runtimeSync.runSync);
  }

  function getTransformerOptions(
    ...[entryPoints, options, getDeps]: Parameters<GetTransformOptions>
  ) {
    return Effect.gen(function* () {
      const result = yield* Effect.promise(() =>
        originalGetTransformerOptions(entryPoints, options, getDeps),
      );

      if (!options.platform) return result;

      const platform = options.platform;
      const ctx = yield* TwinNodeContext;
      yield* Ref.update(ctx.state.runningPlatforms.ref, (x) => HashSet.add(x, platform));

      yield* Effect.logTrace(`Watcher started for [${options.platform}]`);

      return result;
    }).pipe(
      Effect.annotateLogs('platform', options.platform),
      Effect.withSpan('Transformer', { attributes: { ...options } }),
      Logger.withMinimumLogLevel(metroSettings.env.logLevel),
      Effect.provide(twinLoggerLayer),
      runtimeAsync.runPromise,
    );
  }
}
