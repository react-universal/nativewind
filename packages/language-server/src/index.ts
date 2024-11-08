import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Iterable from 'effect/Iterable';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import * as String from 'effect/String';
import { inspect } from 'util';
import {
  ConnectionService,
  ConfigManagerService,
  createLanguageService,
  NativeTwinManagerService,
  DocumentsService,
  initializeConnection,
  languagePrograms,
} from '@native-twin/language-service';
import { LspMainLive } from './lsp.layer';

const program = Effect.gen(function* () {
  const Connection = yield* ConnectionService;
  const configService = yield* ConfigManagerService;
  const documentService = yield* DocumentsService;
  const nativeTwinManager = yield* NativeTwinManagerService;
  const languageService = yield* createLanguageService;

  const Runtime = ManagedRuntime.make(LspMainLive);

  Connection.onInitialize(async (...args) =>
    initializeConnection(...args, nativeTwinManager, configService),
  );

  Connection.onCompletion(async (...args) =>
    languageService.completions
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
    languageService.completions
      .getCompletionEntryDetails(...args)
      .pipe(Runtime.runPromise),
  );

  Connection.onHover(async (...args) =>
    languageService.documentation.getHover(...args).pipe(Effect.runPromise),
  );

  Connection.languages.diagnostics.on(async (...args) =>
    languagePrograms.getDocumentDiagnosticsProgram(...args).pipe(Runtime.runPromise),
  );

  Connection.onDocumentColor(async (...params) =>
    languageService.documentation.getDocumentColors(...params).pipe(Effect.runPromise),
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

  Connection.onDidChangeConfiguration((config) => {
    Connection.console.debug(`Configuration changes received: `);
    if ('nativeTwin' in config.settings) {
      configService.onUpdateConfig({
        ...configService,
        config: {
          ...configService.config,
          ...config.settings['nativeTwin'],
        },
      });
    }
    pipe(
      inspect(config, {
        depth: null,
        sorted: true,
        compact: true,
      }),
      String.linesIterator,
      Iterable.map(String.padStart(5)),
      Iterable.forEach((x) => Connection.console.debug(x)),
    );
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

const runnable = Effect.provide(program, LspMainLive);

Effect.runFork(runnable);
