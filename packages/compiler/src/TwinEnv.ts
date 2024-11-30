import * as NodePath from '@effect/platform-node/NodePath';
import * as Path from '@effect/platform/Path';
import { Config, Console, Context, Effect, Layer } from 'effect';

export const TWIN_ENV_KEYS = {
  projectRoot: 'TWIN_PROJECT_ROOT',
  outputDir: 'TWIN_OUTPUT_DIR',
  twinCorePath: 'TWIN_CORE_PATH',
  twinConfigPath: 'TWIN_CONFIG_PATH',
  inputCSS: 'TWIN_INPUT_CSS_PATH',
};

const getPlatformFilename = (platform: string) => {
  let ext = 'js';
  if (platform === 'web') ext = 'css';

  return `twin.out.${platform}.${ext}`;
};

export const modifyEnv = (key: string, value: string, clear = false) =>
  Effect.gen(function* () {
    const isInEnv = key in process.env;

    const original = process.env[key];
    process.env[key] = value;

    if (clear) {
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => {
          if (isInEnv) {
            process.env[key] = original;
          } else {
            Reflect.deleteProperty(process.env, key);
          }
        }).pipe(
          Effect.tap(() =>
            Console.log(`${key} was ${isInEnv ? 'restored' : 'deleted'} from env`),
          ),
        ),
      );
    }
  });

const make = Effect.gen(function* () {
  const path_ = yield* Path.Path;
  const projectRoot = yield* Config.string(TWIN_ENV_KEYS.projectRoot).pipe(
    Config.withDescription('Usually where the main package.json is placed'),
    Config.withDefault(process.cwd()),
  );

  const twinCoreDir = yield* Config.string(TWIN_ENV_KEYS.twinCorePath).pipe(
    Config.orElse(() =>
      Config.sync(() =>
        path_.join(path_.dirname(require.resolve('@native-twin/core')), '../.cache'),
      ),
    ),
    Config.orElse(() =>
      Config.sync(() => path_.join(projectRoot, 'node_modules/@native-twin/.cache')),
    ),
  );

  const outputDir = yield* Config.string(TWIN_ENV_KEYS.twinCorePath).pipe(
    Config.withDescription('Where the code will be emitted'),
    Config.orElse(() => Config.sync(() => twinCoreDir)),
  );

  const twinConfigPath = yield* Config.option(
    Config.string(TWIN_ENV_KEYS.twinConfigPath),
  ).pipe(Config.withDescription('Twin config file usually twin.config.ts'));

  const inputCss = yield* Config.option(Config.string(TWIN_ENV_KEYS.inputCSS));

  const platformOutputs = {
    android: path_.join(outputDir, getPlatformFilename('android')),
    ios: path_.join(outputDir, getPlatformFilename('ios')),
    web: path_.join(outputDir, getPlatformFilename('web')),
    native: path_.join(outputDir, getPlatformFilename('native')),
  };

  return {
    twinCoreDir,
    projectRoot,
    twinConfigPath,
    outputDir,
    inputCss,
    platformOutputs,
  } as const;
});

export interface TwinEnvContext extends Effect.Effect.Success<typeof make> {}

export const TwinEnvContext = Context.GenericTag<TwinEnvContext>('twin/config/env');

export const TwinEnvContextLive = Layer.effect(TwinEnvContext, make).pipe(
  Layer.provide(NodePath.layerPosix),
);
