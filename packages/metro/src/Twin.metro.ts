import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import path from 'node:path';
import {
  CompilerConfigContext,
  NodeWithNativeTwinOptions,
  TwinFileSystem,
  TwinNodeContext,
  twinLoggerLayer,
  createCompilerConfig,
} from '@native-twin/compiler';
import { TwinMetroConfig } from './models/Metro.models.js';
import { getMetroSettings } from './programs/getMetroSettings.js';

const MainLive = Layer.empty.pipe(Layer.provideMerge(TwinNodeContext.Live));

export function withNativeTwin(
  metroConfig: TwinMetroConfig,
  nativeTwinConfig: NodeWithNativeTwinOptions,
): TwinMetroConfig {
  const outDir =
    nativeTwinConfig.outputDir ??
    path.join(path.dirname(require.resolve('@native-twin/core')), '../..', '.cache');

  const MetroLive = Layer.provideMerge(
    MainLive,
    Layer.succeed(
      CompilerConfigContext,
      createCompilerConfig({
        rootDir: nativeTwinConfig.projectRoot ?? process.cwd(),
        outDir,
        inputCSS: nativeTwinConfig.inputCSS,
        twinConfigPath: nativeTwinConfig.twinConfigPath,
      }),
    ),
  );

  const runtimeSync = ManagedRuntime.make(MetroLive);

  const metroSettings = runtimeSync.runSync(
    getMetroSettings.pipe(Effect.provide(MetroLive)),
  );

  const runtimeAsync = ManagedRuntime.make(
    TwinFileSystem.Live.pipe(Layer.provideMerge(MetroLive)),
  );

  const originalResolver = metroConfig.resolver.resolveRequest;
  const originalGetTransformerOptions = metroConfig.transformer.getTransformOptions;

  return {
    ...metroConfig,
    transformerPath: require.resolve('./programs/metro.transformer'),
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

          yield* watcher.compileProjectFiles(options.platform);
          yield* Effect.logDebug('CHECK_DEBUG_LOGGER');

          yield* Effect.logTrace(`Watcher started for [${options.platform}]`);

          return result;
        }).pipe(
          Effect.scoped,
          Effect.annotateLogs('platform', options.platform),
          Effect.withSpan('Transformer', { attributes: { ...options } }),
          Effect.provide(twinLoggerLayer),
          runtimeAsync.runPromise,
        );
      },
    },
  };
}
