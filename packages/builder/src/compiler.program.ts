import { Deferred, Effect, Option, pipe, Stream } from 'effect';
import { TSCompiler } from './models/TSCompiler.model.js';
import { CompilerContext } from './services/Compiler.service.js';
import { FsUtils } from './services/FsUtils.service.js';
import { listenForkedStreamChanges } from './utils/effect.utils.js';

export const CompilerRun = (config: { watch: boolean; verbose: boolean }) =>
  Effect.gen(function* () {
    const compiler = yield* CompilerContext;
    const fsUtils = yield* FsUtils;
    const latch = yield* Deferred.make();
    const tsCompiler = new TSCompiler();

    const sourceFiles = yield* tsCompiler.getProjectFiles();
    yield* Stream.fromIterable(sourceFiles)
      .pipe(
        Stream.mapEffect((x) => tsCompiler.getFileAt(x)),
        Stream.mapEffect((x) => tsCompiler.emit(x)),
        Stream.filterMap((x) => tsCompiler.resolveEmittedFile(x.getFiles())),
        Stream.mapEffect((x) =>
          compiler.runCompiler({
            diagnostics: [],
            file: x,
            source: x.sourcePath,
          }),
        ),
        Stream.runForEach(({ cjs, dts, dtsMaps, esm }) =>
          Effect.all(
            [
              tsCompiler.writeFile(
                cjs.filePath,
                cjs.content.pipe(
                  Option.getOrThrowWith(() => new Error(`WRITE_ERROR: ${cjs}`)),
                ),
              ),
              tsCompiler.writeFile(
                cjs.sourcemapFilePath,
                cjs.sourcemap.pipe(
                  Option.map((x) => JSON.stringify(x)),
                  Option.getOrThrowWith(() => new Error(`WRITE_ERROR: ${cjs}`)),
                ),
              ),
              tsCompiler.writeFile(esm.filePath, esm.content.pipe(Option.getOrThrow)),
              tsCompiler.writeFile(
                esm.sourcemapFilePath,
                esm.sourcemap.pipe(
                  Option.map((x) => JSON.stringify(x)),
                  Option.getOrThrowWith(() => new Error(`WRITE_ERROR: ${cjs}`)),
                ),
              ),
              tsCompiler.writeFile(
                esm.filePath,
                esm.content.pipe(
                  Option.getOrThrowWith(() => new Error(`WRITE_ERROR: ${cjs}`)),
                ),
              ),
              tsCompiler.writeFile(dts.path, dts.content),
              tsCompiler.writeFile(dtsMaps.path, dtsMaps.content),
            ],
            {
              concurrency: 'unbounded',
              discard: true,
            },
          ),
        ),
      )
      .pipe(
        Effect.tap(() => Effect.logDebug('[FS] Finish emit ESM, CJS, DTS')),
        Effect.withSpan('WRITE_FILES'),
      );

    if (config.watch) {
      const watcher = pipe(
        yield* fsUtils.createWatcher(sourceFiles),
        Stream.tap((x) =>
          Effect.logDebug(
            `[watcher] Detected ${x._tag} change in: ${x.path.replace(process.cwd(), '')}`,
          ),
        ),
        Stream.filterMapEffect((event) => {
          if (event._tag === 'Remove') {
            tsCompiler.rmFile(event.path);
            return Option.some(tsCompiler.rmFile(event.path).pipe(Effect.as(undefined)));
          }
          if (event._tag === 'Create') {
            return Option.some(tsCompiler.addFile(event.path));
          }
          return Option.some(tsCompiler.refreshFileAt(event.path));
        }),
        Stream.mapEffect((x) => tsCompiler.emit(x)),
        Stream.mapEffect((x) => tsCompiler.resolveEmittedFile(x.getFiles())),
        Stream.mapEffect((result) =>
          compiler.runCompiler({
            diagnostics: [],
            file: result,
            source: result.sourcePath,
          }),
        ),
      );
      yield* listenForkedStreamChanges(watcher, ({ cjs, dts, dtsMaps, esm }) =>
        Effect.all([
          tsCompiler.writeFile(cjs.filePath, cjs.content.pipe(Option.getOrThrow)),
          tsCompiler.writeFile(
            cjs.sourcemapFilePath,
            cjs.sourcemap.pipe(
              Option.map((x) => JSON.stringify(x)),
              Option.getOrThrow,
            ),
          ),
          tsCompiler.writeFile(esm.filePath, esm.content.pipe(Option.getOrThrow)),
          tsCompiler.writeFile(
            esm.sourcemapFilePath,
            esm.sourcemap.pipe(
              Option.map((x) => JSON.stringify(x)),
              Option.getOrThrow,
            ),
          ),
          tsCompiler.writeFile(esm.filePath, esm.content.pipe(Option.getOrThrow)),
          tsCompiler.writeFile(dts.path, dts.content),
          tsCompiler.writeFile(dtsMaps.path, dtsMaps.content),
        ]),
      );
      yield* Deferred.await(latch);
    }
  }).pipe(
    Effect.tap(() => Effect.logDebug('Compiler finished!')),
    Effect.catchAllDefect((x) => Effect.logError('UNHANDLED_ERROR; ', x, '\n')),
    Effect.withLogSpan('TWIN_CLI'),
  );
