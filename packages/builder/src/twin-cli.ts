import * as CliCommand from '@effect/cli/Command';
import * as NodeContext from '@effect/platform-node/NodeContext';
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import * as Effect from 'effect/Effect';
import * as LogLevel from 'effect/LogLevel';
import * as Logger from 'effect/Logger';
import pkg from '../package.json';
import * as CliConfigs from './config/cli.config';
import { buildCommandHandler } from './runners/build.program';
import { BuilderConfig } from './services/Builder.service';
import { TwinLogger } from './utils/logger';

const twinCli = CliCommand.make('twin-cli', CliConfigs.CommandConfig).pipe(
  CliCommand.withDescription('Twin Cli'),
);

const twinBuild = CliCommand.make('build', CliConfigs.CliBuildOptions).pipe(
  CliCommand.withHandler(() => buildCommandHandler),
  CliCommand.provide((x) =>
    BuilderConfig.Live({
      configFile: x.configFile,
      watch: x.watch,
    }),
  ),
);

const run = twinCli.pipe(
  CliCommand.withSubcommands([twinBuild]),
  CliCommand.provide(() => TwinLogger),
  CliCommand.run({
    name: 'Twin Cli',
    version: `v${pkg.version}`,
  }),
);

Effect.suspend(() => run(process.argv)).pipe(
  Effect.provide(NodeContext.layer),
  Logger.withMinimumLogLevel(LogLevel.All),
  NodeRuntime.runMain,
);