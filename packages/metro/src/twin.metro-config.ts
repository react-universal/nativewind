import {
  twinMetroRequestResolver,
  twinGetTransformerOptions,
  TwinMetroConfig,
  NodeWithNativeTwinOptions,
  cachedEntries,
} from '@native-twin/compiler/metro';
import {
  createTwinCSSFiles,
  getTwinCacheDir,
  NativeTwinManager,
  makeNodeLayer,
} from '@native-twin/compiler/node';

export function withNativeTwin(
  metroConfig: TwinMetroConfig,
  nativeTwinConfig: NodeWithNativeTwinOptions = {},
): TwinMetroConfig {
  const nodeContext = makeNodeLayer(nativeTwinConfig);

  const { twinMetroConfig, originalGetTransformerOptions } = getDefaultConfig(
    metroConfig,
    nativeTwinConfig,
  );

  const getTransformerOptions = twinGetTransformerOptions(
    originalGetTransformerOptions,
    nodeContext,
  );
  return {
    ...twinMetroConfig,
    transformer: {
      ...twinMetroConfig.transformer,
      getTransformOptions: (...args) => {
        return getTransformerOptions(...args);
      },
    },
  };
}

const getDefaultConfig = (
  metroConfig: TwinMetroConfig,
  nativeTwinConfig: NodeWithNativeTwinOptions = {},
) => {
  const projectRoot = nativeTwinConfig.projectRoot ?? process.cwd();
  const outputDir = getTwinCacheDir();
  const { inputCSS } = createTwinCSSFiles({
    outputDir: outputDir,
    inputCSS: nativeTwinConfig.inputCSS,
  });

  const twin = new NativeTwinManager({
    inputCSS,
    platform: 'native',
    projectRoot,
    twinConfigPath: nativeTwinConfig.configPath ?? 'tailwind.config.ts',
    runtimeEntries: cachedEntries,
  });

  const originalResolver = metroConfig.resolver.resolveRequest;
  const metroResolver = twinMetroRequestResolver(originalResolver, {
    twin,
  });

  const transformerOptions = {
    allowedPaths: twin.allowedPaths,
    allowedPathsGlob: twin.allowedPathsGlob,
    outputDir,
    projectRoot,
    inputCSS,
    platformOutputs: twin.platformOutputs,
    twinConfigPath: twin.twinConfigPath,
    runtimeEntries: cachedEntries,
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
