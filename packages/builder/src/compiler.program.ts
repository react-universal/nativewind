import { Chunk, Deferred, Effect, Layer, Logger, LogLevel, Stream } from 'effect';
import { CompilerContext, CompilerContextLive } from './services/Compiler.service.js';
import { FsUtils, FsUtilsLive } from './services/FsUtils.service.js';
import {
  TypescriptContext,
  TypescriptContextLive,
} from './services/Typescript.service.js';
import { listenForkedStreamChanges } from './utils/effect.utils.js';

const MainLive = Layer.empty.pipe(
  Layer.provideMerge(CompilerContextLive),
  Layer.provideMerge(TypescriptContextLive),
  Layer.provideMerge(FsUtilsLive),
);

export const CompilerRun = (config: { watch: boolean; verbose: boolean }) =>
  Effect.gen(function* () {
    const tsRunner = yield* TypescriptContext;
    const fsUtils = yield* FsUtils;
    const compiler = yield* CompilerContext;
    const latch = yield* Deferred.make();

    const output = yield* tsRunner
      .makeSourcesCompiler(tsRunner.sourceFiles)
      .pipe(
        Stream.mapEffect(compiler.runCompiler),
        Stream.runCollect,
        Effect.withLogSpan('COMPILER'),
      );

    yield* compiler.createCompilerSourceFiles(output);

    if (config.watch) {
      yield* Effect.logInfo('[FS] Starting file watcher...');
      const watcher = yield* fsUtils.createWatcher(tsRunner.sourceFiles);
      yield* listenForkedStreamChanges(
        watcher.pipe(
          Stream.mapEffect((x) => tsRunner.getCompilerFile(x.path)),
          Stream.mapEffect((x) => tsRunner.tsCompileSource(x)),
          Stream.mapEffect(compiler.runCompiler),
        ),
        (data) =>
          Effect.gen(function* () {
            yield* Effect.logInfo(
              `[watcher] Detected change in ${data.sourcePath} Recompiling... `,
            );
            yield* compiler.createCompilerSourceFiles(Chunk.make(data));
          }),
      ).pipe(Effect.tap(() => Effect.logInfo('[twin] Watching files...')));
      yield* Deferred.await(latch);
    }
  }).pipe(
    Effect.scoped,
    Effect.catchAllDefect((x) => Effect.logError('UNHANDLED_ERROR; ', x, '\n')),
    Effect.provide(MainLive),
    Logger.withMinimumLogLevel(config.verbose ? LogLevel.All : LogLevel.Info),
  );
