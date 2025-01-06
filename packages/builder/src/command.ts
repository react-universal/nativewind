import * as Command from '@effect/cli/Command';
import * as Options from '@effect/cli/Options';
import { NodePath } from '@effect/platform-node';
import { Config, ConfigProvider, Effect, Layer } from 'effect';
import { CompilerRun } from './compiler.program.js';
import { CompilerContextLive } from './services/Compiler.service.js';
import { FsUtilsLive } from './services/FsUtils.service.js';
import { TypescriptContextLive } from './services/Typescript.service.js';

const MainLive = Layer.empty.pipe(
  Layer.provideMerge(CompilerContextLive),
  Layer.provideMerge(TypescriptContextLive),
  Layer.provideMerge(FsUtilsLive),
  Layer.provideMerge(NodePath.layerPosix),
);

export const TwinCli = Command.make('twin').pipe(
  Command.withHandler(() =>
    Config.string('PROJECT_DIR').pipe(Effect.tap((x) => Effect.logDebug('ROOT_', x))),
  ),
  Command.withSubcommands([
    Command.make(
      'pack-dev',
      {
        watch: Options.boolean('watch').pipe(
          Options.withAlias('w'),
          Options.withDefault(false),
        ),
        verbose: Options.boolean('verbose').pipe(
          Options.withAlias('vbs'),
          Options.withDefault(false),
        ),
      },
      (x) => CompilerRun(x),
    ).pipe(
      Command.provide(MainLive),
      Command.provide(
        Layer.setConfigProvider(
          ConfigProvider.fromJson({
            PROJECT_DIR: process.cwd(),
          }),
        ),
      ),
    ),
  ]),
);
