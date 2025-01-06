import * as fs from 'fs/promises';
import * as Metro from 'metro';
import path from 'path';

const exampleProjectFixture = {
  cwd: path.join(__dirname, '../../../apps/expo-app'),
  configPath: require.resolve(
    path.join(__dirname, '../../../apps/expo-app', 'metro.config.js'),
  ),
  rootEntry: path.resolve(path.join(__dirname, '../../../apps/expo-app', 'src/screens/index.js')),
  screenComponentPath: path.resolve(
    path.join(__dirname, '../../../apps/expo-app', 'App.tsx'),
  ),
  bundleOut: path.join(__dirname, '../../../apps/expo-app', 'metro-test/bundled.js'),
  babelConfig: require.resolve(
    path.join(__dirname, '../../../apps/expo-app', 'babel.config.js'),
  ),
};
describe('Metro bundler test', () => {
  it('Metro build Native/iOS', async () => {
    const outDir = path.dirname(exampleProjectFixture.bundleOut);
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(exampleProjectFixture.bundleOut, '');
    const config = await Metro.loadConfig(
      {
        verbose: true,
        'max-workers': 1,
        maxWorkers: 1,
        resetCache: true,
        cwd: exampleProjectFixture.cwd,
        config: exampleProjectFixture.configPath,
      },
      // {
      //   // transformerPath: require.resolve('../src/transformer/metro.transformer'),
      //   projectRoot: exampleProjectFixture.cwd,
      //   resetCache: true,
      // },
    );
    await Metro.runBuild(config, {
      entry: exampleProjectFixture.screenComponentPath,
      out: exampleProjectFixture.bundleOut,
      dev: false,
      minify: false,
      sourceMap: false,
      platform: 'ios',
      output: {
        async save(entry, options, postSave) {
          return fs.writeFile(exampleProjectFixture.bundleOut, entry.code, {
            encoding: options.bundleEncoding,
          });
        },
        async build(server, options) {
          const result = await server.build({
            bundleType: 'delta',
            customResolverOptions: config.resolver,
            customTransformOptions: config.transformer,
            dev: false,
            entryFile: options.entryFile,
            excludeSource: true,
            hot: false,
            inlineSourceMap: false,
            lazy: false,
            minify: false,
            modulesOnly: true,
            runModule: true,
            shallow: true,
            createModuleIdFactory: options.createModuleIdFactory,
            unstable_transformProfile: 'default',
            onProgress: options.onProgress,
            platform: options.platform,
          });
          return result;
        },
      },
    });
  }, 800000);

  // it('Metro build Web', async () => {
  //   const outDir = path.dirname(exampleProjectFixture.bundleOut);
  //   await fs.mkdir(outDir, { recursive: true });
  //   await fs.writeFile(exampleProjectFixture.bundleOut, '');
  //   const config = await Metro.loadConfig(
  //     {
  //       verbose: true,
  //       'max-workers': 1,
  //       maxWorkers: 1,
  //       resetCache: true,
  //       cwd: exampleProjectFixture.cwd,
  //       config: exampleProjectFixture.configPath,
  //     },
  //     {
  //       // transformerPath: require.resolve('../src/transformer/metro.transformer'),
  //       projectRoot: exampleProjectFixture.cwd,
  //       resetCache: true,
  //     },
  //   );
  //   await Metro.runBuild(config, {
  //     entry: exampleProjectFixture.rootEntry,
  //     out: exampleProjectFixture.bundleOut,
  //     dev: true,
  //     minify: false,
  //     sourceMap: false,
  //     platform: 'web',
  //     output: {
  //       async save(entry, options, postSave) {
  //         return fs.writeFile(exampleProjectFixture.bundleOut, entry.code, {
  //           encoding: options.bundleEncoding,
  //         });
  //       },
  //       async build(server, options) {
  //         const result = await server.build({
  //           bundleType: 'bundle',
  //           customResolverOptions: config.resolver,
  //           customTransformOptions: config.transformer,
  //           dev: true,
  //           entryFile: options.entryFile,
  //           excludeSource: true,
  //           hot: true,
  //           inlineSourceMap: false,
  //           lazy: false,
  //           minify: false,
  //           modulesOnly: true,
  //           runModule: true,
  //           shallow: false,
  //           createModuleIdFactory: options.createModuleIdFactory,
  //           unstable_transformProfile: 'default',
  //           onProgress: options.onProgress,
  //           platform: 'web',
  //         });
  //         return result;
  //       },
  //     },
  //   });
  // }, 800000);
});
