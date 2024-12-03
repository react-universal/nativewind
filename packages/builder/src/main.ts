#!/usr/bin/env node
import * as Command from '@effect/cli/Command';
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { Logger, Effect, LogLevel } from 'effect';
import { CompilerRun } from './compiler.program.js';

const run = Command.make('twin').pipe(
  Command.withSubcommands([Command.make('pack-dev', {}, () => CompilerRun)]),
  Command.run({
    name: 'Twin Cli',
    version: '1.0.1',
  }),
);

run(process.argv).pipe(
  Effect.provide(NodeContext.layer),
  Logger.withMinimumLogLevel(LogLevel.All),
  NodeRuntime.runMain({
    teardown: (_exit, onExit) => {
      // console.log('EXIT: ', exit);
      onExit(0);
      process.exit(0);
    },
  }),
);

// let callAmount = 0;
// process.on('SIGINT', function (event) {
//   if (callAmount < 1) {
//     console.log(
//       `\n✅ The server has been stopped`,
//       'Shutdown information',
//       'This shutdown was initiated by CTRL+C.',
//     );
//     setTimeout(() => process.exit(), 100);
//   }
//   callAmount++;
// });
