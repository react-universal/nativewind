import * as Effect from 'effect/Effect';
import * as LogLevel from 'effect/LogLevel';
import * as Logger from 'effect/Logger';
import {
  twinMetroRequestResolver,
  twinGetTransformerOptions,
  TwinMetroConfig,
  MetroWithNativeTwindOptions,
} from '@native-twin/compiler/metro';
import {
  createTwinCSSFiles,
  getTwinCacheDir,
  NativeTwinManager,
} from '@native-twin/compiler/node';

export function withNativeTwin(
  metroConfig: TwinMetroConfig,
  nativeTwinConfig: MetroWithNativeTwindOptions = {},
): TwinMetroConfig {
  const { twinMetroConfig, originalGetTransformerOptions, transformerOptions } =
    getDefaultConfig(metroConfig, nativeTwinConfig);

  const getTransformerOptions = twinGetTransformerOptions({
    originalGetTransformerOptions,
    projectRoot: transformerOptions.projectRoot,
    twinConfigPath: transformerOptions.twinConfigPath,
    inputCSS: transformerOptions.inputCSS,
  });
  return {
    ...twinMetroConfig,
    transformer: {
      ...twinMetroConfig.transformer,
      getTransformOptions: (...args) => {
        return getTransformerOptions(...args).pipe(
          Effect.annotateLogs('platform', args[1].platform ?? 'server'),
          Logger.withMinimumLogLevel(LogLevel.All),
          Effect.runPromise,
        );
      },
    },
  };
}

const getDefaultConfig = (
  metroConfig: TwinMetroConfig,
  nativeTwinConfig: MetroWithNativeTwindOptions = {},
) => {
  const projectRoot = nativeTwinConfig.projectRoot ?? process.cwd();
  const outputDir = getTwinCacheDir();
  const { inputCSS } = createTwinCSSFiles({
    outputDir: outputDir,
    inputCSS: nativeTwinConfig.inputCSS,
  });
  const twin = new NativeTwinManager(
    nativeTwinConfig.configPath ?? 'tailwind.config.ts',
    projectRoot,
    'native',
    inputCSS,
  );

  const originalResolver = metroConfig.resolver.resolveRequest;
  const metroResolver = twinMetroRequestResolver(originalResolver, twin);

  const transformerOptions = {
    allowedPaths: twin.allowedPaths,
    allowedPathsGlob: twin.allowedPathsGlob,
    outputDir,
    projectRoot,
    inputCSS,
    platformOutputs: twin.platformOutputs,
    twinConfigPath: twin.twinConfigPath,
  };

  return {
    twinMetroConfig: {
      ...metroConfig,
      transformerPath: require.resolve('@native-twin/compiler/metro.transformer'),
      resolver: {
        ...metroConfig.resolver,
        resolveRequest: metroResolver,
      },
      transformer: {
        ...metroConfig.transformer,
        ...transformerOptions,
        // babelTransformerPath: require.resolve('@native-twin/compiler/metro.babel.transformer'),
        originalTransformerPath: metroConfig.transformerPath,
        unstable_allowRequireContext: true,
      },
    },
    originalGetTransformerOptions: metroConfig.transformer.getTransformOptions,
    originalResolver,
    transformerOptions,
  };
};
