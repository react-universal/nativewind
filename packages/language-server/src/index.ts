import * as Effect from 'effect/Effect';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import {
  ConnectionService,
  DocumentsService,
  languagePrograms,
} from '@native-twin/language-service';
import { LspMainLive } from './lsp.layer';

const Runtime = ManagedRuntime.make(LspMainLive);

const program = Effect.gen(function* () {
  const Connection = yield* ConnectionService;
  const documentService = yield* DocumentsService;

  Connection.onCompletion(async (...args) =>
    languagePrograms
      .getCompletionsAtPosition(...args)
      .pipe(
        Effect.andThen((items) => ({
          isIncomplete: true,
          items,
        })),
      )
      .pipe(Runtime.runPromise),
  );

  Connection.onCompletionResolve(async (...args) =>
    languagePrograms.getCompletionEntryDetails(...args).pipe(Runtime.runPromise),
  );

  Connection.onHover(async (...args) =>
    languagePrograms.getHoverDetails(...args).pipe(Runtime.runPromise),
  );

  Connection.languages.diagnostics.on(async (...args) =>
    languagePrograms.getDocumentDiagnosticsProgram(...args).pipe(Runtime.runPromise),
  );

  Connection.onDocumentColor(async (...params) =>
    languagePrograms.getDocumentColors(...params).pipe(Runtime.runPromise),
  );

  Connection.onDocumentHighlight(async (...args) => {
    const data = await languagePrograms
      .getDocumentHighLightsProgram(...args)
      .pipe(Runtime.runPromise);
    return data;
  });

  Connection.onSelectionRanges(async (params, _token, _, __) => {
    params.positions;
    return [];
  });

  Connection.onCodeAction((_params, _token, _workDone) => {
    return undefined;
  });

  Connection.onShutdown(() => {
    Connection.console.log('shootDown');
    Connection.dispose();
  });

  Connection.listen();
  const listener = documentService.handler.listen(Connection);

  Effect.addFinalizer((exit) => {
    Connection.console.debug('Disposing Connection');
    Connection.dispose();
    Connection.console.debug('Disposing Documents Handler');
    listener.dispose();
    Connection.console.debug(`Closing reason: ${exit.toJSON()}`);
    return Effect.void;
  });
});

Runtime.runFork(program);
