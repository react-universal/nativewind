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
      Effect.flatMap((output) =>
        compiler.runCompiler(output[1], output[0].getFilePath()),
      ),
      Effect.tap((x) => {
        return Effect.all([
          fsUtils.mkdirCached(path.posix.dirname(x.dts.getFilePath())),
          fsUtils.mkdirCached(path.posix.dirname(x.esm.path)),
          fsUtils.mkdirCached(path.posix.dirname(x.dts.getFilePath())),
        ]);
      }),
      Effect.flatMap(({ cjs, dts, dtsMap, esm }) => {
        return Effect.all(
          [
            ts.writeFile(cjs.path, cjs.content),
            ts.writeFile(
              cjs.sourcemapPath,
              cjs.sourcemap.pipe(
                Option.map((x) => JSON.stringify(x)),
                Option.getOrThrowWith(() => new Error(`WRITE_ERROR: ${cjs}`)),
              ),
            ),
            ts.writeFile(esm.path, esm.content),
            ts.writeFile(
              esm.sourcemapPath,
              esm.sourcemap.pipe(
                Option.map((x) => JSON.stringify(x)),
                Option.getOrThrowWith(() => new Error(`WRITE_ERROR: ${cjs}`)),
              ),
            ),
            ts.writeFile(dts.getFilePath(), dts.getText()),
            ts.writeFile(dtsMap.getFilePath(), dtsMap.getText()),
          ],
          {
            concurrency: 'unbounded',
            discard: true,
          },
        );
      }),
    );

    yield* ts.tsBuild.pipe(
      Stream.filterMap((x) =>
        Option.flatMap(x[1], (files) => Option.some(Tuple.make(x[0], files))),
      ),
      Stream.mapEffect((x) => ts.fileEmitter.offer(x)),
      Stream.runForEach(() => compileFile),
      Effect.tap(() =>
        Effect.logDebug('Compiler finished').pipe(
          Effect.andThen(() => {
            if (config.watch) return Effect.void;
            return Queue.shutdown(ts.fileEmitter);
          }),
        ),
      ),
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
    // yield* ts.runner;
    // yield* ts.tsBuild.pipe(Stream.runForEach((x) => Effect.logDebug('RESULT: ', x)));

    // yield* ts.tsBuild
    //   .pipe(
    //     Stream.mapEffect((x) => compiler.runCompiler(x)),
    //     Stream.runForEach(({ cjs, dts, dtsMaps, esm }) =>
    //       Effect.all(
    //         [
    //           ts.writeFile(
    //             cjs.filePath,
    //             cjs.content.pipe(
    //               Option.getOrThrowWith(() => new Error(`WRITE_ERROR: ${cjs}`)),
    //             ),
    //           ),
    //           ts.writeFile(
    //             cjs.sourcemapFilePath,
    //             cjs.sourcemap.pipe(
    //               Option.map((x) => JSON.stringify(x)),
    //               Option.getOrThrowWith(() => new Error(`WRITE_ERROR: ${cjs}`)),
    //             ),
    //           ),
    //           ts.writeFile(esm.filePath, esm.content.pipe(Option.getOrThrow)),
    //           ts.writeFile(
    //             esm.sourcemapFilePath,
    //             esm.sourcemap.pipe(
    //               Option.map((x) => JSON.stringify(x)),
    //               Option.getOrThrowWith(() => new Error(`WRITE_ERROR: ${cjs}`)),
    //             ),
    //           ),
    //           ts.writeFile(
    //             esm.filePath,
    //             esm.content.pipe(
    //               Option.getOrThrowWith(() => new Error(`WRITE_ERROR: ${cjs}`)),
    //             ),
    //           ),
    //           ts.writeFile(dts.path, dts.content),
    //           ts.writeFile(dtsMaps.path, dtsMaps.content),
    //         ],
    //         {
    //           concurrency: 'unbounded',
    //           discard: true,
    //         },
    //       ),
    //     ),
    //   )
    //   .pipe(
    //     Effect.tap(() => Effect.logDebug('[FS] Finish emit ESM, CJS, DTS')),
    //     Effect.withSpan('WRITE_FILES'),
    //   );

    // if (config.watch) {
    //   const watcher = pipe(
    //     yield* fsUtils.createWatcher(sourceFiles),
    //     Stream.tap((x) =>
    //       Effect.logDebug(
    //         `[watcher] Detected ${x._tag} change in: ${x.path.replace(process.cwd(), '')}`,
    //       ),
    //     ),
    //     Stream.filterMapEffect((event) => {
    //       if (event._tag === 'Remove') {
    //         tsCompiler.rmFile(event.path);
    //         return Option.some(tsCompiler.rmFile(event.path).pipe(Effect.as(undefined)));
    //       }
    //       if (event._tag === 'Create') {
    //         return Option.some(tsCompiler.addFile(event.path));
    //       }
    //       return Option.some(tsCompiler.refreshFileAt(event.path));
    //     }),
    //     Stream.mapEffect((x) => tsCompiler.emit(x)),
    //     Stream.mapEffect((x) => tsCompiler.resolveEmittedFile(x.getFiles())),
    //     Stream.mapEffect((result) =>
    //       compiler.runCompiler({
    //         diagnostics: [],
    //         file: result,
    //         source: result.sourcePath,
    //       }),
    //     ),
    //   );
    //   yield* listenForkedStreamChanges(watcher, ({ cjs, dts, dtsMaps, esm }) =>
    //     Effect.all([
    //       ts.writeFile(cjs.filePath, cjs.content.pipe(Option.getOrThrow)),
    //       ts.writeFile(
    //         cjs.sourcemapFilePath,
    //         cjs.sourcemap.pipe(
    //           Option.map((x) => JSON.stringify(x)),
    //           Option.getOrThrow,
    //         ),
    //       ),
    //       ts.writeFile(esm.filePath, esm.content.pipe(Option.getOrThrow)),
    //       ts.writeFile(
    //         esm.sourcemapFilePath,
    //         esm.sourcemap.pipe(
    //           Option.map((x) => JSON.stringify(x)),
    //           Option.getOrThrow,
    //         ),
    //       ),
    //       ts.writeFile(esm.filePath, esm.content.pipe(Option.getOrThrow)),
    //       ts.writeFile(dts.path, dts.content),
    //       ts.writeFile(dtsMaps.path, dtsMaps.content),
    //     ]),
    //   );
    //   yield* Deferred.await(latch);
    // }
  }).pipe(
    // Effect.tap(() => Effect.logDebug('Compiler finished!')),
    Effect.catchAllDefect((x) => Effect.logError('UNHANDLED_ERROR; ', x, '\n')),
    Effect.withLogSpan('TWIN_CLI'),
  );
