import * as ConfigFile from '@effect/cli/ConfigFile';
import * as Options from '@effect/cli/Options';
import * as Path from '@effect/platform/Path';
import * as RA from 'effect/Array';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import type { LogLevel } from 'esbuild';
import { getTargetPackageEntries } from '../utils/builder.utils';
import { CliBuildConfigInput } from './config.types';

const configFile = Options.file('config').pipe(
  Options.withDefault('twin.config.json'),
  Options.withAlias('c'),
);

export const CommandConfig = {
  configFile,
  watch: Options.boolean('watch').pipe(
    Options.withDefault(false),
    Options.withAlias('w'),
  ),
};

export const CliBuildOptions = {
  rn: Options.boolean('react-native').pipe(
    Options.withDefault(false),
    Options.withAlias('rn'),
    Options.optional,
  ),
  minify: Options.boolean('minify').pipe(
    Options.withDefault(false),
    Options.withAlias('min'),
    Options.optional,
  ),
  vscode: Options.boolean('vscode').pipe(
    Options.withDefault(false),
    Options.withAlias('vs'),
    Options.optional,
  ),
  platform: Options.choice('platform', ['neutral', 'node', 'browser']).pipe(
    Options.withAlias('p'),
    Options.optional,
  ),
  watch: Options.boolean('watch').pipe(
    Options.withDefault(false),
    Options.withAlias('w'),
  ),
  configFile,
};

const runnerConfig = Config.literal('rollup', 'esbuild');
const logsConfig = Config.literal(true, false, 'info', 'debug', 'verbose');
export const makeBuilderConfig = (cliArgs: CliBuildConfigInput) =>
  Effect.gen(function* () {
    const path = yield* Path.Path;
    const platformConfig = Config.literal('browser', 'node');
    const rootDir = path.dirname(cliArgs.configFile);

    const config = yield* pipe(
      Config.all({
        platform: platformConfig('platform').pipe(Config.withDefault('browser')),
        reactNative: Config.boolean('reactNative').pipe(Config.withDefault(false)),
        minify: Config.boolean('minify').pipe(Config.withDefault(false)),
        bundle: Config.boolean('bundle').pipe(Config.withDefault(false)),
        production: Config.boolean('production').pipe(Config.withDefault(false)),
        runner: runnerConfig('runner').pipe(Config.withDefault('rollup')),
        logs: logsConfig('logs').pipe(Config.withDefault(false)),
        types: Config.boolean('types').pipe(Config.withDefault(true)),
        vscode: Config.boolean('vscode').pipe(Config.withDefault(false)),
        external: Config.array(Config.string(), 'external').pipe(
          Config.withDefault(RA.ensure('vscode')),
        ),
        entries: Config.array(Config.string(), 'entries').pipe(
          Config.withDefault(RA.ensure(path.join(rootDir, 'src/index.ts'))),
        ),
        watch: Config.boolean('watch').pipe(Config.withDefault(cliArgs.watch)),
      }),
      Effect.provide(
        ConfigFile.layer('twin.config', {
          searchPaths: [rootDir],
          formats: ['json'],
        }),
      ),
    ).pipe(
      Effect.flatMap((resolvedConfig) =>
        Effect.gen(function* () {
          let logLevel: LogLevel = 'silent';
          if (typeof resolvedConfig.logs === 'boolean' && resolvedConfig.logs) {
            logLevel = 'info';
          }
          if (typeof resolvedConfig.logs === 'string') {
            logLevel = resolvedConfig.logs;
          }
          const packageEntries = yield* getTargetPackageEntries(
            path.join(process.cwd(), '/package.json'),
          );
          return {
            ...resolvedConfig,
            logLevel,
            packageEntries,
          };
        }),
      ),
    );

    return config;
  });
