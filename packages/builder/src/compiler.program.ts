import { Deferred, Effect } from 'effect';
import { BuilderLoggerService } from './services/BuildLogger.service.js';
import { CompilerContext, CompilerContextLive } from './services/Compiler.service.js';
import { VirtualFSLive } from './services/VirtualFS.service.js';
import { listenForkedStreamChanges } from './utils/effect.utils.js';

export const CompilerRun = Effect.gen(function* () {
  const compiler = yield* CompilerContext;
  const latch = yield* Deferred.make();
  // yield* Effect.logDebug('FOLDER: ', virtualFS.virtualFolder);

  yield* listenForkedStreamChanges(compiler.compilerStream, (x) =>
    Effect.gen(function* () {
      return 0;
      // Effect.log({
      //   event: x.event,
      //   ts: x.tsFile.path,
      //   esm: {
      //     path: x.esmFile.filePath,
      //     sourcemap: x.esmFile.sourcemapFilePath,
      //   },
      //   annotatedESM: {
      //     path: x.annotatedESMFile.filePath,
      //     sourcemap: x.annotatedESMFile.sourcemapFilePath,
      //   },
      //   cjs: {
      //     path: x.cjsFile.filePath,
      //     sourcemap: x.cjsFile.sourcemapFilePath,
      //   },
      // });
    }),
  );

  yield* Deferred.await(latch);
  yield* Effect.logDebug('FINISH');
}).pipe(
  Effect.catchAllDefect((x) => Effect.logError('UNHANDLED_ERROR; ', x)),
  Effect.provide(CompilerContextLive),
  Effect.provide(VirtualFSLive),
  Effect.provide(BuilderLoggerService.Default),
);
