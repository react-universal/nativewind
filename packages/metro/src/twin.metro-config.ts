import { ManagedRuntime } from 'effect';
import * as Effect from 'effect/Effect';
import path from 'node:path';
import {
  makeNodeLayer,
  TwinNodeContext,
  NodeWithNativeTwinOptions,
} from '@native-twin/compiler/node';
import { TwinMetroConfig } from './models/Metro.models';
import { startTwinWatcher } from './programs/metro.resolver';

export function withNativeTwin(
  metroConfig: TwinMetroConfig,
  nativeTwinConfig: NodeWithNativeTwinOptions = {},
): TwinMetroConfig {
  const MainLayer = makeNodeLayer(nativeTwinConfig);
  const runtime = ManagedRuntime.make(MainLayer);

  const originalResolver = metroConfig.resolver.resolveRequest;
  const originalGetTransformerOptions = metroConfig.transformer.getTransformOptions;

  const data = Effect.map(TwinNodeContext, (x) => x).pipe(runtime.runSync);

  const transformerOptions = {
    allowedPaths: data.config.allowedPaths,
    allowedPathsGlob: data.config.allowedPathsGlob,
    outputDir: data.config.outputDir,
    projectRoot: data.config.projectRoot,
    inputCSS: data.config.inputCSS,
    platformOutputs: Array.from(Object.values(data.config.outputPaths)),
    twinConfigPath: data.config.twinConfigPath,
    runtimeEntries: [],
  };
  return {
    ...metroConfig,
    transformerPath: path.join(__dirname, 'programs', 'metro.transformer.js'),
    resolver: {
      ...metroConfig.resolver,
      resolveRequest: (context, moduleName, platform) => {
        const resolver = originalResolver ?? context.resolveRequest;
        const resolved = resolver(context, moduleName, platform);
        if (!platform) return resolved;

        const platformOutput = data.utils.getOutputCSSPath(platform);
        const platformInput = data.config.inputCSS;

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
      ...transformerOptions,
      // babelTransformerPath: path.join(
      //   __dirname,
      //   'programs',
      //   'metro.babel.transformer.js',
      // ),
      originalTransformerPath: metroConfig.transformerPath,
      getTransformOptions: (entryPoints, options, getDeps) => {
        return Effect.gen(function* () {
          const result = yield* Effect.promise(() =>
            originalGetTransformerOptions(entryPoints, options, getDeps),
          );

          yield* Effect.logTrace('asdasda', result);

          if (options.platform) {
            yield* startTwinWatcher({
              platform: options.platform,
              writeStylesToFS: !options.dev,
            });
          }

          return result;
        }).pipe(
          Effect.annotateLogs('platform', options.platform),
          Effect.withSpan('Transformer', { attributes: { ...options } }),

          runtime.runPromise,
        );
      },
    },
  };
}
