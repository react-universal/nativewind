import { Deferred, Effect, Option, Queue, Stream, Tuple } from 'effect';
import path from 'path';
import { CompilerContext } from './services/Compiler.service.js';
import { FsUtils } from './services/FsUtils.service.js';
import { TypescriptContext } from './services/Typescript.service.js';
import { listenForkedStreamChanges } from './utils/effect.utils.js';

export const CompilerRun = (config: { watch: boolean; verbose: boolean }) =>
  Effect.gen(function* () {
    const compiler = yield* CompilerContext;
    const fsUtils = yield* FsUtils;
    const latch = yield* Deferred.make();
    const ts = yield* TypescriptContext;

    const compileFile = Queue.take(ts.fileEmitter).pipe(
      // Effect.tap(() => Effect.log('Start Babel process')),
      Effect.map((x) => ({ source: x[0], emitted: x[1] })),
      Effect.bind('esm', ({ emitted, source }) =>
        compiler.annotateESMFile(emitted.esm, emitted.sourcemaps, source.getFilePath()),
      ),
      Effect.bind('cjs', ({ esm, source }) =>
        compiler.esmToCJS(esm, source.getFilePath()),
      ),
      // Effect.tap(() => Effect.logDebug('Compiled ESM and CJS')),
      Effect.tap(({ esm, emitted, cjs }) => {
        return Effect.all([
          fsUtils.mkdirCached(path.posix.dirname(emitted.dts.getFilePath())),
          fsUtils.mkdirCached(path.posix.dirname(esm.path)),
          fsUtils.mkdirCached(path.posix.dirname(emitted.dts.getFilePath())),
          fsUtils.mkdirCached(path.posix.dirname(cjs.path)),
        ]);
      }),
      // Effect.tap(() => Effect.logDebug('Created dirs')),
      Effect.flatMap(({ cjs, emitted, esm }) => {
        return Effect.all(
          [
            ts.writeFile(cjs.path, cjs.content),
            ts.writeFile(cjs.sourcemapPath, cjs.sourcemap.pipe(Option.getOrThrow)),
            ts.writeFile(esm.path, esm.content),
            ts.writeFile(esm.sourcemapPath, esm.sourcemap.pipe(Option.getOrThrow)),
            ts.writeFile(emitted.dts.getFilePath(), emitted.dts.getText()),
            ts.writeFile(emitted.dtsMap.getFilePath(), emitted.dtsMap.getText()),
          ],
          {
            concurrency: 'unbounded',
            discard: true,
          },
        );
      }),
      // Effect.tap(() => Effect.logDebug('Created files \n')),
    );

    yield* ts.tsBuild.pipe(
      Stream.onStart(Effect.logDebug('Compiler Starts')),
      Stream.filterMap((x) =>
        Option.flatMap(x[1], (files) => Option.some(Tuple.make(x[0], files))),
      ),
      Stream.mapEffect((x) => ts.fileEmitter.offer(x)),
      // Stream.tap(() => Effect.logDebug('TS Emitted files')),
      Stream.runForEach(() => compileFile),
      Effect.tap(() =>
        Effect.logDebug('Compiler finished').pipe(
          Effect.andThen(() => {
            if (config.watch) return Effect.void;
            return Queue.shutdown(ts.fileEmitter);
          }),
        ),
      ),
      Effect.withLogSpan('TS_BUILD'),
    );

    if (config.watch) {
      yield* Effect.log('[watcher] Start Observing...');
      yield* listenForkedStreamChanges(ts.tsWatch, (result) =>
        ts.fileEmitter.offer(result),
      );
      yield* compileFile.pipe(Effect.forever, Effect.fork);
      yield* Deferred.await(latch);
      return yield* Effect.logInfo('[watcher] Closed.');
    }

    yield* Queue.awaitShutdown(ts.fileEmitter);
  });
