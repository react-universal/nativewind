import { Effect } from 'effect';
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
  makeNodeLayer,
  TwinNodeContext,
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

  function getDefaultConfig(
    metroConfig: TwinMetroConfig,
    nativeTwinConfig: NodeWithNativeTwinOptions = {},
  ) {
    const projectRoot = nativeTwinConfig.projectRoot ?? process.cwd();
    const outputDir = getTwinCacheDir();
    const { inputCSS } = createTwinCSSFiles({
      outputDir: outputDir,
      inputCSS: nativeTwinConfig.inputCSS,
    });

    // const twin = new NativeTwinManager({
    //   inputCSS,
    //   platform: 'native',
    //   projectRoot,
    //   twinConfigPath: nativeTwinConfig.configPath ?? 'tailwind.config.ts',
    //   runtimeEntries: cachedEntries,
    // });

    const originalResolver = metroConfig.resolver.resolveRequest;
    const metroResolver = twinMetroRequestResolver(originalResolver, nodeContext);
    const data = Effect.map(TwinNodeContext, (x) => x).pipe(nodeContext.executor.runSync);

    const transformerOptions = {
      allowedPaths: data.config.allowedPaths,
      allowedPathsGlob: data.config.allowedPathsGlob,
      outputDir,
      projectRoot,
      inputCSS,
      platformOutputs: Array.from(Object.values(data.config.outputPaths)),
      twinConfigPath: data.config.twinConfigPath,
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
  }
}
