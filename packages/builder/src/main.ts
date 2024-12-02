#!/usr/bin/env node
import * as Command from '@effect/cli/Command';
import { FileSystem, Path } from '@effect/platform';
import { NodeContext, NodeRuntime } from '@effect/platform-node';
import { Logger, Effect, LogLevel, Queue } from 'effect';
import { BabelContext, BabelContextLive } from './services/Babel.service.js';
import { BuilderLoggerService } from './services/BuildLogger.service.js';
import { FsUtils, FsUtilsLive } from './services/FsUtils.service.js';
import {
  TsEmitResult,
  TsEmitSource,
  TypescriptContext,
  TypescriptContextLive,
} from './services/Typescript.service.js';

const PackDev = Effect.gen(function* () {
  const tsRunner = yield* TypescriptContext;
  const path_ = yield* Path.Path;
  const fs = yield* FileSystem.FileSystem;
  const fsUtils = yield* FsUtils;
  const babelRunner = yield* BabelContext;

  const processTsResult = (sources: TsEmitSource[], original: TsEmitSource) =>
    Effect.gen(function* () {
      yield* Effect.logDebug('Compiling file: ', original.path);

      yield* Effect.all(
        sources.map(({ content, path }) =>
          Effect.gen(function* () {
            yield* fsUtils.mkDirIfNotExists(path_.dirname(path));
            yield* fs.writeFileString(path, content);
          }),
        ),
      );

      yield* Effect.logDebug('Emitted ESM success: ', original.path);

      yield* babelRunner.annotationsAndCjsCompose(sources, original);

      yield* Effect.logDebug('Compiled succeed: ', original.path);
    }).pipe(Logger.withMinimumLogLevel(LogLevel.Debug));

  yield* Queue.take(tsRunner.compiledFiles).pipe(
    Effect.map((result) =>
      TsEmitResult.$match(result, {
        Diagnostic: (data) => Effect.logDebug('Diagnostic: ', data),
        File: (data) => processTsResult(data.value, data.original),
        Message: (data) => Effect.logDebug('Message: ', data),
      }),
    ),
    Effect.flatten,
    Effect.forever,
  );
  yield* Effect.logDebug('FINISH');
  return tsRunner;
}).pipe(
  Effect.catchAllDefect((x) => Effect.logError('UNHANDLED_ERROR; ', x)),
  Effect.provide(BabelContextLive),
  Effect.provide(TypescriptContextLive),
  Effect.provide(BuilderLoggerService.Default),
);

const run = Command.make('twin').pipe(
  Command.withSubcommands([Command.make('pack-dev', {}, () => PackDev)]),
  Command.run({
    name: 'Twin Cli',
    version: '1.0.1',
  }),
);

Effect.suspend(() => run(process.argv)).pipe(
  Effect.scoped,
  Effect.provide(NodeContext.layer),
  Effect.provide(FsUtilsLive),
  Logger.withMinimumLogLevel(LogLevel.All),
  NodeRuntime.runMain,
);
