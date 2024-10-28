import * as NodeCommandExecutor from '@effect/platform-node/NodeCommandExecutor';
import * as NodeContext from '@effect/platform-node/NodeContext';
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { defineConfig, Options } from 'tsup';
import { CliConfigFile } from '../config/config.types';
import { bundlerExternals } from '../config/constants';
import { TypescriptService } from '../ts/twin.types';

const MainNodeContext = NodeCommandExecutor.layer.pipe(
  Layer.provideMerge(NodeFileSystem.layer),
  Layer.merge(NodePath.layer),
  Layer.merge(NodeContext.layer),
);

export const getTsUpConfig = (configFile: CliConfigFile, watch: boolean): Options =>
  defineConfig({
    // esbuildPlugins: [requireResolvePlugin()],
    entry: configFile.entries,
    format: ['cjs', 'esm'],
    experimentalDts: false,
    dts: false,
    external: [...bundlerExternals, ...configFile.external],
    legacyOutput: true,
    clean: false,
    metafile: false,
    name: 'Native Twin',
    globalName: 'native_twin',
    platform: configFile.platform,
    esbuildOptions: (opt) => {
      opt.logLevel = 'info';
    },
    onSuccess: async () => {
      return Effect.gen(function* () {
        const ts = yield* TypescriptService;
        yield* ts.generate();
      })
        .pipe(
          Effect.provide(MainNodeContext),
          Effect.provide(TypescriptService.Live),
          Effect.catchAllCause(Effect.log),
          Effect.runPromise,
        )
        .then(() => console.warn('finish dts'));
    },
    cjsInterop: true,
    minify: !watch,
    loader: {
      '.snap': 'copy',
      '.ios': 'copy',
      '.android': 'copy',
    },
    shims: true,
    bundle: false,
    treeshake: 'recommended',
    tsconfig: 'tsconfig.build.json',
    splitting: false,
    outDir: './build',
    sourcemap: true,
    watch,
  }) as Options;
