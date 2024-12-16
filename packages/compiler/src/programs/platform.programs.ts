import * as Effect from 'effect/Effect';
import * as Sink from 'effect/Sink';
import * as Stream from 'effect/Stream';
import { TwinDocumentsContext } from '../services/TwinDocuments.service.js';
import { TwinFSContext } from '../services/TwinFileSystem.service.js';
import { TwinNodeContext } from '../services/TwinNodeContext.service.js';

export const compileProjectFiles = (platform: string) =>
  Effect.gen(function* () {
    const ctx = yield* TwinNodeContext;
    const { refreshCssOutput } = yield* TwinFSContext;
    const { createDocumentByPath, getDocumentNodes } = yield* TwinDocumentsContext;

    return yield* Stream.fromIterableEffect(ctx.state.projectFiles.ref).pipe(
      Stream.mapEffect((path) => createDocumentByPath(path)),
      Stream.flatMap((file) =>
        Stream.fromIterableEffect(
          getDocumentNodes(file, platform).pipe(Effect.map((jsxElements) => jsxElements)),
        ),
      ),
      Stream.run(
        Sink.collectAllToMap(
          (x) => x.filename,
          (x) => x,
        ),
      ),
      Effect.flatMap((registry) => refreshCssOutput(platform, registry)),
    );
  });
